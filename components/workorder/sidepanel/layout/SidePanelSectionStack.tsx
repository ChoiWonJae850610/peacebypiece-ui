import type { ReactNode } from "react";

export default function SidePanelSectionStack({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className={compact ? "space-y-3" : "space-y-4 xl:space-y-5"}>{children}</div>;
}
