import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyMemberId, CorrelationId, EntityVersion, ProcessId, ProcessPatch, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { createCommandTenantScope, requireCommandMutationApproval, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { patchProcessV2, ProcessCommandRepositoryError } from "@/lib/domain/work-orders/command/processCommandRepository";
import { WAFL_V2_ALPHA30_MUTATION_APPROVAL } from "@/lib/domain/work-orders/command/runtimeGuard";

const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function patchProcess(input:{readonly workOrderId:string;readonly processId:string;readonly command:{readonly clientRequestId:string;readonly expectedVersion:EntityVersion;readonly patch:ProcessPatch};readonly scope:WorkspaceApiCompanyScope;readonly companyMemberId:string|null;readonly correlationId:CorrelationId}) {
  if(!uuid(input.workOrderId)||!uuid(input.processId)) throw new WorkOrderCommandRequestError({code:"NOT_FOUND",status:404,message:"공정을 찾을 수 없습니다."});
  const scope=createCommandTenantScope({scope:input.scope,companyMemberId:input.companyMemberId,correlationId:input.correlationId,permissionCode:"workorder.update"});
  requireCommandMutationApproval(WAFL_V2_ALPHA30_MUTATION_APPROVAL);
  try{return await patchProcessV2({scope,assignedCompanyMemberId:input.scope.visibility?.mode==="assigned"?input.scope.visibility.companyMemberId as CompanyMemberId:null,workOrderId:input.workOrderId as WorkOrderId,processId:input.processId as ProcessId,...input.command});}
  catch(error){if(error instanceof ProcessCommandRepositoryError){const code=error.reason==="not_found"?"NOT_FOUND":error.reason==="locked"?"LOCKED":error.reason==="revision_mismatch"?"REVISION_MISMATCH":"CONFLICT";throw new WorkOrderCommandRequestError({code,status:code==="NOT_FOUND"?404:409,message:code==="NOT_FOUND"?"공정을 찾을 수 없습니다.":"현재 공정 정보를 수정할 수 없습니다.",entityVersion:error.entityVersion===null?undefined:error.entityVersion as EntityVersion});}throw error;}
}
