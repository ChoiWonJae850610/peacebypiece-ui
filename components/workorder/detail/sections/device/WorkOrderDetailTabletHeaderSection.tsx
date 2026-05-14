"use client";

import { useI18n } from "@/lib/i18n";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

export default function WorkOrderDetailTabletHeaderSection({
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
    <section className="pbp-detail-summary-card rounded-2xl border p-5">
      <div className="grid gap-4 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2 className="break-keep text-2xl font-semibold text-stone-950">{title}</h2>
          <button
            type="button"
            onClick={onOpenBasicInfoModal}
            disabled={locked}
            className="pbp-interactive-button pbp-detail-summary-action mt-3 w-full rounded-2xl border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="text-xs font-medium text-stone-500">{copy.summaryLabel}</div>
            <div className="mt-1 text-sm leading-6 text-stone-900">{summaryValue}</div>
          </button>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={onOpenManagerAssignModal}
            disabled={!canChangeManager || managerLocked}
            className="pbp-interactive-button pbp-detail-summary-action rounded-2xl border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="text-xs font-medium text-stone-500">{copy.managerLabel}</div>
            <div className="mt-1 text-sm font-semibold text-stone-900">{managerValue}</div>
          </button>

          <button
            type="button"
            onClick={onOpenInventoryEditor}
            disabled={!canEditInventory}
            className="pbp-interactive-button pbp-detail-summary-action rounded-2xl border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="text-xs font-medium text-stone-500">{copy.currentInventoryLabel}</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{inventoryValue}</div>
          </button>

          <div className="text-right text-xs text-stone-400">{copy.lastUpdatedPrefix} {lastSavedAt || "-"}</div>
        </div>
      </div>
    </section>
  );
}
