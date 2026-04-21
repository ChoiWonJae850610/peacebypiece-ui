"use client";

import { useMemo, useState } from "react";
import AdminHistoryDebugPanel from "@/components/debug/AdminHistoryDebugPanel";
import AdminWorkOrderHistoryItem from "@/components/admin/history/AdminWorkOrderHistoryItem";
import { buildAdminHistorySectionViewModel } from "@/lib/admin/history/presentation";
import { matchesAdminHistorySearch } from "@/lib/admin/history/selectors";
import { useAdminHistoryTools } from "@/lib/admin/useAdminHistoryTools";
import { useI18n } from "@/lib/i18n";
import { isDebugFeatureEnabled } from "@/lib/constants/runtimeMode";
export default function AdminWorkOrderHistoryPage() {
  const { i18n } = useI18n();
  const pageText = i18n.admin.historyPage;
  const { historyEvents, historyFilter, setHistoryFilter } = useAdminHistoryTools();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = useMemo(
    () => historyEvents.filter((item) => matchesAdminHistorySearch(item, searchQuery)),
    [historyEvents, searchQuery],
  );

  const viewModel = buildAdminHistorySectionViewModel(filteredLogs, historyFilter);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const showDebugPanel = isDebugFeatureEnabled("adminHistoryDebugPanel");

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 border-b border-stone-200 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{viewModel.title}</h2>
              <p className="text-sm leading-6 text-stone-600">{pageText.filterDescription}</p>
            </div>
            <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {viewModel.countText}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-800">{pageText.searchLabel}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={pageText.searchPlaceholder}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {viewModel.filterOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setHistoryFilter(item.value)}
                  className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-2 text-xs font-medium ${item.className}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {viewModel.items.length > 0 ? (
            viewModel.items.map((item, index) => (
              <AdminWorkOrderHistoryItem key={`${item.id}-${index}`} item={item} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
              {hasSearchQuery ? pageText.emptySearch : viewModel.emptyText}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <aside className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-stone-900">{pageText.guideTitle}</h2>
            <p className="text-sm leading-6 text-stone-600">{pageText.guideDescription}</p>
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
              <div>{viewModel.summaryText}</div>
              <div className="mt-2">{pageText.searchGuide}</div>
            </div>
          </div>
        </aside>
        {showDebugPanel ? <AdminHistoryDebugPanel historyEvents={historyEvents} /> : null}
      </div>
    </section>
  );
}
