import "server-only";

import { randomUUID } from "crypto";

import {
  isDatabaseConfigured,
  queryDb,
  withDbTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";

export interface CompanyStandardsInitializationInput {
  companyId: string;
  overwriteProductTypes?: boolean;
}

export interface CompanyStandardsInitializationResult {
  companyId: string;
  unitStandardsLinked: number;
  processStandardsLinked: number;
  productCategoriesCopied: number;
  defaultTemplateId: string | null;
  skippedProductCategories: boolean;
  repository: {
    mode: "db" | "unavailable";
    supportsWrite: boolean;
  };
}

type CountRow = { count: string | number } & DbQueryResultRow;
type DefaultTemplateRow = { id: string } & DbQueryResultRow;
type TemplateCategoryRow = {
  id: string;
  parent_id: string | null;
  level: number | string;
  name: string;
  is_active: boolean | string;
  sort_order: number | string | null;
} & DbQueryResultRow;

function normalizeCount(row: CountRow | undefined): number {
  if (!row) return 0;
  const value = Number(row.count);
  return Number.isFinite(value) ? value : 0;
}

function normalizeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const next = Number(value);
    if (Number.isFinite(next)) return next;
  }
  return fallback;
}

async function countExistingProductCategories(client: DbTransactionClient, companyId: string): Promise<number> {
  const result = await client.query<CountRow>(
    `SELECT count(*)::int AS count
       FROM item_categories
      WHERE company_id = $1`,
    [companyId],
  );

  return normalizeCount(result.rows[0]);
}

async function linkActiveUnitStandards(client: DbTransactionClient, companyId: string): Promise<number> {
  const result = await client.query(
    `INSERT INTO company_enabled_unit_standards (company_id, unit_standard_id, is_enabled, sort_order, updated_at)
     SELECT $1, id, true, sort_order, now()
       FROM system_unit_standards
      WHERE is_active = true
      ORDER BY sort_order ASC, korean_name ASC
     ON CONFLICT (company_id, unit_standard_id) DO UPDATE
     SET is_enabled = EXCLUDED.is_enabled,
         sort_order = EXCLUDED.sort_order,
         updated_at = now()`,
    [companyId],
  );

  return result.rowCount;
}

async function linkActiveProcessStandards(client: DbTransactionClient, companyId: string): Promise<number> {
  const result = await client.query(
    `INSERT INTO company_enabled_process_standards (company_id, process_standard_id, is_enabled, sort_order, updated_at)
     SELECT $1, id, true, sort_order, now()
       FROM system_outsourcing_process_standards
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
     ON CONFLICT (company_id, process_standard_id) DO UPDATE
     SET is_enabled = EXCLUDED.is_enabled,
         sort_order = EXCLUDED.sort_order,
         updated_at = now()`,
    [companyId],
  );

  return result.rowCount;
}

async function getDefaultProductTemplateId(client: DbTransactionClient): Promise<string | null> {
  const result = await client.query<DefaultTemplateRow>(
    `SELECT id
       FROM system_product_type_templates
      WHERE is_active = true
        AND is_default = true
      ORDER BY sort_order ASC, name ASC
      LIMIT 1`,
  );

  return result.rows[0]?.id ?? null;
}

async function listTemplateCategories(client: DbTransactionClient, templateId: string): Promise<TemplateCategoryRow[]> {
  const result = await client.query<TemplateCategoryRow>(
    `SELECT id, parent_id, level, name, is_active, sort_order
       FROM system_product_type_template_categories
      WHERE template_id = $1
        AND is_active = true
      ORDER BY level ASC, sort_order ASC, name ASC`,
    [templateId],
  );

  return result.rows;
}

async function copyDefaultProductCategories(
  client: DbTransactionClient,
  companyId: string,
  options: Pick<CompanyStandardsInitializationInput, "overwriteProductTypes">,
): Promise<{ copied: number; templateId: string | null; skipped: boolean }> {
  const existingCount = await countExistingProductCategories(client, companyId);

  if (existingCount > 0 && options.overwriteProductTypes !== true) {
    return { copied: 0, templateId: null, skipped: true };
  }

  if (options.overwriteProductTypes === true) {
    await client.query("DELETE FROM item_categories WHERE company_id = $1", [companyId]);
  }

  const templateId = await getDefaultProductTemplateId(client);
  if (!templateId) {
    return { copied: 0, templateId: null, skipped: false };
  }

  const templateCategories = await listTemplateCategories(client, templateId);
  const idMap = new Map<string, string>();
  let copied = 0;

  for (const category of templateCategories) {
    const level = normalizeNumber(category.level, 1);
    const targetId = randomUUID();
    const parentId = level === 1 ? null : category.parent_id ? idMap.get(category.parent_id) ?? null : null;

    if (level > 1 && !parentId) {
      continue;
    }

    await client.query(
      `INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        targetId,
        companyId,
        parentId,
        level,
        String(category.name ?? "").trim(),
        normalizeBoolean(category.is_active, true),
        normalizeNumber(category.sort_order, copied + 1),
      ],
    );

    idMap.set(category.id, targetId);
    copied += 1;
  }

  return { copied, templateId, skipped: false };
}

export async function initializeCompanyStandards(
  input: CompanyStandardsInitializationInput,
): Promise<CompanyStandardsInitializationResult> {
  const companyId = input.companyId.trim();

  if (!companyId) {
    throw new Error("companyId is required to initialize company standards.");
  }

  if (!isDatabaseConfigured()) {
    return {
      companyId,
      unitStandardsLinked: 0,
      processStandardsLinked: 0,
      productCategoriesCopied: 0,
      defaultTemplateId: null,
      skippedProductCategories: false,
      repository: { mode: "unavailable", supportsWrite: false },
    };
  }

  return withDbTransaction(async (client) => {
    const unitStandardsLinked = await linkActiveUnitStandards(client, companyId);
    const processStandardsLinked = await linkActiveProcessStandards(client, companyId);
    const productCategoryResult = await copyDefaultProductCategories(client, companyId, input);

    return {
      companyId,
      unitStandardsLinked,
      processStandardsLinked,
      productCategoriesCopied: productCategoryResult.copied,
      defaultTemplateId: productCategoryResult.templateId,
      skippedProductCategories: productCategoryResult.skipped,
      repository: { mode: "db", supportsWrite: true },
    };
  });
}

export async function getCompanyStandardsInitializationPreview(companyId: string): Promise<CompanyStandardsInitializationResult> {
  if (!isDatabaseConfigured()) {
    return {
      companyId,
      unitStandardsLinked: 0,
      processStandardsLinked: 0,
      productCategoriesCopied: 0,
      defaultTemplateId: null,
      skippedProductCategories: false,
      repository: { mode: "unavailable", supportsWrite: false },
    };
  }

  const [units, processes, categories, template] = await Promise.all([
    queryDb<CountRow>("SELECT count(*)::int AS count FROM system_unit_standards WHERE is_active = true"),
    queryDb<CountRow>("SELECT count(*)::int AS count FROM system_outsourcing_process_standards WHERE is_active = true"),
    queryDb<CountRow>(
      `SELECT count(*)::int AS count
         FROM system_product_type_template_categories c
         JOIN system_product_type_templates t ON t.id = c.template_id
        WHERE t.is_active = true
          AND t.is_default = true
          AND c.is_active = true`,
    ),
    queryDb<DefaultTemplateRow>(
      `SELECT id
         FROM system_product_type_templates
        WHERE is_active = true
          AND is_default = true
        ORDER BY sort_order ASC, name ASC
        LIMIT 1`,
    ),
  ]);

  return {
    companyId,
    unitStandardsLinked: normalizeCount(units.rows[0]),
    processStandardsLinked: normalizeCount(processes.rows[0]),
    productCategoriesCopied: normalizeCount(categories.rows[0]),
    defaultTemplateId: template.rows[0]?.id ?? null,
    skippedProductCategories: false,
    repository: { mode: "db", supportsWrite: true },
  };
}
