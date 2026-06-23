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

import { useState, useCallback, useEffect } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { SLOT_COUNT } from "@/components/ions";
import { InputPanel, ResultPanel, RouteLayer } from "@/components/organisms";
import { parseGoogleMapsLink } from "@/components/utils";
import type { Location, RouteResult } from "@/components/types";
import { MapSearchBox } from "@/components/atoms";

// ─── Main exported component ─────────────────────────────────────────────────

const TEST_LINKS = [
  "https://maps.app.goo.gl/ZK4QVFMSy5x3w71t8",
  "https://maps.app.goo.gl/oSKCuDGC1ovtR8QU8",
  "https://maps.app.goo.gl/5pMoFZrvENqTkRXx5",
  "https://maps.app.goo.gl/R5h7f9bNmctqVRDe8",
  "https://maps.app.goo.gl/q9Xpb1Bd7A7x29B86",
  "https://maps.app.goo.gl/dSi9gmAMYPRnQu2K7",
  "https://maps.app.goo.gl/q7wgo6bpD4sXWTMZ6",
  "https://maps.app.goo.gl/2yD79eeePwGoVM9e9",
  "https://maps.app.goo.gl/9mXzvBBCVf6zCSQ49",
  "https://maps.app.goo.gl/1gE2rjtTj1dJiKf87"
];

export default function MapComponent({ apiKey }: { apiKey: string }) {
  const [inputs, setInputs] = useState<string[]>(
    Array.from({ length: SLOT_COUNT }, (_, i) => TEST_LINKS[i] || "")
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null));
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    // Log Dynamic Maps API load
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiName: "Dynamic Maps API",
        endpoint: "https://maps.googleapis.com/maps/api/js",
      }),
    }).catch(console.error);
  }, []);

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

    if (!inputs[0].trim() || !inputs[SLOT_COUNT - 1].trim()) {
      alert("Please provide both the Driver (A) and Shop (J) locations.");
      setComputing(false);
      return;
    }

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

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const loc = place.geometry?.location;
      if (!loc) return;
      // Build a plain lat,lng string — parseGoogleMapsLink handles this format
      const coordString = `${loc.lat()},${loc.lng()}`;
      // Find next empty input slot
      setInputs((prev) => {
        const next = [...prev];
        const emptyIdx = next.findIndex((v) => !v.trim());
        if (emptyIdx !== -1) next[emptyIdx] = coordString;
        return next;
      });
    },
    []
  );

  const handleRawInput = useCallback((text: string) => {
    setInputs((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((v) => !v.trim());
      if (emptyIdx !== -1) next[emptyIdx] = text;
      return next;
    });
  }, []);

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
          Please set <code>GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
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
            <MapSearchBox onPlaceSelect={handlePlaceSelect} onRawInput={handleRawInput} />
            <RouteLayer locations={locations} onResult={handleResult} />
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
