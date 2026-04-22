"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import { buildOrderRequestPrintAttachments, buildOrderRequestPrintHtml } from "@/lib/workorder/presentation/orderRequestDocumentPrint";
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

function getPrintRenderTarget() {
  if (typeof window === "undefined") {
    return "desktop" as const;
  }

  return window.matchMedia("(max-width: 1024px)").matches ? "mobile" as const : "desktop" as const;
}

function waitForDelay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForPrintWindowAssets(printWindow: Window, timeoutMs = 8000) {
  const doc = printWindow.document;
  const images = Array.from(doc.images);

  await Promise.race([
    Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            const done = () => resolve();
            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
          }),
      ),
    ),
    waitForDelay(timeoutMs),
  ]);

  if ("fonts" in doc) {
    try {
      await Promise.race([doc.fonts.ready, waitForDelay(2000)]);
    } catch {
      // noop
    }
  }

  await new Promise<void>((resolve) => printWindow.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => printWindow.requestAnimationFrame(() => resolve()));
}

const TABLE_CELL_CLASS = "px-3 py-2.5 text-center align-middle leading-5";
const TABLE_EMPTY_CLASS = "px-3 py-7 text-center text-sm text-stone-500";

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
  onConfirm: (payload: { factoryName: string; quantity: number }) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.orderRequestConfirm;
  const requested = workOrder.factoryOrderRequest ?? null;
  const submissionSnapshot = useMemo(() => getOrderSubmissionSnapshot(workOrder), [workOrder]);
  const confirmedFactoryName = requested?.factoryName?.trim() || submissionSnapshot.factoryName;
  const confirmedDueDate = submissionSnapshot.dueDate;
  const confirmedQuantity = requested?.quantity ?? submissionSnapshot.quantity;
  const canSubmit = Boolean(confirmedFactoryName) && Boolean(confirmedDueDate) && confirmedQuantity > 0 && !requested;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requestNote, setRequestNote] = useState(() => String(workOrder.memo ?? "").trim());
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const printWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setCurrentPageIndex(0);
    setRequestNote(String(workOrder.memo ?? "").trim());
    setPrintFeedback(null);
    setIsPreparingPrint(false);
  }, [open, workOrder.id, workOrder.memo]);

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

  const handlePrintPdf = async () => {
    if (typeof window === "undefined" || isPreparingPrint) return;

    setPrintFeedback(null);
    setIsPreparingPrint(true);

    const printWindow = window.open("", "_blank", "width=1024,height=900");
    if (!printWindow) {
      setPrintFeedback("팝업이 차단되어 PDF 창을 열 수 없습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도해주세요.");
      setIsPreparingPrint(false);
      return;
    }

    printWindowRef.current = printWindow;

    try {
      printWindow.document.open();
      printWindow.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>발주서 준비 중</title><style>html,body{height:100%;margin:0;font-family:Arial,'Noto Sans KR',sans-serif;background:#f5f2eb;color:#1c1917;}body{display:flex;align-items:center;justify-content:center;padding:24px;}div{font-size:14px;font-weight:600;}</style></head><body><div>첨부파일을 포함한 PDF 문서를 준비하는 중입니다...</div></body></html>`);
      printWindow.document.close();

      const renderTarget = getPrintRenderTarget();
      const printAttachmentBuildResult = await buildOrderRequestPrintAttachments(preview.visibleAttachments, {
        renderTarget,
        attachmentTimeoutMs: renderTarget === "mobile" ? 12000 : 20000,
        pageRenderTimeoutMs: renderTarget === "mobile" ? 8000 : 15000,
      });
      const html = buildOrderRequestPrintHtml(workOrder, printAttachmentBuildResult.renderedAttachments, { requestNote });
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      await waitForPrintWindowAssets(printWindow, renderTarget === "mobile" ? 10000 : 8000);
      printWindow.focus();
      printWindow.print();

      if (printAttachmentBuildResult.failures.length > 0) {
        setPrintFeedback(`일부 첨부파일 렌더링에 실패했습니다. 실패 ${printAttachmentBuildResult.failures.length}건은 오류 안내 페이지로 대체되어 출력됩니다.`);
      }
    } catch (error) {
      console.error("[order-request-print] failed to render print window", error);
      setPrintFeedback("첨부 PDF 렌더링 또는 문서 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      if (!printWindow.closed) {
        printWindow.close();
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
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPreparingPrint}
            className={cn(
              "pbp-interactive-button rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700",
              "hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400",
            )}
          >
            {MODAL_ACTION_LABELS.cancel}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isPreparingPrint}
            className={cn(
              "pbp-interactive-button rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700",
              "hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400",
            )}
          >
            {isPreparingPrint ? "PDF 준비 중..." : i18n.common.ui.modalActions.exportPdf}
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ factoryName: confirmedFactoryName, quantity: confirmedQuantity })}
            disabled={!canSubmit}
            className={cn(
              "pbp-interactive-button rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white",
              "hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:bg-stone-300",
            )}
          >
            {requested ? (copy.requestedBadge ?? "발주 완료") : MODAL_ACTION_LABELS.proceedOrderRequest}
          </button>
        </div>
      }
    >
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

        {printFeedback ? (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {printFeedback}
          </div>
        ) : null}

        <div className="border-b border-stone-400 bg-[#fcfaf5] p-4">
          <section className="overflow-hidden border border-stone-400 bg-white">
            <div className="border-b border-stone-300 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">대표이미지 / 요청사항</div>
            <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="border-b border-stone-300 p-4 xl:border-b-0 xl:border-r">
                {representativeImage ? (
                  <div className="overflow-hidden border border-stone-300 bg-stone-100">
                    <img src={representativeImage.url} alt={representativeImage.name} className="h-[300px] w-full object-contain bg-white" />
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center border border-dashed border-stone-300 bg-white text-sm text-stone-500">
                    대표 이미지가 없습니다.
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold tracking-wide text-rose-700">요청사항</div>
                  <span className="rounded border border-stone-300 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                    첨부파일은 출력 시 본문 뒤에 이어집니다.
                  </span>
                </div>
                <textarea
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  placeholder="요청사항을 입력하세요."
                  className="min-h-[300px] w-full resize-none border border-stone-300 bg-white px-3 py-3 text-sm leading-6 text-stone-800 outline-none transition focus:border-stone-500"
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
