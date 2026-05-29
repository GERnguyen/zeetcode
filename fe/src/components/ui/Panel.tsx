import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
