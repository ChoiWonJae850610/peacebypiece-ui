import { randomUUID } from "crypto";
import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { getWorkOrderV2MeasurementMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import { CompanyMeasurementTemplateError, patchCompanyMeasurementTemplate } from "@/lib/domain/work-orders/measurement/companyTemplateRepository";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";

type Context={params:Promise<{templateId:string}>};
export async function PATCH(request:Request,context:Context){const correlationId=randomUUID() as CorrelationId;if(!getWorkOrderV2MeasurementMutationRuntimeGuard().ok)return Response.json({ok:false,error:{code:"FORBIDDEN",correlationId}},{status:403});const guard=await requireWorkspaceApiGuard({permissionCode:"workorder.update"});if(!guard.ok)return guard.response;try{const body=await request.json() as Record<string,unknown>;const data=await patchCompanyMeasurementTemplate({scope:{mode:"tenant_member",companyId:guard.scope.companyId as never,companyMemberId:guard.session.companyMemberId as never,permissionCodes:["workorder.update"],correlationId},id:(await context.params).templateId,name:body.name,isActive:body.isActive});return createWaflApiSuccess({template:data},{headers:{"Cache-Control":"no-store","X-WAFL-Correlation-Id":correlationId}});}catch(error){const status=error instanceof CompanyMeasurementTemplateError&&error.reason==="not_found"?404:400;return Response.json({ok:false,error:{code:error instanceof CompanyMeasurementTemplateError?error.reason.toUpperCase():"VALIDATION_ERROR",correlationId}},{status});}}
