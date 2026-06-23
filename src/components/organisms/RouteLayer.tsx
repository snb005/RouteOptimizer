/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — RouteLayer
   Map overlay: computes the route via Routes API, draws polyline & markers.
   Pure Google Maps logic — no visible DOM output (returns null).
   ═══════════════════════════════════════════════════════════════════════════ */

// src/components/organisms/RouteLayer.tsx
"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { ROUTE_COLORS } from "@/components/ions";
import type { Location, RouteResult } from "@/components/types";

interface Props {
  locations: Location[];
  lockedSlots: boolean[];
  onResult: (r: RouteResult | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function RouteLayer({ locations, lockedSlots, onResult, onMapClick }: Props) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    if (!map || !onMapClick) return;
    clickListenerRef.current = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    );
    return () => {
      if (clickListenerRef.current)
        google.maps.event.removeListener(clickListenerRef.current);
    };
  }, [map, onMapClick]);

  useEffect(() => {
    if (!map || locations.length < 2 || !geometryLib) return;

    const [origin, ...rest] = locations;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1);

    const fetchRoute = async () => {
      const hasLocks = intermediates.some((l) => lockedSlots[parseInt(l.id, 10)]);
      const allLocked = intermediates.every((l) => lockedSlots[parseInt(l.id, 10)]);

      let finalIntermediates = intermediates;
      let shouldOptimize = intermediates.length > 0;

      if (hasLocks) {
        if (allLocked) {
          shouldOptimize = false;
        } else {
          // First pass: request optimize waypoint order
          const res = await fetch("/api/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
              destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
              intermediates: intermediates.map((l) => ({
                location: { latLng: { latitude: l.lat, longitude: l.lng } },
              })),
              travelMode: "DRIVE",
              optimizeWaypointOrder: true,
              routingPreference: "TRAFFIC_AWARE",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const optIndices = data.routes?.[0]?.optimizedIntermediateWaypointIndex ?? [];
            if (optIndices.length > 0) {
              const results: (Location | null)[] = Array(intermediates.length).fill(null);

              // 1. Place locked intermediate waypoints in their original slots
              intermediates.forEach((l, idx) => {
                const origIdx = parseInt(l.id, 10);
                if (lockedSlots[origIdx]) {
                  results[idx] = l;
                }
              });

              // 2. Place unlocked ones in Google's relative optimized order
              let emptyIdx = 0;
              optIndices.forEach((i: number) => {
                const l = intermediates[i];
                const origIdx = parseInt(l.id, 10);
                if (!lockedSlots[origIdx]) {
                  while (emptyIdx < results.length && results[emptyIdx] !== null) {
                    emptyIdx++;
                  }
                  if (emptyIdx < results.length) {
                    results[emptyIdx] = l;
                  }
                }
              });

              // 3. Fallback
              intermediates.forEach((l) => {
                const origIdx = parseInt(l.id, 10);
                if (!lockedSlots[origIdx] && !results.includes(l)) {
                  while (emptyIdx < results.length && results[emptyIdx] !== null) {
                    emptyIdx++;
                  }
                  if (emptyIdx < results.length) {
                    results[emptyIdx] = l;
                  }
                }
              });

              finalIntermediates = results.filter((x): x is Location => x !== null);
            }
          }
          shouldOptimize = false;
        }
      }

      // Fetch the final route (with or without optimization depending on locks)
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          intermediates: finalIntermediates.map((l) => ({
            location: { latLng: { latitude: l.lat, longitude: l.lng } },
          })),
          travelMode: "DRIVE",
          optimizeWaypointOrder: shouldOptimize,
          routingPreference: "TRAFFIC_AWARE",
          locationsMetadata: locations.map((loc, idx) => ({
            lat:    loc.lat,
            lng:    loc.lng,
            name:   loc.name,
            raw:    loc.raw,
            role:   idx === 0
                      ? "DRIVER"
                      : idx === locations.length - 1
                      ? "SHOP"
                      : "STOP",
            remark: loc.remark ?? null,
          })),
          driverId: "demo-driver-001",
        }),
      });

      if (!res.ok) { console.error(await res.json()); onResult(null); return; }

      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) { onResult(null); return; }

      // Draw polyline
      polylineRef.current?.setMap(null);
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current.forEach(iw => iw.close());
      infoWindowsRef.current = [];
      const path = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
      polylineRef.current = new google.maps.Polyline({
        path, map,
        strokeColor: "#4285F4", strokeOpacity: 1, strokeWeight: 4, geodesic: true,
      });

      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);

      // Reconstructed ordered locations
      const orderedLocs =
        shouldOptimize && route.optimizedIntermediateWaypointIndex?.length > 0
          ? [origin, ...route.optimizedIntermediateWaypointIndex.map((i: number) => finalIntermediates[i]), destination]
          : [origin, ...finalIntermediates, destination];

      // Drop markers
      orderedLocs.forEach((loc, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === orderedLocs.length - 1;
        const hasRemark = loc.remark && loc.remark.trim().length > 0;

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
            fillColor: hasRemark ? "#F59E0B" : ROUTE_COLORS[idx % ROUTE_COLORS.length],
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          },
        });
        markersRef.current.push(marker);

        if (isStart || isEnd) {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-1 flex flex-col font-sans" style="min-width: 100px;">
                <div style="font-weight:900; font-size:14px; color:${isStart ? '#10B981' : '#8B5CF6'};">${isStart ? '🚕 Driver' : '🏪 Shop'}</div>
                ${hasRemark ? `
                  <div class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-[var(--ion-remark-bg)] border-[var(--ion-remark-border)] text-[9px] text-[var(--ion-remark-text)] font-semibold whitespace-nowrap">
                    <span style="color: var(--ion-remark-icon);">📝</span>
                    <span>${loc.remark}</span>
                  </div>
                ` : ""}
              </div>
            `,
            disableAutoPan: true,
            // @ts-ignore
            headerDisabled: true,
          });
          infoWindow.open(map, marker);
          infoWindowsRef.current.push(infoWindow);

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        } else if (hasRemark) {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-1 flex flex-col gap-1 font-sans" style="min-width: 140px;">
                <div class="text-[9px] font-bold text-[var(--ion-neutral-400)] uppercase tracking-wider">Stop ${idx}</div>
                <div class="text-xs text-[var(--ion-neutral-800)] font-semibold truncate" style="max-width: 180px;">${loc.name || `Stop ${idx}`}</div>
                <div class="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-[var(--ion-remark-bg)] border-[var(--ion-remark-border)] text-[10px] text-[var(--ion-remark-text)] font-semibold">
                  <span style="color: var(--ion-remark-icon);">📝</span>
                  <span class="truncate" style="max-width: 140px;" title="${loc.remark}">${loc.remark}</span>
                </div>
              </div>
            `,
            disableAutoPan: true,
            // @ts-ignore
            headerDisabled: true,
          });
          infoWindow.open(map, marker);
          infoWindowsRef.current.push(infoWindow);

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        }
      });

      onResult({
        encodedPolyline: route.polyline?.encodedPolyline ?? "",
        distanceMeters: route.distanceMeters,
        durationSeconds: parseInt(route.duration?.replace("s", "") ?? "0", 10),
        optimizedOrder: shouldOptimize
          ? (route.optimizedIntermediateWaypointIndex ?? [])
          : finalIntermediates.map(fl => intermediates.indexOf(fl)),
      });
    };

    fetchRoute();
    return () => {
      polylineRef.current?.setMap(null);
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current.forEach(iw => iw.close());
      infoWindowsRef.current = [];
    };
  }, [map, locations, geometryLib, lockedSlots]);

  return null;
}
