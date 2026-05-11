import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import { getWorkspaceCompanyContext } from "@/lib/constants/company";
import { listSystemProductTemplates } from "@/lib/system/standards/productTemplateRepository";
import type { SystemProductTemplateRow } from "@/lib/system/standards/systemProductTemplateStandards";
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

function toDefaultItemCategories(template: SystemProductTemplateRow | null, companyId: string): AdminItemCategoryDefinition[] {
  if (!template) return [];

  const rows: AdminItemCategoryDefinition[] = [];

  for (const top of template.tree) {
    const topId = `default:${template.id}:1:${top.id}`;
    rows.push({
      id: topId,
      company_id: companyId,
      parent_id: null,
      level: 1,
      name: top.name,
      is_active: top.isActive !== false,
      sort_order: normalizeNumber(top.sortOrder, (rows.length + 1) * 10),
    });

    for (const second of top.children) {
      const secondId = `default:${template.id}:2:${second.id}`;
      rows.push({
        id: secondId,
        company_id: companyId,
        parent_id: topId,
        level: 2,
        name: second.name,
        is_active: second.isActive !== false,
        sort_order: normalizeNumber(second.sortOrder, 10),
      });

      for (const leaf of second.children) {
        rows.push({
          id: `default:${template.id}:3:${leaf.id}`,
          company_id: companyId,
          parent_id: secondId,
          level: 3,
          name: leaf.name,
          is_active: leaf.isActive !== false,
          sort_order: normalizeNumber(leaf.sortOrder, 10),
        });
      }
    }
  }

  return rows;
}

async function getDefaultItemCategories(companyId: string): Promise<AdminItemCategoryDefinition[]> {
  if (!isDatabaseConfigured()) return [];
  const templates = await listSystemProductTemplates();
  const defaultTemplate = templates.find((template) => template.isDefault && template.status === "active") ?? null;
  return toDefaultItemCategories(defaultTemplate, companyId);
}

export async function getAdminStandards(): Promise<AdminStandardsPayload> {
  const companyId = getWorkspaceCompanyContext().companyId;

  if (!isDatabaseConfigured()) {
    return {
      units: [],
      itemCategories: [],
      defaultItemCategories: [],
      repository: { mode: "unavailable", adapterConfigured: false, supportsWrite: false },
      error: "DB_NOT_CONFIGURED",
    };
  }

  const [unitsResult, companyCategoriesResult, defaultItemCategories] = await Promise.all([
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
       WHERE company_id = $1
       ORDER BY level ASC, sort_order ASC, name ASC`,
      [companyId],
    ),
    getDefaultItemCategories(companyId),
  ]);

  return {
    units: unitsResult.rows.map(normalizeUnit),
    itemCategories: companyCategoriesResult.rows.map(normalizeItemCategory),
    defaultItemCategories,
    repository: { mode: "db", adapterConfigured: true, supportsWrite: true },
  };
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
      units: [],
      itemCategories: [],
      defaultItemCategories: [],
      repository: { mode: "unavailable", adapterConfigured: false, supportsWrite: false },
      error: "DB_NOT_CONFIGURED",
    };
  }

  const companyId = getWorkspaceCompanyContext().companyId;

  if (input.units) {
    const incomingUnitIds = input.units.map((unit) => unit.id?.trim()).filter((id): id is string => Boolean(id));
    const validUnitIdResult = incomingUnitIds.length > 0
      ? await queryDb<{ id: string } & DbQueryResultRow>(
          `SELECT id FROM system_unit_standards WHERE id = ANY($1::text[])`,
          [incomingUnitIds],
        )
      : { rows: [] };
    const validUnitIds = new Set(validUnitIdResult.rows.map((row) => row.id));
    const units = input.units
      .map((unit, index) => ({
        id: unit.id?.trim(),
        isEnabled: unit.is_active !== false,
        sortOrder: Number.isFinite(unit.sort_order) ? unit.sort_order : (index + 1) * 10,
      }))
      .filter((unit): unit is { id: string; isEnabled: boolean; sortOrder: number } => Boolean(unit.id) && validUnitIds.has(unit.id));

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
    const categories = normalizeIncomingCategories(input.itemCategories)
      .sort((a, b) => a.level - b.level || a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));

    await queryDb("DELETE FROM item_categories WHERE company_id = $1", [companyId]);

    const idMap = new Map<string, string>();

    for (const category of categories) {
      const sourceId = category.id;
      const targetId = randomUUID();
      idMap.set(sourceId, targetId);
      const parentId = category.level === 1 ? null : category.parent_id ? idMap.get(category.parent_id) ?? null : null;
      if (category.level > 1 && !parentId) continue;

      await queryDb(
        `INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [targetId, companyId, parentId, category.level, category.name, category.is_active, category.sort_order],
      );
    }
  }

  return getAdminStandards();
}
