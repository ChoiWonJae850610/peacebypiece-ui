import type {
  CreateWorkOrderDraftInput,
  CreateWorkOrderDraftResult,
  CreateWorkOrderReorderInput,
  CreateWorkOrderReorderResult,
  CreateWorkOrderCopyInput,
  CreateWorkOrderCopyResult,
  PatchWorkOrderBasicInfoInput,
  PatchWorkOrderBasicInfoResult,
  WorkOrderDetailCore,
  WorkOrderListPage,
  WorkOrderListStatusFilter,
  WorkOrderCharacterFilter,
  WorkOrderLineageFilter,
  SetWorkOrderSampleInput,
  SetWorkOrderSampleResult,
  WorkOrderProcesses,
  WorkOrderSeriesHistory,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";
import { isNonEmptyString } from "./apiValidation";

export async function getWorkOrderList(input: {
  readonly query?: string;
  readonly status?: WorkOrderListStatusFilter;
  readonly character?: WorkOrderCharacterFilter;
  readonly lineage?: readonly WorkOrderLineageFilter[];
  readonly cursor?: string | null;
} = {}): Promise<WorkOrderListPage> {
  const query = new URLSearchParams({ limit: "30" });
  if (input.query?.trim()) query.set("q", input.query.trim());
  if (input.status && input.status !== "all") query.set("status", input.status);
  if (input.character && input.character !== "all") query.set("character", input.character);
  if (input.lineage?.length) query.set("lineage", ["reorder", "rework"].filter((value) => input.lineage?.includes(value as WorkOrderLineageFilter)).join(","));
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
    body: { clientRequestId: command.clientRequestId, productName: command.productName, isSample: command.isSample },
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
    || typeof result.isSample !== "boolean"
    || result.derivationKind !== "original"
    || result.reorderRound !== 0
    || !Number.isSafeInteger(body.data.nextVersion)
    || body.data.nextVersion < 1
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "레시피 생성 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function createWorkOrderReorder(
  sourceWorkOrderId: string,
  command: CreateWorkOrderReorderInput,
  idempotencyKey: string,
): Promise<CreateWorkOrderReorderResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: CreateWorkOrderReorderResult }>(
    `/api/v2/work-orders/${encodeURIComponent(sourceWorkOrderId)}/reorder`,
    { method: "POST", body: command, idempotencyKey },
  );
  const result = body.data?.result;
  if (!body.ok || !result || result.derivationKind !== "reorder" || result.isSample !== false
    || result.sourceWorkOrderId !== sourceWorkOrderId || result.reorderRound < 1
    || result.status !== "draft" || result.revisionStatus !== "draft"
    || !Number.isSafeInteger(result.totalQuantity) || result.totalQuantity < 0) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "리오더 생성 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function createWorkOrderCopy(sourceWorkOrderId:string,command:CreateWorkOrderCopyInput,idempotencyKey:string):Promise<CreateWorkOrderCopyResult>{
  const body=await requestJson<{readonly ok:boolean;readonly data?:CreateWorkOrderCopyResult}>(`/api/v2/work-orders/${encodeURIComponent(sourceWorkOrderId)}/copy`,{method:"POST",body:command,idempotencyKey});const result=body.data?.result;
  if(!body.ok||!result||result.status!=="draft"||result.revisionStatus!=="draft"||result.derivationKind!=="original"||result.reorderRound!==0||!isNonEmptyString(result.workOrderId)||!isNonEmptyString(result.revisionId))throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"레시피 복사 응답이 올바르지 않습니다."});return body.data!;
}

export async function deleteDraftWorkOrder(workOrderId:string){const body=await requestJson<{readonly ok:boolean;readonly data?:{readonly deleted:boolean;readonly workOrderId:string}}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}`,{method:"DELETE"});if(!body.ok||!body.data?.deleted||body.data.workOrderId!==workOrderId)throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"초안 삭제 응답이 올바르지 않습니다."});return body.data;}

export async function getWorkOrderSeriesHistory(workOrderId: string): Promise<WorkOrderSeriesHistory> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderSeriesHistory }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/reorder`, { method: "GET" },
  );
  if (!body.ok || !body.data || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업 이력 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function setWorkOrderSample(workOrderId: string, command: SetWorkOrderSampleInput, idempotencyKey: string): Promise<SetWorkOrderSampleResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: SetWorkOrderSampleResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/sample`,
    { method: "PATCH", body: command, idempotencyKey },
  );
  if (!body.ok || !body.data?.result || typeof body.data.result.isSample !== "boolean" || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업 구분 변경 응답이 올바르지 않습니다." });
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
