/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE — MapComponent
   Top-level composition of organisms. Manages state and wires everything.

   Atomic Design Hierarchy:
     ION     → tokens.css  (pseudo-classes, design tokens, stroke tags)
     ATOM    → NumberBadge, StatusTag, TextInput, ActionButton
     MOLECULE→ LocationSlot, StatCard, StopListItem
     ORGANISM→ InputPanel, ResultPanel, RouteLayer
     TEMPLATE→ THIS FILE (MapComponent)
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { SLOT_COUNT } from "@/components/ions";
import { InputPanel, ResultPanel, RouteLayer } from "@/components/organisms";
import { parseGoogleMapsLink } from "@/components/utils";
import type { Location, RouteResult } from "@/components/types";

// ─── Main exported component ─────────────────────────────────────────────────

export default function MapComponent({ apiKey }: { apiKey: string }) {
  const [inputs, setInputs] = useState<string[]>(Array(SLOT_COUNT).fill(""));
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null));
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [computing, setComputing] = useState(false);

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  const handleInput = (idx: number, value: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    setErrors((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const handleOptimize = async () => {
    setComputing(true);
    const newErrors: (string | null)[] = Array(SLOT_COUNT).fill(null);
    const parsed: Location[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const raw = inputs[i];
      if (!raw.trim()) continue;

      let linkToParse = raw;
      if (raw.includes("maps.app.goo.gl") || raw.includes("goo.gl/maps")) {
        try {
          const res = await fetch("/api/expand", {
            method: "POST",
            body: JSON.stringify({ url: raw }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) linkToParse = data.url;
          }
        } catch (e) {
          console.error("Failed to expand short link", e);
        }
      }

      const result = parseGoogleMapsLink(linkToParse);
      if (!result) {
        newErrors[i] = "Could not extract coordinates from this link.";
      } else {
        parsed.push({ id: String(i), raw, ...result });
      }
    }

    setErrors(newErrors);

    if (parsed.length < 2) {
      alert("Please provide at least 2 valid locations.");
      setComputing(false);
      return;
    }

    setLocations(parsed);
  };

  const handleClear = () => {
    setInputs(Array(SLOT_COUNT).fill(""));
    setErrors(Array(SLOT_COUNT).fill(null));
    setLocations([]);
    setRouteResult(null);
    setComputing(false);
  };

  const handleResult = useCallback((r: RouteResult | null) => {
    setRouteResult(r);
    setComputing(false);
  }, []);

  /* ── Compute ordered locations for result panel ────────────────────────── */

  const orderedLocations = (() => {
    if (!routeResult || locations.length < 2) return [];
    const [origin, ...rest] = locations;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1);
    const { optimizedOrder } = routeResult;

    if (optimizedOrder.length > 0 && intermediates.length > 0) {
      return [origin, ...optimizedOrder.map((i) => intermediates[i]), destination];
    }
    return locations;
  })();

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500 p-8 text-center">
        <p className="text-lg font-medium">
          Please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
        {/* ── Left Panel ── */}
        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[85vh] pr-1">
          <InputPanel
            inputs={inputs}
            errors={errors}
            computing={computing}
            onInputChange={handleInput}
            onOptimize={handleOptimize}
            onClear={handleClear}
          />

          {routeResult && (
            <ResultPanel
              result={routeResult}
              orderedLocations={orderedLocations}
            />
          )}
        </div>

        {/* ── Right Panel: Map ── */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 min-h-[400px]">
          <Map
            defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
            defaultZoom={5}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="route-optimizer-map"
          >
            <RouteLayer locations={locations} onResult={handleResult} />
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
