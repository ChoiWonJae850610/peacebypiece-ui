import { EMPTY_DISPLAY } from "@/lib/constants/display";
import { MATERIAL_KIND, ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { getOrderEntriesByTargetType, getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import type { Attachment, Material, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";

export type OrderRequestDocumentPage = {
  factoryName: string;
  dueDate: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
};

export type OrderRequestDocumentPreview = {
  displayTitle: string;
  pages: OrderRequestDocumentPage[];
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
  visibleAttachments: Attachment[];
  requestNote: string;
};

function normalizeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || EMPTY_DISPLAY;
}

function normalizeNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((total, item) => total + normalizeNumber(getter(item)), 0);
}

function getDisplayAttachments(attachments: Attachment[]) {
  const officialAttachments = attachments.filter((attachment) => (attachment.scope ?? "official") === "official");
  return officialAttachments.length > 0 ? officialAttachments : attachments;
}

function getRepresentativeImage(attachments: Attachment[]) {
  const officialImages = attachments.filter(
    (attachment) => attachment.type === "image" && (attachment.scope ?? "official") === "official",
  );
  if (officialImages.length > 0) return officialImages[0] ?? null;
  return attachments.find((attachment) => attachment.type === "image") ?? null;
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
  const safePageIndex = Math.min(Math.max(0, pageIndex), pages.length - 1);
  const currentPage = pages[safePageIndex] ?? fallbackPage;

  const materials = workOrder.materials ?? [];
  const fabricMaterials = materials.filter((material) => material.type === MATERIAL_KIND.fabric);
  const subsidiaryMaterials = materials.filter((material) => material.type === MATERIAL_KIND.subsidiary);
  const outsourcingItems = workOrder.outsourcing ?? [];
  const attachmentItems = workOrder.attachments ?? [];
  const visibleAttachments = getDisplayAttachments(attachmentItems);

  const fabricAmountTotal = sumBy(fabricMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const subsidiaryAmountTotal = sumBy(subsidiaryMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const outsourcingAmountTotal = sumBy(outsourcingItems, (item) => item.totalCost);
  const materialAndOutsourcingAmountTotal = fabricAmountTotal + subsidiaryAmountTotal + outsourcingAmountTotal;
  const currentFactoryCostAmount = currentPage.laborCost + currentPage.lossCost;
  const currentDocumentAmount = materialAndOutsourcingAmountTotal + currentFactoryCostAmount;

  return {
    displayTitle: normalizeText(workOrder.displayTitle || workOrder.title),
    pages,
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
    representativeImage: getRepresentativeImage(visibleAttachments),
    visibleAttachments,
    requestNote: String(workOrder.memo ?? "").trim(),
  };
}
