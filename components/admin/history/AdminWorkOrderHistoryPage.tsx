"use client";

import { useMemo, useState } from "react";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AppSelect } from "@/components/common/ui";
import AdminHistoryList from "@/components/admin/history/AdminHistoryList";
import { buildAdminHistorySectionViewModel } from "@/lib/admin/history/presentation";
import {
  ADMIN_HISTORY_DATE_FILTER_OPTIONS,
  filterAdminHistoryPageEvents,
  selectAdminHistoryUserOptions,
} from "@/lib/admin/history/selectors";
import type { AdminHistoryDateFilter, AdminHistoryFilter } from "@/lib/admin/history/types";
import { applyAdminHistoryFilterAction } from "@/lib/admin/history/actionFlow";
import { useI18n } from "@/lib/i18n";

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.35-5.65" />
      <path d="M20 4.5V9h-4.5" />
    </svg>
  );
}

type AdminWorkOrderHistoryPageProps = {
  initialHistoryEvents?: import("@/lib/admin/history/types").AdminHistoryEvent[];
};

export default function AdminWorkOrderHistoryPage({ initialHistoryEvents = [] }: AdminWorkOrderHistoryPageProps) {
  const { i18n } = useI18n();
  const pageText = i18n.admin.historyPage;
  const [historyFilter, setHistoryFilter] = useState<AdminHistoryFilter>("all");
  const historyEvents = useMemo(
    () => applyAdminHistoryFilterAction({ events: initialHistoryEvents, filter: historyFilter }),
    [initialHistoryEvents, historyFilter],
  );
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

  const viewModel = buildAdminHistorySectionViewModel(filteredLogs, historyFilter, i18n.admin);
  const hasSearchQuery = searchQuery.trim().length > 0 || dateFilter !== "all" || userFilter !== "all" || historyFilter !== "all";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4 shadow-sm transition-colors">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--pbp-text-primary)]">{pageText.searchBoxTitle}</h2>
                <p className="mt-1 text-xs text-[var(--pbp-text-muted)]">{pageText.searchBoxDescription}</p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_0.75fr_0.75fr]">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[var(--pbp-text-secondary)]">{pageText.searchLabel}</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={pageText.searchPlaceholder}
                  className="h-10 w-full rounded-2xl border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-3 text-sm text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)] focus:ring-4 focus:ring-[var(--pbp-focus-ring-soft)]"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[var(--pbp-text-secondary)]">{pageText.dateLabel}</span>
                <AppSelect
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as AdminHistoryDateFilter)}
                  options={dateOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  size="sm"
                  ariaLabel={pageText.dateLabel}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[var(--pbp-text-secondary)]">{pageText.userLabel}</span>
                <AppSelect
                  value={userFilter}
                  onValueChange={setUserFilter}
                  options={userOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  size="sm"
                  ariaLabel={pageText.userLabel}
                />
              </label>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {viewModel.filterOptions.map((item) => (
              <AdminButton
                key={item.value}
                type="button"
                onClick={() => setHistoryFilter(item.value)}
                variant={item.value === historyFilter ? "primary" : "secondary"}
                className="h-9 px-3 text-xs"
              >
                {item.label}
              </AdminButton>
            ))}
            <AdminButton
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              variant="secondary"
              className="h-9 w-9 px-0"
              aria-label={pageText.refreshLabel}
              title={pageText.refreshLabel}
            >
              <RefreshIcon />
            </AdminButton>
          </div>
        </div>
      </div>

      <AdminHistoryList viewModel={viewModel} emptyText={hasSearchQuery ? pageText.emptySearch : viewModel.emptyText} />
    </section>
  );
}
