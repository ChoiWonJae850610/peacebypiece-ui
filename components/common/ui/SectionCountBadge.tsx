import type { ReactNode } from "react";

import { WaflBadge } from "@/components/common/ui";

type SectionCountBadgeProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCountBadge({ children, className = "" }: SectionCountBadgeProps) {
  return (
    <WaflBadge variant="count" size="sm" className={["pbp-sidepanel-count-badge font-medium", className].filter(Boolean).join(" ")}>
      {children}
    </WaflBadge>
  );
}
