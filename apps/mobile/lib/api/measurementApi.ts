import type { MeasurementTemplateContent, MeasurementTemplateSummary } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { measurementCommandPath } from "@/domain/measurementCommandTransport";
import { requestJson } from "../apiTransport";
import { isNonEmptyString } from "./apiValidation";

export async function mutateWorkOrderMeasurement(
  workOrderId: string,
  command: import("@/domain/mobileContract").MeasurementCommandInput,
  idempotencyKey: string,
): Promise<import("@/domain/mobileContract").MeasurementCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: { readonly result?: import("@/domain/mobileContract").MeasurementCommandResult; readonly nextVersion?: number } }>(
    measurementCommandPath(workOrderId),
    { method: "POST", body: command, idempotencyKey },
  );
  const result = body.data?.result;
  if (!body.ok || !result || result.workOrderId !== workOrderId || !isNonEmptyString(result.revisionId)
    || !Number.isSafeInteger(result.nextVersion) || result.nextVersion < 1 || body.data?.nextVersion !== result.nextVersion
    || !Array.isArray(result.changedFields) || result.changedFields.some((field) => !isNonEmptyString(field))) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "Measurement command response is invalid." });
  }
  return result;
}

export async function getMeasurementTemplates(workOrderId:string,categoryCode:string|null,genderCode:string|null):Promise<readonly MeasurementTemplateSummary[]>{const query=new URLSearchParams();if(categoryCode)query.set("categoryCode",categoryCode);if(genderCode)query.set("genderCode",genderCode);const body=await requestJson<{readonly ok:boolean;readonly data?:{readonly items?:readonly MeasurementTemplateSummary[]}}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-spec/templates?${query.toString()}`,{method:"GET"});const items=body.data?.items;if(!body.ok||!Array.isArray(items))throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"Measurement template response is invalid."});return items;}
export async function getMeasurementTemplateContent(workOrderId:string,templateId:string,genderCode:string|null):Promise<MeasurementTemplateContent>{const query=new URLSearchParams({templateId});if(genderCode)query.set("genderCode",genderCode);const body=await requestJson<{readonly ok:boolean;readonly data?:{readonly content?:MeasurementTemplateContent}}>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-spec/templates?${query.toString()}`,{method:"GET"});const content=body.data?.content;if(!body.ok||!content||content.templateId!==templateId||!Array.isArray(content.sizes)||!Array.isArray(content.poms)||!Array.isArray(content.values))throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"Measurement template content response is invalid."});return content;}
export async function patchCompanyMeasurementTemplate(templateId:string,input:{readonly name?:string;readonly isActive?:boolean}){const body=await requestJson<{readonly ok:boolean;readonly data?:{readonly template?:MeasurementTemplateSummary}}>(`/api/v2/size-spec-templates/${encodeURIComponent(templateId)}`,{method:"PATCH",body:input});if(!body.ok||!body.data?.template)throw new MobileApiError({code:"MALFORMED_RESPONSE",message:"Company template response is invalid."});return body.data.template;}
