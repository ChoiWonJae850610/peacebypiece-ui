import type { ReactNode } from "react";

import { WaflSurface } from "./WaflSurface";

type SummaryCardProps = {
  title?: string;
  children: ReactNode;
};

export default function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <WaflSurface component="summary-card" tone="surface" className="p-5">
      {title ? (
        <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
          {title}
        </h3>
      ) : null}
      <div className={title ? "mt-4" : "mt-0"}>{children}</div>
    </WaflSurface>
  );
}
