/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — InputPanel
   Fixed Driver + Shop slots. Dynamic middle stops via Add Stop button.
   Synced with map pin-drop and search via targetSlot.
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { LocationSlot } from "@/components/molecules";
import { ActionButton } from "@/components/atoms";
import Papa from "papaparse";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

interface InputPanelProps {
  inputs: string[];           // [driver, ...stops, shop]
  slotIds: string[];          // stable unique slot IDs
  errors: (string | null)[];
  remarks: string[];
  computing: boolean;
  targetSlot: number | null;
  onTarget: (idx: number) => void;
  onInputChange: (index: number, value: string) => void;
  onRemarkChange: (index: number, remark: string) => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onCsvImport?: (locations: string[]) => void;
  onOptimize: () => void;
  onClear: () => void;
  lockedSlots: boolean[];
  onToggleLock: (index: number) => void;
  onToggleAllLocks: () => void;
  onReorderStops: (activeIdx: number, overIdx: number) => void;
}

export default function InputPanel({
  inputs,
  slotIds,
  errors,
  remarks,
  computing,
  targetSlot,
  onTarget,
  onInputChange,
  onRemarkChange,
  onAddStop,
  onRemoveStop,
  onCsvImport,
  onOptimize,
  onClear,
  lockedSlots,
  onToggleLock,
  onToggleAllLocks,
  onReorderStops,
}: InputPanelProps) {
  const stopCount = inputs.length - 2; // exclude driver + shop

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // prevent dragging on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIdx = slotIds.indexOf(active.id as string);
      const overIdx = slotIds.indexOf(over.id as string);
      if (activeIdx !== -1 && overIdx !== -1) {
        onReorderStops(activeIdx, overIdx);
      }
    }
  };

  /* CSV helpers */
  const handleDownloadCsv = () => {
    const sample = [
      ["Location"],
      ["https://maps.app.goo.gl/ZK4QVFMSy5x3w71t8"],
      ["https://maps.app.goo.gl/oSKCuDGC1ovtR8QU8"],
      ["https://maps.app.goo.gl/5pMoFZrvENqTkRXx5"],
    ];
    const blob = new Blob([Papa.unparse(sample)], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "sample_locations.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleUploadCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onCsvImport) return;
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const locs = (data as string[][])
          .map((r) => r[0])
          .filter((v) => v && v.toLowerCase() !== "location");
        onCsvImport(locs);
      },
    });
    e.target.value = "";
  };

  const anyLocked = lockedSlots.some(Boolean);

  return (
    <div className="ion-depth-card p-4 flex flex-col gap-4 transition-all duration-200 hover:border-[var(--ion-brand-300)]">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[var(--ion-neutral-800)] tracking-tight text-sm">
          📍 Route Planner
        </h2>
        <div className="flex items-center gap-1.5">
          {/* Lock / Unlock All Toggle */}
          <button
            type="button"
            onClick={onToggleAllLocks}
            className={`text-[10px] font-semibold ion-active-press px-2 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer select-none ${
              anyLocked
                ? "text-[var(--ion-brand-600)] bg-[var(--ion-brand-50)] hover:bg-[var(--ion-brand-100)] ring-1 ring-[var(--ion-brand-100)]"
                : "text-[var(--ion-neutral-500)] hover:text-[var(--ion-neutral-600)] hover:bg-[var(--ion-neutral-100)]"
            }`}
            title={anyLocked ? "Unlock all slots" : "Lock all slots"}
          >
            {anyLocked ? (
              <>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <span>Unlock All</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-5h-1V6c0-2.76-2.24-5-5-5-2.28 0-4.27 1.54-4.82 3.73-.13.52.18 1.04.7 1.17.52.13 1.04-.18 1.17-.7C9.52 3.66 10.66 3 12 3c1.66 0 3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
                </svg>
                <span>Lock All</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadCsv}
            className="text-[10px] font-semibold text-[var(--ion-brand-600)] bg-[var(--ion-brand-50)] hover:bg-[var(--ion-brand-100)] ion-active-press px-2 py-1 rounded-lg transition-colors"
          >
            ↓ Sample
          </button>
          <label className="text-[10px] font-semibold text-white bg-[var(--ion-brand-600)] hover:bg-[var(--ion-brand-700)] ion-active-press ion-hover-lift px-2 py-1 rounded-lg cursor-pointer shadow-sm transition-colors">
            ↑ CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleUploadCsv} />
          </label>
          <button
            onClick={onClear}
            className="text-[10px] font-semibold text-[var(--ion-neutral-500)] hover:text-[var(--ion-danger-500)] ion-active-press px-2 py-1 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Hint ── */}
      <p className="text-[11px] text-[var(--ion-neutral-500)] leading-relaxed">
        Paste a Google Maps share link or <code className="bg-[var(--ion-neutral-100)] px-1 py-0.5 rounded text-[10px]">lat,lng</code>.
        Driver → middle stops auto-optimized → Shop.
      </p>

      {/* ── Slots ── */}
      <div className="flex flex-col gap-2">

        {/* Driver — fixed slot 0 */}
        <LocationSlot
          id={slotIds[0] || "driver"}
          index={0}
          role="driver"
          value={inputs[0]}
          error={errors[0]}
          remark={remarks[0] || ""}
          onChange={(v) => onInputChange(0, v)}
          onRemarkChange={(r) => onRemarkChange(0, r)}
          isTargeted={targetSlot === 0}
          onTarget={() => onTarget(0)}
          isLocked={lockedSlots[0]}
          onToggleLock={() => onToggleLock(0)}
        />

        {/* Divider */}
        {stopCount > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-[var(--ion-neutral-200)]" />
            <span className="text-[10px] text-[var(--ion-neutral-400)] font-semibold uppercase tracking-wider">
              {stopCount} Stop{stopCount !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-px bg-[var(--ion-neutral-200)]" />
          </div>
        )}

        {/* Dynamic middle stops — indices 1 .. inputs.length-2 */}
        {stopCount > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slotIds.slice(1, -1)}
              strategy={verticalListSortingStrategy}
            >
              <div className="ion-depth-inset flex flex-col gap-2 max-h-[40vh] overflow-y-auto p-2 light-scrollbar">
                {inputs.slice(1, -1).map((val, si) => {
                  const absIdx = si + 1; // absolute index in inputs[]
                  const id = slotIds[absIdx];
                  return (
                    <LocationSlot
                      key={id}
                      id={id}
                      index={absIdx}
                      role="stop"
                      value={val}
                      error={errors[absIdx]}
                      remark={remarks[absIdx] || ""}
                      onChange={(v) => onInputChange(absIdx, v)}
                      onRemarkChange={(r) => onRemarkChange(absIdx, r)}
                      isTargeted={targetSlot === absIdx}
                      onTarget={() => onTarget(absIdx)}
                      isLocked={lockedSlots[absIdx]}
                      onToggleLock={() => onToggleLock(absIdx)}
                      onRemove={() => onRemoveStop(absIdx)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add Stop button */}
        <button
          type="button"
          onClick={onAddStop}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-[var(--ion-brand-200)] text-[var(--ion-brand-600)] hover:border-[var(--ion-brand-500)] hover:bg-[var(--ion-brand-50)] cursor-pointer text-xs font-semibold transition-all duration-200 ion-active-press"
          title="Add a stop"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Stop
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-[var(--ion-neutral-200)]" />
        </div>

        {/* Shop — fixed last slot */}
        <LocationSlot
          id={slotIds[inputs.length - 1] || "shop"}
          index={inputs.length - 1}
          role="shop"
          value={inputs[inputs.length - 1]}
          error={errors[inputs.length - 1]}
          remark={remarks[inputs.length - 1] || ""}
          onChange={(v) => onInputChange(inputs.length - 1, v)}
          onRemarkChange={(r) => onRemarkChange(inputs.length - 1, r)}
          isTargeted={targetSlot === inputs.length - 1}
          onTarget={() => onTarget(inputs.length - 1)}
          isLocked={lockedSlots[inputs.length - 1]}
          onToggleLock={() => onToggleLock(inputs.length - 1)}
        />
      </div>

      {/* ── Optimize button ── */}
      <ActionButton
        variant="primary"
        fullWidth
        disabled={computing}
        onClick={onOptimize}
      >
        {computing ? <span className="ion-pulse">Computing…</span> : "⚡ Optimize Route"}
      </ActionButton>
    </div>
  );
}
