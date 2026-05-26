import type { WorkOrder } from "@/types/workorder";
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
  requestedMaterialLabel: string;
  dueDateLabel: string;
};

export type MaterialOrderWorkspaceWorkOrdersResult = {
  workOrders: WorkOrder[];
};

export function resolveMaterialOrderType(order: MaterialOrder): MaterialOrderLineItemType | null {
  return order.lines[0]?.itemType ?? null;
}

export function formatMaterialOrderCode(order: Pick<MaterialOrder, "id">): string {
  return `MO-${order.id.slice(0, 8).toUpperCase()}`;
}

export function formatMaterialOrderStatusLabel(status: MaterialOrder["status"]): string {
  switch (status) {
    case "draft":
      return "작성중";
    case "review_requested":
      return "검토요청";
    case "approved":
      return "승인";
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

export function formatMaterialOrderTypeLabel(type: MaterialOrderLineItemType | null): string {
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

export async function fetchAllocationCandidateWorkOrders(): Promise<MaterialOrderWorkspaceWorkOrderCandidate[]> {
  const response = await fetch("/api/workorders", {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  const payload = await readJsonResponse<MaterialOrderWorkspaceWorkOrdersResult>(response);
  const workOrders = Array.isArray(payload.workOrders) ? payload.workOrders : [];

  return workOrders.map((workOrder) => ({
    id: workOrder.id,
    code: workOrder.displayTitle || workOrder.title || workOrder.id.slice(0, 8),
    productName: workOrder.baseTitle || workOrder.title || "제목 없음",
    reorderLabel: resolveReorderLabel(workOrder.reorderRound),
    requestedMaterialLabel: "자재 배분 가능",
    dueDateLabel: workOrder.dueDate ? `납기 ${workOrder.dueDate}` : "납기 미정",
  }));
}

function resolveReorderLabel(reorderRound: number | undefined): string {
  if (!reorderRound || reorderRound <= 0) return "초도";
  return `리오더 ${reorderRound}차`;
}
