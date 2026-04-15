"use client";

import AdminPanelHistoryPreviewItem from "@/components/common/modal/adminPanel/AdminPanelHistoryPreviewItem";
import { HISTORY_FILTER_BUTTON_CLASS } from "@/lib/constants/display";
import { useI18n } from "@/lib/i18n";
import { HISTORY_FILTER_OPTIONS } from "@/lib/constants/workflow";
import type { HistoryFilter } from "@/types/workflow";
import type { HistoryLog } from "@/types/workorder";

type AdminPanelHistorySectionProps = {
  historyLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
};

export default function AdminPanelHistorySection({
  historyLogs,
  historyFilter,
  onHistoryFilterChange,
}: AdminPanelHistorySectionProps) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{ui.modal.adminPanel.historyTitle}</h3>
          <div className="mt-1 text-xs text-stone-500">{ui.modal.adminPanel.historySummaryFormat}</div>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">
          {`${historyLogs.length}${ui.modal.adminPanel.countSuffix}`}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {HISTORY_FILTER_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onHistoryFilterChange(value)}
            className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-1 text-xs font-medium ${
              historyFilter === value ? HISTORY_FILTER_BUTTON_CLASS.active : HISTORY_FILTER_BUTTON_CLASS.inactive
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {historyLogs.length > 0 ? (
          historyLogs.map((item) => <AdminPanelHistoryPreviewItem key={item.id} item={item} />)
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
            {i18n.workorder.presentation.inventoryLog.empty}
          </div>
        )}
      </div>
    </section>
  );
}
