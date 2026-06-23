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
import { arrayMove } from "@dnd-kit/sortable";

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
  // Fixed: [driver, shop] — 2 slots minimum
  const [inputs, setInputs] = useState<string[]>(["", ""]);
  const [slotIds, setSlotIds] = useState<string[]>(["driver", "shop"]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>([null, null]);
  const [remarks, setRemarks] = useState<string[]>(["", ""]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [targetSlot, setTargetSlot] = useState<number | null>(null);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>([false, false]);

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

  const handleToggleLock = (idx: number) => {
    setLockedSlots((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // ─── Update handleToggleAllLocks to use inputs.length ────────────────────
  const handleToggleAllLocks = () => {
    setLockedSlots((prev) => {
      const hasAnyLocked = prev.some(Boolean);
      return Array(inputs.length).fill(!hasAnyLocked);
    });
  };

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

  const handleRemarkChange = (idx: number, remark: string) => {
    setRemarks((prev) => {
      const next = [...prev];
      next[idx] = remark;
      return next;
    });
  };

  // ─── Add Stop ────────────────────────────────────────────────────────────
  const handleAddStop = useCallback(() => {
    const newId = `stop-${Math.random().toString(36).substr(2, 9)}`;
    setInputs((prev) => {
      const next = [...prev];
      next.splice(prev.length - 1, 0, ""); // insert before last (shop)
      return next;
    });
    setSlotIds((prev) => {
      const next = [...prev];
      next.splice(prev.length - 1, 0, newId);
      return next;
    });
    setErrors((prev) => {
      const next = [...prev];
      next.splice(prev.length - 1, 0, null);
      return next;
    });
    setRemarks((prev) => {
      const next = [...prev];
      next.splice(prev.length - 1, 0, "");
      return next;
    });
    setLockedSlots((prev) => {
      const next = [...prev];
      next.splice(prev.length - 1, 0, false);
      return next;
    });
    // auto-target the new stop slot
    setTargetSlot((prev) => {
      // new stop is at index inputs.length - 1 (before shop appended)
      return inputs.length - 1;
    });
  }, [inputs.length]);

  // ─── Remove Stop ─────────────────────────────────────────────────────────
  const handleRemoveStop = useCallback((absIdx: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== absIdx));
    setSlotIds((prev) => prev.filter((_, i) => i !== absIdx));
    setErrors((prev) => prev.filter((_, i) => i !== absIdx));
    setRemarks((prev) => prev.filter((_, i) => i !== absIdx));
    setLockedSlots((prev) => prev.filter((_, i) => i !== absIdx));
    setTargetSlot(null);
  }, []);

  // ─── Update handleOptimize guard (was SLOT_COUNT-1) ──────────────────────
  const handleOptimize = async () => {
    setComputing(true);
    const newErrors: (string | null)[] = Array(inputs.length).fill(null);
    const parsed: Location[] = [];

    if (!inputs[0].trim() || !inputs[inputs.length - 1].trim()) {
      alert("Please provide both the Driver and Shop locations.");
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
        parsed.push({ id: String(i), raw, remark: remarks[i] || "", ...result });
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

  // ─── Update handleClear ───────────────────────────────────────────────────
  const handleClear = () => {
    setInputs(["", ""]);
    setSlotIds(["driver", "shop"]);
    setErrors([null, null]);
    setRemarks(["", ""]);
    setLocations([]);
    setRouteResult(null);
    setComputing(false);
    setTargetSlot(null);
    setLockedSlots([false, false]);
  };

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const loc = place.geometry?.location;
      if (!loc) return;
      // Build a plain lat,lng string — parseGoogleMapsLink handles this format
      const coordString = `${loc.lat()},${loc.lng()}`;
      // Find next empty input slot unless specifically targeted
      setInputs((prev) => {
        const next = [...prev];
        const idx = targetSlot !== null ? targetSlot : next.findIndex((v) => !v.trim());
        if (idx !== -1) {
          next[idx] = coordString;
          setTargetSlot(null);
        }
        return next;
      });
    },
    [targetSlot]
  );

  const handleRawInput = useCallback((text: string) => {
    setInputs((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((v) => !v.trim());
      if (emptyIdx !== -1) next[emptyIdx] = text;
      return next;
    });
  }, []);

  // ─── Update handleCsvImport ───────────────────────────────────────────────
  const handleCsvImport = useCallback((locs: string[]) => {
    if (locs.length < 2) return;
    // First = driver, last = shop, middle = stops
    setInputs(locs);
    setSlotIds(locs.map((_, i) => i === 0 ? "driver" : i === locs.length - 1 ? "shop" : `stop-${Math.random().toString(36).substr(2, 9)}`));
    setErrors(Array(locs.length).fill(null));
    setRemarks(Array(locs.length).fill(""));
    setLockedSlots(Array(locs.length).fill(false));
  }, []);

  const handleReorderStops = useCallback((activeIdx: number, overIdx: number) => {
    setInputs((prev) => arrayMove(prev, activeIdx, overIdx));
    setSlotIds((prev) => arrayMove(prev, activeIdx, overIdx));
    setErrors((prev) => arrayMove(prev, activeIdx, overIdx));
    setRemarks((prev) => arrayMove(prev, activeIdx, overIdx));
    setLockedSlots((prev) => arrayMove(prev, activeIdx, overIdx));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setInputs((prev) => {
      const next = [...prev];
      const idx = targetSlot !== null ? targetSlot : next.findIndex((v) => !v.trim());
      if (idx !== -1) {
        next[idx] = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        setTargetSlot(null);
      }
      return next;
    });
  }, [targetSlot]);

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
        <div className="w-full lg:w-[430px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[85vh] pr-1 dark-scrollbar">
          <InputPanel
            inputs={inputs}
            slotIds={slotIds}
            errors={errors}
            remarks={remarks}
            computing={computing}
            targetSlot={targetSlot}
            onTarget={setTargetSlot}
            onInputChange={handleInput}
            onRemarkChange={handleRemarkChange}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onCsvImport={handleCsvImport}
            onOptimize={handleOptimize}
            onClear={handleClear}
            lockedSlots={lockedSlots}
            onToggleLock={handleToggleLock}
            onToggleAllLocks={handleToggleAllLocks}
            onReorderStops={handleReorderStops}
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
            <RouteLayer locations={locations} lockedSlots={lockedSlots} onResult={handleResult} onMapClick={handleMapClick} />
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
