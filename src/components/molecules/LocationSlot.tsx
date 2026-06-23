/* ═══════════════════════════════════════════════════════════════════════════
   MOLECULE — LocationSlot
   NumberBadge + TextInput + error + lock + remark + removable stop support
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useState } from "react";
import { NumberBadge, TextInput, RemarkModal } from "@/components/atoms";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LocationSlotProps {
  id: string;
  index: number;
  role?: "driver" | "shop" | "stop";
  value: string;
  error: string | null;
  remark: string;
  onChange: (value: string) => void;
  onRemarkChange: (remark: string) => void;
  isTargeted?: boolean;
  onTarget?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onRemove?: () => void;
}

function placeholderFor(role: "driver" | "shop" | "stop", index: number): string {
  if (role === "driver") return "Driver location — Maps link or lat,lng";
  if (role === "shop") return "Shop / Destination — Maps link or lat,lng";
  return `Stop ${index} — Maps link or lat,lng`;
}

function stopLabelFor(role: "driver" | "shop" | "stop", index: number): string {
  if (role === "driver") return "Driver Origin";
  if (role === "shop") return "Shop / Destination";
  return `Stop ${index}`;
}

const ROLE_PILL: Record<"driver" | "shop" | "stop", string> = {
  driver: "bg-[var(--ion-success-100)] text-[var(--ion-success-700)]",
  shop: "bg-[var(--ion-purple-100)]  text-[var(--ion-purple-700)]",
  stop: "",
};

export default function LocationSlot({
  id,
  index,
  role = "stop",
  value,
  error,
  remark,
  onChange,
  onRemarkChange,
  isTargeted = false,
  onTarget,
  isLocked = false,
  onToggleLock,
  onRemove,
}: LocationSlotProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasRemark = remark.trim().length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: role !== "stop" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={[
          "relative flex flex-col gap-1 group rounded-xl p-1.5",
          isDragging ? "" : "transition-all duration-200",
          "ion-stroke-subtle",
          isTargeted
            ? "ring-2 ring-[var(--ion-brand-500)] ring-offset-1 bg-[var(--ion-brand-50)]"
            : "bg-[var(--ion-depth-0)] shadow-xs hover:shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-center gap-0.5">
          {/* Drag handle for middle stops */}
          {role === "stop" && (
            <div
              {...attributes}
              {...listeners}
              className="text-[var(--ion-neutral-400)] hover:text-[var(--ion-neutral-600)] cursor-grab active:cursor-grabbing p-1 flex items-center justify-center shrink-0 select-none"
              title="Drag to reorder"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </div>
          )}
          {/* Badge — click to target */}
          <button
            type="button"
            onClick={onTarget}
            className="ion-active-press focus:outline-none cursor-pointer flex-shrink-0"
            title="Target this slot for next pin drop or search"
          >
            <NumberBadge index={index} />
          </button>

          {/* Role pill */}
          {role !== "stop" && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${ROLE_PILL[role]}`}>
              {role}
            </span>
          )}

          {/* Input */}
          <div className="flex-1 min-w-0">
            <TextInput
              type="text"
              placeholder={placeholderFor(role, index)}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              error={!!error}
              aria-label={placeholderFor(role, index)}
            />
          </div>

          {/* Remark Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={[
              "p-1.5 rounded-lg transition-all duration-150 ion-active-press focus:outline-none cursor-pointer flex-shrink-0",
              hasRemark
                ? "ring-1"
                : "text-[var(--ion-neutral-400)] hover:text-amber-500 hover:bg-amber-50"
            ].join(" ")}
            style={hasRemark ? {
              color: "var(--ion-remark-icon)",
              background: "var(--ion-remark-active-bg)",
              border: "1px solid var(--ion-remark-border)",
            } : {}}
            title={hasRemark ? `Remark: ${remark}` : "Add remark for this stop"}
            aria-label="Add or edit stop remark"
          >
            {/* Pencil icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Lock toggle */}
          {onToggleLock && (
            <button
              type="button"
              onClick={onToggleLock}
              className={[
                "p-1.5 rounded-lg transition-all duration-150 ion-active-press focus:outline-none cursor-pointer flex-shrink-0",
                isLocked
                  ? "text-[var(--ion-brand-600)] bg-[var(--ion-brand-50)] hover:bg-[var(--ion-brand-100)] ring-1 ring-[var(--ion-brand-100)]"
                  : "text-[var(--ion-neutral-400)] hover:text-[var(--ion-neutral-600)] hover:bg-[var(--ion-neutral-100)]",
              ].join(" ")}
              title={isLocked ? "Unlock slot" : "Lock slot"}
            >
              {isLocked ? (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-5h-1V6c0-2.76-2.24-5-5-5-2.28 0-4.27 1.54-4.82 3.73-.13.52.18 1.04.7 1.17.52.13 1.04-.18 1.17-.7C9.52 3.66 10.66 3 12 3c1.66 0 3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
                </svg>
              )}
            </button>
          )}

          {/* Remove button — stops only */}
          {onRemove && role === "stop" && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-[var(--ion-neutral-400)] hover:text-[var(--ion-danger-500)] hover:bg-[var(--ion-danger-50)] transition-all duration-150 ion-active-press focus:outline-none cursor-pointer flex-shrink-0"
              title="Remove stop"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Remark pill — shown below row when remark is saved */}
        {hasRemark && (
          <div className="pl-9 pt-0.5">
            <span className="ion-remark-pill">
              <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {remark}
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--ion-danger-500)] pl-9 pt-0.5">{error}</p>
        )}
      </div>

      {/* Remark Modal */}
      {modalOpen && (
        <RemarkModal
          stopLabel={stopLabelFor(role, index)}
          initial={remark}
          onSave={onRemarkChange}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
