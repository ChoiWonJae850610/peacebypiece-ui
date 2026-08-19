import type { WorkOrderProductionMutationResult, WorkOrderProductionOptions } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";

export type ProductionProcessWriteInput = { readonly role: "factory" | "additional"; readonly processCode: string | null; readonly partnerId: string; readonly unitPrice: string; readonly memo: string | null };
type Command = { readonly clientRequestId: string; readonly expectedVersion: number; readonly process: ProductionProcessWriteInput };
type DeleteCommand = { readonly clientRequestId: string; readonly expectedVersion: number };
export type ProductionOrderCommandKind = "request" | "cancel" | "complete";

function mutation(data: WorkOrderProductionMutationResult | undefined) {
  if(!data || !Number.isSafeInteger(data.nextVersion) || data.nextVersion<1 || typeof data.workOrderId!=="string" || typeof data.revisionId!=="string") throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"제작 정보 저장 응답이 올바르지 않습니다."});
  return data;
}

export async function getWorkOrderProductionOptions(workOrderId:string):Promise<WorkOrderProductionOptions>{
  const body=await requestJson<{ok:boolean;data?:WorkOrderProductionOptions}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/production-options`,{method:"GET"});
  const data=body.data;
  if(!body.ok||!data||data.workOrderId!==workOrderId||!Number.isSafeInteger(data.entityVersion)||!Array.isArray(data.factoryPartners)||!Array.isArray(data.processStandards)||!Array.isArray(data.processPartners))throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"제작 선택 목록 응답이 올바르지 않습니다."});
  return data;
}

export async function createWorkOrderProductionProcess(workOrderId:string,command:Command,idempotencyKey:string){
  const body=await requestJson<{ok:boolean;data?:WorkOrderProductionMutationResult}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/processes`,{method:"POST",body:command,idempotencyKey});return mutation(body.data);
}
export async function updateWorkOrderProductionProcess(workOrderId:string,processId:string,command:Command,idempotencyKey:string){
  const body=await requestJson<{ok:boolean;data?:WorkOrderProductionMutationResult}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/processes/${encodeURIComponent(processId)}`,{method:"PATCH",body:command,idempotencyKey});return mutation(body.data);
}
export async function deleteWorkOrderProductionProcess(workOrderId:string,processId:string,command:DeleteCommand,idempotencyKey:string){
  const body=await requestJson<{ok:boolean;data?:WorkOrderProductionMutationResult}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/processes/${encodeURIComponent(processId)}`,{method:"DELETE",body:command,idempotencyKey});return mutation(body.data);
}
export async function transitionWorkOrderProductionOrder(workOrderId:string,processId:string,kind:ProductionOrderCommandKind,command:DeleteCommand,idempotencyKey:string){
  const body=await requestJson<{ok:boolean;data?:WorkOrderProductionMutationResult}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/processes/${encodeURIComponent(processId)}/order-${kind}`,{method:"POST",body:command,idempotencyKey});return mutation(body.data);
}
