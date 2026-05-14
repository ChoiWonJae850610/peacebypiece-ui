import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminFilterBar({ children, className = "" }: AdminFilterBarProps) {
  return (
    <div className={["flex flex-wrap items-center gap-2 rounded-[24px] p-2.5 pbp-admin-filter-bar", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
