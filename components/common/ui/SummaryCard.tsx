import type { ReactNode } from "react";

type SummaryCardProps = {
  title?: string;
  children: ReactNode;
};

export default function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <div className="rounded-[24px] p-5 pbp-card">
      {title ? <h3 className="text-sm font-semibold pbp-text-primary">{title}</h3> : null}
      <div className={title ? "mt-4" : "mt-0"}>{children}</div>
    </div>
  );
}
