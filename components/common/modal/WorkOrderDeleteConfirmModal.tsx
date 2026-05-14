"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_CONTENT_LABEL_CLASS, MODAL_CONTENT_MUTED_PANEL_CLASS, MODAL_CONTENT_VALUE_CLASS, MODAL_CONTENT_WARNING_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
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
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose },
        primary: { label: lifecycleText.deleteModalConfirmLabel, onClick: onConfirm, tone: "danger" },
      })}
    >
      <div className="space-y-4">
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} px-4 py-4`}>
          <div className={`font-medium ${MODAL_CONTENT_LABEL_CLASS}`}>{lifecycleText.deleteModalTargetLabel}</div>
          <div className={`mt-1 break-all ${MODAL_CONTENT_VALUE_CLASS}`}>{title}</div>
        </div>
        <div className={MODAL_CONTENT_WARNING_PANEL_CLASS}>
          {lifecycleText.deleteModalNotice}
        </div>
      </div>
    </ModalShell>
  );
}
