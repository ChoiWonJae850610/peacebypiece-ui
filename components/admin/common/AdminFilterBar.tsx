import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminFilterBar({ children, className = "" }: AdminFilterBarProps) {
  return (
    <div className={["flex flex-wrap items-center gap-2 rounded-[24px] border border-stone-200 bg-stone-50/70 p-3", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
