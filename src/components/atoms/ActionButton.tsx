/* ═══════════════════════════════════════════════════════════════════════════
   ATOM — ActionButton
   Primary / secondary button with ion pseudo-class hover-lift, active-press,
   focus-ring, and disabled states.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** Fill the available width */
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    "bg-blue-600 text-white shadow-sm " +
    "hover:bg-blue-700 " +
    "ion-hover-lift ion-active-press",
  secondary:
    "bg-gray-100 text-gray-600 " +
    "hover:bg-gray-200 " +
    "ion-hover-tint ion-active-press",
};

export default function ActionButton({
  variant = "primary",
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        py-2.5 px-4 rounded-xl font-semibold text-sm
        transition-all duration-200
        ion-focus-ring
        ${disabled ? "bg-gray-100 text-gray-600 cursor-not-allowed" : VARIANT_CLASSES[variant]}
        ${fullWidth ? "flex-1" : ""}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
