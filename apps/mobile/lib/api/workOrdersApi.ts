import type {
  CreateWorkOrderDraftInput,
  CreateWorkOrderDraftResult,
  PatchWorkOrderBasicInfoInput,
  PatchWorkOrderBasicInfoResult,
  WorkOrderDetailCore,
  WorkOrderListPage,
  WorkOrderListStatusFilter,
  WorkOrderProcesses,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";
import { isNonEmptyString } from "./apiValidation";

export async function getWorkOrderList(input: {
  readonly query?: string;
  readonly status?: WorkOrderListStatusFilter;
  readonly cursor?: string | null;
} = {}): Promise<WorkOrderListPage> {
  const query = new URLSearchParams({ limit: "30" });
  if (input.query?.trim()) query.set("q", input.query.trim());
  if (input.status && input.status !== "all") query.set("status", input.status);
  if (input.cursor) query.set("cursor", input.cursor);
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderListPage }>(`/api/v2/work-orders?${query.toString()}`, { method: "GET" });
  if (!body.ok || !body.data || !Array.isArray(body.data.items)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 목록 응답이 올바르지 않습니다." });
  return body.data;
}

export async function createWorkOrderDraft(
  command: CreateWorkOrderDraftInput,
  idempotencyKey: string,
): Promise<CreateWorkOrderDraftResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: CreateWorkOrderDraftResult;
  }>("/api/v2/work-orders", {
    method: "POST",
    body: { clientRequestId: command.clientRequestId, productName: command.productName },
    idempotencyKey,
  });
  const result = body.data?.result;
  if (
    !body.ok
    || !result
    || !isNonEmptyString(result.workOrderId)
    || !isNonEmptyString(result.revisionId)
    || result.revisionNumber !== 0
    || result.status !== "draft"
    || result.revisionStatus !== "draft"
    || result.displayDocumentNumber !== null
    || !isNonEmptyString(result.productName)
    || result.productTypeCode !== null
    || result.seasonCode !== null
    || result.itemCode !== null
    || result.dueDate !== null
    || result.totalQuantity !== 0
    || result.memo !== null
    || result.factoryDeliveryMemo !== null
    || !Number.isSafeInteger(body.data.nextVersion)
    || body.data.nextVersion < 1
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업지시서 생성 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function getWorkOrderDetail(workOrderId: string): Promise<WorkOrderDetailCore> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderDetailCore }>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}`, { method: "GET" });
  if (!body.ok || !body.data?.header) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 상세 응답이 올바르지 않습니다." });
  return body.data;
}

export async function getWorkOrderProcesses(workOrderId: string): Promise<WorkOrderProcesses> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderProcesses }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/processes`,
    { method: "GET" },
  );
  if (!body.ok || !body.data || !Array.isArray(body.data.flowSummary) || !Array.isArray(body.data.processes)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 정보를 불러오지 못했습니다." });
  }
  return body.data;
}

export async function patchWorkOrderBasicInfo(
  workOrderId: string,
  command: PatchWorkOrderBasicInfoInput,
): Promise<PatchWorkOrderBasicInfoResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: PatchWorkOrderBasicInfoResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}`,
    { method: "PATCH", body: command },
  );
  if (
    !body.ok
    || !body.data?.result
    || !Number.isSafeInteger(body.data.nextVersion)
    || body.data.nextVersion < 1
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 저장 응답이 올바르지 않습니다." });
  }
  return body.data;
}
