"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";
import { MODAL_CONTENT_WARNING_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
import OrderRequestDocumentPreviewPanel from "@/components/common/modal/orderRequest/OrderRequestDocumentPreview";
import { getFactoryOrderRowsValidationMessage, getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import { useI18n } from "@/lib/i18n";
import { isDebugFeatureEnabled } from "@/lib/runtime/runtimeMode";
import type { WorkOrder } from "@/types/workorder";

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

export default function OrderRequestConfirmModal({
  open,
  workOrder,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workOrder: WorkOrder;
  onClose: () => void;
  onConfirm: (payload: { factoryName: string; quantity: number; requestNote?: string | null }) => void | Promise<void>;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.orderRequestConfirm;
  const currencySuffix = i18n.workorder.ui.common.currencySuffix;
  const requested = workOrder.factoryOrderRequest ?? null;
  const submissionSnapshot = useMemo(() => getOrderSubmissionSnapshot(workOrder), [workOrder]);
  const confirmedFactoryName = requested?.factoryName?.trim() || submissionSnapshot.factoryName;
  const confirmedDueDate = submissionSnapshot.dueDate;
  const confirmedQuantity = requested?.quantity ?? submissionSnapshot.quantity;
  const orderRowsValidationMessage = useMemo(
    () => getFactoryOrderRowsValidationMessage(workOrder, i18n.workorder.actionFlow),
    [i18n.workorder.actionFlow, workOrder],
  );
  const canSubmit = Boolean(confirmedFactoryName) && Boolean(confirmedDueDate) && confirmedQuantity > 0 && !requested && !orderRowsValidationMessage;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requestNote, setRequestNote] = useState("");
  const [isSubmittingOrderRequest, setIsSubmittingOrderRequest] = useState(false);

  useEffect(() => {
    setCurrentPageIndex(0);
    setRequestNote("");
    setIsSubmittingOrderRequest(false);
  }, [open, workOrder.id]);

  const preview = useMemo(() => getOrderRequestDocumentPreview(workOrder, currentPageIndex), [currentPageIndex, workOrder]);
  const showOrderRequestDocumentDebug = isDebugFeatureEnabled("orderRequestDocumentDebug");

  const handleSubmitOrderRequest = async () => {
    if (!canSubmit || isSubmittingOrderRequest) return;

    setIsSubmittingOrderRequest(true);
    try {
      await onConfirm({ factoryName: confirmedFactoryName, quantity: confirmedQuantity, requestNote: requestNote.trim() || null });
    } finally {
      setIsSubmittingOrderRequest(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={undefined}
      maxWidthClass="md:max-w-6xl"
      overlayClassName="pbp-modal-overlay"
      bodyClassName="bg-[var(--pbp-modal-section-muted)]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSubmitOrderRequest}
            disabled={!canSubmit || isSubmittingOrderRequest}
            className={cn(
              "pbp-interactive-button pbp-action-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold",
              "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? copy.requestedBadge : MODAL_ACTION_LABELS.proceedOrderRequest}
            title={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? copy.requestedBadge : MODAL_ACTION_LABELS.proceedOrderRequest}
          >
            {isSubmittingOrderRequest ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
            <span>{requested ? copy.requestedBadge : MODAL_ACTION_LABELS.proceedOrderRequest}</span>
          </button>
        </div>
      }
    >
      <OrderRequestDocumentPreviewPanel
        preview={preview}
        copy={copy}
        currencySuffix={currencySuffix}
        requestNote={requestNote}
        onRequestNoteChange={setRequestNote}
        currentPageIndex={currentPageIndex}
        onPageIndexChange={setCurrentPageIndex}
        fallbackFactoryName={confirmedFactoryName}
        fallbackDueDate={confirmedDueDate}
        fallbackQuantity={confirmedQuantity}
        showDebug={showOrderRequestDocumentDebug}
      />
      {orderRowsValidationMessage ? (
        <div className={`mx-auto mt-3 w-full max-w-[1040px] rounded-lg px-4 py-3 font-medium ${MODAL_CONTENT_WARNING_PANEL_CLASS}`}>
          {orderRowsValidationMessage}
        </div>
      ) : null}
    </ModalShell>
  );
}
