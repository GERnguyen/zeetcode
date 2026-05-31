import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-[var(--accent)] text-[#102019] shadow-[0_12px_30px_rgba(69,214,154,0.18)] hover:shadow-[0_16px_38px_rgba(69,214,154,0.3)]",
  secondary: "bg-[#343842] text-[var(--text)] hover:bg-[#3d424d]",
  ghost: "bg-transparent text-[var(--muted)] hover:bg-[#30333a] hover:text-[var(--text)]",
};

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-0 px-3.5 font-black transition-[transform,box-shadow,background,color,opacity] duration-150 hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
