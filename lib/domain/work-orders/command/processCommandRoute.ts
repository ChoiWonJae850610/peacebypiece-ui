import "server-only";

import { randomUUID } from "crypto";
import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { patchProcess } from "@/lib/domain/work-orders/command/processCommandService";
import { validatePatchProcess } from "@/lib/domain/work-orders/command/processValidation";
import { getWorkOrderV2CommandRuntimeGuard, WAFL_V2_ALPHA30_MUTATION_APPROVAL } from "@/lib/domain/work-orders/command/runtimeGuard";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

export async function handlePatchProcessV2(request:Request,workOrderId:string,processId:string){const correlationId=randomUUID() as CorrelationId;const runtime=getWorkOrderV2CommandRuntimeGuard({requireMutationApproval:true,requiredMutationApproval:WAFL_V2_ALPHA30_MUTATION_APPROVAL});if(!runtime.ok)return createCommandErrorResponse({code:"FORBIDDEN",message:"승인된 dev/test runtime에서만 사용할 수 있습니다.",status:403,correlationId});const guard=await requireWorkspaceApiGuard({permissionCode:"workorder.update"});if(!guard.ok)return createCommandErrorResponse({...mapCommandGuardFailureStatus(guard.response.status),correlationId});try{const command=validatePatchProcess(await readBoundedCommandJson(request));const result=await patchProcess({workOrderId,processId,command,scope:guard.scope,companyMemberId:guard.session.companyMemberId,correlationId});return createWaflApiSuccess(result.data,{headers:{"Cache-Control":"no-store","X-WAFL-Correlation-Id":correlationId,"X-WAFL-Command-Statement-Count":String(result.statementCount),"X-WAFL-Command-DB-Ms":String(result.dbMs)}});}catch(error){if(error instanceof WorkOrderCommandValidationError)return createCommandErrorResponse({code:"VALIDATION_ERROR",message:error.message,status:400,fieldErrors:error.fieldErrors,correlationId});if(error instanceof WorkOrderCommandRequestError)return createCommandErrorResponse({code:error.code,message:error.message,status:error.status,entityVersion:error.entityVersion,correlationId});console.error("[WORK_ORDER_V2_PROCESS_PATCH_FAILED]",{correlationId,errorName:error instanceof Error?error.name:"UnknownError"});return createCommandErrorResponse({code:"INTERNAL_ERROR",message:"공정 변경을 처리하지 못했습니다.",status:500,retryable:true,correlationId});}}
