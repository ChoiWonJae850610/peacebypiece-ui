import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminFilterBar({ children, className = "" }: AdminFilterBarProps) {
  return (
    <div className={["flex flex-wrap items-center gap-2 rounded-[24px] border border-stone-200 bg-stone-50/80 p-2.5 shadow-inner shadow-stone-100/60", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
