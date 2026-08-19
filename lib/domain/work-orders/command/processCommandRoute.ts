import "server-only";

import { randomUUID } from "crypto";
import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { createProductionProcess, deleteProductionProcess, transitionProductionProcessOrder, updateProductionProcess } from "@/lib/domain/work-orders/command/processCommandService";
import { validateDeleteProductionProcessCommand, validateProductionProcessCommand, type ProductionOrderTransitionKind } from "@/lib/domain/work-orders/command/processValidation";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

async function execute(request:Request, workOrderId:string, processId:string|null, operation:"create"|"update"|"delete") {
  const correlationId=randomUUID() as CorrelationId;
  const guard=await requireWorkspaceApiGuard({permissionCode:"workorder.update"});
  if(!guard.ok)return createCommandErrorResponse({...mapCommandGuardFailureStatus(guard.response.status),correlationId});
  try {
    const body=await readBoundedCommandJson(request);
    const common={workOrderId,scope:guard.scope,companyMemberId:guard.session.companyMemberId,correlationId};
    const result=operation==="create"
      ? await createProductionProcess({...common,command:validateProductionProcessCommand(body,request.headers.get("Idempotency-Key"))})
      : operation==="update"
        ? await updateProductionProcess({...common,processId:processId!,command:validateProductionProcessCommand(body,request.headers.get("Idempotency-Key"))})
        : await deleteProductionProcess({...common,processId:processId!,command:validateDeleteProductionProcessCommand(body,request.headers.get("Idempotency-Key"))});
    return createWaflApiSuccess(result.data,{headers:{"Cache-Control":"no-store","X-WAFL-Correlation-Id":correlationId,"X-WAFL-Command-Statement-Count":String(result.statementCount),"X-WAFL-Command-DB-Ms":String(result.dbMs)}});
  } catch(error) {
    if(error instanceof WorkOrderCommandValidationError)return createCommandErrorResponse({code:"VALIDATION_ERROR",message:error.message,status:400,fieldErrors:error.fieldErrors,correlationId});
    if(error instanceof WorkOrderCommandRequestError)return createCommandErrorResponse({code:error.code,message:error.message,status:error.status,entityVersion:error.entityVersion,correlationId});
    console.error("[WORK_ORDER_V2_PRODUCTION_COMMAND_FAILED]",{correlationId,operation,errorName:error instanceof Error?error.name:"UnknownError"});
    return createCommandErrorResponse({code:"INTERNAL_ERROR",message:"제작 정보 변경을 처리하지 못했습니다.",status:500,retryable:true,correlationId});
  }
}

export function handleCreateProcessV2(request:Request,workOrderId:string){return execute(request,workOrderId,null,"create");}
export function handlePatchProcessV2(request:Request,workOrderId:string,processId:string){return execute(request,workOrderId,processId,"update");}
export function handleDeleteProcessV2(request:Request,workOrderId:string,processId:string){return execute(request,workOrderId,processId,"delete");}

export async function handleProductionProcessOrderV2(request:Request,workOrderId:string,processId:string,kind:ProductionOrderTransitionKind) {
  const correlationId=randomUUID() as CorrelationId;
  const guard=await requireWorkspaceApiGuard({permissionCode:"workorder.update"});
  if(!guard.ok)return createCommandErrorResponse({...mapCommandGuardFailureStatus(guard.response.status),correlationId});
  try {
    const body=await readBoundedCommandJson(request);
    const command=validateDeleteProductionProcessCommand(body,request.headers.get("Idempotency-Key"));
    const result=await transitionProductionProcessOrder({workOrderId,processId,kind,command,scope:guard.scope,companyMemberId:guard.session.companyMemberId,correlationId});
    return createWaflApiSuccess(result.data,{headers:{"Cache-Control":"no-store","X-WAFL-Correlation-Id":correlationId,"X-WAFL-Command-Statement-Count":String(result.statementCount),"X-WAFL-Command-DB-Ms":String(result.dbMs)}});
  } catch(error) {
    if(error instanceof WorkOrderCommandValidationError)return createCommandErrorResponse({code:"VALIDATION_ERROR",message:error.message,status:400,fieldErrors:error.fieldErrors,correlationId});
    if(error instanceof WorkOrderCommandRequestError)return createCommandErrorResponse({code:error.code,message:error.message,status:error.status,entityVersion:error.entityVersion,correlationId});
    console.error("[WORK_ORDER_V2_PRODUCTION_ORDER_COMMAND_FAILED]",{correlationId,kind,errorName:error instanceof Error?error.name:"UnknownError"});
    return createCommandErrorResponse({code:"INTERNAL_ERROR",message:"제작 공장 발주 상태를 변경하지 못했습니다.",status:500,retryable:true,correlationId});
  }
}
