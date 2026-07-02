import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrderCompanyScope } from "@/lib/workorder/service/workOrderService";
import { getWorkOrderCategoryCode, type WorkOrderSizeSpec, type WorkOrderSizeSpecPatch, type WorkOrderSizeSpecPom, type WorkOrderSizeSpecSize, type WorkOrderSizeSpecUnit, type WorkOrderSizeSpecValue } from "@/lib/workorder/sizeSpec/types";
import { assertMeasurementValue, normalizeMeasurementDisplayValue, parseMeasurementValue } from "@/lib/workorder/sizeSpec/valuePolicy";
import type { WorkOrder } from "@/types/workorder";

type SizeSpecRow = {
  work_order_id: string;
  size_set_code: string | null;
  measurement_unit: WorkOrderSizeSpecUnit | null;
  updated_at: string | Date | null;
};

type SizeRow = {
  size_code: string;
  display_label: string;
  sort_order: number | null;
};

type PomRow = {
  pom_code: string;
  display_name: string;
  measurement_type: string;
  instruction: string | null;
  sort_order: number | null;
};

type ValueRow = {
  size_code: string;
  pom_code: string;
  display_value: string | null;
};

type DefaultSizeSetRow = {
  size_set_code: string;
  catalog_version_code: string | null;
};

function toIsoString(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapSizes(rows: SizeRow[]): WorkOrderSizeSpecSize[] {
  return rows.map((row) => ({
    code: row.size_code,
    displayLabel: row.display_label,
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

function mapPoms(rows: PomRow[]): WorkOrderSizeSpecPom[] {
  return rows.map((row) => ({
    code: row.pom_code,
    displayName: row.display_name,
    measurementType: row.measurement_type,
    instruction: row.instruction ?? null,
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

function mapValues(rows: ValueRow[]): WorkOrderSizeSpecValue[] {
  return rows.map((row) => ({
    sizeCode: row.size_code,
    pomCode: row.pom_code,
    displayValue: normalizeMeasurementDisplayValue(row.display_value),
  }));
}

async function getExistingSpec(workOrderId: string, scope: WorkOrderCompanyScope): Promise<SizeSpecRow | null> {
  const result = await queryDb<SizeSpecRow>(
    `
      SELECT spec.work_order_id,
             spec.size_set_code,
             spec.measurement_unit,
             spec.updated_at
        FROM workorder_size_specs spec
        INNER JOIN spec_sheets work_order
          ON work_order.id = spec.work_order_id
         AND work_order.company_id = spec.company_id
       WHERE spec.work_order_id = $1
         AND spec.company_id = $2
         AND work_order.is_active = TRUE
         AND work_order.deleted_at IS NULL
       LIMIT 1
    `,
    [workOrderId, scope.companyId],
  );

  return result.rows[0] ?? null;
}

async function listSpecSizes(workOrderId: string, scope: WorkOrderCompanyScope): Promise<WorkOrderSizeSpecSize[]> {
  const result = await queryDb<SizeRow>(
    `
      SELECT size_code, display_label, sort_order
        FROM workorder_size_spec_sizes
       WHERE work_order_id = $1
         AND company_id = $2
       ORDER BY sort_order ASC, display_label ASC
    `,
    [workOrderId, scope.companyId],
  );
  return mapSizes(result.rows);
}

async function listSpecPoms(workOrderId: string, scope: WorkOrderCompanyScope): Promise<WorkOrderSizeSpecPom[]> {
  const result = await queryDb<PomRow>(
    `
      SELECT pom_code, display_name, measurement_type, instruction, sort_order
        FROM workorder_size_spec_poms
       WHERE work_order_id = $1
         AND company_id = $2
       ORDER BY sort_order ASC, display_name ASC
    `,
    [workOrderId, scope.companyId],
  );
  return mapPoms(result.rows);
}

async function listSpecValues(workOrderId: string): Promise<WorkOrderSizeSpecValue[]> {
  const result = await queryDb<ValueRow>(
    `
      SELECT size_code, pom_code, display_value
        FROM workorder_size_spec_values
       WHERE work_order_id = $1
       ORDER BY pom_code ASC, size_code ASC
    `,
    [workOrderId],
  );
  return mapValues(result.rows);
}

async function findDefaultSizeSet(input: {
  companyId: string;
  categoryCode: string | null;
  requestedSizeSetCode?: string | null;
}): Promise<DefaultSizeSetRow | null> {
  const result = await queryDb<DefaultSizeSetRow>(
    `
      SELECT ss.code AS size_set_code,
             ss.catalog_version_code
        FROM system_size_sets ss
        LEFT JOIN system_category_size_sets scs
          ON scs.size_set_code = ss.code
         AND ($2::text IS NOT NULL AND scs.category_code = $2)
        LEFT JOIN company_size_set_activations csa
          ON csa.size_set_code = ss.code
         AND csa.company_id = $1
       WHERE ($3::text IS NULL OR ss.code = $3)
         AND COALESCE(csa.is_enabled, TRUE) = TRUE
       ORDER BY
         CASE WHEN ss.code = $3 THEN 0 ELSE 1 END,
         CASE WHEN scs.category_code IS NOT NULL THEN 0 ELSE 1 END,
         ss.sort_order ASC,
         ss.code ASC
       LIMIT 1
    `,
    [input.companyId, input.categoryCode, input.requestedSizeSetCode ?? null],
  );
  return result.rows[0] ?? null;
}

async function loadSystemSizes(sizeSetCode: string): Promise<WorkOrderSizeSpecSize[]> {
  const result = await queryDb<SizeRow>(
    `
      SELECT code AS size_code, display_label, sort_order
        FROM system_size_options
       WHERE size_set_code = $1
       ORDER BY sort_order ASC, display_label ASC
    `,
    [sizeSetCode],
  );
  return mapSizes(result.rows);
}

async function loadSystemPoms(input: {
  companyId: string;
  categoryCode: string | null;
}): Promise<WorkOrderSizeSpecPom[]> {
  const result = await queryDb<PomRow>(
    `
      SELECT pom.code AS pom_code,
             pom.display_name,
             pom.measurement_type,
             pom.instruction,
             COALESCE(scp.sort_order, pom.sort_order) AS sort_order
        FROM system_pom_definitions pom
        LEFT JOIN system_category_poms scp
          ON scp.pom_code = pom.code
         AND ($2::text IS NOT NULL AND scp.category_code = $2)
        LEFT JOIN company_pom_activations cpa
          ON cpa.pom_code = pom.code
         AND cpa.company_id = $1
       WHERE pom.is_active = TRUE
         AND COALESCE(cpa.is_enabled, TRUE) = TRUE
       ORDER BY
         CASE WHEN scp.category_code IS NOT NULL THEN 0 ELSE 1 END,
         COALESCE(scp.sort_order, pom.sort_order) ASC,
         pom.display_name ASC
       LIMIT 12
    `,
    [input.companyId, input.categoryCode],
  );
  return mapPoms(result.rows);
}

function emptySpec(workOrderId: string): WorkOrderSizeSpec {
  return {
    workOrderId,
    sizeSetCode: null,
    measurementUnit: "cm",
    sizes: [],
    poms: [],
    values: [],
    updatedAt: null,
  };
}

export async function getWorkOrderSizeSpec(input: {
  workOrder: WorkOrder;
  scope: WorkOrderCompanyScope;
}): Promise<WorkOrderSizeSpec> {
  const existing = await getExistingSpec(input.workOrder.id, input.scope);
  if (existing) {
    return {
      workOrderId: existing.work_order_id,
      sizeSetCode: existing.size_set_code,
      measurementUnit: existing.measurement_unit ?? "cm",
      sizes: await listSpecSizes(input.workOrder.id, input.scope),
      poms: await listSpecPoms(input.workOrder.id, input.scope),
      values: await listSpecValues(input.workOrder.id),
      updatedAt: toIsoString(existing.updated_at),
    };
  }

  const categoryCode = getWorkOrderCategoryCode(input.workOrder);
  const sizeSet = await findDefaultSizeSet({
    companyId: input.scope.companyId,
    categoryCode,
  });
  if (!sizeSet) return emptySpec(input.workOrder.id);

  return {
    workOrderId: input.workOrder.id,
    sizeSetCode: sizeSet.size_set_code,
    measurementUnit: "cm",
    sizes: await loadSystemSizes(sizeSet.size_set_code),
    poms: await loadSystemPoms({
      companyId: input.scope.companyId,
      categoryCode,
    }),
    values: [],
    updatedAt: null,
  };
}

export async function saveWorkOrderSizeSpec(input: {
  workOrder: WorkOrder;
  scope: WorkOrderCompanyScope;
  patch: WorkOrderSizeSpecPatch;
  updatedByUserId: string;
}): Promise<WorkOrderSizeSpec> {
  const previous = await getWorkOrderSizeSpec({
    workOrder: input.workOrder,
    scope: input.scope,
  });
  const measurementUnit = input.patch.measurementUnit ?? previous.measurementUnit;
  const categoryCode = getWorkOrderCategoryCode(input.workOrder);
  const sizeSet = await findDefaultSizeSet({
    companyId: input.scope.companyId,
    categoryCode,
    requestedSizeSetCode: input.patch.sizeSetCode ?? previous.sizeSetCode,
  });
  if (!sizeSet) {
    throw new Error("WORKORDER_SIZE_SET_NOT_FOUND");
  }

  const sizes = await loadSystemSizes(sizeSet.size_set_code);
  const poms = previous.poms.length > 0
    ? previous.poms
    : await loadSystemPoms({ companyId: input.scope.companyId, categoryCode });
  const values = (input.patch.values ?? previous.values).map((value) => {
    const displayValue = normalizeMeasurementDisplayValue(value.displayValue);
    assertMeasurementValue(displayValue, measurementUnit);
    return {
      sizeCode: String(value.sizeCode ?? "").trim(),
      pomCode: String(value.pomCode ?? "").trim(),
      displayValue,
    };
  }).filter((value) => value.sizeCode && value.pomCode);
  const sizeCodes = new Set(sizes.map((size) => size.code));
  const pomCodes = new Set(poms.map((pom) => pom.code));
  const filteredValues = values.filter((value) => sizeCodes.has(value.sizeCode) && pomCodes.has(value.pomCode));

  await queryDb(
    `
      INSERT INTO workorder_size_specs (
        work_order_id,
        company_id,
        size_set_code,
        measurement_unit,
        source_catalog_version_code,
        updated_by_user_id,
        created_at,
        updated_at
      )
      SELECT work_order.id,
             work_order.company_id,
             $3,
             $4,
             $5,
             $6,
             now(),
             now()
        FROM spec_sheets work_order
       WHERE work_order.id = $1
         AND work_order.company_id = $2
         AND work_order.is_active = TRUE
         AND work_order.deleted_at IS NULL
      ON CONFLICT (work_order_id)
      DO UPDATE SET
        size_set_code = EXCLUDED.size_set_code,
        measurement_unit = EXCLUDED.measurement_unit,
        source_catalog_version_code = EXCLUDED.source_catalog_version_code,
        updated_by_user_id = EXCLUDED.updated_by_user_id,
        updated_at = now()
    `,
    [
      input.workOrder.id,
      input.scope.companyId,
      sizeSet.size_set_code,
      measurementUnit,
      sizeSet.catalog_version_code,
      input.updatedByUserId,
    ],
  );

  await queryDb(`DELETE FROM workorder_size_spec_sizes WHERE work_order_id = $1`, [input.workOrder.id]);
  await queryDb(`DELETE FROM workorder_size_spec_poms WHERE work_order_id = $1`, [input.workOrder.id]);

  for (const size of sizes) {
    await queryDb(
      `
        INSERT INTO workorder_size_spec_sizes (work_order_id, company_id, size_code, display_label, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (work_order_id, size_code)
        DO UPDATE SET display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order
      `,
      [input.workOrder.id, input.scope.companyId, size.code, size.displayLabel, size.sortOrder],
    );
  }

  for (const pom of poms) {
    await queryDb(
      `
        INSERT INTO workorder_size_spec_poms (
          work_order_id, company_id, pom_code, display_name, measurement_type, instruction, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (work_order_id, pom_code)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          measurement_type = EXCLUDED.measurement_type,
          instruction = EXCLUDED.instruction,
          sort_order = EXCLUDED.sort_order
      `,
      [input.workOrder.id, input.scope.companyId, pom.code, pom.displayName, pom.measurementType, pom.instruction, pom.sortOrder],
    );
  }

  await queryDb(`DELETE FROM workorder_size_spec_values WHERE work_order_id = $1`, [input.workOrder.id]);
  for (const value of filteredValues) {
    await queryDb(
      `
        INSERT INTO workorder_size_spec_values (
          work_order_id, size_code, pom_code, display_value, decimal_value, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (work_order_id, size_code, pom_code)
        DO UPDATE SET
          display_value = EXCLUDED.display_value,
          decimal_value = EXCLUDED.decimal_value,
          updated_at = now()
      `,
      [
        input.workOrder.id,
        value.sizeCode,
        value.pomCode,
        value.displayValue,
        parseMeasurementValue(value.displayValue, measurementUnit),
      ],
    );
  }

  return getWorkOrderSizeSpec({
    workOrder: input.workOrder,
    scope: input.scope,
  });
}
