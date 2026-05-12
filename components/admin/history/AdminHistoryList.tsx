"use client";

import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import AdminWorkOrderHistoryItem from "@/components/admin/history/AdminWorkOrderHistoryItem";
import type { AdminHistorySectionViewModel } from "@/lib/admin/history/presentation";

type AdminHistoryListProps = {
  viewModel: AdminHistorySectionViewModel;
  emptyText: string;
};

export default function AdminHistoryList({ viewModel, emptyText }: AdminHistoryListProps) {
  return (
    <div className="flex h-[calc(100vh-292px)] min-h-[520px] flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{viewModel.title}</h2>
          <p className="mt-1 text-xs text-stone-500">{viewModel.summaryText}</p>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {viewModel.items.length > 0 ? (
          viewModel.items.map((item) => <AdminWorkOrderHistoryItem key={item.id} item={item} />)
        ) : (
          <AdminEmptyState title={emptyText} className="rounded-2xl border-dashed shadow-none" />
        )}
      </div>
    </div>
  );
}
