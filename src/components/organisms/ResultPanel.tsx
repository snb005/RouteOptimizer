/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — ResultPanel
   Displays the optimized route summary: stats + ordered stop list.
   Composes StatCard + StopListItem molecules.
   Uses ion-stroke-brand for the outer border hover effect.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { StatCard, StopListItem } from "@/components/molecules";
import type { Location, RouteResult } from "@/components/types";
import { useCopyRouteLink, downloadRoutePdf } from "./RoutePdf";

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

// ── NEW: Build Google Maps /dir/ shareable URL from ordered lat/lng stops ──
function buildShareUrl(stops: Location[]): string {
  const coords = stops
    .map((loc) => `${loc.lat},${loc.lng}`)
    .join("/");
  return `https://www.google.com/maps/dir/${coords}`;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface ResultPanelProps {
  result: RouteResult;
  orderedLocations: Location[];
}

export default function ResultPanel({ result, orderedLocations }: ResultPanelProps) {
  const { copied, handleShare } = useCopyRouteLink(orderedLocations);
  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      await downloadRoutePdf(result, orderedLocations, "Demo Driver");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenInMaps = () => {
    if (orderedLocations.length < 2) return;
    const url = buildShareUrl(orderedLocations);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 ion-stroke-brand transition-all">
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

      {/* ── NEW: Share Buttons ── */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={handleOpenInMaps}
          className="w-full flex items-center justify-center gap-2 
                     bg-blue-600 hover:bg-blue-700 active:scale-95
                     text-white text-sm font-semibold
                     py-2.5 px-4 rounded-xl
                     transition-all duration-200 ion-hover-lift cursor-pointer"
        >
          📍 Open in Google Maps
        </button>
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 
                     bg-white hover:bg-gray-50 border border-gray-200 active:scale-95
                     text-gray-700 text-sm font-semibold
                     py-2.5 px-4 rounded-xl
                     transition-all duration-200 ion-hover-lift cursor-pointer"
        >
          {copied ? "✅ Link Copied!" : "🔗 Copy Share Link"}
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 
                     bg-cyan-500 hover:bg-cyan-600 active:scale-95 disabled:opacity-50
                     text-white text-sm font-semibold
                     py-2.5 px-4 rounded-xl
                     transition-all duration-200 ion-hover-lift cursor-pointer"
        >
          {generating ? "⏳ Generating PDF..." : "📄 Download PDF"}
        </button>
      </div>
    </div>
  );
}
