/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — InputPanel
   The full left sidebar: header + location slots + action buttons.
   Composes LocationSlot molecules + ActionButton atoms.
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { ActionButton } from "@/components/atoms";
import { LocationSlot } from "@/components/molecules";
import { SLOT_COUNT } from "@/components/ions";

interface InputPanelProps {
  inputs: string[];
  errors: (string | null)[];
  computing: boolean;
  onInputChange: (index: number, value: string) => void;
  onOptimize: () => void;
  onClear: () => void;
}

export default function InputPanel({
  inputs,
  errors,
  computing,
  onInputChange,
  onOptimize,
  onClear,
}: InputPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">📍 Paste Google Maps Links</h2>
        <p className="text-xs text-gray-500">
          Paste a Google Maps share URL or plain <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">lat,lng</code> for each stop.
          First = start, Last = end. Middle stops are auto-optimized.
        </p>
      </div>

      {/* Location slots */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: SLOT_COUNT }).map((_, i) => (
          <LocationSlot
            key={i}
            index={i}
            value={inputs[i]}
            error={errors[i]}
            onChange={(val) => onInputChange(i, val)}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        <ActionButton
          variant="primary"
          fullWidth
          disabled={computing}
          onClick={onOptimize}
        >
          {computing ? (
            <span className="ion-pulse">Computing…</span>
          ) : (
            "⚡ Optimize Route"
          )}
        </ActionButton>
        <ActionButton variant="secondary" onClick={onClear}>
          Clear
        </ActionButton>
      </div>
    </div>
  );
}
