/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — RouteLayer
   Map overlay: computes the route via Routes API, draws polyline & markers.
   Pure Google Maps logic — no visible DOM output (returns null).
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { ROUTE_COLORS } from "@/components/ions";
import type { Location, RouteResult } from "@/components/types";

interface RouteLayerProps {
  locations: Location[];
  onResult: (r: RouteResult | null) => void;
}

export default function RouteLayer({ locations, onResult }: RouteLayerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const geometryLib = useMapsLibrary("geometry");

  const polylineRef = useRef<google.maps.Polyline | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const clearOverlays = useCallback(() => {
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!map || !routesLib || !geometryLib) return;
    if (locations.length < 2) {
      clearOverlays();
      onResult(null);
      return;
    }

    clearOverlays();

    const [origin, ...rest] = locations;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RouteClass = (routesLib as any).Route as {
      computeRoutes: (req: object) => Promise<any>;
    };

    const request: Record<string, unknown> = {
      origin: {
        location: { lat: origin.lat, lng: origin.lng },
      },
      destination: {
        location: { lat: destination.lat, lng: destination.lng },
      },
      travelMode: "DRIVE",
      optimizeWaypointOrder: intermediates.length > 0,
      routingPreference: "TRAFFIC_AWARE",
      fields: [
        "polyline.encodedPolyline",
        "distanceMeters",
        "duration",
        "optimizedIntermediateWaypointIndex"
      ],
    };

    if (intermediates.length > 0) {
      request.intermediates = intermediates.map((loc) => ({
        location: { lat: loc.lat, lng: loc.lng },
      }));
    }

    RouteClass.computeRoutes(request)
      .then((response: any) => {
        const route = response?.routes?.[0];
        if (!route) { onResult(null); return; }

        const encodedPolyline = route.polyline?.encodedPolyline ?? "";
        const distanceMeters: number = route.distanceMeters ?? 0;
        const durationSeconds = parseInt(route.duration?.replace("s", "") ?? "0", 10);
        const optimizedOrder: number[] = route.optimizedIntermediateWaypointIndex ?? [];

        onResult({ encodedPolyline, distanceMeters, durationSeconds, optimizedOrder });

        // Draw polyline
        if (encodedPolyline) {
          const path = google.maps.geometry.encoding.decodePath(encodedPolyline);
          polylineRef.current = new google.maps.Polyline({
            path,
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.85,
            map,
          });
        }

        // Ordered stops
        const orderedLocs =
          intermediates.length > 0 && optimizedOrder.length > 0
            ? [origin, ...optimizedOrder.map((i) => intermediates[i]), destination]
            : locations;

        // Drop markers
        orderedLocs.forEach((loc, idx) => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            label: {
              text: String(idx + 1),
              color: "#fff",
              fontWeight: "bold",
              fontSize: "12px",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            },
          });
          markersRef.current.push(marker);
        });

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        orderedLocs.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }));
        map.fitBounds(bounds, 60);
      })
      .catch((err: unknown) => {
        console.error("computeRoutes failed:", err);
        onResult(null);
      });

    return clearOverlays;
  }, [map, routesLib, geometryLib, locations, clearOverlays, onResult]);

  return null;
}
