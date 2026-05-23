"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Material, Outsourcing } from "@/types/workorder";
import type { OrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";

type OrderRequestConfirmCopy = {
  documentTitle: string;
  dueDateLabel: string;
  factoryUnset: string;
  summaryItemName: string;
  summaryLaborCost: string;
  summaryCost: string;
  summaryQuantity: string;
  summaryFabricTotal: string;
  summarySubsidiaryTotal: string;
  summaryOutsourcingTotal: string;
  summaryLossCost: string;
  representativeImageTitle: string;
  representativeImageEmpty: string;
  requestNoteTitle: string;
  requestNotePlaceholder: string;
  fabricTableTitle: string;
  subsidiaryTableTitle: string;
  outsourcingTableTitle: string;
  tableVendor: string;
  tableMaterialName: string;
  tableQuantity: string;
  tableUnit: string;
  tableUnitCost: string;
  tableAmount: string;
  tableOutsourcingVendor: string;
  tableOutsourcingTask: string;
  fabricFooter: string;
  subsidiaryFooter: string;
  outsourcingFooter: string;
  itemEmpty: string;
  previousPageAria: string;
  nextPageAria: string;
  debugTitle: string;
};

type OrderRequestDocumentPreviewProps = {
  preview: OrderRequestDocumentPreview;
  copy: OrderRequestConfirmCopy;
  currencySuffix: string;
  isProcessing: boolean;
  processingTitle: string;
  processingMessage: string;
  requestNote: string;
  onRequestNoteChange: (next: string) => void;
  requestNoteMaxLines: number;
  requestNoteMaxChars: number;
  currentPageIndex: number;
  onPageIndexChange: Dispatch<SetStateAction<number>>;
  fallbackFactoryName: string;
  fallbackDueDate: string;
  fallbackQuantity: number;
  showDebug: boolean;
};

const TABLE_HEAD_CLASS = "px-3 py-2.5 text-center font-semibold text-stone-700";
const TABLE_CELL_CLASS = "px-3 py-2.5 text-center align-middle leading-5";
const TABLE_EMPTY_CLASS = "px-3 py-7 text-center text-sm text-stone-500";

function formatCurrency(value: number, suffix: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${numeric.toLocaleString()}${suffix}`;
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
          <div key={item.label} className="flex min-w-0 items-baseline gap-2 border-b border-dashed border-stone-200 pb-2 last:border-b-0 md:border-b-0 md:pb-0">
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
  children: ReactNode;
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
                <th key={column.label} className={`${TABLE_HEAD_CLASS} ${column.className ?? ""}`.trim()}>
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

function MaterialTableRows({
  materials,
  emptyLabel,
  currencySuffix,
}: {
  materials: Material[];
  emptyLabel: string;
  currencySuffix: string;
}) {
  if (materials.length === 0) {
    return (
      <tr>
        <td colSpan={6} className={TABLE_EMPTY_CLASS}>
          {emptyLabel}
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
          <td className={TABLE_CELL_CLASS}>{formatCurrency(material.unitCost, currencySuffix)}</td>
          <td className={TABLE_CELL_CLASS}>
            {formatCurrency(material.totalCost || material.quantity * material.unitCost, currencySuffix)}
          </td>
        </tr>
      ))}
    </>
  );
}

function OutsourcingTableRows({
  outsourcingItems,
  emptyLabel,
  currencySuffix,
}: {
  outsourcingItems: Outsourcing[];
  emptyLabel: string;
  currencySuffix: string;
}) {
  if (outsourcingItems.length === 0) {
    return (
      <tr>
        <td colSpan={5} className={TABLE_EMPTY_CLASS}>
          {emptyLabel}
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
          <td className={TABLE_CELL_CLASS}>{formatCurrency(item.unitCost, currencySuffix)}</td>
          <td className={TABLE_CELL_CLASS}>{formatCurrency(item.totalCost, currencySuffix)}</td>
        </tr>
      ))}
    </>
  );
}

export default function OrderRequestDocumentPreviewPanel({
  preview,
  copy,
  currencySuffix,
  isProcessing,
  processingTitle,
  processingMessage,
  requestNote,
  onRequestNoteChange,
  requestNoteMaxLines,
  requestNoteMaxChars,
  currentPageIndex,
  onPageIndexChange,
  fallbackFactoryName,
  fallbackDueDate,
  fallbackQuantity,
  showDebug,
}: OrderRequestDocumentPreviewProps) {
  const formatDisplayCurrency = (value: number) => formatCurrency(value, currencySuffix);
  const totalPageCount = preview.documents.length;
  const safePageIndex = clampPageIndex(currentPageIndex, totalPageCount);
  const currentFactoryPage = preview.currentPage;
  const currentFactoryName = currentFactoryPage.factoryName || fallbackFactoryName;
  const currentDueDate = currentFactoryPage.dueDate || fallbackDueDate;
  const currentFactoryQuantity = currentFactoryPage.quantity || fallbackQuantity;
  const currentFactoryLaborCost = currentFactoryPage.laborCost || 0;
  const currentFactoryLossCost = currentFactoryPage.lossCost || 0;
  const representativeImage = preview.representativeImage;

  const firstSummaryItems = [
    { label: copy.summaryItemName, value: preview.displayTitle },
    { label: copy.summaryLaborCost, value: formatDisplayCurrency(currentFactoryLaborCost) },
    { label: copy.summaryCost, value: formatDisplayCurrency(preview.currentDocumentAmount) },
    { label: copy.summaryQuantity, value: formatQuantity(currentFactoryQuantity) },
  ];

  const secondSummaryItems = [
    { label: copy.summaryFabricTotal, value: formatDisplayCurrency(preview.fabricAmountTotal) },
    { label: copy.summarySubsidiaryTotal, value: formatDisplayCurrency(preview.subsidiaryAmountTotal) },
    { label: copy.summaryOutsourcingTotal, value: formatDisplayCurrency(preview.outsourcingAmountTotal) },
    { label: copy.summaryLossCost, value: formatDisplayCurrency(currentFactoryLossCost) },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[1040px] overflow-hidden rounded-sm border border-stone-500 bg-white text-stone-900 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">

      {isProcessing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/72 backdrop-blur-[2px]" role="status" aria-live="polite">
          <div className="flex min-w-[260px] max-w-[360px] flex-col items-center rounded-2xl border border-stone-300 bg-white px-6 py-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" aria-hidden="true" />
            <span className="mt-4 text-sm font-bold text-stone-900">{processingTitle}</span>
            <span className="mt-1 text-xs leading-5 text-stone-500">{processingMessage}</span>
          </div>
        </div>
      ) : null}

      <div className="border-b border-stone-400 px-5 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div className="min-w-0 pt-1 text-left">
            <div className="text-[11px] font-semibold tracking-wide text-stone-500">{copy.dueDateLabel}</div>
            <div className="mt-1 text-sm font-semibold text-stone-900">{formatDateLabel(currentDueDate)}</div>
          </div>
          <div className="min-w-0 text-center">
            <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
              <div className="text-[25px] font-black tracking-[0.2em] text-stone-900">{copy.documentTitle}</div>
              <div className="max-w-[240px] truncate text-xs font-semibold text-stone-500">{currentFactoryName || copy.factoryUnset}</div>
            </div>
            <div className="mt-2 text-lg font-bold text-stone-900">{preview.displayTitle}</div>
          </div>
          <div />
        </div>
      </div>

      <SummaryLine items={firstSummaryItems} />
      <SummaryLine items={secondSummaryItems} className="bg-stone-50" />

      <div className="border-b border-stone-400 bg-[#fcfaf5] p-4">
        <section className="grid gap-3 xl:grid-cols-2">
          <div className="flex min-h-[360px] flex-col overflow-hidden border border-stone-400 bg-white">
            <div className="flex h-10 shrink-0 items-center border-b border-stone-300 bg-stone-100 px-3 text-sm font-bold text-stone-900">{copy.representativeImageTitle}</div>
            <div className="flex flex-1 p-4">
              {representativeImage ? (
                <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-hidden border border-stone-300 bg-stone-100">
                  <img src={representativeImage.url} alt={representativeImage.name} className="h-full max-h-[300px] w-full bg-white object-contain" />
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-1 items-center justify-center border border-dashed border-stone-300 bg-white text-sm text-stone-500">
                  {copy.representativeImageEmpty}
                </div>
              )}
            </div>
          </div>
          <div className="flex min-h-[360px] flex-col overflow-hidden border border-stone-400 bg-white">
            <div className="flex h-10 shrink-0 items-center border-b border-stone-300 bg-stone-100 px-3 text-sm font-bold text-stone-900">{copy.requestNoteTitle}</div>
            <div className="flex flex-1 p-4">
              <div className="flex min-h-[300px] flex-1 flex-col gap-2">
                <textarea
                  value={requestNote}
                  onChange={(event) => onRequestNoteChange(event.target.value)}
                  placeholder={copy.requestNotePlaceholder}
                  rows={requestNoteMaxLines}
                  maxLength={requestNoteMaxChars}
                  className="min-h-0 flex-1 resize-none border border-stone-300 bg-white px-3 py-3 text-sm leading-6 text-stone-800 outline-none transition focus:border-stone-500"
                />
                <div className="flex items-center justify-between text-[11px] leading-4 text-stone-500">
                  <span>{requestNote.split("\n").length} / {requestNoteMaxLines}줄</span>
                  <span>{requestNote.length} / {requestNoteMaxChars}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4 bg-[#fcfaf5] p-4">
        <SectionTable
          title={copy.fabricTableTitle}
          columns={[
            { label: copy.tableVendor, className: "w-[19%]" },
            { label: copy.tableMaterialName, className: "w-[27%]" },
            { label: copy.tableQuantity, className: "w-[12%]" },
            { label: copy.tableUnit, className: "w-[10%]" },
            { label: copy.tableUnitCost, className: "w-[16%]" },
            { label: copy.tableAmount, className: "w-[16%]" },
          ]}
          footerLabel={copy.fabricFooter}
          footerValue={formatDisplayCurrency(preview.fabricAmountTotal)}
        >
          <MaterialTableRows materials={preview.fabricMaterials} emptyLabel={copy.itemEmpty} currencySuffix={currencySuffix} />
        </SectionTable>

        <SectionTable
          title={copy.subsidiaryTableTitle}
          columns={[
            { label: copy.tableVendor, className: "w-[19%]" },
            { label: copy.tableMaterialName, className: "w-[27%]" },
            { label: copy.tableQuantity, className: "w-[12%]" },
            { label: copy.tableUnit, className: "w-[10%]" },
            { label: copy.tableUnitCost, className: "w-[16%]" },
            { label: copy.tableAmount, className: "w-[16%]" },
          ]}
          footerLabel={copy.subsidiaryFooter}
          footerValue={formatDisplayCurrency(preview.subsidiaryAmountTotal)}
        >
          <MaterialTableRows materials={preview.subsidiaryMaterials} emptyLabel={copy.itemEmpty} currencySuffix={currencySuffix} />
        </SectionTable>

        <SectionTable
          title={copy.outsourcingTableTitle}
          columns={[
            { label: copy.tableOutsourcingVendor, className: "w-[24%]" },
            { label: copy.tableOutsourcingTask, className: "w-[30%]" },
            { label: copy.tableQuantity, className: "w-[12%]" },
            { label: copy.tableUnitCost, className: "w-[17%]" },
            { label: copy.tableAmount, className: "w-[17%]" },
          ]}
          footerLabel={copy.outsourcingFooter}
          footerValue={formatDisplayCurrency(preview.outsourcingAmountTotal)}
        >
          <OutsourcingTableRows outsourcingItems={preview.outsourcingItems} emptyLabel={copy.itemEmpty} currencySuffix={currencySuffix} />
        </SectionTable>
      </div>

      {showDebug ? (
        <div className="border-t border-dashed border-amber-300 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
          <div className="font-semibold">{copy.debugTitle}</div>
          <div className="mt-1 break-words">
            {preview.currentDocument.label} · {currentFactoryPage.factoryName || copy.factoryUnset} · {copy.dueDateLabel} {formatDateLabel(currentDueDate)} · {copy.tableQuantity} {formatQuantity(currentFactoryQuantity)}
          </div>
        </div>
      ) : null}

      <div className="border-t border-stone-300 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPageIndexChange((prev) => clampPageIndex(prev - 1, totalPageCount))}
            disabled={totalPageCount <= 1 || safePageIndex <= 0}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300"
            aria-label={copy.previousPageAria}
          >
            <span className="block rotate-90">▾</span>
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold text-stone-600">{getFactoryPageLabel(safePageIndex, totalPageCount)}</div>
            <div className="mt-1 text-[11px] text-stone-500">{preview.currentDocument.label} · {currentFactoryPage.factoryName || copy.factoryUnset}</div>
          </div>
          <button
            type="button"
            onClick={() => onPageIndexChange((prev) => clampPageIndex(prev + 1, totalPageCount))}
            disabled={totalPageCount <= 1 || safePageIndex >= totalPageCount - 1}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300"
            aria-label={copy.nextPageAria}
          >
            <span className="block -rotate-90">▾</span>
          </button>
        </div>
      </div>
    </div>
  );
}
