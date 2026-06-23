/* ═══════════════════════════════════════════════════════════════════════════
   MOLECULE — StopListItem
   NumberBadge (sm) + location name + optional StatusTag in a row.
   Uses ion-hover-tint on hover for row highlight.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NumberBadge, StatusTag } from "@/components/atoms";

interface StopListItemProps {
  index: number;
  name: string;
  isFirst: boolean;
  isLast: boolean;
}

export default function StopListItem({ index, name, isFirst, isLast }: StopListItemProps) {
  return (
    <li className="flex items-center gap-2 text-sm py-1 px-1.5 -mx-1.5 rounded-lg ion-hover-tint transition-colors">
      <NumberBadge index={index} size="sm" />
      <span className="text-gray-700 truncate" title={name}>
        {name || `Stop ${index + 1}`}
      </span>
      {isFirst && <StatusTag label="Driver" variant="start" />}
      {isLast  && <StatusTag label="Shop"   variant="end" />}
    </li>
  );
}
