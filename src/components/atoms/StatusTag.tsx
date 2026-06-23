/* ═══════════════════════════════════════════════════════════════════════════
   ATOM — StatusTag
   A tiny pill/badge to denote "Start", "End", or any label.
   Uses ion-level pseudo-class for hover-brighten interaction.
   ═══════════════════════════════════════════════════════════════════════════ */

interface StatusTagProps {
  label: string;
  variant?: "start" | "end" | "info";
}

const VARIANT_CLASSES: Record<string, string> = {
  start: "bg-green-100 text-green-700",
  end:   "bg-purple-100 text-purple-700",
  info:  "bg-blue-100 text-blue-700",
};

export default function StatusTag({ label, variant = "info" }: StatusTagProps) {
  return (
    <span
      className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium select-none
        ion-hover-brighten ${VARIANT_CLASSES[variant]}`}
    >
      {label}
    </span>
  );
}
