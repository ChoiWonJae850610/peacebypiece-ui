"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ToastMessage from "@/components/common/ToastMessage";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";

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
import { getFactoryOrderRowsValidationMessage, getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import { buildOrderRequestPrintHtml } from "@/lib/workorder/presentation/orderRequestDocumentPrint";
import { useI18n } from "@/lib/i18n";
import { isDebugFeatureEnabled } from "@/lib/constants/runtimeMode";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";

function formatCurrency(value: number) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${numeric.toLocaleString()}원`;
}

function formatQuantity(value: number, suffix?: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return suffix ? `${numeric.toLocaleString()} ${suffix}` : numeric.toLocaleString();
}

function formatDateLabel(value?: string | null) {
  const text = value?.trim();
  if (!text) return "-";
  return text;
}


function clampPageIndex(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.max(0, value), total - 1);
}

function getFactoryPageLabel(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return "-/-";
  return `${currentPage + 1}/${totalPages}`;
}


const TABLE_HEAD_CLASS = "px-3 py-2.5 text-center font-semibold text-stone-700";
const TABLE_CELL_CLASS = "px-3 py-2.5 text-center align-middle leading-5";
const TABLE_EMPTY_CLASS = "px-3 py-7 text-center text-sm text-stone-500";

function getMobilePrintBrowser() {
  if (typeof navigator === "undefined") return { isAndroid: false, isSamsungInternet: false };
  const userAgent = navigator.userAgent || "";
  return {
    isAndroid: /Android/i.test(userAgent),
    isSamsungInternet: /SamsungBrowser/i.test(userAgent),
  };
}


function SummaryLine({
  items,
  className = "",
}: {
  items: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <div className={`border-b border-stone-400 px-4 py-3 ${className}`.trim()}>
      <div className="grid gap-x-5 gap-y-2 text-sm text-stone-800 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 items-baseline gap-2 border-b border-dashed border-stone-200 pb-2 last:border-b-0 md:pb-0 md:border-b-0">
            <span className="shrink-0 text-xs font-semibold tracking-wide text-stone-500">{item.label}</span>
            <span className="min-w-0 flex-1 break-words text-right text-sm font-semibold text-stone-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTable({
  title,
  columns,
  children,
  footerLabel,
  footerValue,
}: {
  title: string;
  columns: Array<{ label: string; className?: string }>;
  children: React.ReactNode;
  footerLabel: string;
  footerValue: string;
}) {
  return (
    <section className="overflow-hidden border border-stone-400 bg-white">
      <div className="border-b border-stone-400 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse text-xs text-stone-800">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={`${TABLE_HEAD_CLASS} ${column.className ?? ""}`.trim()}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
          <tfoot>
            <tr className="border-t border-stone-300 bg-stone-50">
              <td colSpan={columns.length - 1} className="px-3 py-2.5 text-center font-semibold text-stone-700">
                {footerLabel}
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-stone-900">{footerValue}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function MaterialTableRows({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return (
      <tr>
        <td colSpan={6} className={TABLE_EMPTY_CLASS}>
          항목이 없습니다.
        </td>
      </tr>
    );
  }

  return (
    <>
      {materials.map((material) => (
        <tr key={material.id} className="border-b border-stone-200 last:border-b-0">
          <td className={TABLE_CELL_CLASS}>{material.vendor || "-"}</td>
          <td className={`${TABLE_CELL_CLASS} break-words`}>{material.name || "-"}</td>
          <td className={TABLE_CELL_CLASS}>{formatQuantity(material.quantity)}</td>
          <td className={TABLE_CELL_CLASS}>{material.unit || "-"}</td>
          <td className={TABLE_CELL_CLASS}>{formatCurrency(material.unitCost)}</td>
          <td className={TABLE_CELL_CLASS}>
            {formatCurrency(material.totalCost || material.quantity * material.unitCost)}
          </td>
        </tr>
      ))}
    </>
  );
}

function OutsourcingTableRows({ outsourcingItems }: { outsourcingItems: Outsourcing[] }) {
  if (outsourcingItems.length === 0) {
    return (
      <tr>
        <td colSpan={5} className={TABLE_EMPTY_CLASS}>
          항목이 없습니다.
        </td>
      </tr>
    );
  }

  return (
    <>
      {outsourcingItems.map((item) => (
        <tr key={item.id} className="border-b border-stone-200 last:border-b-0">
          <td className={TABLE_CELL_CLASS}>{item.vendor || "-"}</td>
          <td className={`${TABLE_CELL_CLASS} break-words`}>{item.process || "-"}</td>
          <td className={TABLE_CELL_CLASS}>{formatQuantity(item.quantity)}</td>
          <td className={TABLE_CELL_CLASS}>{formatCurrency(item.unitCost)}</td>
          <td className={TABLE_CELL_CLASS}>{formatCurrency(item.totalCost)}</td>
        </tr>
      ))}
    </>
  );
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
  const totalPageCount = preview.documents.length;
  const safePageIndex = clampPageIndex(currentPageIndex, totalPageCount);
  const currentFactoryPage = preview.currentPage;
  const currentFactoryName = currentFactoryPage.factoryName || confirmedFactoryName;
  const currentDueDate = currentFactoryPage.dueDate || confirmedDueDate;
  const currentFactoryQuantity = currentFactoryPage.quantity || confirmedQuantity;
  const currentFactoryLaborCost = currentFactoryPage.laborCost || 0;
  const currentFactoryLossCost = currentFactoryPage.lossCost || 0;
  const displayTitle = preview.displayTitle;
  const fabricMaterials = preview.fabricMaterials;
  const subsidiaryMaterials = preview.subsidiaryMaterials;
  const representativeImage = preview.representativeImage;
  const firstSummaryItems = [
    { label: "품명", value: displayTitle },
    { label: "공임", value: formatCurrency(currentFactoryLaborCost) },
    { label: "원가", value: formatCurrency(preview.currentDocumentAmount) },
    { label: "수량", value: formatQuantity(currentFactoryQuantity) },
  ];

  const secondSummaryItems = [
    { label: "원단합", value: formatCurrency(preview.fabricAmountTotal) },
    { label: "부자재합", value: formatCurrency(preview.subsidiaryAmountTotal) },
    { label: "외주합", value: formatCurrency(preview.outsourcingAmountTotal) },
    { label: "로스", value: formatCurrency(currentFactoryLossCost) },
  ];

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
        setPrintFeedback("PDF 출력 요청을 시작하지 못했습니다.");
        return;
      }

      const printWindow = window.open("", "_blank", "noopener=no,width=1024,height=900");
      if (!printWindow) {
        setPrintFeedback("PDF 출력 요청을 시작하지 못했습니다.");
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
        setPrintFeedback("PDF 출력 요청을 완료했습니다.");
      } else {
        printWindow.document.open();
        printWindow.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>발주서 준비 중</title><style>html,body{height:100%;margin:0;font-family:Arial,'Noto Sans KR',sans-serif;background:#f5f2eb;color:#1c1917;}body{display:flex;align-items:center;justify-content:center;padding:24px;}div{font-size:14px;font-weight:600;}</style></head><body><div>출력용 문서를 준비하는 중입니다...</div></body></html>`);
        printWindow.document.close();
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setPrintFeedback("PDF 출력 요청을 완료했습니다.");
      }
    } catch (error) {
      console.error("[order-request-print] failed to render print window", error);
      setPrintFeedback("PDF 출력 요청을 시작하지 못했습니다.");
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
            aria-label={isPreparingPrint ? "PDF 준비 중" : i18n.common.ui.modalActions.exportPdf}
            title={isPreparingPrint ? "PDF 준비 중" : i18n.common.ui.modalActions.exportPdf}
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
            aria-label={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? (copy.requestedBadge ?? "발주 완료") : MODAL_ACTION_LABELS.proceedOrderRequest}
            title={isSubmittingOrderRequest ? getProcessingLabel(MODAL_ACTION_LABELS.proceedOrderRequest, i18n.workorder.ui.actionSection.processingFormat) : requested ? (copy.requestedBadge ?? "발주 완료") : MODAL_ACTION_LABELS.proceedOrderRequest}
          >
            {isSubmittingOrderRequest ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : requested ? <CheckIcon /> : <ArrowNextIcon />}
          </button>
        </div>
      }
    >
      <ToastMessage message={printFeedback} />
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-sm border border-stone-500 bg-white text-stone-900 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="border-b border-stone-400 px-5 py-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div className="min-w-0 pt-1 text-left">
              <div className="text-[11px] font-semibold tracking-wide text-stone-500">납기일</div>
              <div className="mt-1 text-sm font-semibold text-stone-900">{formatDateLabel(currentDueDate)}</div>
            </div>
            <div className="min-w-0 text-center">
              <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
                <div className="text-[25px] font-black tracking-[0.2em] text-stone-900">작 업 지 시 서</div>
                <div className="max-w-[240px] truncate text-xs font-semibold text-stone-500">{currentFactoryName || "공장 미지정"}</div>
              </div>
              <div className="mt-2 text-lg font-bold text-stone-900">{displayTitle}</div>
            </div>
            <div />
          </div>
        </div>

        <SummaryLine items={firstSummaryItems} />
        <SummaryLine items={secondSummaryItems} className="bg-stone-50" />

        {orderRowsValidationMessage ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {orderRowsValidationMessage}
          </div>
        ) : null}

        <div className="border-b border-stone-400 bg-[#fcfaf5] p-4">
          <section className="grid gap-3 xl:grid-cols-2">
            <div className="flex min-h-[360px] flex-col overflow-hidden border border-stone-400 bg-white">
              <div className="flex h-10 shrink-0 items-center border-b border-stone-300 bg-stone-100 px-3 text-sm font-bold text-stone-900">대표 이미지</div>
              <div className="flex flex-1 p-4">
                {representativeImage ? (
                  <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-hidden border border-stone-300 bg-stone-100">
                    <img src={representativeImage.url} alt={representativeImage.name} className="h-full max-h-[300px] w-full object-contain bg-white" />
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-1 items-center justify-center border border-dashed border-stone-300 bg-white text-sm text-stone-500">
                    대표 이미지가 없습니다.
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-h-[360px] flex-col overflow-hidden border border-stone-400 bg-white">
              <div className="flex h-10 shrink-0 items-center border-b border-stone-300 bg-stone-100 px-3 text-sm font-bold text-stone-900">요청사항</div>
              <div className="flex flex-1 p-4">
                <textarea
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  placeholder="발주 요청 시 전달할 메모를 입력하세요."
                  className="min-h-[300px] flex-1 resize-none border border-stone-300 bg-white px-3 py-3 text-sm leading-6 text-stone-800 outline-none transition focus:border-stone-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 bg-[#fcfaf5] p-4">
          <SectionTable
            title="원단 내역"
            columns={[
              { label: "거래처", className: "w-[19%]" },
              { label: "자재명", className: "w-[27%]" },
              { label: "수량", className: "w-[12%]" },
              { label: "단위", className: "w-[10%]" },
              { label: "단가", className: "w-[16%]" },
              { label: "금액", className: "w-[16%]" },
            ]}
            footerLabel="원단 총합"
            footerValue={formatCurrency(preview.fabricAmountTotal)}
          >
            <MaterialTableRows materials={fabricMaterials} />
          </SectionTable>

          <SectionTable
            title="부자재 내역"
            columns={[
              { label: "거래처", className: "w-[19%]" },
              { label: "자재명", className: "w-[27%]" },
              { label: "수량", className: "w-[12%]" },
              { label: "단위", className: "w-[10%]" },
              { label: "단가", className: "w-[16%]" },
              { label: "금액", className: "w-[16%]" },
            ]}
            footerLabel="부자재 총합"
            footerValue={formatCurrency(preview.subsidiaryAmountTotal)}
          >
            <MaterialTableRows materials={subsidiaryMaterials} />
          </SectionTable>

          <SectionTable
            title="외주 내역"
            columns={[
              { label: "외주처", className: "w-[24%]" },
              { label: "작업명", className: "w-[30%]" },
              { label: "수량", className: "w-[12%]" },
              { label: "단가", className: "w-[17%]" },
              { label: "금액", className: "w-[17%]" },
            ]}
            footerLabel="외주 총합"
            footerValue={formatCurrency(preview.outsourcingAmountTotal)}
          >
            <OutsourcingTableRows outsourcingItems={preview.outsourcingItems} />
          </SectionTable>
        </div>

        {showOrderRequestDocumentDebug ? (
          <div className="border-t border-dashed border-amber-300 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
            <div className="font-semibold">발주 문서 디버그</div>
            <div className="mt-1 break-words">
              {preview.currentDocument.label} · {currentFactoryPage.factoryName || "공장 미지정"} · 납기 {formatDateLabel(currentDueDate)} · 수량 {formatQuantity(currentFactoryQuantity)}
            </div>
          </div>
        ) : null}

        <div className="border-t border-stone-300 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentPageIndex((prev) => clampPageIndex(prev - 1, totalPageCount))}
              disabled={totalPageCount <= 1 || safePageIndex <= 0}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300"
              aria-label="이전 페이지"
            >
              <span className="block rotate-90">▾</span>
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-stone-600">{getFactoryPageLabel(safePageIndex, totalPageCount)}</div>
              <div className="mt-1 text-[11px] text-stone-500">{preview.currentDocument.label} · {currentFactoryPage.factoryName || "공장 미지정"}</div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPageIndex((prev) => clampPageIndex(prev + 1, totalPageCount))}
              disabled={totalPageCount <= 1 || safePageIndex >= totalPageCount - 1}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300"
              aria-label="다음 페이지"
            >
              <span className="block -rotate-90">▾</span>
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
