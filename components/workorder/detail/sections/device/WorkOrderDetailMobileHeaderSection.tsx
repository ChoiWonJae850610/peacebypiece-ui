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
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="break-keep text-xl font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{summaryValue}</p>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onOpenBasicInfoModal}
          disabled={locked}
          className="pbp-interactive-button flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-xs font-medium text-stone-500">{copy.summaryLabel}</span>
          <span className="ml-3 text-sm font-medium text-stone-900">{summaryValue}</span>
        </button>

        <button
          type="button"
          onClick={onOpenManagerAssignModal}
          disabled={!canChangeManager || managerLocked}
          className="pbp-interactive-button flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-xs font-medium text-stone-500">{copy.managerLabel}</span>
          <span className="ml-3 text-sm font-medium text-stone-900">{managerValue}</span>
        </button>

        <button
          type="button"
          onClick={onOpenInventoryEditor}
          disabled={!canEditInventory}
          className="pbp-interactive-button flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-xs font-medium text-stone-500">{copy.currentInventoryLabel}</span>
          <span className="ml-3 text-sm font-semibold tabular-nums text-stone-900">{inventoryValue}</span>
        </button>
      </div>

      <div className="mt-3 text-right text-xs text-stone-400">{copy.lastUpdatedPrefix} {lastSavedAt || "-"}</div>
    </section>
  );
}
