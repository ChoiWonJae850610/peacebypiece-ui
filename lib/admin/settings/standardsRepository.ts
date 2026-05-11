import "server-only";

import { randomUUID } from "crypto";
import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import { getWorkspaceCompanyContext } from "@/lib/constants/company";
import { createDefaultItemCategoryDefinitions, createDefaultUnitDefinitions } from "@/lib/admin/settings/standardsDefaults";
import type { AdminItemCategoryDefinition, AdminItemCategoryLevel, AdminStandardsPayload, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";

type UnitRow = AdminUnitDefinition & DbQueryResultRow;
type ItemCategoryRow = AdminItemCategoryDefinition & DbQueryResultRow;

function normalizeBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
}

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const next = Number(value);
    if (Number.isFinite(next)) return next;
  }
  return fallback;
}

function normalizeUnit(row: UnitRow): AdminUnitDefinition {
  return {
    id: String(row.id),
    company_id: row.company_id ?? getWorkspaceCompanyContext().companyId,
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    category: row.category ?? null,
    is_active: normalizeBoolean(row.is_active),
    sort_order: normalizeNumber(row.sort_order),
  };
}

function normalizeItemCategory(row: ItemCategoryRow): AdminItemCategoryDefinition {
  const level = normalizeNumber(row.level, 1);
  return {
    id: String(row.id),
    company_id: row.company_id ?? getWorkspaceCompanyContext().companyId,
    parent_id: row.parent_id ?? null,
    level: level === 2 || level === 3 ? level : 1,
    name: String(row.name ?? ""),
    is_active: normalizeBoolean(row.is_active),
    sort_order: normalizeNumber(row.sort_order),
  };
}

export async function getAdminStandards(): Promise<AdminStandardsPayload> {
  if (!isDatabaseConfigured()) {
    return {
      units: createDefaultUnitDefinitions(),
      itemCategories: createDefaultItemCategoryDefinitions(),
      repository: { mode: "fallback", adapterConfigured: false, supportsWrite: false },
    };
  }

  const companyId = getWorkspaceCompanyContext().companyId;
  const [unitsResult, categoriesResult] = await Promise.all([
    queryDb<UnitRow>(
      `SELECT sus.id,
              $1::text AS company_id,
              sus.code,
              sus.korean_name AS name,
              sus.category,
              COALESCE(ceus.is_enabled, true) AS is_active,
              COALESCE(ceus.sort_order, sus.sort_order) AS sort_order
         FROM system_unit_standards sus
         LEFT JOIN company_enabled_unit_standards ceus
           ON ceus.unit_standard_id = sus.id
          AND ceus.company_id = $1
        WHERE sus.is_active = true
        ORDER BY COALESCE(ceus.sort_order, sus.sort_order) ASC, sus.korean_name ASC`,
      [companyId],
    ),
    queryDb<ItemCategoryRow>(
      `SELECT id, company_id, parent_id, level, name, is_active, sort_order
       FROM item_categories
       WHERE company_id = $1 OR company_id IS NULL
       ORDER BY level ASC, sort_order ASC, name ASC`,
      [companyId],
    ),
  ]);

  return {
    units: unitsResult.rows.length > 0
      ? unitsResult.rows.map(normalizeUnit)
      : createDefaultUnitDefinitions(companyId),
    itemCategories: categoriesResult.rows.length > 0
      ? categoriesResult.rows.map(normalizeItemCategory)
      : createDefaultItemCategoryDefinitions(companyId),
    repository: { mode: "db", adapterConfigured: true, supportsWrite: true },
  };
}

function normalizeIncomingUnits(items: AdminUnitDefinition[]): AdminUnitDefinition[] {
  const companyId = getWorkspaceCompanyContext().companyId;
  return items
    .map((item, index) => ({
      id: item.id?.trim() || randomUUID(),
      company_id: companyId,
      code: item.code.trim(),
      name: item.name.trim(),
      category: item.category ?? null,
      is_active: item.is_active !== false,
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : (index + 1) * 10,
    }))
    .filter((item) => item.code.length > 0 && item.name.length > 0);
}

function normalizeItemCategoryLevel(level: AdminItemCategoryDefinition["level"]): AdminItemCategoryLevel {
  return level === 2 || level === 3 ? level : 1;
}

function normalizeIncomingCategories(items: AdminItemCategoryDefinition[]): AdminItemCategoryDefinition[] {
  const companyId = getWorkspaceCompanyContext().companyId;
  return items
    .map((item, index): AdminItemCategoryDefinition => {
      const level = normalizeItemCategoryLevel(item.level);

      return {
        id: item.id?.trim() || randomUUID(),
        company_id: companyId,
        parent_id: level === 1 ? null : item.parent_id ?? null,
        level,
        name: item.name.trim(),
        is_active: item.is_active !== false,
        sort_order: Number.isFinite(item.sort_order) ? item.sort_order : (index + 1) * 10,
      };
    })
    .filter((item) => item.name.length > 0);
}

export async function replaceAdminStandards(input: Partial<Pick<AdminStandardsPayload, "units" | "itemCategories">>): Promise<AdminStandardsPayload> {
  if (!isDatabaseConfigured()) {
    return {
      units: input.units ?? createDefaultUnitDefinitions(),
      itemCategories: input.itemCategories ?? createDefaultItemCategoryDefinitions(),
      repository: { mode: "fallback", adapterConfigured: false, supportsWrite: false },
      error: "DB_NOT_CONFIGURED",
    };
  }

  const companyId = getWorkspaceCompanyContext().companyId;

  if (input.units) {
    const units = input.units
      .map((unit, index) => ({
        id: unit.id?.trim(),
        isEnabled: unit.is_active !== false,
        sortOrder: Number.isFinite(unit.sort_order) ? unit.sort_order : (index + 1) * 10,
      }))
      .filter((unit): unit is { id: string; isEnabled: boolean; sortOrder: number } => Boolean(unit.id));

    for (const unit of units) {
      await queryDb(
        `INSERT INTO company_enabled_unit_standards (company_id, unit_standard_id, is_enabled, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (company_id, unit_standard_id) DO UPDATE
         SET is_enabled = EXCLUDED.is_enabled,
             sort_order = EXCLUDED.sort_order,
             updated_at = now()`,
        [companyId, unit.id, unit.isEnabled, unit.sortOrder],
      );
    }
  }

  if (input.itemCategories) {
    const categories = normalizeIncomingCategories(input.itemCategories);
    for (const category of categories) {
      await queryDb(
        `INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE
         SET company_id = EXCLUDED.company_id,
             parent_id = EXCLUDED.parent_id,
             level = EXCLUDED.level,
             name = EXCLUDED.name,
             is_active = EXCLUDED.is_active,
             sort_order = EXCLUDED.sort_order,
             updated_at = now()`,
        [category.id, companyId, category.parent_id, category.level, category.name, category.is_active, category.sort_order],
      );
    }
    const ids = categories.map((category) => category.id);
    if (ids.length === 0) await queryDb("DELETE FROM item_categories WHERE company_id = $1", [companyId]);
    else await queryDb("DELETE FROM item_categories WHERE company_id = $1 AND id <> ALL($2::text[])", [companyId, ids]);
  }

  return getAdminStandards();
}
