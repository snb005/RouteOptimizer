import { NextResponse } from "next/server";
import crypto from "crypto";
import { PrismaClient, StopRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_DRIVER_ID = "demo-driver-001";

function generateCacheKey(body: RouteRequestBody) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify({
      origin:        body.origin,
      destination:   body.destination,
      intermediates: body.intermediates,
    }))
    .digest("hex");
}

// ─── Types ────────────────────────────────────────────────────────────────

interface LocationMeta {
  lat:    number;
  lng:    number;
  name?:  string;
  raw?:   string;
  role?:  "DRIVER" | "STOP" | "SHOP";
  remark?: string;
}

interface RouteRequestBody {
  origin:              object;
  destination:         object;
  intermediates?:      object[];
  travelMode?:         string;
  optimizeWaypointOrder?: boolean;
  routingPreference?:  string;
  locationsMetadata?:  LocationMeta[];
  driverId?:           string;
}

// ─── POST ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body: RouteRequestBody = await req.json();
  const cacheKey = generateCacheKey(body);
  const driverId = body.driverId ?? DEMO_DRIVER_ID;

  // ── Cache hit ──
  const cached = await prisma.route.findUnique({
    where: { cacheKey },
    include: {
      stops: {
        orderBy: { stopOrder: "asc" },
        include: { location: true },
      },
    },
  });

  if (cached) {
    console.log("Cache hit for route!");
    return Response.json({
      routes: [{
        distanceMeters: cached.totalDistance,
        duration:       `${cached.totalDuration}s`,
        polyline:       { encodedPolyline: cached.encodedPolyline },
        optimizedIntermediateWaypointIndex: cached.orderedPath,
      }],
    }, { status: 200 });
  }

  // ── Cache miss — fetch Google Routes API ──
  console.log("Cache miss. Fetching from Google Routes API...");

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "X-Goog-Api-Key":  process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": [
          "routes.polyline.encodedPolyline",
          "routes.distanceMeters",
          "routes.duration",
          "routes.optimizedIntermediateWaypointIndex",
        ].join(","),
      },
      body: JSON.stringify({
        origin:                 body.origin,
        destination:            body.destination,
        intermediates:          body.intermediates,
        travelMode:             body.travelMode,
        optimizeWaypointOrder:  body.optimizeWaypointOrder,
        routingPreference:      body.routingPreference,
      }),
    }
  );

  const rawText = await res.text();

  // Guard: empty body from Google (quota exceeded, bad key, etc.)
  if (!rawText.trim()) {
    return Response.json(
      { error: "Google Routes API returned an empty response.", status: res.status },
      { status: 502 }
    );
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    return Response.json(
      { error: "Google Routes API returned non-JSON.", raw: rawText.slice(0, 200) },
      { status: 502 }
    );
  }

  const route = data.routes?.[0];

  if (!res.ok || !route) {
    return Response.json(data, { status: res.status });
  }

  // ── Parse response ──
  const totalDistance = route.distanceMeters ?? 0;
  const totalDuration = parseInt(route.duration?.replace("s", "") ?? "0", 10);
  const encodedPolyline = route.polyline?.encodedPolyline ?? "";
  const orderedPath = route.optimizedIntermediateWaypointIndex ?? [];

  // ── Ensure demo driver exists ──
  if (driverId === DEMO_DRIVER_ID) {
    await prisma.driver.upsert({
      where: { id: DEMO_DRIVER_ID },
      update: {},
      create: {
        id:      DEMO_DRIVER_ID,
        name:    "Demo Driver",
        phone:   "+91-98765-43210",
        vehicle: "MH-12 AB 1234",
      },
    });
  }

  // ── Build DB ops in a transaction ──
  const locs: LocationMeta[] = body.locationsMetadata ?? [];

  // 1. Upsert all unique locations
  const uniqueLocs = new Map<string, LocationMeta>();
  locs.forEach((loc) => {
    const key = `${loc.lat},${loc.lng}`;
    if (!uniqueLocs.has(key)) uniqueLocs.set(key, loc);
  });

  const locationUpserts = Array.from(uniqueLocs.values()).map((loc) =>
    prisma.location.upsert({
      where:  { lat_lng: { lat: loc.lat, lng: loc.lng } },
      update: { name: loc.name || loc.raw || "" },
      create: {
        name: loc.name || loc.raw || "",
        lat:  loc.lat,
        lng:  loc.lng,
        raw:  loc.raw,
      },
    })
  );

  const upsertedLocs = await prisma.$transaction(locationUpserts);

  // Build lat,lng → id map
  const locMap = new Map<string, string>();
  upsertedLocs.forEach((l) => locMap.set(`${l.lat},${l.lng}`, l.id));

  // 2. Single atomic transaction: deactivate → create route → log
  await prisma.$transaction([
    // Deactivate previous active route for this driver (safe — no unique issue after migration)
    prisma.route.updateMany({
      where: { driverId, isActive: true },
      data:  { isActive: false },
    }),

    prisma.route.create({
      data: {
        cacheKey,
        totalDistance,
        totalDuration,
        encodedPolyline,
        orderedPath,
        isActive: true,
        driverId,
        stops: {
          create: locs.map((loc, idx) => ({
            stopOrder:  idx,
            role:       (loc.role as StopRole) ?? StopRole.STOP,
            remark:     loc.remark ?? null,
            locationId: locMap.get(`${loc.lat},${loc.lng}`)!,
          })),
        },
      },
    }),

    prisma.apiLog.create({
      data: {
        apiName:  "Routes API",
        endpoint: "https://routes.googleapis.com/directions/v2:computeRoutes",
        request:  {
          origin:               body.origin,
          destination:          body.destination,
          intermediates:        body.intermediates,
          travelMode:           body.travelMode,
          optimizeWaypointOrder: body.optimizeWaypointOrder,
          routingPreference:    body.routingPreference,
        },
        response: data,
      },
    }),
  ]);

  return Response.json(data, { status: 200 });
}
