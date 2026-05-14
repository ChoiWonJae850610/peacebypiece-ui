"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ToastMessage from "@/components/common/ToastMessage";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";
import OrderRequestDocumentPreviewPanel from "@/components/common/modal/orderRequest/OrderRequestDocumentPreview";
import { getFactoryOrderRowsValidationMessage, getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import { buildOrderRequestPrintHtml } from "@/lib/workorder/presentation/orderRequestDocumentPrint";
import { useI18n } from "@/lib/i18n";
import { isDebugFeatureEnabled } from "@/lib/runtime/runtimeMode";
import type { WorkOrder } from "@/types/workorder";

function PrintIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M6 7V4.75h8V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.25 15.25h9.5V11.5h-9.5v3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.25 8.25h11.5a1 1 0 0 1 1 1v3.25h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.75h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowNextIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4.75 10h9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m10.75 6 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="m5 10.25 3.25 3.25L15 6.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

function getMobilePrintBrowser() {
  if (typeof navigator === "undefined") return { isAndroid: false, isSamsungInternet: false };
  const userAgent = navigator.userAgent || "";
  return {
    isAndroid: /Android/i.test(userAgent),
    isSamsungInternet: /SamsungBrowser/i.test(userAgent),
  };
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
  onConfirm: (payload: { factoryName: string; quantity: number }) => void | Promise<void>;
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
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isSubmittingOrderRequest, setIsSubmittingOrderRequest] = useState(false);
  const printWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setCurrentPageIndex(0);
    setRequestNote("");
    setPrintFeedback(null);
    setIsPreparingPrint(false);
    setIsSubmittingOrderRequest(false);
  }, [open, workOrder.id]);

  useEffect(() => {
    if (!printFeedback) return;

    let timeout: number | null = null;
    const clearFeedback = () => setPrintFeedback(null);
    const startDismissTimer = () => {
      if (timeout !== null) return;
      timeout = window.setTimeout(clearFeedback, 3200);
    };

    if (document.hasFocus()) {
      startDismissTimer();
    } else {
      window.addEventListener("focus", startDismissTimer, { once: true });
    }

    return () => {
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
      window.removeEventListener("focus", startDismissTimer);
    };
  }, [printFeedback]);

  useEffect(() => {
    return () => {
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
      }
      printWindowRef.current = null;
    };
  }, []);

  const preview = useMemo(() => getOrderRequestDocumentPreview(workOrder, currentPageIndex), [currentPageIndex, workOrder]);
  const showOrderRequestDocumentDebug = isDebugFeatureEnabled("orderRequestDocumentDebug");

  const handleSubmitOrderRequest = async () => {
    if (!canSubmit || isSubmittingOrderRequest) return;

    setIsSubmittingOrderRequest(true);
    try {
      await onConfirm({ factoryName: confirmedFactoryName, quantity: confirmedQuantity });
    } finally {
      setIsSubmittingOrderRequest(false);
    }
  };

  const handlePrintPdf = async () => {
    if (typeof window === "undefined" || isPreparingPrint) return;

    setPrintFeedback(null);
    setIsPreparingPrint(true);

    const { isAndroid, isSamsungInternet } = getMobilePrintBrowser();

    try {
      const html = buildOrderRequestPrintHtml(workOrder, {
        requestNote,
        autoPrint: !isAndroid,
        showPrintToolbar: isAndroid && !isSamsungInternet,
        closeAfterPrint: !isAndroid,
      });

      if (isSamsungInternet) {
        setPrintFeedback(copy.printFailedToast);
        return;
      }

      const printWindow = window.open("", "_blank", "noopener=no,width=1024,height=900");
      if (!printWindow) {
        setPrintFeedback(copy.printFailedToast);
        return;
      }

      printWindowRef.current = printWindow;

      if (isAndroid) {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        printWindow.location.replace(objectUrl);
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60_000);
        setPrintFeedback(copy.printSuccessToast);
      } else {
        printWindow.document.open();
        printWindow.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>${copy.printPreparingTitle}</title><style>html,body{height:100%;margin:0;font-family:Arial,'Noto Sans KR',sans-serif;background:#f5f2eb;color:#1c1917;}body{display:flex;align-items:center;justify-content:center;padding:24px;}div{font-size:14px;font-weight:600;}</style></head><body><div>${copy.printPreparingMessage}</div></body></html>`);
        printWindow.document.close();
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setPrintFeedback(copy.printSuccessToast);
      }
    } catch (error) {
      console.error("[order-request-print] failed to render print window", error);
      setPrintFeedback(copy.printFailedToast);
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
      }
      printWindowRef.current = null;
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={undefined}
      maxWidthClass="md:max-w-6xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="bg-[#f5f2eb]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isPreparingPrint}
            className={cn(
              "pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700",
              "hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400",
            )}
            aria-label={isPreparingPrint ? copy.printPreparingAria : i18n.common.ui.modalActions.exportPdf}
            title={isPreparingPrint ? copy.printPreparingAria : i18n.common.ui.modalActions.exportPdf}
          >
            <PrintIcon />
          </button>
          <button
            type="button"
            onClick={handleSubmitOrderRequest}
            disabled={!canSubmit || isSubmittingOrderRequest}
            className={cn(
              "pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white",
              "hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:bg-stone-300",
            )}
            aria-label={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? copy.requestedBadge : MODAL_ACTION_LABELS.proceedOrderRequest}
            title={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? copy.requestedBadge : MODAL_ACTION_LABELS.proceedOrderRequest}
          >
            {isSubmittingOrderRequest ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : requested ? <CheckIcon /> : <ArrowNextIcon />}
          </button>
        </div>
      }
    >
      <ToastMessage message={printFeedback} />
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
        <div className="mx-auto mt-3 w-full max-w-[1040px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {orderRowsValidationMessage}
        </div>
      ) : null}
    </ModalShell>
  );
}
