"use client";

import { useI18n } from "@/lib/i18n";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

export default function WorkOrderDetailMobileHeaderSection({
  title,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  canChangeManager,
  canEditInventory,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  locked = false,
  managerLocked = locked,
}: HeaderProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.header;
  const common = i18n.workorder.ui.common;
  const managerValue = managerName || "-";
  const summaryValue = summaryText || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}${common.quantitySuffix}`;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
      <h2 className="break-keep text-lg font-semibold leading-7 text-stone-950 sm:text-xl">{title}</h2>
      <p className="mt-2 break-keep text-sm leading-6 text-stone-600">{summaryValue}</p>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onOpenBasicInfoModal}
          disabled={locked}
          className="pbp-interactive-button flex min-w-0 flex-col items-start gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:px-4"
        >
          <span className="text-xs font-medium text-stone-500">{copy.summaryLabel}</span>
          <span className="max-w-full break-words text-sm font-medium text-stone-900 sm:ml-3 sm:text-right">{summaryValue}</span>
        </button>

        <button
          type="button"
          onClick={onOpenManagerAssignModal}
          disabled={!canChangeManager || managerLocked}
          className="pbp-interactive-button flex min-w-0 flex-col items-start gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:px-4"
        >
          <span className="text-xs font-medium text-stone-500">{copy.managerLabel}</span>
          <span className="max-w-full break-words text-sm font-medium text-stone-900 sm:ml-3 sm:text-right">{managerValue}</span>
        </button>

        <button
          type="button"
          onClick={onOpenInventoryEditor}
          disabled={!canEditInventory}
          className="pbp-interactive-button flex min-w-0 flex-col items-start gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:px-4"
        >
          <span className="text-xs font-medium text-stone-500">{copy.currentInventoryLabel}</span>
          <span className="max-w-full break-words text-sm font-semibold tabular-nums text-stone-900 sm:ml-3 sm:text-right">{inventoryValue}</span>
        </button>
      </div>

      <div className="mt-3 text-right text-xs text-stone-400">{copy.lastUpdatedPrefix} {lastSavedAt || "-"}</div>
    </section>
  );
}
