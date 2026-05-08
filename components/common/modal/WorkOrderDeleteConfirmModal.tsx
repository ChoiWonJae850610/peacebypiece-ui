"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem } from "@/types/workorder";

export default function WorkOrderDeleteConfirmModal({
  open,
  workOrder,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workOrder: WorkOrderListItem | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { i18n } = useI18n();
  const lifecycleText = i18n.workorder.lifecycle;
  const title = workOrder?.displayTitle?.trim() || workOrder?.title?.trim() || lifecycleText.newWorkOrderFallbackTitle;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={lifecycleText.deleteModalTitle}
      description={lifecycleText.deleteModalDescription}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "active:bg-stone-200" },
        primary: { label: lifecycleText.deleteModalConfirmLabel, onClick: onConfirm, tone: "danger" },
      })}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
          <div className="text-xs font-medium text-stone-500">{lifecycleText.deleteModalTargetLabel}</div>
          <div className="mt-1 break-all text-base font-semibold text-stone-950">{title}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-600">
          {lifecycleText.deleteModalNotice}
        </div>
      </div>
    </ModalShell>
  );
}
