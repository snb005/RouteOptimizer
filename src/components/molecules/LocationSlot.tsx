/* ═══════════════════════════════════════════════════════════════════════════
   MOLECULE — LocationSlot
   NumberBadge + TextInput + error message composed as one input row.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NumberBadge, TextInput } from "@/components/atoms";
import { SLOT_COUNT } from "@/components/ions";

interface LocationSlotProps {
  /** 0-based index */
  index: number;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}

function placeholderFor(index: number): string {
  if (index === 0) return "Start location (Maps link or lat,lng)";
  if (index === SLOT_COUNT - 1) return "End location (Maps link or lat,lng)";
  return `Stop ${index + 1} (optional)`;
}

export default function LocationSlot({ index, value, error, onChange }: LocationSlotProps) {
  return (
    <div className="flex flex-col gap-0.5 group">
      <div className="flex items-center gap-2">
        <NumberBadge index={index} />
        <TextInput
          type="text"
          placeholder={placeholderFor(index)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          aria-label={placeholderFor(index)}
        />
      </div>
      {error && <p className="text-xs text-red-500 pl-8">{error}</p>}
    </div>
  );
}
