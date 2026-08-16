import "server-only";

import { createHash } from "crypto";

import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import type { WorkOrderStructureOptionKind } from "@/lib/domain/work-orders/catalog/structureOptionPolicy";
import { decodeWorkOrderMajorCategoryCode, type WorkOrderMajorCategoryCode } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";

export const STRUCTURE_OPTION_CREATE_COMMAND_CODE = "work_order.structure_option.create";
export const STRUCTURE_OPTION_REMOVE_COMMAND_CODE = "work_order.structure_option.remove";
export const STRUCTURE_OPTION_RENAME_COMMAND_CODE = "work_order.structure_option.rename";

export type CompanyWorkOrderStructureOption = {
  readonly id: string;
  readonly kind: WorkOrderStructureOptionKind;
  readonly displayName: string;
  readonly hexValue: string | null;
  readonly active: boolean;
  readonly sourceKind: "company";
  readonly categoryCode: WorkOrderMajorCategoryCode | null;
};

export class StructureOptionRepositoryError extends Error {
  constructor(readonly reason: "not_found" | "locked" | "conflict" | "idempotency_conflict" | "duplicate" | "validation", readonly entityVersion: number | null = null) {
    super(reason);
    this.name = "StructureOptionRepositoryError";
  }
}

type WorkOrderRow = DbQueryResultRow & {
  readonly id: string;
  readonly revision_id: string;
  readonly entity_version: number | string;
  readonly status: string;
  readonly revision_status: string;
  readonly product_type_code: string | null;
};

type OptionRow = DbQueryResultRow & {
  readonly id: string;
  readonly option_kind: WorkOrderStructureOptionKind;
  readonly display_name: string;
  readonly normalized_name: string;
  readonly hex_value: string | null;
  readonly is_active: boolean;
  readonly category_code: WorkOrderMajorCategoryCode | null;
};

const integer = (value: number | string) => Number.parseInt(String(value), 10);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function mapOption(row: OptionRow): CompanyWorkOrderStructureOption {
  return { id: row.id, kind: row.option_kind, displayName: row.display_name, hexValue: row.hex_value, active: row.is_active, sourceKind: "company", categoryCode: row.category_code };
}

async function readTarget(client: Parameters<typeof installTenantClaims>[0], input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly assignedCompanyMemberId: string | null;
  readonly lock: boolean;
}) {
  const result = await client.query<WorkOrderRow>(`
    SELECT w.id, w.current_revision_id AS revision_id, w.entity_version, w.status, r.revision_status, r.product_type_code_snapshot AS product_type_code
    FROM work_orders w
    JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND ($3::text IS NULL OR w.assignee_member_id = $3)
    ${input.lock ? "FOR UPDATE OF w, r" : ""}
  `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
  const row = result.rows[0];
  if (!row) throw new StructureOptionRepositoryError("not_found");
  return row;
}

export async function listCompanyWorkOrderStructureOptions(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly assignedCompanyMemberId: string | null;
}) {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = await readTarget(client, { ...input, lock: false });
    const categoryCode = decodeWorkOrderMajorCategoryCode(target.product_type_code);
    const options = await client.query<OptionRow>(`
      SELECT id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
      FROM company_work_order_structure_options
      WHERE company_id = $1 AND is_active
        AND (option_kind <> 'spec_item' OR category_code IS NULL OR category_code = $2)
      ORDER BY option_kind, lower(display_name), id
    `, [input.scope.companyId, categoryCode]);
    return { entityVersion: integer(target.entity_version), categoryCode, items: options.rows.map(mapOption) };
  });
}

type MutationCommon = {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly assignedCompanyMemberId: string | null;
  readonly expectedVersion: number;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
};

async function reserveReceipt(client: Parameters<typeof installTenantClaims>[0], input: MutationCommon, commandCode: string) {
  const inserted = await client.query<DbQueryResultRow>(`
    INSERT INTO work_order_command_receipts (company_id, command_code, idempotency_key, request_sha256, work_order_id, correlation_id)
    VALUES ($1, $2, $3, $4, $5::uuid, $6)
    ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
    RETURNING request_sha256
  `, [input.scope.companyId, commandCode, input.scopedIdempotencyKeyHash, input.requestHash, input.workOrderId, input.scope.correlationId]);
  if (inserted.rows[0]) return false;
  const existing = await client.query<DbQueryResultRow & { readonly request_sha256: string }>(`
    SELECT request_sha256 FROM work_order_command_receipts
    WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
  `, [input.scope.companyId, commandCode, input.scopedIdempotencyKeyHash]);
  if (existing.rows[0]?.request_sha256 !== input.requestHash) throw new StructureOptionRepositoryError("idempotency_conflict");
  return true;
}

async function finishReceipt(client: Parameters<typeof installTenantClaims>[0], input: MutationCommon, commandCode: string, revisionId: string, version: number) {
  await client.query(`
    UPDATE work_order_command_receipts
    SET result_revision_id=$4::uuid, result_entity_version=$5
    WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
  `, [input.scope.companyId, commandCode, input.scopedIdempotencyKeyHash, revisionId, version]);
}

export async function createCompanyWorkOrderStructureOption(input: MutationCommon & {
  readonly optionId: string;
  readonly kind: WorkOrderStructureOptionKind;
  readonly displayName: string;
  readonly normalizedName: string;
  readonly hexValue: string | null;
}) {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = await readTarget(client, { ...input, lock: true });
    const version = integer(target.entity_version);
    if (target.status !== "draft" || target.revision_status !== "draft") throw new StructureOptionRepositoryError("locked", version);
    if (version !== input.expectedVersion) throw new StructureOptionRepositoryError("conflict", version);
    const categoryCode = input.kind === "spec_item" ? decodeWorkOrderMajorCategoryCode(target.product_type_code) : null;
    const replay = await reserveReceipt(client, input, STRUCTURE_OPTION_CREATE_COMMAND_CODE);
    if (replay) {
      const found = await client.query<OptionRow>(`
        SELECT id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
        FROM company_work_order_structure_options
        WHERE company_id=$1 AND option_kind=$2 AND normalized_name=$3 AND category_code IS NOT DISTINCT FROM $4
      `, [input.scope.companyId, input.kind, input.normalizedName, categoryCode]);
      if (!found.rows[0]) throw new StructureOptionRepositoryError("conflict", version);
      return { item: mapOption(found.rows[0]), entityVersion: version, idempotentReplay: true };
    }
    const inserted = await client.query<OptionRow>(`
      INSERT INTO company_work_order_structure_options (
        id, company_id, option_kind, display_name, normalized_name, hex_value, category_code, created_by_member_id
      ) VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (company_id, option_kind, (COALESCE(category_code, '')), normalized_name) DO UPDATE
      SET display_name=EXCLUDED.display_name, hex_value=EXCLUDED.hex_value, is_active=true, updated_at=now()
      RETURNING id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
    `, [input.optionId, input.scope.companyId, input.kind, input.displayName, input.normalizedName, input.hexValue, categoryCode, input.scope.companyMemberId]);
    const item = inserted.rows[0];
    if (!item) throw new StructureOptionRepositoryError("duplicate", version);
    await client.query(`
      INSERT INTO domain_events (company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
      VALUES ($1,'company_work_order_structure_option',$2,$3,$4,$5,$6,$7::jsonb,1)
    `, [input.scope.companyId, item.id, STRUCTURE_OPTION_CREATE_COMMAND_CODE, input.scope.companyMemberId, input.scope.correlationId, "회사 사이즈·색상 선택지 저장", JSON.stringify({ workOrderId: input.workOrderId, optionKind: input.kind })]);
    await finishReceipt(client, input, STRUCTURE_OPTION_CREATE_COMMAND_CODE, target.revision_id, version);
    return { item: mapOption(item), entityVersion: version, idempotentReplay: false };
  });
}

export async function removeCompanyWorkOrderStructureOption(input: MutationCommon & { readonly optionId: string }) {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = await readTarget(client, { ...input, lock: true });
    const version = integer(target.entity_version);
    if (target.status !== "draft" || target.revision_status !== "draft") throw new StructureOptionRepositoryError("locked", version);
    if (version !== input.expectedVersion) throw new StructureOptionRepositoryError("conflict", version);
    const replay = await reserveReceipt(client, input, STRUCTURE_OPTION_REMOVE_COMMAND_CODE);
    if (replay) return { optionId: input.optionId, removed: true, deactivated: false, entityVersion: version, idempotentReplay: true };
    const selected = await client.query<OptionRow>(`
      SELECT id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
      FROM company_work_order_structure_options
      WHERE company_id=$1 AND id=$2::uuid
      FOR UPDATE
    `, [input.scope.companyId, input.optionId]);
    const option = selected.rows[0];
    if (!option) throw new StructureOptionRepositoryError("not_found", version);
    const categoryCode = decodeWorkOrderMajorCategoryCode(target.product_type_code);
    if (option.option_kind === "spec_item" && option.category_code !== null && option.category_code !== categoryCode) throw new StructureOptionRepositoryError("not_found", version);
    const usage = option.option_kind === "size"
      ? await client.query<DbQueryResultRow & { readonly used: boolean }>(`
          SELECT EXISTS (
            SELECT 1 FROM work_order_sizes s
            WHERE s.company_id=$1 AND lower(trim(s.display_label))=$2
          ) AS used
        `, [input.scope.companyId, option.normalized_name])
      : option.option_kind === "color" ? await client.query<DbQueryResultRow & { readonly used: boolean }>(`
          SELECT EXISTS (
            SELECT 1 FROM work_order_colors c
            WHERE c.company_id=$1 AND lower(trim(c.display_name))=$2
          ) AS used
        `, [input.scope.companyId, option.normalized_name])
        : await client.query<DbQueryResultRow & { readonly used: boolean }>(`
          SELECT EXISTS (
            SELECT 1 FROM work_order_size_spec_poms p
            WHERE p.company_id=$1 AND lower(trim(p.display_name))=$2
          ) AS used
        `, [input.scope.companyId, option.normalized_name]);
    const deactivated = usage.rows[0]?.used === true;
    if (deactivated) {
      await client.query(`UPDATE company_work_order_structure_options SET is_active=false,updated_at=now() WHERE company_id=$1 AND id=$2::uuid`, [input.scope.companyId, input.optionId]);
    } else {
      await client.query(`DELETE FROM company_work_order_structure_options WHERE company_id=$1 AND id=$2::uuid`, [input.scope.companyId, input.optionId]);
    }
    await client.query(`
      INSERT INTO domain_events (company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
      VALUES ($1,'company_work_order_structure_option',$2,$3,$4,$5,$6,$7::jsonb,1)
    `, [input.scope.companyId, input.optionId, STRUCTURE_OPTION_REMOVE_COMMAND_CODE, input.scope.companyMemberId, input.scope.correlationId, deactivated ? "사용 이력이 있는 회사 선택지 숨김" : "미사용 회사 선택지 삭제", JSON.stringify({ workOrderId: input.workOrderId, optionKind: option.option_kind, deactivated })]);
    await finishReceipt(client, input, STRUCTURE_OPTION_REMOVE_COMMAND_CODE, target.revision_id, version);
    return { optionId: input.optionId, removed: true, deactivated, entityVersion: version, idempotentReplay: false };
  });
}

export async function renameCompanyWorkOrderStructureOption(input: MutationCommon & {
  readonly optionId: string;
  readonly displayName: string;
  readonly normalizedName: string;
}) {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = await readTarget(client, { ...input, lock: true });
    const version = integer(target.entity_version);
    if (target.status !== "draft" || target.revision_status !== "draft") throw new StructureOptionRepositoryError("locked", version);
    if (version !== input.expectedVersion) throw new StructureOptionRepositoryError("conflict", version);
    const replay = await reserveReceipt(client, input, STRUCTURE_OPTION_RENAME_COMMAND_CODE);
    if (replay) {
      const found = await client.query<OptionRow>(`
        SELECT id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
        FROM company_work_order_structure_options
        WHERE company_id=$1 AND id=$2::uuid
      `, [input.scope.companyId, input.optionId]);
      if (!found.rows[0]) throw new StructureOptionRepositoryError("not_found", version);
      return { item: mapOption(found.rows[0]), entityVersion: version, idempotentReplay: true };
    }
    const selected = await client.query<OptionRow>(`
      SELECT id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
      FROM company_work_order_structure_options
      WHERE company_id=$1 AND id=$2::uuid AND option_kind='spec_item'
      FOR UPDATE
    `, [input.scope.companyId, input.optionId]);
    if (!selected.rows[0]) throw new StructureOptionRepositoryError("not_found", version);
    const categoryCode = decodeWorkOrderMajorCategoryCode(target.product_type_code);
    if (selected.rows[0].category_code !== null && selected.rows[0].category_code !== categoryCode) throw new StructureOptionRepositoryError("not_found", version);
    let updated;
    try {
      updated = await client.query<OptionRow>(`
        UPDATE company_work_order_structure_options
        SET display_name=$3, normalized_name=$4, updated_at=now()
        WHERE company_id=$1 AND id=$2::uuid
        RETURNING id, option_kind, display_name, normalized_name, hex_value, is_active, category_code
      `, [input.scope.companyId, input.optionId, input.displayName, input.normalizedName]);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") throw new StructureOptionRepositoryError("duplicate", version);
      throw error;
    }
    const item = updated.rows[0];
    if (!item) throw new StructureOptionRepositoryError("not_found", version);
    await client.query(`
      INSERT INTO domain_events (company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
      VALUES ($1,'company_work_order_structure_option',$2,$3,$4,$5,$6,$7::jsonb,1)
    `, [input.scope.companyId, input.optionId, STRUCTURE_OPTION_RENAME_COMMAND_CODE, input.scope.companyMemberId, input.scope.correlationId, "회사 스펙 항목 이름 변경", JSON.stringify({ workOrderId: input.workOrderId, optionKind: item.option_kind })]);
    await finishReceipt(client, input, STRUCTURE_OPTION_RENAME_COMMAND_CODE, target.revision_id, version);
    return { item: mapOption(item), entityVersion: version, idempotentReplay: false };
  });
}

export function scopedStructureOptionIdempotencyKey(commandCode: string, scope: TenantMemberScope, key: string) {
  return sha256([commandCode, scope.companyId, scope.companyMemberId, key].join("\0"));
}
