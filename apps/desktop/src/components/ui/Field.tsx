import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  description?: string;
  children: ReactNode;
}

const CONTROL_CLASS_NAME =
  "h-11 w-full rounded-2xl border border-ink-300/45 bg-white/85 px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-700/60 focus:bg-white";

export function Field({ label, description, children }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-ink-700">
      <span>{label}</span>
      {children}
      {description ? <span className="text-xs font-normal text-ink-500">{description}</span> : null}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[CONTROL_CLASS_NAME, "min-w-0", className].join(" ")} {...props} />;
}

export function SelectInput({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={[CONTROL_CLASS_NAME, "min-w-0", className].join(" ")} {...props} />;
}
