import type { WorkOrderSummary } from "@/types/workorder";
import {
  getMaterialOrderReadinessSummary,
  isMaterialOrderCandidateWorkOrder,
  resolveMaterialOrderReadinessStatus,
  type MaterialOrderReadinessStatus,
} from "@/lib/material-orders/materialOrderReadiness";
import type {
  MaterialOrder,
  MaterialOrderCreateInput,
  MaterialOrderLineInput,
  MaterialOrderLineItemType,
  MaterialOrderSupplier,
  MaterialOrderSupplierListResult,
} from "@/lib/material-orders/types";

export type MaterialOrderWorkspaceListResult = {
  materialOrders: MaterialOrder[];
};

export type MaterialOrderWorkspaceMutationResult = MaterialOrderWorkspaceListResult & {
  materialOrder: MaterialOrder | null;
};

export type MaterialOrderWorkspaceApiError = {
  message?: string;
  code?: string;
  error?: string;
};

export type MaterialOrderWorkspaceWorkOrderCandidate = {
  id: string;
  code: string;
  productName: string;
  reorderLabel: string;
  managerLabel: string;
  requestedMaterialLabel: string;
  materialCountLabel: string;
  dueDateLabel: string;
  materialReadinessStatus: MaterialOrderReadinessStatus;
  materialReadinessLabel: string;
  materialItems: NonNullable<WorkOrderSummary["materialItems"]>;
};

export type MaterialOrderWorkspaceWorkOrdersResult = {
  workOrders: WorkOrderSummary[];
};

export function resolveMaterialOrderType(order: MaterialOrder): MaterialOrderLineItemType | null {
  return order.lines[0]?.itemType ?? null;
}

export function formatMaterialOrderCode(order: Pick<MaterialOrder, "id">): string {
  return `MO-${order.id.slice(0, 8).toUpperCase()}`;
}

export function formatMaterialOrderPrimaryLineLabel(order: Pick<MaterialOrder, "lines">): string {
  const primaryLine = order.lines[0] ?? null;
  if (!primaryLine?.itemName?.trim()) return "품목 미입력";

  const extraCount = Math.max(0, order.lines.length - 1);
  return extraCount > 0 ? `${primaryLine.itemName.trim()} 외 ${extraCount}건` : primaryLine.itemName.trim();
}

export function formatMaterialOrderDisplayTitle(order: MaterialOrder): string {
  const materialType = resolveMaterialOrderType(order);
  const typeLabel = formatMaterialOrderTypeLabel(materialType);
  const supplierLabel = order.supplierPartnerName?.trim() || "공급처 미선택";
  return `${typeLabel} · ${supplierLabel}`;
}

export function formatMaterialOrderRequesterLabel(order: Pick<MaterialOrder, "requestedByDisplayName">): string {
  return order.requestedByDisplayName?.trim() || "담당자 미확인";
}

export function formatMaterialOrderStatusLabel(status: MaterialOrder["status"]): string {
  switch (status) {
    case "draft":
      return "작성중";
    case "review_requested":
      return "검토요청";
    case "approved":
      return "발주요청";
    case "order_placed":
      return "발주완료";
    case "rejected":
      return "반려";
    case "cancelled":
      return "취소";
    default:
      return status;
  }
}

export function resolveMaterialOrderStatusBadgeTone(status: MaterialOrder["status"]): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "draft":
      return "neutral";
    case "review_requested":
      return "warning";
    case "approved":
      return "info";
    case "order_placed":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function formatMaterialOrderTypeLabel(type: MaterialOrderLineItemType | null | ""): string {
  if (type === "fabric") return "원단";
  if (type === "submaterial") return "부자재";
  return "미지정";
}

export function formatMaterialOrderDateLabel(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date);
}

export function formatMaterialOrderAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function toMaterialOrderWorkspaceError(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallbackMessage;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | MaterialOrderWorkspaceApiError | null;

  if (!response.ok) {
    const errorPayload = payload as MaterialOrderWorkspaceApiError | null;
    throw new Error(errorPayload?.message || errorPayload?.error || errorPayload?.code || "요청을 처리하지 못했습니다.");
  }

  return payload as T;
}

export async function fetchMaterialOrders(): Promise<MaterialOrder[]> {
  const response = await fetch("/api/material-orders", {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  const payload = await readJsonResponse<MaterialOrderWorkspaceListResult>(response);
  return Array.isArray(payload.materialOrders) ? payload.materialOrders : [];
}


export async function fetchMaterialOrderSuppliers(type: MaterialOrderLineItemType): Promise<MaterialOrderSupplier[]> {
  const params = new URLSearchParams({ type });
  const response = await fetch(`/api/material-orders/suppliers?${params.toString()}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  const payload = await readJsonResponse<MaterialOrderSupplierListResult>(response);
  return Array.isArray(payload.suppliers) ? payload.suppliers : [];
}

export async function createEmptyMaterialOrder(): Promise<MaterialOrderWorkspaceMutationResult> {
  const body: Partial<MaterialOrderCreateInput> = {
    status: "draft",
    lines: [],
  };

  const response = await fetch("/api/material-orders", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<MaterialOrderWorkspaceMutationResult>(response);
}

export async function updateMaterialOrderDetail(input: {
  materialOrderId: string;
  supplierPartnerId?: string | null;
  note?: string | null;
  lines: MaterialOrderLineInput[];
}): Promise<MaterialOrderWorkspaceMutationResult> {
  const response = await fetch("/api/material-orders", {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJsonResponse<MaterialOrderWorkspaceMutationResult>(response);
}

export async function updateMaterialOrderStatus(input: {
  materialOrderId: string;
  status: MaterialOrder["status"];
}): Promise<MaterialOrderWorkspaceMutationResult> {
  const response = await fetch("/api/material-orders", {
    method: "PATCH",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJsonResponse<MaterialOrderWorkspaceMutationResult>(response);
}

export async function cancelMaterialOrder(input: {
  materialOrderId: string;
}): Promise<MaterialOrderWorkspaceMutationResult> {
  return updateMaterialOrderStatus({
    materialOrderId: input.materialOrderId,
    status: "cancelled",
  });
}

export async function fetchAllocationCandidateWorkOrders(): Promise<MaterialOrderWorkspaceWorkOrderCandidate[]> {
  const response = await fetch("/api/workorders/summary?status=active", {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  const payload = await readJsonResponse<MaterialOrderWorkspaceWorkOrdersResult>(response);
  const workOrders = Array.isArray(payload.workOrders) ? payload.workOrders : [];

  return workOrders
    .filter(isMaterialOrderCandidateWorkOrder)
    .map((workOrder) => {
      const materialItems = resolveWorkOrderMaterialItems(workOrder);
      const materialReadinessStatus = resolveMaterialOrderReadinessStatus(workOrder);
      const materialReadinessSummary = getMaterialOrderReadinessSummary(materialReadinessStatus);

      return {
        id: workOrder.id,
        code: workOrder.displayTitle || workOrder.title || "제목 없음",
        productName: workOrder.baseTitle || workOrder.title || "제목 없음",
        reorderLabel: resolveReorderLabel(workOrder.reorderRound),
        managerLabel: workOrder.manager ? `담당 ${workOrder.manager}` : "담당자 미확인",
        requestedMaterialLabel: resolveWorkOrderMaterialSummary(workOrder.materialSummary, workOrder.materialCount),
        materialCountLabel: resolveWorkOrderMaterialCountLabel(workOrder),
        dueDateLabel: workOrder.dueDate ? `납기 ${workOrder.dueDate}` : "납기 미정",
        materialReadinessStatus,
        materialReadinessLabel: materialReadinessSummary.label,
        materialItems,
      };
    });
}

function resolveWorkOrderMaterialItems(workOrder: WorkOrderSummary): NonNullable<WorkOrderSummary["materialItems"]> {
  return Array.isArray(workOrder.materialItems)
    ? workOrder.materialItems.filter((item) => item.itemName.trim().length > 0)
    : [];
}

function resolveWorkOrderMaterialCountLabel(workOrder: WorkOrderSummary): string {
  const fabricCount = typeof workOrder.materialFabricCount === "number" && Number.isFinite(workOrder.materialFabricCount)
    ? workOrder.materialFabricCount
    : 0;
  const submaterialCount = typeof workOrder.materialSubmaterialCount === "number" && Number.isFinite(workOrder.materialSubmaterialCount)
    ? workOrder.materialSubmaterialCount
    : 0;

  if (fabricCount > 0 || submaterialCount > 0) {
    return `원단 ${fabricCount}종 · 부자재 ${submaterialCount}종`;
  }

  const totalCount = typeof workOrder.materialCount === "number" && Number.isFinite(workOrder.materialCount)
    ? workOrder.materialCount
    : 0;
  return totalCount > 0 ? `원단·부자재 ${totalCount}종` : "원단·부자재 0종";
}

function resolveWorkOrderMaterialSummary(materialSummary: string | undefined, materialCount: number | undefined): string {
  const normalizedSummary = materialSummary?.trim();
  if (normalizedSummary) return normalizedSummary;

  const count = typeof materialCount === "number" && Number.isFinite(materialCount) ? materialCount : 0;
  return count > 0 ? `원단·부자재 ${count}종` : "자재 할당 대기";
}


function resolveReorderLabel(reorderRound: number | undefined): string {
  if (!reorderRound || reorderRound <= 0) return "초도";
  return `리오더 ${reorderRound}차`;
}
