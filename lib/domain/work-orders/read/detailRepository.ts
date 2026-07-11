import "server-only";

import { performance } from "perf_hooks";

import {
  GENERATED_DOCUMENT_STATUSES,
  MATERIAL_LINE_STATUSES,
  PROCESS_STATUSES,
  WORK_ORDER_DOCUMENT_TYPES,
  WORK_ORDER_REVISION_STATUSES,
  WORK_ORDER_STATUSES,
  type AttachmentId,
  type ColorId,
  type ControlledFileUrl,
  type CurrencyCode,
  type DecimalString,
  type DisplayDocumentNumber,
  type EntityVersion,
  type GeneratedDocumentId,
  type GeneratedDocumentStatus,
  type ImageId,
  type IsoDate,
  type IsoDateTime,
  type MaterialId,
  type MaterialLineId,
  type MaterialLineStatus,
  type MaterialType,
  type OpaqueCursor,
  type PartnerId,
  type PomColumnId,
  type ProcessId,
  type ProcessStatus,
  type RevisionNumber,
  type SizeRowId,
  type SizeTemplateId,
  type TenantMemberScope,
  type WorkOrderAssetPage,
  type WorkOrderAssetReadModel,
  type WorkOrderDetailCoreReadModel,
  type WorkOrderDocumentPage,
  type WorkOrderDocumentType,
  type WorkOrderHistoryPage,
  type WorkOrderId,
  type WorkOrderMaterialLineReadModel,
  type WorkOrderMaterialPage,
  type WorkOrderProcessesReadModel,
  type WorkOrderRevisionId,
  type WorkOrderRevisionStatus,
  type WorkOrderSizeColorMatrixReadModel,
  type WorkOrderSizeSpecReadModel,
  type WorkOrderStatus,
} from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";

export const WORK_ORDER_V2_DETAIL_REPOSITORY_STATEMENT_COUNT = 2;

const TARGET_SQL = `
  SELECT w.id, w.current_revision_id, w.entity_version
  FROM work_orders w
  WHERE w.company_id = $1
    AND w.id = $2::uuid
    AND w.deleted_at IS NULL
    AND ($3::text IS NULL OR w.assignee_member_id = $3)
`;

export const WORK_ORDER_V2_DETAIL_CORE_SQL = `
  WITH target AS MATERIALIZED (
    SELECT w.id, w.product_name, w.product_type_code, w.season_code, w.item_code,
           w.status, w.due_date, w.total_quantity, w.document_number_base,
           w.current_revision_id, w.representative_image_id, w.entity_version, w.updated_at,
           r.revision_no, r.revision_status, r.finalized_at, r.unit_price,
           r.fabric_total, r.accessory_total, r.process_total, r.estimated_total
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.id = w.current_revision_id AND r.company_id = w.company_id
    WHERE w.company_id = $1
      AND w.id = $2::uuid
      AND w.deleted_at IS NULL
      AND ($3::text IS NULL OR w.assignee_member_id = $3)
  ), latest_document AS (
    SELECT d.id, d.status, d.display_document_number, d.generated_at,
           row_number() OVER (ORDER BY d.created_at DESC, d.id DESC) AS row_number
    FROM generated_documents d
    JOIN target t ON t.id = d.work_order_id
    WHERE d.company_id = $1 AND d.deleted_at IS NULL
  )
  SELECT t.id, t.product_name, t.product_type_code, t.season_code, t.item_code,
         t.status, t.due_date, t.total_quantity, t.document_number_base,
         t.current_revision_id, t.entity_version, t.updated_at, t.revision_no,
         t.revision_status, t.finalized_at, t.unit_price, t.fabric_total,
         t.accessory_total, t.process_total, t.estimated_total,
         i.id AS image_id, i.title AS image_title,
         (SELECT count(*)::integer FROM work_order_material_lines m
          WHERE m.company_id = $1 AND m.revision_id = t.current_revision_id AND m.material_type = 'fabric') AS fabric_count,
         (SELECT count(*)::integer FROM work_order_material_lines m
          WHERE m.company_id = $1 AND m.revision_id = t.current_revision_id AND m.material_type = 'accessory') AS accessory_count,
         (SELECT count(*)::integer FROM work_order_colors c
          WHERE c.company_id = $1 AND c.revision_id = t.current_revision_id) AS color_count,
         (SELECT count(*)::integer FROM work_order_sizes s
          WHERE s.company_id = $1 AND s.revision_id = t.current_revision_id) AS size_count,
         (SELECT count(*)::integer FROM work_order_processes p
          WHERE p.company_id = $1 AND p.revision_id = t.current_revision_id) AS process_count,
         (SELECT count(*)::integer FROM work_order_revision_images ri
          WHERE ri.company_id = $1 AND ri.revision_id = t.current_revision_id) AS image_count,
         (SELECT count(*)::integer FROM work_order_revision_attachments ra
          WHERE ra.company_id = $1 AND ra.revision_id = t.current_revision_id) AS attachment_count,
         (SELECT count(*)::integer FROM generated_documents d
          WHERE d.company_id = $1 AND d.work_order_id = t.id AND d.deleted_at IS NULL) AS document_count,
         (SELECT count(*)::integer FROM domain_events e
          WHERE e.company_id = $1 AND e.entity_type = 'work_order' AND e.entity_id = t.id::text) AS history_count,
         ld.id AS latest_document_id, ld.status AS latest_document_status,
         ld.display_document_number AS latest_display_document_number,
         ld.generated_at AS latest_document_generated_at
  FROM target t
  LEFT JOIN work_order_images i
    ON i.id = t.representative_image_id AND i.company_id = $1 AND i.deleted_at IS NULL
  LEFT JOIN latest_document ld ON ld.row_number = 1
`;

export const WORK_ORDER_V2_MATERIALS_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL})
  SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
         m.id, m.material_id, m.material_type, m.name, m.color_option,
         m.supplier_partner_id, NULL::text AS partner_name, m.required_quantity,
         m.allowance_quantity, m.inventory_usage_quantity, m.order_quantity,
         m.unit_code, m.unit_price, m.amount, m.memo, m.status, m.display_order
  FROM target t
  LEFT JOIN work_order_material_lines m
    ON m.company_id = $1 AND m.revision_id = t.current_revision_id
   AND m.material_type = $6
   AND ($4::integer IS NULL OR (m.display_order, m.id) > ($4::integer, $5::uuid))
  ORDER BY m.display_order ASC NULLS LAST, m.id ASC NULLS LAST
  LIMIT $7
`;

export const WORK_ORDER_V2_SIZE_COLOR_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL}), rows AS (
    SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
           'meta'::text AS row_kind, NULL::text AS id_a, NULL::text AS id_b,
           NULL::text AS value_a, NULL::text AS value_b, NULL::integer AS order_value,
           r.quantity_matrix_note AS memo_value, r.total_quantity_snapshot::text AS quantity_value
    FROM target t
    JOIN work_order_revisions r ON r.company_id = $1 AND r.id = t.current_revision_id
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'color', c.id::text, NULL,
           c.display_name, c.hex_value, c.display_order, NULL, NULL
    FROM target t JOIN work_order_colors c ON c.company_id = $1 AND c.revision_id = t.current_revision_id
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'size', s.id::text, NULL,
           s.size_code, s.display_label, s.display_order, NULL, NULL
    FROM target t JOIN work_order_sizes s ON s.company_id = $1 AND s.revision_id = t.current_revision_id
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'cell', q.color_id::text, q.size_id::text,
           NULL, NULL, NULL, NULL, q.quantity::text
    FROM target t JOIN color_size_quantities q ON q.company_id = $1 AND q.revision_id = t.current_revision_id
  )
  SELECT work_order_id, current_revision_id, entity_version, row_kind, id_a, id_b,
         value_a, value_b, order_value, memo_value, quantity_value
  FROM rows
  ORDER BY CASE row_kind WHEN 'meta' THEN 0 WHEN 'color' THEN 1 WHEN 'size' THEN 2 ELSE 3 END,
           order_value ASC NULLS LAST, id_a ASC NULLS LAST, id_b ASC NULLS LAST
`;

export const WORK_ORDER_V2_SIZE_SPEC_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL}), spec AS (
    SELECT ss.* FROM target t
    LEFT JOIN work_order_size_specs ss
      ON ss.company_id = $1 AND ss.revision_id = t.current_revision_id
  ), rows AS (
    SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
           'meta'::text AS row_kind, s.gender_code AS value_a, s.category_code AS value_b,
           COALESCE(s.measurement_unit, 'cm') AS value_c, s.source_template_id AS id_a,
           NULL::text AS id_b, NULL::text AS id_c, NULL::integer AS order_value,
           NULL::text AS decimal_value, NULL::text AS display_value
    FROM target t LEFT JOIN spec s ON true
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'size', x.size_code, x.display_label,
           NULL, x.id::text, NULL, NULL, x.display_order, NULL, NULL
    FROM target t JOIN work_order_size_spec_sizes x ON x.company_id = $1 AND x.revision_id = t.current_revision_id
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'pom', p.pom_code, p.display_name,
           NULL, p.id::text, NULL, NULL, p.display_order, NULL, NULL
    FROM target t JOIN work_order_size_spec_poms p ON p.company_id = $1 AND p.revision_id = t.current_revision_id
    UNION ALL
    SELECT t.id, t.current_revision_id, t.entity_version, 'cell', NULL, NULL, NULL,
           v.size_row_id::text, v.pom_column_id::text, NULL, NULL,
           v.decimal_value::text, v.display_fraction
    FROM target t JOIN work_order_size_spec_values v ON v.company_id = $1 AND v.revision_id = t.current_revision_id
  )
  SELECT work_order_id, current_revision_id, entity_version, row_kind, value_a, value_b,
         value_c, id_a, id_b, id_c, order_value, decimal_value, display_value
  FROM rows
  ORDER BY CASE row_kind WHEN 'meta' THEN 0 WHEN 'size' THEN 1 WHEN 'pom' THEN 2 ELSE 3 END,
           order_value ASC NULLS LAST, id_a ASC NULLS LAST, id_b ASC NULLS LAST
`;

export const WORK_ORDER_V2_PROCESSES_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL})
  SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
         p.id, p.process_type_code, p.process_name_snapshot, p.partner_id,
         p.partner_name_snapshot, p.quantity, p.due_date, p.unit_code,
         p.unit_price, p.amount, p.memo, p.status, p.display_order
  FROM target t
  LEFT JOIN work_order_processes p
    ON p.company_id = $1 AND p.revision_id = t.current_revision_id
  ORDER BY p.display_order ASC NULLS LAST, p.id ASC NULLS LAST
`;

export const WORK_ORDER_V2_ASSETS_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL}), assets AS (
    SELECT ri.revision_id, ri.image_id AS id, 'image'::text AS asset_type,
           ri.filename_snapshot AS filename, i.title AS optional_title,
           ri.mime_type_snapshot AS mime_type, i.size_bytes, ri.display_order,
           ri.is_representative, false AS include_in_document, i.created_at AS uploaded_at
    FROM target t
    JOIN work_order_revision_images ri ON ri.company_id = $1 AND ri.revision_id = t.current_revision_id
    JOIN work_order_images i ON i.company_id = $1 AND i.id = ri.image_id AND i.deleted_at IS NULL
    UNION ALL
    SELECT ra.revision_id, ra.attachment_id, 'attachment', ra.filename_snapshot, NULL,
           ra.mime_type_snapshot, a.size_bytes, ra.display_order,
           false, ra.output_include, a.created_at
    FROM target t
    JOIN work_order_revision_attachments ra ON ra.company_id = $1 AND ra.revision_id = t.current_revision_id
    JOIN work_order_attachments a ON a.company_id = $1 AND a.id = ra.attachment_id AND a.deleted_at IS NULL
  )
  SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
         a.id, a.asset_type, a.filename, a.optional_title, a.mime_type, a.size_bytes,
         a.display_order, a.is_representative, a.include_in_document, a.uploaded_at
  FROM target t
  LEFT JOIN assets a
    ON ($4::integer IS NULL OR (a.display_order, a.asset_type, a.id) > ($4::integer, $5::text, $6::uuid))
  ORDER BY a.display_order ASC NULLS LAST, a.asset_type ASC NULLS LAST, a.id ASC NULLS LAST
  LIMIT $7
`;

export const WORK_ORDER_V2_DOCUMENTS_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL})
  SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
         d.id, d.work_order_revision_id, d.document_type, d.display_document_number,
         d.status, d.renderer_version, d.dto_schema_version, d.generated_at,
         d.revoked_at, d.created_at,
         EXISTS (
           SELECT 1 FROM document_access_tokens token
           WHERE token.company_id = $1 AND token.generated_document_id = d.id
             AND token.revoked_at IS NULL AND token.expires_at > now()
         ) AS access_token_available
  FROM target t
  LEFT JOIN generated_documents d
    ON d.company_id = $1 AND d.work_order_id = t.id AND d.deleted_at IS NULL
   AND ($4::timestamptz IS NULL OR (d.created_at, d.id) < ($4::timestamptz, $5::uuid))
  ORDER BY d.created_at DESC NULLS LAST, d.id DESC NULLS LAST
  LIMIT $6
`;

export const WORK_ORDER_V2_HISTORY_SQL = `
  WITH target AS MATERIALIZED (${TARGET_SQL})
  SELECT t.id AS work_order_id, t.current_revision_id, t.entity_version,
         e.id, e.command_code, e.change_summary, e.occurred_at
  FROM target t
  LEFT JOIN domain_events e
    ON e.company_id = $1 AND e.entity_type = 'work_order' AND e.entity_id = t.id::text
   AND ($4::timestamptz IS NULL OR (e.occurred_at, e.id) < ($4::timestamptz, $5::uuid))
  ORDER BY e.occurred_at DESC NULLS LAST, e.id DESC NULLS LAST
  LIMIT $6
`;

type RepositoryTiming = { readonly queryCount: number; readonly queryMs: number; readonly transactionMs: number };
type RepositoryResult<T> = RepositoryTiming & { readonly data: T | null; readonly nextPosition?: readonly string[] | null; readonly hasMore?: boolean };

async function queryTenantRows<TRow extends DbQueryResultRow>(input: {
  readonly scope: TenantMemberScope;
  readonly sql: string;
  readonly params: readonly unknown[];
}): Promise<{ readonly rows: readonly TRow[]; readonly queryMs: number; readonly transactionMs: number }> {
  const transactionStartedAt = performance.now();
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(
      `SELECT set_config('wafl.company_id', $1, true),
              set_config('wafl.company_member_id', $2, true),
              set_config('wafl.access_mode', 'tenant_member', true),
              set_config('wafl.correlation_id', $3, true)`,
      [input.scope.companyId, input.scope.companyMemberId, input.scope.correlationId],
    );
    const queryStartedAt = performance.now();
    const result = await client.query<TRow>(input.sql, [...input.params]);
    return {
      rows: result.rows,
      queryMs: Number((performance.now() - queryStartedAt).toFixed(2)),
      transactionMs: Number((performance.now() - transactionStartedAt).toFixed(2)),
    };
  });
}

function timing(result: { readonly queryMs: number; readonly transactionMs: number }): RepositoryTiming {
  return { queryCount: WORK_ORDER_V2_DETAIL_REPOSITORY_STATEMENT_COUNT, queryMs: result.queryMs, transactionMs: result.transactionMs };
}

function asCount(value: unknown): number {
  const count = Number(value ?? 0);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("WORK_ORDER_DETAIL_INVALID_COUNT");
  return count;
}

function asDecimal(value: unknown): DecimalString {
  return String(value ?? "0") as DecimalString;
}

function asIsoDate(value: unknown): IsoDate | null {
  if (value === null || value === undefined) return null;
  return (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)) as IsoDate;
}

function asIsoDateTime(value: unknown): IsoDateTime | null {
  if (value === null || value === undefined) return null;
  return (value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString()) as IsoDateTime;
}

function asEnum<TValue extends string>(value: unknown, allowed: readonly TValue[], code: string): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) throw new Error(code);
  return value as TValue;
}

function baseParams(input: { readonly scope: TenantMemberScope; readonly workOrderId: WorkOrderId; readonly assignedCompanyMemberId: string | null }): readonly unknown[] {
  return [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId];
}

export async function getWorkOrderDetailCoreV2(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: string | null;
}): Promise<RepositoryResult<WorkOrderDetailCoreReadModel>> {
  const result = await queryTenantRows<DbQueryResultRow>({ scope: input.scope, sql: WORK_ORDER_V2_DETAIL_CORE_SQL, params: baseParams(input) });
  const row = result.rows[0];
  if (!row) return { data: null, ...timing(result) };
  const entityVersion = asCount(row.entity_version) as EntityVersion;
  const fabric = asCount(row.fabric_count);
  const accessory = asCount(row.accessory_count);
  const images = asCount(row.image_count);
  const attachments = asCount(row.attachment_count);
  const hardBlockers = [
    ...(images === 0 ? [{ code: "REPRESENTATIVE_IMAGE_REQUIRED" as const, message: "대표 이미지가 필요합니다." }] : []),
    ...(asCount(row.total_quantity) === 0 ? [{ code: "TOTAL_QUANTITY_REQUIRED" as const, message: "총수량이 필요합니다." }] : []),
    ...(row.due_date ? [] : [{ code: "DUE_DATE_REQUIRED" as const, message: "납기가 필요합니다." }]),
    ...(fabric === 0 ? [{ code: "MATERIAL_REQUIRED" as const, message: "원단 정보가 필요합니다." }] : []),
  ];
  const warnings = [
    ...(attachments === 0 ? [{ code: "NO_INCLUDED_ATTACHMENT" as const, message: "포함할 첨부파일이 없습니다." }] : []),
  ];
  const revisionNo = asCount(row.revision_no) as RevisionNumber;
  const documentStatus = row.latest_document_status === null
    ? null
    : asEnum(row.latest_document_status, GENERATED_DOCUMENT_STATUSES, "WORK_ORDER_DETAIL_INVALID_DOCUMENT_STATUS");
  const data: WorkOrderDetailCoreReadModel = {
    header: {
      id: String(row.id) as WorkOrderId,
      productName: String(row.product_name),
      productTypeCode: row.product_type_code === null ? null : String(row.product_type_code),
      productTypeAlias: null,
      seasonCode: row.season_code === null ? null : String(row.season_code),
      itemCode: row.item_code === null ? null : String(row.item_code),
      dueDate: asIsoDate(row.due_date),
      totalQuantity: asCount(row.total_quantity),
      status: asEnum(row.status, WORK_ORDER_STATUSES, "WORK_ORDER_DETAIL_INVALID_STATUS"),
      currentRevisionId: String(row.current_revision_id) as WorkOrderRevisionId,
      currentRevisionNumber: revisionNo,
      representativeImage: row.image_id
        ? { imageId: String(row.image_id) as ImageId, thumbnailUrl: null, altText: String(row.image_title ?? row.product_name) }
        : null,
      readiness: {
        canIssue: hardBlockers.length === 0,
        hardBlockers,
        warnings,
        checkedAt: new Date().toISOString() as IsoDateTime,
        basedOnVersion: entityVersion,
        source: "server_canonical",
      },
      document: {
        latestDocumentId: row.latest_document_id ? String(row.latest_document_id) as GeneratedDocumentId : null,
        status: documentStatus,
        displayDocumentNumber: row.latest_display_document_number
          ? String(row.latest_display_document_number) as DisplayDocumentNumber
          : null,
        generatedAt: asIsoDateTime(row.latest_document_generated_at),
      },
      entityVersion,
      updatedAt: asIsoDateTime(row.updated_at) as IsoDateTime,
    },
    revision: {
      status: asEnum(row.revision_status, WORK_ORDER_REVISION_STATUSES, "WORK_ORDER_DETAIL_INVALID_REVISION_STATUS"),
      finalizedAt: asIsoDateTime(row.finalized_at),
    },
    amounts: {
      currency: "KRW" as CurrencyCode,
      unitPrice: asDecimal(row.unit_price),
      fabricTotal: asDecimal(row.fabric_total),
      accessoryTotal: asDecimal(row.accessory_total),
      processTotal: asDecimal(row.process_total),
      estimatedTotal: asDecimal(row.estimated_total),
    },
    tabCounts: {
      fabric,
      accessory,
      colors: asCount(row.color_count),
      sizes: asCount(row.size_count),
      processes: asCount(row.process_count),
      images,
      attachments,
      documents: asCount(row.document_count),
      history: asCount(row.history_count),
    },
  };
  return { data, ...timing(result) };
}

type CommonCollectionInput = {
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: string | null;
  readonly limit: number;
  readonly cursorPosition: readonly string[] | null;
};

export async function getWorkOrderMaterialsV2(input: CommonCollectionInput & { readonly materialType: MaterialType }): Promise<RepositoryResult<WorkOrderMaterialPage>> {
  const displayOrder = input.cursorPosition ? Number(input.cursorPosition[0]) : null;
  const cursorId = input.cursorPosition?.[1] ?? null;
  const result = await queryTenantRows<DbQueryResultRow>({
    scope: input.scope,
    sql: WORK_ORDER_V2_MATERIALS_SQL,
    params: [...baseParams(input), displayOrder, cursorId, input.materialType, input.limit + 1],
  });
  const meta = result.rows[0];
  if (!meta) return { data: null, ...timing(result) };
  const rows = result.rows.filter((row) => row.id !== null).slice(0, input.limit);
  const hasMore = result.rows.filter((row) => row.id !== null).length > input.limit;
  const items: WorkOrderMaterialLineReadModel[] = rows.map((row) => {
    const status = asEnum(row.status, MATERIAL_LINE_STATUSES, "WORK_ORDER_MATERIAL_INVALID_STATUS");
    return {
      id: String(row.id) as MaterialLineId,
      materialId: row.material_id ? String(row.material_id) as MaterialId : null,
      materialType: String(row.material_type) as MaterialType,
      name: String(row.name),
      colorOption: row.color_option === null ? null : String(row.color_option),
      partnerId: row.supplier_partner_id ? String(row.supplier_partner_id) as PartnerId : null,
      partnerName: row.partner_name === null ? null : String(row.partner_name),
      requiredQuantity: asDecimal(row.required_quantity), allowanceQuantity: asDecimal(row.allowance_quantity),
      inventoryUsageQuantity: asDecimal(row.inventory_usage_quantity), orderQuantity: asDecimal(row.order_quantity),
      unitCode: String(row.unit_code), currency: "KRW" as CurrencyCode,
      unitPrice: asDecimal(row.unit_price), amount: asDecimal(row.amount),
      memo: row.memo === null ? null : String(row.memo), status, displayOrder: asCount(row.display_order),
      editable: status === "editing", locked: status === "completed",
    };
  });
  const last = rows.at(-1);
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      materialType: input.materialType,
      items, nextCursor: null, hasMore, limit: input.limit,
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    nextPosition: hasMore && last ? [String(last.display_order), String(last.id)] : null,
    hasMore,
    ...timing(result),
  };
}

export async function getWorkOrderSizeColorV2(input: Omit<CommonCollectionInput, "limit" | "cursorPosition">): Promise<RepositoryResult<WorkOrderSizeColorMatrixReadModel>> {
  const result = await queryTenantRows<DbQueryResultRow>({ scope: input.scope, sql: WORK_ORDER_V2_SIZE_COLOR_SQL, params: baseParams(input) });
  const meta = result.rows.find((row) => row.row_kind === "meta");
  if (!meta) return { data: null, ...timing(result) };
  const sizes = result.rows.filter((row) => row.row_kind === "size").map((row) => ({
    id: String(row.id_a) as SizeRowId, code: String(row.value_a), displayLabel: String(row.value_b), displayOrder: asCount(row.order_value),
  }));
  const colors = result.rows.filter((row) => row.row_kind === "color").map((row) => ({
    id: String(row.id_a) as ColorId, displayName: String(row.value_a), hexValue: row.value_b === null ? null : String(row.value_b), displayOrder: asCount(row.order_value),
  }));
  const quantityCells = result.rows.filter((row) => row.row_kind === "cell").map((row) => ({
    colorId: String(row.id_a) as ColorId, sizeRowId: String(row.id_b) as SizeRowId, quantity: asDecimal(row.quantity_value),
  }));
  const matrixTotal = quantityCells.reduce((sum, cell) => sum + Number(cell.quantity), 0);
  const expectedTotal = Number(meta.quantity_value ?? 0);
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      sizes, colors, quantityCells,
      matrixTotal: String(matrixTotal) as DecimalString,
      expectedTotal: String(expectedTotal) as DecimalString,
      totalsMatch: matrixTotal === expectedTotal,
      memoFallback: meta.memo_value === null ? null : String(meta.memo_value),
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    ...timing(result),
  };
}

export async function getWorkOrderSizeSpecV2(input: Omit<CommonCollectionInput, "limit" | "cursorPosition">): Promise<RepositoryResult<WorkOrderSizeSpecReadModel>> {
  const result = await queryTenantRows<DbQueryResultRow>({ scope: input.scope, sql: WORK_ORDER_V2_SIZE_SPEC_SQL, params: baseParams(input) });
  const meta = result.rows.find((row) => row.row_kind === "meta");
  if (!meta) return { data: null, ...timing(result) };
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      genderCode: meta.value_a === null ? null : String(meta.value_a),
      categoryCode: meta.value_b === null ? null : String(meta.value_b),
      measurementUnit: meta.value_c === "inch" ? "inch" : "cm",
      templateId: meta.id_a ? String(meta.id_a) as SizeTemplateId : null,
      sizes: result.rows.filter((row) => row.row_kind === "size").map((row) => ({
        id: String(row.id_a) as SizeRowId, code: String(row.value_a), displayLabel: String(row.value_b), displayOrder: asCount(row.order_value),
      })),
      pomColumns: result.rows.filter((row) => row.row_kind === "pom").map((row) => ({
        id: String(row.id_a) as PomColumnId, code: String(row.value_a), displayName: String(row.value_b), displayOrder: asCount(row.order_value),
      })),
      cells: result.rows.filter((row) => row.row_kind === "cell").map((row) => ({
        sizeRowId: String(row.id_a) as SizeRowId, pomColumnId: String(row.id_b) as PomColumnId,
        displayValue: row.display_value === null ? null : String(row.display_value),
        decimalValue: row.decimal_value === null ? null : asDecimal(row.decimal_value),
      })),
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    ...timing(result),
  };
}

export async function getWorkOrderProcessesV2(input: Omit<CommonCollectionInput, "limit" | "cursorPosition">): Promise<RepositoryResult<WorkOrderProcessesReadModel>> {
  const result = await queryTenantRows<DbQueryResultRow>({ scope: input.scope, sql: WORK_ORDER_V2_PROCESSES_SQL, params: baseParams(input) });
  const meta = result.rows[0];
  if (!meta) return { data: null, ...timing(result) };
  const processes = result.rows.filter((row) => row.id !== null).map((row) => {
    const status = asEnum(row.status, PROCESS_STATUSES, "WORK_ORDER_PROCESS_INVALID_STATUS");
    return {
      id: String(row.id) as ProcessId, processTypeCode: String(row.process_type_code), processName: String(row.process_name_snapshot),
      partnerId: row.partner_id ? String(row.partner_id) as PartnerId : null,
      partnerName: row.partner_name_snapshot === null ? null : String(row.partner_name_snapshot),
      quantity: asDecimal(row.quantity), dueDate: asIsoDate(row.due_date), unitCode: String(row.unit_code),
      currency: "KRW" as CurrencyCode, unitPrice: asDecimal(row.unit_price), amount: asDecimal(row.amount),
      memo: row.memo === null ? null : String(row.memo), status, displayOrder: asCount(row.display_order),
      editable: status !== "completed", locked: status === "completed",
    };
  });
  const flowCodes = ["order", "material", "cutting", "process", "inspection", "shipment"] as const;
  const completedCount = processes.filter((process) => process.status === "completed").length;
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      flowSummary: flowCodes.map((stepCode, index) => ({
        stepCode,
        status: (index < completedCount ? "completed" : index === completedCount ? "in_progress" : "ready") as ProcessStatus,
      })),
      processes,
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    ...timing(result),
  };
}

export async function getWorkOrderAssetsV2(input: CommonCollectionInput): Promise<RepositoryResult<WorkOrderAssetPage>> {
  const position = input.cursorPosition;
  const result = await queryTenantRows<DbQueryResultRow>({
    scope: input.scope, sql: WORK_ORDER_V2_ASSETS_SQL,
    params: [...baseParams(input), position ? Number(position[0]) : null, position?.[1] ?? null, position?.[2] ?? null, input.limit + 1],
  });
  const meta = result.rows[0];
  if (!meta) return { data: null, ...timing(result) };
  const available = result.rows.filter((row) => row.id !== null);
  const rows = available.slice(0, input.limit);
  const items: WorkOrderAssetReadModel[] = rows.map((row) => ({
    assetType: row.asset_type === "attachment" ? "attachment" : "image",
    id: String(row.id) as ImageId | AttachmentId,
    filename: String(row.filename), optionalTitle: row.optional_title === null ? null : String(row.optional_title),
    mimeType: String(row.mime_type), sizeBytes: asCount(row.size_bytes), displayOrder: asCount(row.display_order),
    isRepresentative: Boolean(row.is_representative), includeInDocument: Boolean(row.include_in_document),
    state: "active", viewUrl: null as ControlledFileUrl | null,
    uploadedAt: asIsoDateTime(row.uploaded_at) as IsoDateTime,
  }));
  const hasMore = available.length > input.limit;
  const last = rows.at(-1);
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      items, nextCursor: null, hasMore, limit: input.limit,
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    nextPosition: hasMore && last ? [String(last.display_order), String(last.asset_type), String(last.id)] : null,
    hasMore,
    ...timing(result),
  };
}

export async function getWorkOrderDocumentsV2(input: CommonCollectionInput): Promise<RepositoryResult<WorkOrderDocumentPage>> {
  const position = input.cursorPosition;
  const result = await queryTenantRows<DbQueryResultRow>({
    scope: input.scope, sql: WORK_ORDER_V2_DOCUMENTS_SQL,
    params: [...baseParams(input), position?.[0] ?? null, position?.[1] ?? null, input.limit + 1],
  });
  const meta = result.rows[0];
  if (!meta) return { data: null, ...timing(result) };
  const available = result.rows.filter((row) => row.id !== null);
  const rows = available.slice(0, input.limit);
  const items = rows.map((row) => ({
    id: String(row.id) as GeneratedDocumentId,
    revisionId: String(row.work_order_revision_id) as WorkOrderRevisionId,
    documentType: asEnum(row.document_type, WORK_ORDER_DOCUMENT_TYPES, "WORK_ORDER_DOCUMENT_INVALID_TYPE") as WorkOrderDocumentType,
    displayDocumentNumber: String(row.display_document_number) as DisplayDocumentNumber,
    status: asEnum(row.status, GENERATED_DOCUMENT_STATUSES, "WORK_ORDER_DOCUMENT_INVALID_STATUS") as GeneratedDocumentStatus,
    rendererVersion: String(row.renderer_version), documentSchemaVersion: asCount(row.dto_schema_version),
    generatedAt: asIsoDateTime(row.generated_at), revokedAt: asIsoDateTime(row.revoked_at),
    accessTokenAvailable: Boolean(row.access_token_available), previewUrl: null as ControlledFileUrl | null,
  }));
  const hasMore = available.length > input.limit;
  const last = rows.at(-1);
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      currentRevisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      items, nextCursor: null, hasMore, limit: input.limit,
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    nextPosition: hasMore && last ? [asIsoDateTime(last.created_at) as string, String(last.id)] : null,
    hasMore,
    ...timing(result),
  };
}

export async function getWorkOrderHistoryV2(input: CommonCollectionInput): Promise<RepositoryResult<WorkOrderHistoryPage>> {
  const position = input.cursorPosition;
  const result = await queryTenantRows<DbQueryResultRow>({
    scope: input.scope, sql: WORK_ORDER_V2_HISTORY_SQL,
    params: [...baseParams(input), position?.[0] ?? null, position?.[1] ?? null, input.limit + 1],
  });
  const meta = result.rows[0];
  if (!meta) return { data: null, ...timing(result) };
  const available = result.rows.filter((row) => row.id !== null);
  const rows = available.slice(0, input.limit);
  const items = rows.map((row) => ({
    id: String(row.id), commandCode: String(row.command_code),
    changeSummary: row.change_summary === null ? null : String(row.change_summary),
    occurredAt: asIsoDateTime(row.occurred_at) as IsoDateTime,
  }));
  const hasMore = available.length > input.limit;
  const last = rows.at(-1);
  return {
    data: {
      workOrderId: String(meta.work_order_id) as WorkOrderId,
      revisionId: String(meta.current_revision_id) as WorkOrderRevisionId,
      items, nextCursor: null, hasMore, limit: input.limit,
      entityVersion: asCount(meta.entity_version) as EntityVersion,
    },
    nextPosition: hasMore && last ? [asIsoDateTime(last.occurred_at) as string, String(last.id)] : null,
    hasMore,
    ...timing(result),
  };
}
