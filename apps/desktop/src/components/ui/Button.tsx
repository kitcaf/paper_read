import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASS_NAMES: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-paper-50 hover:bg-ink-800 disabled:bg-ink-500",
  secondary:
    "border border-ink-300/45 bg-white text-ink-700 hover:border-ink-300/70 hover:bg-paper-50",
  ghost: "text-ink-500 hover:bg-ink-100/70 hover:text-ink-900",
  danger:
    "border border-ink-300/45 bg-white text-ink-600 hover:border-coral-500/45 hover:text-coral-500",
  soft: "border border-ink-300/30 bg-paper-50 text-ink-700 hover:border-ink-300/60 hover:bg-white"
};

const SIZE_CLASS_NAMES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0"
};

export function Button({
  className = "",
  type = "button",
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-55",
        VARIANT_CLASS_NAMES[variant],
        SIZE_CLASS_NAMES[size],
        className
      ].join(" ")}
      type={type}
      {...props}
    />
  );
}
