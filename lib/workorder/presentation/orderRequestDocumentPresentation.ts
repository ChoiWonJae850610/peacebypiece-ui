import { EMPTY_DISPLAY } from "@/lib/constants/display";
import { MATERIAL_KIND, ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { getOrderEntriesByTargetType, getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import type { Attachment, Material, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";

export type OrderRequestDocumentPage = {
  factoryName: string;
  dueDate: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
};

export type OrderRequestDocumentUnit = {
  key: string;
  index: number;
  total: number;
  label: string;
  factoryName: string;
  page: OrderRequestDocumentPage;
  pageBreakPolicy: "factory-document";
};

export type OrderRequestDocumentPreview = {
  displayTitle: string;
  documents: OrderRequestDocumentUnit[];
  pages: OrderRequestDocumentPage[];
  currentDocument: OrderRequestDocumentUnit;
  currentPage: OrderRequestDocumentPage;
  fabricMaterials: Material[];
  subsidiaryMaterials: Material[];
  outsourcingItems: Outsourcing[];
  fabricAmountTotal: number;
  subsidiaryAmountTotal: number;
  outsourcingAmountTotal: number;
  materialAndOutsourcingAmountTotal: number;
  currentFactoryCostAmount: number;
  currentDocumentAmount: number;
  representativeImage: Attachment | null;
  requestNote: string;
};

function normalizeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || EMPTY_DISPLAY;
}

function normalizeOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "";
}

function normalizeNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((total, item) => total + normalizeNumber(getter(item)), 0);
}


export function getRepresentativeImage(allAttachments: Attachment[]) {
  const designImages = allAttachments.filter(
    (attachment) => attachment.type === "image" && attachment.scope === "design",
  );
  if (designImages.length > 0) return designImages[0] ?? null;

  const officialImages = allAttachments.filter(
    (attachment) => attachment.type === "image" && (attachment.scope ?? "attachment") === "attachment",
  );
  if (officialImages.length > 0) return officialImages[0] ?? null;

  return allAttachments.find((attachment) => attachment.type === "image") ?? null;
}

function buildFactoryPages(factoryEntries: OrderEntry[], fallback: OrderRequestDocumentPage) {
  if (factoryEntries.length === 0) return [fallback];

  return factoryEntries.map((entry) => ({
    factoryName: normalizeText(entry.factory || fallback.factoryName),
    dueDate: normalizeText(entry.dueDate || fallback.dueDate),
    quantity: normalizeNumber(entry.quantity),
    laborCost: normalizeNumber(entry.laborCost),
    lossCost: normalizeNumber(entry.lossCost),
  }));
}

function buildDocumentUnits(pages: OrderRequestDocumentPage[]) {
  const total = pages.length;

  return pages.map((page, index) => ({
    key: `factory-document-${index + 1}-${normalizeOptionalText(page.factoryName) || "empty"}`,
    index,
    total,
    label: `문서 ${index + 1}`,
    factoryName: page.factoryName,
    page,
    pageBreakPolicy: "factory-document" as const,
  }));
}

export function getOrderRequestDocumentPreview(workOrder: WorkOrder, pageIndex: number): OrderRequestDocumentPreview {
  const submissionSnapshot = getOrderSubmissionSnapshot(workOrder);
  const requested = workOrder.factoryOrderRequest ?? null;
  const orderEntriesByTarget = getOrderEntriesByTargetType(workOrder.orderEntries);
  const factoryEntries = orderEntriesByTarget[ORDER_ENTRY_TARGET_TYPE.factory] ?? [];

  const fallbackPage: OrderRequestDocumentPage = {
    factoryName: normalizeText(requested?.factoryName || submissionSnapshot.factoryName),
    dueDate: normalizeText(submissionSnapshot.dueDate),
    quantity: normalizeNumber(requested?.quantity ?? submissionSnapshot.quantity),
    laborCost: normalizeNumber(submissionSnapshot.laborCost),
    lossCost: normalizeNumber(submissionSnapshot.lossCost),
  };

  const pages = buildFactoryPages(factoryEntries, fallbackPage);
  const documents = buildDocumentUnits(pages);
  const safePageIndex = Math.min(Math.max(0, pageIndex), documents.length - 1);
  const currentDocument = documents[safePageIndex] ?? documents[0] ?? {
    key: "factory-document-1-empty",
    index: 0,
    total: 1,
    label: "문서 1",
    factoryName: fallbackPage.factoryName,
    page: fallbackPage,
    pageBreakPolicy: "factory-document" as const,
  };
  const currentPage = currentDocument.page;

  const materials = workOrder.materials ?? [];
  const fabricMaterials = materials.filter((material) => material.type === MATERIAL_KIND.fabric);
  const subsidiaryMaterials = materials.filter((material) => material.type === MATERIAL_KIND.subsidiary);
  const outsourcingItems = workOrder.outsourcing ?? [];
  const attachmentItems = workOrder.attachments ?? [];

  const fabricAmountTotal = sumBy(fabricMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const subsidiaryAmountTotal = sumBy(subsidiaryMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const outsourcingAmountTotal = sumBy(outsourcingItems, (item) => item.totalCost);
  const materialAndOutsourcingAmountTotal = fabricAmountTotal + subsidiaryAmountTotal + outsourcingAmountTotal;
  const currentFactoryCostAmount = currentPage.laborCost + currentPage.lossCost;
  const currentDocumentAmount = materialAndOutsourcingAmountTotal + currentFactoryCostAmount;

  return {
    displayTitle: normalizeText(getWorkOrderDisplayTitle(workOrder)),
    documents,
    pages,
    currentDocument,
    currentPage,
    fabricMaterials,
    subsidiaryMaterials,
    outsourcingItems,
    fabricAmountTotal,
    subsidiaryAmountTotal,
    outsourcingAmountTotal,
    materialAndOutsourcingAmountTotal,
    currentFactoryCostAmount,
    currentDocumentAmount,
    representativeImage: getRepresentativeImage(attachmentItems),
    requestNote: String(workOrder.memo ?? "").trim(),
  };
}
