/* ═══════════════════════════════════════════════════════════════════════════
   ATOM — RemarkModal
   Prompt modal for per-stop driver remarks.
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useEffect, useRef, useState } from "react";

interface RemarkModalProps {
  stopLabel: string;   // e.g. "Stop 3" or "Driver" or "Shop"
  initial: string;
  onSave: (remark: string) => void;
  onClose: () => void;
}

export default function RemarkModal({
  stopLabel,
  initial,
  onSave,
  onClose,
}: RemarkModalProps) {
  const [value, setValue] = useState(initial);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // autofocus on open
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => { onSave(value.trim()); onClose(); };
  const handleClear = () => { onSave(""); onClose(); };

  return (
    <div className="ion-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ion-modal-panel p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* pencil icon */}
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--ion-remark-active-bg)" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke="var(--ion-remark-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--ion-neutral-500)" }}>
                Remarks for
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--ion-neutral-900)" }}>
                {stopLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ion-active-press w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" style={{ color: "var(--ion-neutral-400)" }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Ring bell, leave at door, call on arrival…"
          rows={4}
          maxLength={300}
          className="ion-focus-ring w-full resize-none rounded-xl px-3.5 py-3 text-sm
            border transition-colors"
          style={{
            background: "var(--ion-depth-2)",
            borderColor: "var(--ion-neutral-200)",
            color: "var(--ion-neutral-800)",
            fontFamily: "inherit",
            lineHeight: "1.6",
          }}
        />
        <p className="text-right text-xs" style={{ color: "var(--ion-neutral-400)", marginTop: "-12px" }}>
          {value.length}/300
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-end">

          <button
            type="button"
            onClick={handleSave}
            className="ion-active-press px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--ion-brand-600)", color: "#fff" }}
          >
            Save
          </button>
          {/* <button
            type="button"
            onClick={onClose}
            className="ion-active-press px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--ion-neutral-600)", background: "var(--ion-neutral-100)" }}
          >
            Cancel
          </button> */}
          {/* {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="ion-active-press px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--ion-danger-500)", background: "var(--ion-danger-50)" }}
            >
              Clear
            </button>
          )} */}
        </div>

      </div>
    </div>
  );
}
