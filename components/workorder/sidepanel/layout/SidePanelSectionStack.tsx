import type { ReactNode } from "react";

export default function SidePanelSectionStack({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className={compact ? "space-y-3 pb-2" : "space-y-3 pb-2 xl:space-y-4"}>{children}</div>;
}
