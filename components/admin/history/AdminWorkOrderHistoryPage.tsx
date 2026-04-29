"use client";

import { useMemo, useState } from "react";
import AdminWorkOrderHistoryItem from "@/components/admin/history/AdminWorkOrderHistoryItem";
import { buildAdminHistorySectionViewModel } from "@/lib/admin/history/presentation";
import {
  ADMIN_HISTORY_DATE_FILTER_OPTIONS,
  filterAdminHistoryPageEvents,
  selectAdminHistoryUserOptions,
} from "@/lib/admin/history/selectors";
import type { AdminHistoryDateFilter } from "@/lib/admin/history/types";
import { useAdminHistoryTools } from "@/lib/admin/useAdminHistoryTools";
import { useI18n } from "@/lib/i18n";

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.35-5.65" />
      <path d="M20 4.5V9h-4.5" />
    </svg>
  );
}

export default function AdminWorkOrderHistoryPage() {
  const { i18n } = useI18n();
  const pageText = i18n.admin.historyPage;
  const { historyEvents, historyFilter, setHistoryFilter } = useAdminHistoryTools();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<AdminHistoryDateFilter>("all");
  const [userFilter, setUserFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const dateOptions = useMemo(
    () => ADMIN_HISTORY_DATE_FILTER_OPTIONS.map((option) => ({
      ...option,
      label: pageText.dateFilters[option.value] ?? option.label,
    })),
    [pageText],
  );
  const userOptions = useMemo(
    () => selectAdminHistoryUserOptions(historyEvents).map((option) => (option.value === "all" ? { ...option, label: pageText.allUsers } : option)),
    [historyEvents, pageText],
  );

  const filteredLogs = useMemo(
    () => filterAdminHistoryPageEvents({
      items: historyEvents,
      searchQuery,
      dateFilter,
      userFilter,
    }),
    [dateFilter, historyEvents, refreshKey, searchQuery, userFilter],
  );

  const viewModel = buildAdminHistorySectionViewModel(filteredLogs, historyFilter);
  const hasSearchQuery = searchQuery.trim().length > 0 || dateFilter !== "all" || userFilter !== "all" || historyFilter !== "all";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{pageText.searchBoxTitle}</h2>
                <p className="mt-1 text-xs text-stone-500">{pageText.searchBoxDescription}</p>
              </div>
              <span className="hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 sm:inline-flex">{viewModel.countText}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_0.75fr_0.75fr]">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-700">{pageText.searchLabel}</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={pageText.searchPlaceholder}
                  className="h-10 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-700">{pageText.dateLabel}</span>
                <select
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value as AdminHistoryDateFilter)}
                  className="h-10 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none transition focus:border-stone-400"
                >
                  {dateOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-700">{pageText.userLabel}</span>
                <select
                  value={userFilter}
                  onChange={(event) => setUserFilter(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none transition focus:border-stone-400"
                >
                  {userOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {viewModel.filterOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setHistoryFilter(item.value)}
                className={`h-9 rounded-full px-3 text-xs font-semibold transition ${item.className}`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              aria-label={pageText.refreshLabel}
              title={pageText.refreshLabel}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>

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
              {hasSearchQuery ? pageText.emptySearch : viewModel.emptyText}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
