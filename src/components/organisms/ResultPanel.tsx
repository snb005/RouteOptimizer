/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — ResultPanel
   Displays the optimized route summary: stats + ordered stop list.
   Composes StatCard + StopListItem molecules.
   Uses ion-stroke-brand for the outer border hover effect.
   ═══════════════════════════════════════════════════════════════════════════ */

import { StatCard, StopListItem } from "@/components/molecules";
import type { Location, RouteResult } from "@/components/types";

/* ── Formatting helpers ────────────────────────────────────────────────── */

function formatDistance(meters: number) {
  return meters >= 1000
    ? (meters / 1000).toFixed(1) + " km"
    : meters + " m";
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface ResultPanelProps {
  result: RouteResult;
  orderedLocations: Location[];
}

export default function ResultPanel({ result, orderedLocations }: ResultPanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 ion-stroke-brand ion-hover-lift transition-all">
      <h3 className="font-bold text-blue-800 mb-3 text-sm uppercase tracking-wide">
        ✅ Optimized Route
      </h3>

      {/* Stats row */}
      <div className="flex gap-3 mb-3">
        <StatCard value={formatDistance(result.distanceMeters)} label="Total Distance" />
        <StatCard value={formatDuration(result.durationSeconds)} label="Est. Duration" />
      </div>

      {/* Visit order */}
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Visit Order
      </h4>
      <ol className="flex flex-col gap-0.5">
        {orderedLocations.map((loc, idx) => (
          <StopListItem
            key={loc.id}
            index={idx}
            name={loc.name}
            isFirst={idx === 0}
            isLast={idx === orderedLocations.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
