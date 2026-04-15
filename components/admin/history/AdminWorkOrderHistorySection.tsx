"use client";

import AdminWorkOrderHistoryItem from "@/components/admin/history/AdminWorkOrderHistoryItem";
import { buildAdminHistorySectionViewModel } from "@/lib/admin/historyPresentation";
import type { HistoryFilter } from "@/types/workflow";
import type { HistoryLog } from "@/types/workorder";

type AdminWorkOrderHistorySectionProps = {
  historyLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
};

export default function AdminWorkOrderHistorySection({
  historyLogs,
  historyFilter,
  onHistoryFilterChange,
}: AdminWorkOrderHistorySectionProps) {
  const viewModel = buildAdminHistorySectionViewModel(historyLogs, historyFilter);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{viewModel.title}</h3>
          <div className="mt-1 text-xs text-stone-500">{viewModel.summaryText}</div>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{viewModel.countText}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {viewModel.filterOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onHistoryFilterChange(item.value)}
            className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-1 text-xs font-medium ${item.className}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {viewModel.items.length > 0 ? (
          viewModel.items.map((item) => <AdminWorkOrderHistoryItem key={item.id} item={item} />)
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
            {viewModel.emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
