import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils/cn";

const controlClass =
  "min-h-10 rounded-xl border border-[var(--line)] bg-[#202329] px-3 text-[var(--text)] outline-none transition-[border-color,box-shadow,background] placeholder:text-[#707783] focus:border-[var(--accent)] focus:bg-[#232831] focus:shadow-[0_0_0_3px_rgba(69,214,154,0.12)]";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, "select-control", className)} {...props} />;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
      {label}
      {children}
    </label>
  );
}
