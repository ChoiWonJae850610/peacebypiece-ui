import type { Locale } from "@/lib/i18n";
import { calculateOrderEntryAmount, calculateOutsourcingAmount } from "@/lib/workorder/detail/detailCalculations";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { OrderEntry, Outsourcing } from "@/types/workorder";

export type WorkOrderProcessCostLine = {
  id: string;
  label: string;
  unitAmount: number;
  lossAmount: number;
  totalAmount: number;
};

export type WorkOrderCostSummaryPresentation = {
  processLines: WorkOrderProcessCostLine[];
  processLaborCost: number;
  processLossCost: number;
  totalCost: number;
  unitCost: number;
};

function normalizeCostNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function buildFallbackProcessLabel(fallbackProcess: string, index: number) {
  return fallbackProcess.replace("{index}", String(index + 1));
}

function buildProductionProcessLine({
  item,
  index,
  fallbackProcess,
  locale,
}: {
  item: OrderEntry;
  index: number;
  fallbackProcess: string;
  locale: Locale;
}): WorkOrderProcessCostLine {
  const typeLabel = translateWorkOrderDisplayText(item.type, locale);
  const factoryLabel = translateWorkOrderDisplayText(item.factory, locale);
  const labels = [typeLabel, factoryLabel].filter(Boolean);
  const quantity = normalizeCostNumber(item.quantity);
  const unitAmount = quantity * normalizeCostNumber(item.laborCost);
  const lossAmount = quantity * normalizeCostNumber(item.lossCost);

  return {
    id: `production-${item.id}`,
    label: labels.length > 0 ? labels.join(" · ") : buildFallbackProcessLabel(fallbackProcess, index),
    unitAmount,
    lossAmount,
    totalAmount: calculateOrderEntryAmount(item),
  };
}

function buildOutsourcingProcessLine({
  item,
  index,
  productionLineCount,
  fallbackProcess,
  locale,
}: {
  item: Outsourcing;
  index: number;
  productionLineCount: number;
  fallbackProcess: string;
  locale: Locale;
}): WorkOrderProcessCostLine {
  const processLabel = getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale));
  const vendorLabel = getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale));
  const labels = [processLabel, vendorLabel].filter(Boolean);
  const quantity = normalizeCostNumber(item.quantity);
  const unitAmount = quantity * normalizeCostNumber(item.unitCost);
  const lossAmount = quantity * normalizeCostNumber(item.lossCost);

  return {
    id: `outsourcing-${item.id}`,
    label: labels.length > 0 ? labels.join(" · ") : buildFallbackProcessLabel(fallbackProcess, productionLineCount + index),
    unitAmount,
    lossAmount,
    totalAmount: calculateOutsourcingAmount(item),
  };
}

export function buildWorkOrderProcessCostLines({
  orderEntries,
  outsourcing,
  fallbackProcess,
  locale,
}: {
  orderEntries: OrderEntry[];
  outsourcing: Outsourcing[];
  fallbackProcess: string;
  locale: Locale;
}): WorkOrderProcessCostLine[] {
  const productionLines = orderEntries.slice(0, 1).map((item, index) => buildProductionProcessLine({ item, index, fallbackProcess, locale }));
  const outsourcingLines = outsourcing.map((item, index) => buildOutsourcingProcessLine({
    item,
    index,
    productionLineCount: productionLines.length,
    fallbackProcess,
    locale,
  }));

  return [...productionLines, ...outsourcingLines];
}

export function buildWorkOrderCostSummaryPresentation({
  fabricTotal,
  subsidiaryTotal,
  unitCost,
  orderEntries,
  outsourcing,
  fallbackProcess,
  locale,
}: {
  fabricTotal: number;
  subsidiaryTotal: number;
  unitCost: number;
  orderEntries: OrderEntry[];
  outsourcing: Outsourcing[];
  fallbackProcess: string;
  locale: Locale;
}): WorkOrderCostSummaryPresentation {
  const processLines = buildWorkOrderProcessCostLines({ orderEntries, outsourcing, fallbackProcess, locale });
  const processLaborCost = processLines.reduce((sum, item) => sum + item.unitAmount, 0);
  const processLossCost = processLines.reduce((sum, item) => sum + item.lossAmount, 0);
  const totalCost = fabricTotal + subsidiaryTotal + processLaborCost + processLossCost;
  const productionQuantity = orderEntries.reduce((sum, item) => sum + normalizeCostNumber(item.quantity), 0);

  return {
    processLines,
    processLaborCost,
    processLossCost,
    totalCost,
    unitCost: productionQuantity > 0 ? Math.round(totalCost / productionQuantity) : unitCost,
  };
}
