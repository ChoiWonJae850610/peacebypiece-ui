import type { ReactNode } from "react";

type SectionCountBadgeProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCountBadge({ children, className = "" }: SectionCountBadgeProps) {
  return (
    <span className={["pbp-sidepanel-count-badge rounded-full px-2 py-1 text-[11px] font-medium", className].filter(Boolean).join(" ")}>{children}</span>
  );
}
