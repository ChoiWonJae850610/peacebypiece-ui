import type { ReactNode } from "react";

export default function DesktopCostSummaryLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return <div className="grid gap-4 grid-cols-2">{left}{right}</div>;
}
