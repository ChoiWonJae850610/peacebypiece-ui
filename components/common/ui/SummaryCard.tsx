import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  children: ReactNode;
};

export default function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
