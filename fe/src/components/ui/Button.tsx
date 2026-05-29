import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-[var(--accent)] text-[#102019]",
  secondary: "bg-[#343842] text-[var(--text)]",
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
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-0 px-3.5 font-black transition disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
