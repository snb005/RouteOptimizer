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
    "flex-1 text-black text-sm px-3 py-2 rounded-lg outline-none transition-all duration-200 " +
    "ion-focus-ring ";

  const state = error
    ? "ion-stroke-danger bg-red-50 focus:border-red-500"
    : "ion-stroke-subtle bg-gray-50 hover:bg-white focus:bg-white focus:border-blue-400";

  return <input className={`${base} ${state} ${className}`} {...rest} />;
}
