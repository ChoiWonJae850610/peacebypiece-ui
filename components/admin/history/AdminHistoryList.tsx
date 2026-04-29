"use client";

import AdminWorkOrderHistoryItem from "@/components/admin/history/AdminWorkOrderHistoryItem";
import type { AdminHistorySectionViewModel } from "@/lib/admin/history/presentation";

type AdminHistoryListProps = {
  viewModel: AdminHistorySectionViewModel;
  emptyText: string;
};

export default function AdminHistoryList({ viewModel, emptyText }: AdminHistoryListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{viewModel.title}</h2>
          <p className="mt-1 text-xs text-stone-500">{viewModel.summaryText}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{viewModel.countText}</span>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {viewModel.items.length > 0 ? (
          viewModel.items.map((item, index) => <AdminWorkOrderHistoryItem key={`${item.id}-${index}`} item={item} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
