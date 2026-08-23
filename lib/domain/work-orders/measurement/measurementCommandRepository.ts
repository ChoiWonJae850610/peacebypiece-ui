import "server-only";

import { createHash } from "crypto";
import { performance } from "perf_hooks";

import { withWaflV2TenantWriteTransaction, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { WORK_ORDER_COMMAND_CODES, type WorkOrderCommandCode } from "@/lib/domain/work-orders/command/workOrderCommandCodes";
import { parseMeasurementToCm } from "@/lib/domain/work-orders/measurement/measurementPolicy";
import type { CompanyMemberId, EntityVersion, TenantMemberScope, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { decodeWorkOrderMajorCategoryCode } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";
import { findWaflSystemSpecItem } from "@/lib/domain/work-orders/catalog/systemSpecItemCatalog";
import { findWaflBasicSpecTemplateById } from "@/lib/domain/work-orders/measurement/waflBasicSpecV1";

type Target = DbQueryResultRow & { work_order_id: string; revision_id: string; revision_no: number | string; work_order_version: number | string; work_order_status: string; revision_status: string; product_type_code: string | null; item_code: string | null };
type Receipt = DbQueryResultRow & { request_sha256: string; result_entity_version: number | string | null; result_revision_id: string | null; work_order_id: string | null };
type Context = { statements: number };
export type MeasurementCommandKind = "apply-template" | "set-unit" | "set-cell" | "add-pom" | "rename-pom" | "remove-pom" | "reorder-poms" | "set-pom-selection" | "save-company-template" | "update-company-template";
export type MeasurementCommandInput = {
  readonly scope: TenantMemberScope; readonly assignedCompanyMemberId: CompanyMemberId | null; readonly workOrderId: WorkOrderId;
  readonly expectedVersion: EntityVersion; readonly idempotencyKeyHash: string; readonly requestHash: string; readonly clientRequestId: string;
  readonly kind: MeasurementCommandKind; readonly payload: Record<string, unknown>;
};
export type MeasurementCommandResult = { readonly workOrderId: WorkOrderId; readonly revisionId: string; readonly nextVersion: EntityVersion; readonly idempotentReplay: boolean; readonly changedFields: readonly string[]; readonly statementCount: number; readonly transactionCount: 1; readonly dbMs: number };

export class MeasurementCommandRepositoryError extends Error { constructor(readonly reason: "not_found" | "conflict" | "locked" | "validation" | "idempotency_conflict" | "idempotency_incomplete") { super(reason); } }
const commandFor: Record<MeasurementCommandKind, WorkOrderCommandCode> = {
  "apply-template": WORK_ORDER_COMMAND_CODES.measurement.applyTemplate, "set-unit": WORK_ORDER_COMMAND_CODES.measurement.patchUnit, "set-cell": WORK_ORDER_COMMAND_CODES.measurement.patchCell,
  "add-pom": WORK_ORDER_COMMAND_CODES.measurement.pomCreate, "rename-pom": WORK_ORDER_COMMAND_CODES.measurement.pomPatch, "remove-pom": WORK_ORDER_COMMAND_CODES.measurement.pomDelete, "reorder-poms": WORK_ORDER_COMMAND_CODES.measurement.pomReorder,
  "set-pom-selection": WORK_ORDER_COMMAND_CODES.measurement.pomSelectionBatch,
  "save-company-template": WORK_ORDER_COMMAND_CODES.measurement.saveCompanyTemplate,
  "update-company-template": WORK_ORDER_COMMAND_CODES.measurement.updateCompanyTemplate,
};
function n(value: unknown, max = 120) { const text = typeof value === "string" ? value.normalize("NFKC").trim() : ""; if (!text || text.length > max) throw new MeasurementCommandRepositoryError("validation"); return text; }
function uuid(value: unknown) { const text = typeof value === "string" ? value : ""; if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) throw new MeasurementCommandRepositoryError("validation"); return text; }
function id(value: string) { const hash = createHash("sha256").update(value).digest("hex").split(""); hash[12] = "5"; hash[16] = ["8", "9", "a", "b"][Number.parseInt(hash[16], 16) % 4]; return `${hash.slice(0,8).join("")}-${hash.slice(8,12).join("")}-${hash.slice(12,16).join("")}-${hash.slice(16,20).join("")}-${hash.slice(20,32).join("")}`; }
async function q<T extends DbQueryResultRow>(client: DbTransactionClient, context: Context, sql: string, values: readonly unknown[] = []) { context.statements += 1; return client.query<T>(sql, [...values]); }
async function target(client: DbTransactionClient, context: Context, input: MeasurementCommandInput) {
  const row = (await q<Target>(client, context, `SELECT w.id work_order_id,r.id revision_id,r.revision_no,w.entity_version work_order_version,w.status work_order_status,r.revision_status,r.product_type_code_snapshot product_type_code,r.item_code_snapshot item_code FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL AND ($3::text IS NULL OR w.assignee_member_id=$3) FOR UPDATE OF w,r`, [input.scope.companyId,input.workOrderId,input.assignedCompanyMemberId])).rows[0];
  if (!row) throw new MeasurementCommandRepositoryError("not_found");
  if (Number(row.work_order_version) !== input.expectedVersion) throw new MeasurementCommandRepositoryError("conflict");
  if (row.work_order_status !== "draft" || row.revision_status !== "draft") throw new MeasurementCommandRepositoryError("locked"); return row;
}
async function receipt(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, code: string) {
 const row=(await q<Receipt>(client,context,`SELECT request_sha256,result_entity_version,result_revision_id,work_order_id FROM work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`,[input.scope.companyId,code,input.idempotencyKeyHash])).rows[0];
 if (!row) return null; if(row.request_sha256!==input.requestHash) throw new MeasurementCommandRepositoryError("idempotency_conflict"); if(row.result_entity_version===null||!row.result_revision_id||!row.work_order_id) throw new MeasurementCommandRepositoryError("idempotency_incomplete"); return row;
}
async function reserve(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, code: string) { const result=await q(client,context,`INSERT INTO work_order_command_receipts(company_id,command_code,idempotency_key,request_sha256,correlation_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(company_id,command_code,idempotency_key) DO NOTHING RETURNING command_code`,[input.scope.companyId,code,input.idempotencyKeyHash,input.requestHash,input.scope.correlationId]); if(!result.rows[0]) throw new MeasurementCommandRepositoryError("idempotency_incomplete"); }
async function versionEventReceipt(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, row: Target, code: string, fields: readonly string[]) {
 const updated=(await q<DbQueryResultRow & { entity_version:number|string }>(client,context,`WITH w AS (UPDATE work_orders SET entity_version=entity_version+1,updated_at=now() WHERE company_id=$1 AND id=$2::uuid AND entity_version=$3 AND status='draft' RETURNING entity_version),r AS (UPDATE work_order_revisions SET entity_version=entity_version+1,updated_at=now() WHERE company_id=$1 AND id=$4::uuid AND revision_status='draft' RETURNING id) SELECT entity_version FROM w WHERE EXISTS(SELECT 1 FROM r)`,[input.scope.companyId,row.work_order_id,input.expectedVersion,row.revision_id])).rows[0]; if(!updated) throw new MeasurementCommandRepositoryError("conflict"); const next=Number(updated.entity_version);
 await q(client,context,`INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version) VALUES($1,'work_order',$2,$3,$4,$5,$6,$7::jsonb,1)`,[input.scope.companyId,row.work_order_id,code,input.scope.companyMemberId,input.scope.correlationId,"measurement snapshot updated",JSON.stringify({revisionId:row.revision_id,revisionNumber:Number(row.revision_no),clientRequestId:input.clientRequestId,changedFields:fields,versionTransition:{from:input.expectedVersion,to:next}})]);
 await q(client,context,`UPDATE work_order_command_receipts SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_entity_version=$6 WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`,[input.scope.companyId,code,input.idempotencyKeyHash,row.work_order_id,row.revision_id,next]); return next;
}
async function spec(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, revisionId: string) { return (await q<DbQueryResultRow & { id:string; measurement_unit:string }>(client,context,`SELECT id,measurement_unit FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid FOR UPDATE`,[input.scope.companyId,revisionId])).rows[0] ?? null; }
async function bootstrapSpec(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, revisionId: string) {
 const snapshotId=id(`alpha62-spec:${revisionId}`);
 await q(client,context,`INSERT INTO work_order_size_specs(id,company_id,revision_id,measurement_unit) VALUES($1::uuid,$2,$3::uuid,'cm')`,[snapshotId,input.scope.companyId,revisionId]);
 await q(client,context,`INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order) SELECT s.id,$1,$2::uuid,$3::uuid,s.size_code,s.display_label,s.display_order FROM work_order_sizes s WHERE s.company_id=$1 AND s.revision_id=$2::uuid ORDER BY s.display_order,s.id`,[input.scope.companyId,revisionId,snapshotId]);
 return {id:snapshotId,measurement_unit:"cm"};
}
async function apply(client: DbTransactionClient, context: Context, input: MeasurementCommandInput, row: Target) {
 let existing=await spec(client,context,input,row.revision_id); const kind=input.kind;
 if (kind === "apply-template") {
  const templateId = uuid(input.payload.templateId);
  const basicTemplate = findWaflBasicSpecTemplateById(templateId, row.item_code);
  const persistedTemplate = basicTemplate ? null : (await q<DbQueryResultRow & { id: string; template_version: number | string }>(
    client,
    context,
    `SELECT id,template_version FROM size_spec_templates WHERE id=$1::uuid AND is_active AND (company_id IS NULL OR company_id=$2)`,
    [templateId, input.scope.companyId],
  )).rows[0];
  if (!basicTemplate && !persistedTemplate) throw new MeasurementCommandRepositoryError("not_found");
  const templateVersion = basicTemplate?.templateVersion ?? Number(persistedTemplate!.template_version);
  const snapshotId = existing?.id ?? id(`alpha62-spec:${row.revision_id}`);
  if (existing) {
    await q(client, context, `DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid`, [input.scope.companyId, snapshotId]);
    await q(client, context, `DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$2::uuid`, [input.scope.companyId, snapshotId]);
    await q(client, context, `DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid`, [input.scope.companyId, snapshotId]);
  } else {
    await q(client, context, `INSERT INTO work_order_size_specs(id,company_id,revision_id,category_code,measurement_unit,source_template_id,source_template_version) VALUES($1::uuid,$2,$3::uuid,$4,'cm',$5,$6)`, [snapshotId, input.scope.companyId, row.revision_id, basicTemplate?.categoryCode ?? null, templateId, templateVersion]);
  }
  await q(client, context, `UPDATE work_order_size_specs SET category_code=COALESCE($3,category_code),measurement_unit='cm',source_template_id=$4,source_template_version=$5,updated_at=now() WHERE company_id=$1 AND id=$2::uuid`, [input.scope.companyId, snapshotId, basicTemplate?.categoryCode ?? null, templateId, templateVersion]);
  await q(client, context, `INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order) SELECT s.id,$1,$2::uuid,$3::uuid,s.size_code,s.display_label,s.display_order FROM work_order_sizes s WHERE s.company_id=$1 AND s.revision_id=$2::uuid ORDER BY s.display_order,s.id`, [input.scope.companyId, row.revision_id, snapshotId]);
  if (basicTemplate) {
    const pomRows = basicTemplate.poms.map((pom) => ({ code: pom.code, name: pom.name, display_order: pom.displayOrder }));
    const valueRows = Object.entries(basicTemplate.valuesCm).flatMap(([sizeCode, values]) => Object.entries(values).map(([name, value]) => ({
      size_code: sizeCode,
      pom_code: basicTemplate.poms.find((pom) => pom.name === name)?.code ?? "",
      decimal_value: value,
    }))).filter((value) => value.pom_code);
    await q(client, context, `INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order) SELECT gen_random_uuid(),$1,$2::uuid,$3::uuid,x.code,x.name,'length',NULL,x.display_order FROM jsonb_to_recordset($4::jsonb) AS x(code text,name text,display_order integer) ORDER BY x.display_order`, [input.scope.companyId, row.revision_id, snapshotId, JSON.stringify(pomRows)]);
    await q(client, context, `INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value,display_fraction) SELECT $1,$2::uuid,$3::uuid,s.id,p.id,x.decimal_value,NULL FROM jsonb_to_recordset($4::jsonb) AS x(size_code text,pom_code text,decimal_value numeric) JOIN work_order_size_spec_sizes s ON s.company_id=$1 AND s.size_spec_id=$3::uuid AND upper(regexp_replace(trim(s.size_code),'\\s+','','g'))=upper(regexp_replace(trim(x.size_code),'\\s+','','g')) JOIN work_order_size_spec_poms p ON p.company_id=$1 AND p.size_spec_id=$3::uuid AND p.pom_code=x.pom_code`, [input.scope.companyId, row.revision_id, snapshotId, JSON.stringify(valueRows)]);
  } else {
    await q(client, context, `INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order) SELECT gen_random_uuid(),$1,$2::uuid,$3::uuid,pom_code,display_name,measurement_type,instruction,display_order FROM size_spec_template_poms WHERE template_id=$4::uuid ORDER BY display_order,id`, [input.scope.companyId, row.revision_id, snapshotId, templateId]);
    await q(client, context, `INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value,display_fraction) SELECT $1,$2::uuid,$3::uuid,s.id,p.id,v.decimal_value,v.display_fraction FROM size_spec_template_values v JOIN size_spec_template_sizes ts ON ts.id=v.size_row_id JOIN size_spec_template_poms tp ON tp.id=v.pom_column_id JOIN work_order_size_spec_sizes s ON s.company_id=$1 AND s.size_spec_id=$3::uuid AND upper(regexp_replace(trim(s.size_code),'\\s+','','g'))=upper(regexp_replace(trim(ts.size_code),'\\s+','','g')) JOIN work_order_size_spec_poms p ON p.company_id=$1 AND p.size_spec_id=$3::uuid AND p.pom_code=tp.pom_code WHERE v.template_id=$4::uuid`, [input.scope.companyId, row.revision_id, snapshotId, templateId]);
  }
  return ["template"] as const;
 }
 if(!existing && (kind==="set-unit"||kind==="set-pom-selection")) existing=await bootstrapSpec(client,context,input,row.revision_id);
 if(!existing) throw new MeasurementCommandRepositoryError("not_found");
 if(kind==="set-unit"){ const unit=input.payload.measurementUnit; if(unit!=="cm"&&unit!=="inch") throw new MeasurementCommandRepositoryError("validation"); await q(client,context,`UPDATE work_order_size_specs SET measurement_unit=$3,updated_at=now() WHERE company_id=$1 AND id=$2::uuid`,[input.scope.companyId,existing.id,unit]); return ["measurementUnit"] as const; }
 if(kind==="set-cell"){const workOrderSizeId=uuid(input.payload.sizeRowId),pomId=uuid(input.payload.pomColumnId),unit=input.payload.measurementUnit,text=input.payload.displayValue; if((unit!=="cm"&&unit!=="inch")||(text!==null&&typeof text!=="string"))throw new MeasurementCommandRepositoryError("validation"); const parsed=text===null?null:parseMeasurementToCm(text,unit); if(text!==null&&!parsed)throw new MeasurementCommandRepositoryError("validation"); await q(client,context,`INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value,display_fraction,updated_at) SELECT $1,$2::uuid,$3::uuid,spec_size.id,p.id,$4,$5,now() FROM work_order_sizes work_size JOIN work_order_size_spec_sizes spec_size ON spec_size.company_id=work_size.company_id AND spec_size.revision_id=work_size.revision_id AND spec_size.size_spec_id=$3::uuid AND upper(regexp_replace(trim(spec_size.size_code),'\\s+','','g'))=upper(regexp_replace(trim(work_size.size_code),'\\s+','','g')) JOIN work_order_size_spec_poms p ON p.company_id=spec_size.company_id AND p.size_spec_id=$3::uuid WHERE work_size.company_id=$1 AND work_size.revision_id=$2::uuid AND work_size.id=$6::uuid AND p.id=$7::uuid ON CONFLICT(size_spec_id,size_row_id,pom_column_id) DO UPDATE SET decimal_value=EXCLUDED.decimal_value,display_fraction=EXCLUDED.display_fraction,updated_at=now()`,[input.scope.companyId,row.revision_id,existing.id,parsed?.centimeters??null,parsed?.displayFraction??null,workOrderSizeId,pomId]);return ["cell"] as const;}
  if(kind==="set-pom-selection") {
    const categoryCode = decodeWorkOrderMajorCategoryCode(row.product_type_code);
    const rawItems = input.payload.selectedItems;
   if (!Array.isArray(rawItems) || rawItems.length > 80) throw new MeasurementCommandRepositoryError("validation");
   const selectedItems = rawItems.map((value) => {
     if (!value || typeof value !== "object" || Array.isArray(value)) throw new MeasurementCommandRepositoryError("validation");
     const item = value as Record<string, unknown>;
      return {
        catalogOptionId: item.catalogOptionId == null ? null : uuid(item.catalogOptionId),
        systemSpecItemKey: item.systemSpecItemKey == null ? null : n(item.systemSpecItemKey, 96),
        currentPomId: item.currentPomId == null ? null : uuid(item.currentPomId),
        displayName: n(item.displayName, 80),
      };
   });
   const currentPomIds = selectedItems.flatMap((item) => item.currentPomId ? [item.currentPomId] : []);
    const catalogOptionIds = selectedItems.flatMap((item) => item.catalogOptionId ? [item.catalogOptionId] : []);
    const systemSpecItemKeys = selectedItems.flatMap((item) => item.systemSpecItemKey ? [item.systemSpecItemKey] : []);
    if (new Set(currentPomIds).size !== currentPomIds.length || new Set(catalogOptionIds).size !== catalogOptionIds.length || new Set(systemSpecItemKeys).size !== systemSpecItemKeys.length) throw new MeasurementCommandRepositoryError("validation");
    if (selectedItems.some((item) => !item.currentPomId && Number(Boolean(item.catalogOptionId)) + Number(Boolean(item.systemSpecItemKey)) !== 1)) throw new MeasurementCommandRepositoryError("validation");
   if (currentPomIds.length) {
     const owned = await q<DbQueryResultRow & { id: string }>(client, context, `SELECT id FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid AND id=ANY($3::uuid[])`, [input.scope.companyId, existing.id, currentPomIds]);
     if (owned.rows.length !== currentPomIds.length) throw new MeasurementCommandRepositoryError("not_found");
   }
   const catalogRows = catalogOptionIds.length
      ? await q<DbQueryResultRow & { id: string; display_name: string }>(client, context, `SELECT id,display_name FROM company_work_order_structure_options WHERE company_id=$1 AND option_kind='spec_item' AND is_active AND (category_code IS NULL OR category_code=$3) AND id=ANY($2::uuid[]) FOR SHARE`, [input.scope.companyId, catalogOptionIds, categoryCode])
      : { rows: [] };
   if (catalogRows.rows.length !== catalogOptionIds.length) throw new MeasurementCommandRepositoryError("not_found");
    const catalogNames = new Map(catalogRows.rows.map((item) => [item.id, item.display_name]));
    if (!categoryCode && systemSpecItemKeys.length > 0) throw new MeasurementCommandRepositoryError("validation");
    const systemItems = new Map(systemSpecItemKeys.map((key) => [key, categoryCode ? findWaflSystemSpecItem(categoryCode, key) : null]));
    if ([...systemItems.values()].some((item) => item === null)) throw new MeasurementCommandRepositoryError("not_found");
   await q(client, context, `DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid AND NOT (pom_column_id=ANY($3::uuid[]))`, [input.scope.companyId, existing.id, currentPomIds]);
   await q(client, context, `DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid AND NOT (id=ANY($3::uuid[]))`, [input.scope.companyId, existing.id, currentPomIds]);
   for (const [displayOrder, item] of selectedItems.entries()) {
     if (item.currentPomId) {
       await q(client, context, `UPDATE work_order_size_spec_poms SET display_order=$4,updated_at=now() WHERE company_id=$1 AND size_spec_id=$2::uuid AND id=$3::uuid`, [input.scope.companyId, existing.id, item.currentPomId, displayOrder]);
       continue;
     }
      if (item.catalogOptionId) {
        const displayName = catalogNames.get(item.catalogOptionId);
        if (!displayName) throw new MeasurementCommandRepositoryError("not_found");
        await q(client, context, `INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order) VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,'length',NULL,$7)`, [id(`alpha64:spec-item:${input.idempotencyKeyHash}:${item.catalogOptionId}`), input.scope.companyId, row.revision_id, existing.id, `company_spec_item:${item.catalogOptionId}`, displayName, displayOrder]);
        continue;
      }
      const systemItem = item.systemSpecItemKey ? systemItems.get(item.systemSpecItemKey) : null;
      if (!systemItem) throw new MeasurementCommandRepositoryError("not_found");
      await q(client, context, `INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order) VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,'length',NULL,$7)`, [id(`alpha64:system-spec-item:${input.idempotencyKeyHash}:${systemItem.key}`), input.scope.companyId, row.revision_id, existing.id, `wafl_system_spec_item:${systemItem.key}`, systemItem.displayName, displayOrder]);
   }
   return ["pomSelection"] as const;
 }
  if(kind==="save-company-template"||kind==="update-company-template"){const predecessorId=kind==="update-company-template"?uuid(input.payload.templateId):null;const predecessor=predecessorId?(await q<DbQueryResultRow & {name:string;gender_code:string|null;category_code:string|null;size_set_code:string|null;template_version:number|string}>(client,context,`SELECT name,gender_code,category_code,size_set_code,template_version FROM size_spec_templates WHERE id=$1::uuid AND company_id=$2 AND source_kind='company' AND is_active FOR UPDATE`,[predecessorId,input.scope.companyId])).rows[0]:null;if(predecessorId&&!predecessor)throw new MeasurementCommandRepositoryError("not_found");const templateName=predecessor?.name??n(input.payload.templateName),templateVersion=predecessor?Number(predecessor.template_version)+1:1;const templateId=id(`alpha62:company-template:${input.idempotencyKeyHash}`);const created=await q<DbQueryResultRow & { id:string }>(client,context,`INSERT INTO size_spec_templates(id,company_id,source_kind,name,gender_code,category_code,size_set_code,template_version,is_active,created_by_member_id) SELECT $1::uuid,$2,'company',$3,COALESCE($4,s.gender_code),COALESCE($5,s.category_code),$6,$7,true,$8 FROM work_order_size_specs s WHERE s.company_id=$2 AND s.id=$9::uuid RETURNING id`,[templateId,input.scope.companyId,templateName,predecessor?.gender_code??null,predecessor?.category_code??null,predecessor?.size_set_code??null,templateVersion,input.scope.companyMemberId,existing.id]);if(!created.rows[0])throw new MeasurementCommandRepositoryError("not_found");await q(client,context,`INSERT INTO size_spec_template_sizes(id,template_id,size_code,display_label,display_order) SELECT gen_random_uuid(),$1::uuid,size_code,display_label,display_order FROM work_order_size_spec_sizes WHERE company_id=$2 AND size_spec_id=$3::uuid`,[templateId,input.scope.companyId,existing.id]);await q(client,context,`INSERT INTO size_spec_template_poms(id,template_id,pom_code,display_name,measurement_type,instruction,display_order) SELECT gen_random_uuid(),$1::uuid,pom_code,display_name,measurement_type,instruction,display_order FROM work_order_size_spec_poms WHERE company_id=$2 AND size_spec_id=$3::uuid`,[templateId,input.scope.companyId,existing.id]);await q(client,context,`INSERT INTO size_spec_template_values(template_id,size_row_id,pom_column_id,decimal_value,display_fraction) SELECT $1::uuid,ts.id,tp.id,v.decimal_value,v.display_fraction FROM work_order_size_spec_values v JOIN work_order_size_spec_sizes s ON s.id=v.size_row_id JOIN work_order_size_spec_poms p ON p.id=v.pom_column_id JOIN size_spec_template_sizes ts ON ts.template_id=$1::uuid AND ts.size_code=s.size_code JOIN size_spec_template_poms tp ON tp.template_id=$1::uuid AND tp.pom_code=p.pom_code WHERE v.company_id=$2 AND v.size_spec_id=$3::uuid`,[templateId,input.scope.companyId,existing.id]);if(predecessorId)await q(client,context,`UPDATE size_spec_templates SET is_active=false,updated_at=now() WHERE id=$1::uuid AND company_id=$2 AND source_kind='company' AND is_active`,[predecessorId,input.scope.companyId]);return [kind==="update-company-template"?"companyTemplateVersion":"companyTemplate"] as const;}
 if(kind==="add-pom"){const name=n(input.payload.displayName),code=n(input.payload.pomCode??name,64),type=input.payload.measurementType; if(!["circumference","half_flat","quarter_pattern_reference","length"].includes(String(type)))throw new MeasurementCommandRepositoryError("validation");await q(client,context,`INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order) VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,$7,$8,(SELECT COALESCE(max(display_order),-1)+1 FROM work_order_size_spec_poms WHERE company_id=$2 AND size_spec_id=$4::uuid))`,[id(`alpha62:pom:${input.idempotencyKeyHash}`),input.scope.companyId,row.revision_id,existing.id,code,name,type,typeof input.payload.instruction==="string"?input.payload.instruction.trim()||null:null]);return ["pom"] as const;}
 const table="work_order_size_spec_poms"; if(kind==="rename-pom"){const rowId=uuid(input.payload.pomColumnId);await q(client,context,`UPDATE ${table} SET display_name=$4,updated_at=now() WHERE company_id=$1 AND size_spec_id=$2::uuid AND id=$3::uuid`,[input.scope.companyId,existing.id,rowId,n(input.payload.displayName)]);return ["pom"] as const;} if(kind==="remove-pom"){const rowId=uuid(input.payload.pomColumnId);await q(client,context,`DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid AND pom_column_id=$3::uuid`,[input.scope.companyId,existing.id,rowId]);await q(client,context,`DELETE FROM ${table} WHERE company_id=$1 AND size_spec_id=$2::uuid AND id=$3::uuid`,[input.scope.companyId,existing.id,rowId]);return ["pom"] as const;} const ids=Array.isArray(input.payload.orderedIds)?input.payload.orderedIds.map(uuid):[];if(!ids.length)throw new MeasurementCommandRepositoryError("validation");await q(client,context,`UPDATE ${table} item SET display_order=u.ordinality-1,updated_at=now() FROM unnest($3::uuid[]) WITH ORDINALITY u(id,ordinality) WHERE item.company_id=$1 AND item.size_spec_id=$2::uuid AND item.id=u.id`,[input.scope.companyId,existing.id,ids]); return ["pomOrder"] as const;
}
export async function executeMeasurementCommandV2(input: MeasurementCommandInput): Promise<MeasurementCommandResult> { const started=performance.now(); const context:Context={statements:0}; const code=commandFor[input.kind]; return withWaflV2TenantWriteTransaction(async client=>{await installTenantClaims(client,input.scope);const replay=await receipt(client,context,input,code);if(replay)return{workOrderId:input.workOrderId,revisionId:replay.result_revision_id!,nextVersion:Number(replay.result_entity_version) as EntityVersion,idempotentReplay:true,changedFields:[],statementCount:context.statements,transactionCount:1,dbMs:Math.round((performance.now()-started)*100)/100};const row=await target(client,context,input);await reserve(client,context,input,code);const fields=await apply(client,context,input,row);const next=await versionEventReceipt(client,context,input,row,code,fields);return{workOrderId:input.workOrderId,revisionId:row.revision_id,nextVersion:next as EntityVersion,idempotentReplay:false,changedFields:fields,statementCount:context.statements,transactionCount:1,dbMs:Math.round((performance.now()-started)*100)/100};}); }
