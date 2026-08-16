import "server-only";

import { createHash } from "crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { executeMeasurementCommandV2, MeasurementCommandRepositoryError, type MeasurementCommandKind } from "@/lib/domain/work-orders/measurement/measurementCommandRepository";
import type { CorrelationId, EntityVersion } from "@/lib/domain/work-orders/contracts";

function sha(value: string) { return createHash("sha256").update(value).digest("hex"); }
function uuid(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new WorkOrderCommandRequestError({ code:"NOT_FOUND",status:404,message:"Work order not found." }); }
function map(error: MeasurementCommandRepositoryError): never {
 const status=error.reason==="not_found"?404:error.reason==="locked"?409:error.reason==="validation"?400:409;
 const message=error.reason==="not_found"?"작업지시서 또는 완성 스펙 대상을 찾을 수 없습니다.":error.reason==="locked"?"수정 가능한 초안에서만 완성 스펙을 변경할 수 있습니다.":error.reason==="validation"?"완성 스펙 변경 내용을 확인해 주세요.":"최신 작업지시서 상태를 다시 확인해 주세요.";
 throw new WorkOrderCommandRequestError({code:error.reason==="not_found"?"NOT_FOUND":error.reason==="validation"?"VALIDATION_ERROR":error.reason==="locked"?"LOCKED":"CONFLICT",status,message});
}

export async function runMeasurementCommand(input: { readonly workOrderId:string; readonly kind:MeasurementCommandKind; readonly body:Record<string,unknown>; readonly idempotencyKey:string|null; readonly scope:WorkspaceApiCompanyScope; readonly companyMemberId:string|null; readonly correlationId:CorrelationId; }) {
  uuid(input.workOrderId); const expectedVersion=input.body.expectedVersion; const clientRequestId=input.body.clientRequestId;
  if(!Number.isSafeInteger(expectedVersion)||Number(expectedVersion)<1||typeof clientRequestId!=="string"||!clientRequestId.trim()||!input.idempotencyKey?.trim()) throw new WorkOrderCommandRequestError({code:"VALIDATION_ERROR",status:400,message:"expectedVersion, clientRequestId, and Idempotency-Key are required."});
  const tenant=createCommandTenantScope({scope:input.scope,companyMemberId:input.companyMemberId,correlationId:input.correlationId,permissionCode:"workorder.update"}); const hash=sha([input.kind,tenant.companyId,tenant.companyMemberId,input.idempotencyKey].join("\0"));
  try { return await executeMeasurementCommandV2({scope:tenant,assignedCompanyMemberId:input.scope.visibility?.mode==="assigned"?input.scope.visibility.companyMemberId as never:null,workOrderId:input.workOrderId as never,expectedVersion:expectedVersion as EntityVersion,idempotencyKeyHash:hash,requestHash:sha(JSON.stringify({workOrderId:input.workOrderId,kind:input.kind,body:input.body})),clientRequestId:clientRequestId.trim(),kind:input.kind,payload:input.body}); } catch(error) { if(error instanceof MeasurementCommandRepositoryError) map(error); throw error; }
}
