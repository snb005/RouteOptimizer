/* ═══════════════════════════════════════════════════════════════════════════
   ATOM — TextInput
   A styled text input with ion-level focus-ring, stroke-subtle hover,
   and error (stroke-danger) states.
   ═══════════════════════════════════════════════════════════════════════════ */

import { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Whether the field is in an error state */
  error?: boolean;
}

export default function TextInput({ error = false, className = "", ...rest }: TextInputProps) {
  const base =
    "flex-1 text-[var(--ion-neutral-800)] text-sm px-3 py-2 rounded-lg outline-none transition-all duration-200 " +
    "ion-focus-ring ";

  const state = error
    ? "ion-stroke-danger bg-[var(--ion-danger-50)] focus:border-[var(--ion-danger-500)]"
    : "ion-stroke-subtle bg-[var(--ion-depth-2)] hover:bg-[var(--ion-depth-0)] focus:bg-[var(--ion-depth-0)] focus:border-[var(--ion-brand-500)]";

  return <input className={`${base} ${state} ${className}`} {...rest} />;
}
