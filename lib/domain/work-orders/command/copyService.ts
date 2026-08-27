import "server-only";

import { createHash } from "crypto";
import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { CopyCommandRepositoryError, createWorkOrderCopyV2, readCompletedWorkOrderCopyReplay, WORK_ORDER_COPY_CREATE_COMMAND_CODE } from "@/lib/domain/work-orders/command/copyCommandRepository";
import { cleanupReorderAssetCopy, createReorderDeterministicId, prepareReorderAssetCopy } from "@/lib/domain/work-orders/command/reorderAssetCopy";
import { getWorkOrderV2ReorderMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import type { CorrelationId, EntityVersion, WorkOrderId, WorkOrderRevisionId } from "@/lib/domain/work-orders/contracts";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
function map(error: CopyCommandRepositoryError): never { if(error.reason==="not_found")throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"복사할 작업지시서를 찾을 수 없습니다."}); if(error.reason==="idempotency_conflict")throw new WorkOrderCommandRequestError({code:"CONFLICT",status:409,message:"같은 복사 요청 ID가 다른 요청에 사용되었습니다."}); throw new WorkOrderCommandRequestError({code:"CONFLICT",status:409,message:"복사 상태를 확인하고 다시 시도해 주세요.",retryable:true}); }
export async function createWorkOrderCopy(input:{readonly sourceWorkOrderId:string;readonly clientRequestId:string;readonly idempotencyKey:string;readonly scope:WorkspaceApiCompanyScope;readonly companyMemberId:string|null;readonly correlationId:CorrelationId}){
  if(!/^[0-9a-f-]{36}$/i.test(input.sourceWorkOrderId))throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"복사할 작업지시서를 찾을 수 없습니다."});
  if(!input.clientRequestId.trim()||!input.idempotencyKey.trim())throw new WorkOrderCommandRequestError({code:"VALIDATION_ERROR",status:400,message:"복사 요청 정보를 확인해 주세요."});
  if(!getWorkOrderV2ReorderMutationRuntimeGuard().ok)throw new WorkOrderCommandRequestError({code:"FORBIDDEN",status:403,message:"복사는 승인된 dev/test runtime에서만 실행할 수 있습니다."});
  const scope=createCommandTenantScope({scope:input.scope,companyMemberId:input.companyMemberId,correlationId:input.correlationId,permissionCode:"workorder.create"});
  const keyHash=sha([WORK_ORDER_COPY_CREATE_COMMAND_CODE,scope.companyId,scope.companyMemberId,input.idempotencyKey].join("\0"));const requestHash=sha(JSON.stringify({sourceWorkOrderId:input.sourceWorkOrderId}));
  try{const replay=await readCompletedWorkOrderCopyReplay({scope,keyHash,requestHash});if(replay)return{data:{result:replay,nextVersion:1 as EntityVersion},idempotentReplay:true};}catch(error){if(error instanceof CopyCommandRepositoryError)map(error);throw error;}
  const targetWorkOrderId=createReorderDeterministicId(keyHash,"copy-work-order") as WorkOrderId;const targetRevisionId=createReorderDeterministicId(keyHash,"copy-revision") as WorkOrderRevisionId;const targetSizeSpecId=createReorderDeterministicId(keyHash,"copy-size-spec");
  const copied=await prepareReorderAssetCopy({scope,sourceWorkOrderId:input.sourceWorkOrderId as WorkOrderId,targetWorkOrderId,idempotencySeed:keyHash,includeAllAttachments:true});
  try{const result=await createWorkOrderCopyV2({scope,sourceWorkOrderId:input.sourceWorkOrderId as WorkOrderId,targetWorkOrderId,targetRevisionId,targetSizeSpecId,keyHash,requestHash,clientRequestId:input.clientRequestId,assets:copied.plan});return{data:{result:result.result,nextVersion:result.nextVersion},idempotentReplay:result.idempotentReplay};}catch(error){await cleanupReorderAssetCopy(copied.copiedKeys);if(error instanceof CopyCommandRepositoryError)map(error);throw error;}
}
