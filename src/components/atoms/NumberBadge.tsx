/* ═══════════════════════════════════════════════════════════════════════════
   ATOM — NumberBadge
   A small colored circle with a centered number inside.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ROUTE_COLORS } from "@/components/ions";

interface NumberBadgeProps {
  /** 0-based index (picks color from palette, displays idx+1) */
  index: number;
  /** Visual size variant */
  size?: "sm" | "md";
}

export default function NumberBadge({ index, size = "md" }: NumberBadgeProps) {
  const dim = size === "sm" ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs";

  return (
    <div
      className={`${dim} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ion-hover-brighten`}
      style={{ background: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
      aria-hidden="true"
    >
      {index + 1}
    </div>
  );
}
