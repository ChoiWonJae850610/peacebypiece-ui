import "server-only";

import { performance } from "perf_hooks";

import type {
  CurrencyCode, DecimalString, DisplayDocumentNumber,
  EntityVersion, IsoDate, IsoDateTime, MaterialLineId, MaterialLineStatus, MaterialType,
  ProcessId, ProcessStatus, RevisionNumber, TenantMemberScope, WorkOrderId,
  WorkOrderIssuedPreviewReadModel, WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";

export const WORK_ORDER_V2_PREVIEW_QUERY_COUNT = 9;
const SECTION_ORDER = ["basic", "assets", "fabrics", "accessories", "sizeColor", "sizeSpec", "processes", "memo", "issue"] as const;

const TARGET = `w.company_id = $1 AND w.id = $2::uuid AND r.id = $3::uuid AND r.work_order_id = w.id AND r.company_id = w.company_id AND w.deleted_at IS NULL AND ($4::text IS NULL OR w.assignee_member_id = $4)`;

function text(value: unknown): string | null { return value === null || value === undefined ? null : String(value); }
function decimal(value: unknown): DecimalString { return String(value ?? "0") as DecimalString; }
function count(value: unknown): number { const n = Number(value ?? 0); if (!Number.isSafeInteger(n) || n < 0) throw new Error("PREVIEW_INVALID_COUNT"); return n; }
function date(value: unknown): IsoDate | null { return value == null ? null : String(value).slice(0, 10) as IsoDate; }
function dateTime(value: unknown): IsoDateTime { if (value == null) throw new Error("PREVIEW_ISSUE_TIME_REQUIRED"); return new Date(String(value)).toISOString() as IsoDateTime; }

export type PreviewRepositoryResult = { readonly data: WorkOrderIssuedPreviewReadModel | null; readonly reason?: "not_issued"; readonly queryCount: number; readonly queryMs: number; readonly transactionMs: number };

export async function getIssuedWorkOrderPreviewV2(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly assignedCompanyMemberId: string | null;
}): Promise<PreviewRepositoryResult> {
  const transactionStarted = performance.now();
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(`SELECT set_config('wafl.company_id',$1,true), set_config('wafl.company_member_id',$2,true), set_config('wafl.access_mode','tenant_member',true), set_config('wafl.correlation_id',$3,true)`, [input.scope.companyId, input.scope.companyMemberId, input.scope.correlationId]);
    const params = [input.scope.companyId, input.workOrderId, input.revisionId, input.assignedCompanyMemberId];
    const revisionParams = [input.scope.companyId, input.revisionId];
    const started = performance.now();
    const header = await client.query<DbQueryResultRow>(`SELECT w.id, w.status, w.document_number_base, r.id revision_id, r.revision_no, r.revision_status, r.product_name_snapshot, r.product_type_code_snapshot, r.season_code_snapshot, r.item_code_snapshot, r.due_date_snapshot, r.total_quantity_snapshot, r.unit_price, r.fabric_total, r.accessory_total, r.process_total, r.estimated_total, r.memo, r.factory_delivery_memo, r.finalized_at FROM work_orders w JOIN work_order_revisions r ON ${TARGET}`, params);
    const h = header.rows[0];
    if (!h) return { data: null, queryCount: WORK_ORDER_V2_PREVIEW_QUERY_COUNT, queryMs: Number((performance.now() - started).toFixed(2)), transactionMs: Number((performance.now() - transactionStarted).toFixed(2)) };
    if (!new Set(["issued", "revised", "completed"]).has(String(h.status)) || !new Set(["finalized", "superseded"]).has(String(h.revision_status))) {
      return { data: null, reason: "not_issued", queryCount: WORK_ORDER_V2_PREVIEW_QUERY_COUNT, queryMs: Number((performance.now() - started).toFixed(2)), transactionMs: Number((performance.now() - transactionStarted).toFixed(2)) };
    }
    if (!h.document_number_base) throw new Error("PREVIEW_DOCUMENT_NUMBER_REQUIRED");
    const materials = await client.query<DbQueryResultRow>(`SELECT m.id,m.material_type,m.material_id,m.name,m.color_option,m.usage_area,m.required_quantity,m.allowance_quantity,m.inventory_usage_quantity,m.order_quantity,m.unit_code,m.unit_price,m.amount,m.memo,m.status,m.display_order FROM work_order_material_lines m WHERE m.company_id=$1 AND m.revision_id=$2::uuid ORDER BY m.material_type,m.display_order,m.id`, revisionParams);
    const colors = await client.query<DbQueryResultRow>(`SELECT id,display_name,hex_value,display_order FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY display_order,id`, revisionParams);
    const sizes = await client.query<DbQueryResultRow>(`SELECT id,size_code,display_label,display_order FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY display_order,id`, revisionParams);
    const cells = await client.query<DbQueryResultRow>(`SELECT color_id,size_id,quantity FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY color_id,size_id`, revisionParams);
    const specs = await client.query<DbQueryResultRow>(`WITH s AS (SELECT id,gender_code,category_code,measurement_unit,source_template_id FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid), rows AS (SELECT 'meta' kind,id::text a,gender_code b,category_code c,measurement_unit d,source_template_id e,NULL::text f,NULL::text g,0 ord FROM s UNION ALL SELECT 'size',x.id::text,x.size_code,x.display_label,NULL,NULL,NULL,NULL,x.display_order FROM work_order_size_spec_sizes x WHERE x.company_id=$1 AND x.revision_id=$2::uuid UNION ALL SELECT 'pom',p.id::text,p.pom_code,p.display_name,NULL,NULL,NULL,NULL,p.display_order FROM work_order_size_spec_poms p WHERE p.company_id=$1 AND p.revision_id=$2::uuid UNION ALL SELECT 'cell',v.size_row_id::text,v.pom_column_id::text,v.decimal_value::text,v.display_fraction,NULL,NULL,NULL,0 FROM work_order_size_spec_values v WHERE v.company_id=$1 AND v.revision_id=$2::uuid) SELECT kind,a,b,c,d,e,f,g,ord FROM rows ORDER BY CASE kind WHEN 'meta' THEN 0 WHEN 'size' THEN 1 WHEN 'pom' THEN 2 ELSE 3 END,ord,a`, revisionParams);
    const processes = await client.query<DbQueryResultRow>(`SELECT id,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,quantity,due_date,unit_code,unit_price,amount,memo,application_area,application_color_target,status,display_order FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY display_order,id`, revisionParams);
    const assets = await client.query<DbQueryResultRow>(`SELECT 'image' asset_type,filename_snapshot filename,mime_type_snapshot mime_type,display_order,is_representative,false include_in_document FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$2::uuid UNION ALL SELECT 'attachment',filename_snapshot,mime_type_snapshot,display_order,false,output_include FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY display_order,asset_type,filename`, revisionParams);
    const materialRows = materials.rows.map((m) => ({ id: String(m.id) as MaterialLineId, materialId: text(m.material_id) as never, materialType: String(m.material_type) as MaterialType, name: String(m.name), colorOption: text(m.color_option), usageArea: text(m.usage_area), partnerId: null, partnerName: null, requiredQuantity: decimal(m.required_quantity), allowanceQuantity: decimal(m.allowance_quantity), inventoryUsageQuantity: decimal(m.inventory_usage_quantity), orderQuantity: decimal(m.order_quantity), unitCode: String(m.unit_code), currency: "KRW" as CurrencyCode, unitPrice: decimal(m.unit_price), amount: decimal(m.amount), memo: text(m.memo), status: String(m.status) as MaterialLineStatus, displayOrder: count(m.display_order), editable: false, locked: true }));
    const specMeta = specs.rows.find((r) => r.kind === "meta");
    const sizeSpecSizes = specs.rows.filter((r) => r.kind === "size").map((r) => ({ id: String(r.a) as never, code: String(r.b), displayLabel: String(r.c), displayOrder: count(r.ord) }));
    const poms = specs.rows.filter((r) => r.kind === "pom").map((r) => ({ id: String(r.a) as never, code: String(r.b), displayName: String(r.c), displayOrder: count(r.ord) }));
    const data: WorkOrderIssuedPreviewReadModel = {
      document: { title: "작업지시서", displayDocumentNumber: `${h.document_number_base}-R${h.revision_no}` as DisplayDocumentNumber, revisionNumber: count(h.revision_no) as RevisionNumber, issuedAt: dateTime(h.finalized_at) },
      header: { workOrderId: String(h.id) as WorkOrderId, revisionId: String(h.revision_id) as WorkOrderRevisionId, productName: String(h.product_name_snapshot), productTypeCode: text(h.product_type_code_snapshot), seasonCode: text(h.season_code_snapshot), itemCode: text(h.item_code_snapshot), dueDate: date(h.due_date_snapshot), totalQuantity: count(h.total_quantity_snapshot), memo: text(h.memo), factoryDeliveryMemo: text(h.factory_delivery_memo) },
      amounts: { currency: "KRW" as CurrencyCode, unitPrice: decimal(h.unit_price), fabricTotal: decimal(h.fabric_total), accessoryTotal: decimal(h.accessory_total), processTotal: decimal(h.process_total), estimatedTotal: decimal(h.estimated_total) },
      materials: { fabrics: materialRows.filter((m) => m.materialType === "fabric"), accessories: materialRows.filter((m) => m.materialType === "accessory") },
      sizeColors: { workOrderId: String(h.id) as WorkOrderId, revisionId: String(h.revision_id) as WorkOrderRevisionId, sizes: sizes.rows.map((r) => ({ id: String(r.id) as never, code: String(r.size_code), displayLabel: String(r.display_label), displayOrder: count(r.display_order) })), colors: colors.rows.map((r) => ({ id: String(r.id) as never, displayName: String(r.display_name), hexValue: text(r.hex_value), displayOrder: count(r.display_order) })), quantityCells: cells.rows.map((r) => ({ colorId: String(r.color_id) as never, sizeRowId: String(r.size_id) as never, quantity: decimal(r.quantity) })), matrixTotal: decimal(cells.rows.reduce((sum,r)=>sum+Number(r.quantity??0),0)), expectedTotal: decimal(h.total_quantity_snapshot), totalsMatch: cells.rows.length === 0 || cells.rows.reduce((sum,r)=>sum+Number(r.quantity??0),0) === count(h.total_quantity_snapshot), memoFallback: null, entityVersion: 1 as EntityVersion },
      sizeSpecifications: { workOrderId: String(h.id) as WorkOrderId, revisionId: String(h.revision_id) as WorkOrderRevisionId, genderCode: text(specMeta?.b), categoryCode: text(specMeta?.c), measurementUnit: (text(specMeta?.d) ?? "cm") as "cm"|"inch", templateId: text(specMeta?.e) as never, sizes: sizeSpecSizes, pomColumns: poms, cells: specs.rows.filter((r)=>r.kind === "cell").map((r)=>({ sizeRowId:String(r.a) as never,pomColumnId:String(r.b) as never,decimalValue:text(r.c) as DecimalString|null,displayValue:text(r.d) })), entityVersion: 1 as EntityVersion },
      processes: processes.rows.map((r)=>({ id:String(r.id) as ProcessId,processTypeCode:String(r.process_type_code),processName:String(r.process_name_snapshot),partnerId:text(r.partner_id) as never,partnerName:text(r.partner_name_snapshot),quantity:decimal(r.quantity),dueDate:date(r.due_date),unitCode:String(r.unit_code),currency:"KRW" as CurrencyCode,unitPrice:decimal(r.unit_price),amount:decimal(r.amount),memo:text(r.memo),applicationArea:text(r.application_area),applicationColorTarget:text(r.application_color_target),status:String(r.status) as ProcessStatus,displayOrder:count(r.display_order),editable:false,locked:true })),
      assets: assets.rows.map((r)=>({ assetType:String(r.asset_type) as "image"|"attachment",filename:String(r.filename),mimeType:String(r.mime_type),displayOrder:count(r.display_order),isRepresentative:Boolean(r.is_representative),includeInDocument:Boolean(r.include_in_document) })),
      issue: { workOrderStatus: String(h.status) as "issued"|"revised"|"completed", revisionStatus: String(h.revision_status) as "finalized"|"superseded" },
      layoutMetadata: { schemaVersion: 1, sectionOrder: SECTION_ORDER, businessTimezone: "Asia/Seoul" },
    };
    return { data, queryCount: WORK_ORDER_V2_PREVIEW_QUERY_COUNT, queryMs: Number((performance.now()-started).toFixed(2)), transactionMs: Number((performance.now()-transactionStarted).toFixed(2)) };
  });
}
