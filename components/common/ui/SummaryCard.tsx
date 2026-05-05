import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  children: ReactNode;
};

export default function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <div className="rounded-[24px] p-5 pbp-card">
      <h3 className="text-sm font-semibold pbp-text-primary">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
