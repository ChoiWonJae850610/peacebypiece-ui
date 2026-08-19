import "server-only";

import { createHash } from "crypto";
import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyMemberId, CorrelationId, ProcessId, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { createProductionProcessV2, deleteProductionProcessV2, ProcessCommandRepositoryError, transitionProductionProcessOrderV2, updateProductionProcessV2 } from "@/lib/domain/work-orders/command/processCommandRepository";
import type { DeleteProductionProcessCommand, ProductionOrderTransitionKind, ProductionProcessCommand } from "@/lib/domain/work-orders/command/processValidation";
import { WORK_ORDER_COMMAND_CODES } from "@/lib/domain/work-orders/command/workOrderCommandCodes";
import { getWorkOrderV2ProductionMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
const deterministicUuid=(hash:string)=>`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
const assigned=(scope:WorkspaceApiCompanyScope)=>scope.visibility?.mode==="assigned"?scope.visibility.companyMemberId as CompanyMemberId:null;

function map(error: ProcessCommandRepositoryError): never {
  const status=error.reason==="not_found"?404:["invalid_option","order_not_ready"].includes(error.reason)?400:409;
  const code=error.reason==="not_found"?"NOT_FOUND":["invalid_option","order_not_ready"].includes(error.reason)?"VALIDATION_ERROR":error.reason==="locked"?"LOCKED":"CONFLICT";
  const message=error.reason==="invalid_option"?"현재 회사에서 사용할 수 있는 제작 공정과 업체를 선택해 주세요.":error.reason==="order_not_ready"?"제작 공장, 장당 공임, 작업지시서 수량을 확인해 주세요.":error.reason==="factory_exists"?"제작 공장은 하나만 설정할 수 있습니다.":error.reason==="not_found"?"제작 공정을 찾을 수 없습니다.":"현재 제작 정보를 변경할 수 없습니다.";
  throw new WorkOrderCommandRequestError({code,status,message,entityVersion:error.entityVersion===null?undefined:error.entityVersion as never});
}

function context(input:{scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId}) {
  const runtime=getWorkOrderV2ProductionMutationRuntimeGuard();
  if(!runtime.ok)throw new WorkOrderCommandRequestError({code:"FORBIDDEN",status:403,message:"승인된 alpha.65 dev/test runtime에서만 사용할 수 있습니다."});
  return createCommandTenantScope({scope:input.scope,companyMemberId:input.companyMemberId,correlationId:input.correlationId,permissionCode:"workorder.update"});
}

function common(input:{workOrderId:string;scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId;command:ProductionProcessCommand|DeleteProductionProcessCommand;commandCode:string}) {
  if(!UUID.test(input.workOrderId))throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"작업지시서를 찾을 수 없습니다."});
  const scope=context(input);
  const keyHash=sha([input.commandCode,scope.companyId,scope.companyMemberId,input.command.idempotencyKey].join("\0"));
  const requestHash=sha(JSON.stringify({workOrderId:input.workOrderId,expectedVersion:input.command.expectedVersion,process:"process" in input.command?input.command.process:null}));
  return {scope,assignedCompanyMemberId:assigned(input.scope),workOrderId:input.workOrderId as WorkOrderId,keyHash,requestHash};
}

export async function createProductionProcess(input:{workOrderId:string;command:ProductionProcessCommand;scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId}) {
  const c=common({...input,commandCode:"work_order.production_process.create"});
  const processId=deterministicUuid(c.keyHash) as ProcessId;
  try{return await createProductionProcessV2({...c,processId,command:input.command});}catch(error){if(error instanceof ProcessCommandRepositoryError)map(error);throw error;}
}

export async function updateProductionProcess(input:{workOrderId:string;processId:string;command:ProductionProcessCommand;scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId}) {
  if(!UUID.test(input.processId))throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"제작 공정을 찾을 수 없습니다."});
  const c=common({...input,commandCode:"work_order.production_process.update"});
  try{return await updateProductionProcessV2({...c,processId:input.processId as ProcessId,command:input.command});}catch(error){if(error instanceof ProcessCommandRepositoryError)map(error);throw error;}
}

export async function deleteProductionProcess(input:{workOrderId:string;processId:string;command:DeleteProductionProcessCommand;scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId}) {
  if(!UUID.test(input.processId))throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"제작 공정을 찾을 수 없습니다."});
  const c=common({...input,commandCode:"work_order.production_process.delete"});
  try{return await deleteProductionProcessV2({...c,processId:input.processId as ProcessId,command:input.command});}catch(error){if(error instanceof ProcessCommandRepositoryError)map(error);throw error;}
}

const ORDER_COMMAND_CODES = {
  request: WORK_ORDER_COMMAND_CODES.productionProcess.orderRequest,
  cancel: WORK_ORDER_COMMAND_CODES.productionProcess.orderCancel,
  complete: WORK_ORDER_COMMAND_CODES.productionProcess.orderComplete,
} as const;

export async function transitionProductionProcessOrder(input:{workOrderId:string;processId:string;kind:ProductionOrderTransitionKind;command:DeleteProductionProcessCommand;scope:WorkspaceApiCompanyScope;companyMemberId:string|null;correlationId:CorrelationId}) {
  if(!UUID.test(input.processId))throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"제작 공정을 찾을 수 없습니다."});
  const c=common({...input,commandCode:ORDER_COMMAND_CODES[input.kind]});
  try{return await transitionProductionProcessOrderV2({...c,processId:input.processId as ProcessId,kind:input.kind,command:input.command});}catch(error){if(error instanceof ProcessCommandRepositoryError)map(error);throw error;}
}
