import type { ReactNode } from "react";

import { AppBadge } from "@/components/common/ui";

type SectionCountBadgeProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCountBadge({ children, className = "" }: SectionCountBadgeProps) {
  return (
    <AppBadge variant="count" size="sm" className={["pbp-sidepanel-count-badge font-medium", className].filter(Boolean).join(" ")}>
      {children}
    </AppBadge>
  );
}
