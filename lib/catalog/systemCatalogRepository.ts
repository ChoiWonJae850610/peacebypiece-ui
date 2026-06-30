import "server-only";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import {
  SYSTEM_CATALOG_CATEGORIES,
  SYSTEM_CATALOG_VERSION_CODE,
  SYSTEM_POMS,
  SYSTEM_SIZE_SETS,
} from "@/lib/catalog/systemCatalogPolicy";

export type CompanyCatalogSummary = {
  catalogVersionCode: string | null;
  categories: {
    code: string;
    parentCode: string | null;
    depth: number;
    domain: string;
    displayName: string;
    defaultEnabled: boolean;
    isOptional: boolean;
    isEnabled: boolean;
    sortOrder: number;
  }[];
  sizeSets: {
    code: string;
    displayName: string;
    isEnabled: boolean;
    options: { code: string; label: string; sortOrder: number }[];
  }[];
  poms: {
    code: string;
    displayName: string;
    measurementUnit: string;
    measurementType: string;
    isEnabled: boolean;
    sortOrder: number;
  }[];
};

type CatalogCategoryRow = DbQueryResultRow & {
  code: string;
  parent_code: string | null;
  depth: number;
  domain: string;
  display_name: string;
  default_enabled: boolean;
  is_optional: boolean;
  is_enabled: boolean | null;
  sort_order: number;
};

type SizeSetRow = DbQueryResultRow & {
  code: string;
  display_name: string;
  is_enabled: boolean | null;
  option_code: string | null;
  option_label: string | null;
  option_sort_order: number | null;
};

type PomRow = DbQueryResultRow & {
  code: string;
  display_name: string;
  measurement_unit: string;
  measurement_type: string;
  sort_order: number;
  is_enabled: boolean | null;
};

async function run(client: DbTransactionClient | null, text: string, params: unknown[] = []) {
  if (client) return client.query(text, params);
  return queryDb(text, params);
}

export async function seedSystemCatalog(client: DbTransactionClient | null = null): Promise<void> {
  await run(
    client,
    `
      INSERT INTO system_catalog_versions (id, code, label, status, is_current, updated_at)
      VALUES ($1, $1, 'WAFL System Catalog 0.24.27', 'current', true, now())
      ON CONFLICT (code) DO UPDATE
      SET label = EXCLUDED.label,
          status = EXCLUDED.status,
          is_current = EXCLUDED.is_current,
          updated_at = now()
    `,
    [SYSTEM_CATALOG_VERSION_CODE],
  );

  for (const category of SYSTEM_CATALOG_CATEGORIES) {
    await run(
      client,
      `
        INSERT INTO system_catalog_categories (
          id, catalog_version_code, code, parent_code, depth, domain, display_name,
          default_enabled, is_optional, is_active, sort_order, updated_at
        )
        VALUES ($1, $2, $1, $3, $4, $5, $6, $7, $8, true, $9, now())
        ON CONFLICT (code) DO UPDATE
        SET parent_code = EXCLUDED.parent_code,
            depth = EXCLUDED.depth,
            domain = EXCLUDED.domain,
            display_name = EXCLUDED.display_name,
            default_enabled = EXCLUDED.default_enabled,
            is_optional = EXCLUDED.is_optional,
            is_active = true,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
      `,
      [
        category.code,
        SYSTEM_CATALOG_VERSION_CODE,
        category.parentCode,
        category.depth,
        category.domain,
        category.displayName,
        category.defaultEnabled,
        category.isOptional,
        category.sortOrder,
      ],
    );
  }

  for (const sizeSet of SYSTEM_SIZE_SETS) {
    await run(
      client,
      `
        INSERT INTO system_size_sets (id, catalog_version_code, code, display_name, is_custom_allowed, sort_order, updated_at)
        VALUES ($1, $2, $1, $3, true, $4, now())
        ON CONFLICT (code) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
      `,
      [sizeSet.code, SYSTEM_CATALOG_VERSION_CODE, sizeSet.displayName, sizeSet.sortOrder],
    );
    for (const option of sizeSet.options) {
      await run(
        client,
        `
          INSERT INTO system_size_options (id, size_set_code, code, display_label, sort_order, updated_at)
          VALUES ($1, $2, $3, $4, $5, now())
          ON CONFLICT (size_set_code, code) DO UPDATE
          SET display_label = EXCLUDED.display_label,
              sort_order = EXCLUDED.sort_order,
              updated_at = now()
        `,
        [`${sizeSet.code}:${option.code}`, sizeSet.code, option.code, option.label, option.sortOrder],
      );
    }
    for (const categoryCode of sizeSet.categoryCodes) {
      await run(
        client,
        `
          INSERT INTO system_category_size_sets (category_code, size_set_code)
          VALUES ($1, $2)
          ON CONFLICT (category_code, size_set_code) DO NOTHING
        `,
        [categoryCode, sizeSet.code],
      );
    }
  }

  for (const pom of SYSTEM_POMS) {
    await run(
      client,
      `
        INSERT INTO system_pom_definitions (
          id, catalog_version_code, code, display_name, measurement_unit,
          measurement_type, instruction, sort_order, is_active, updated_at
        )
        VALUES ($1, $2, $1, $3, $4, $5, $6, $7, true, now())
        ON CONFLICT (code) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            measurement_unit = EXCLUDED.measurement_unit,
            measurement_type = EXCLUDED.measurement_type,
            instruction = EXCLUDED.instruction,
            sort_order = EXCLUDED.sort_order,
            is_active = true,
            updated_at = now()
      `,
      [
        pom.code,
        SYSTEM_CATALOG_VERSION_CODE,
        pom.displayName,
        pom.measurementUnit,
        pom.measurementType,
        pom.instruction,
        pom.sortOrder,
      ],
    );
    for (const categoryCode of pom.categoryCodes) {
      await run(
        client,
        `
          INSERT INTO system_category_poms (category_code, pom_code, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (category_code, pom_code) DO UPDATE
          SET sort_order = EXCLUDED.sort_order
        `,
        [categoryCode, pom.code, pom.sortOrder],
      );
    }
  }
}

export async function provisionCompanyCatalog(client: DbTransactionClient, companyId: string): Promise<void> {
  await seedSystemCatalog(client);
  await client.query(
    `
      INSERT INTO company_catalog_provisioning (company_id, catalog_version_code, provisioned_at, updated_at)
      VALUES ($1, $2, now(), now())
      ON CONFLICT (company_id) DO NOTHING
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
  await client.query(
    `
      INSERT INTO company_catalog_categories (company_id, category_code, catalog_version_code, is_enabled, provisioned_at, updated_at)
      SELECT $1, code, catalog_version_code, default_enabled, now(), now()
      FROM system_catalog_categories
      WHERE catalog_version_code = $2 AND is_active = true
      ON CONFLICT (company_id, category_code) DO NOTHING
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
  await client.query(
    `
      INSERT INTO company_size_set_activations (company_id, size_set_code, catalog_version_code, is_enabled, provisioned_at, updated_at)
      SELECT $1, code, catalog_version_code, true, now(), now()
      FROM system_size_sets
      WHERE catalog_version_code = $2
      ON CONFLICT (company_id, size_set_code) DO NOTHING
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
  await client.query(
    `
      INSERT INTO company_pom_activations (company_id, pom_code, catalog_version_code, is_enabled, provisioned_at, updated_at)
      SELECT $1, code, catalog_version_code, true, now(), now()
      FROM system_pom_definitions
      WHERE catalog_version_code = $2 AND is_active = true
      ON CONFLICT (company_id, pom_code) DO NOTHING
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
}

export async function listSystemCatalog(): Promise<CompanyCatalogSummary> {
  if (!isDatabaseConfigured()) {
    return { catalogVersionCode: SYSTEM_CATALOG_VERSION_CODE, categories: [], sizeSets: [], poms: [] };
  }
  return listCompanyCatalog(null);
}

export async function listCompanyCatalog(companyId: string | null): Promise<CompanyCatalogSummary> {
  if (!isDatabaseConfigured()) {
    return { catalogVersionCode: SYSTEM_CATALOG_VERSION_CODE, categories: [], sizeSets: [], poms: [] };
  }

  const categoryResult = await queryDb<CatalogCategoryRow>(
    `
      SELECT sc.code, sc.parent_code, sc.depth, sc.domain, sc.display_name,
             sc.default_enabled, sc.is_optional, sc.sort_order,
             cc.is_enabled
      FROM system_catalog_categories sc
      LEFT JOIN company_catalog_categories cc
        ON cc.category_code = sc.code AND cc.company_id = $1
      WHERE sc.catalog_version_code = $2
      ORDER BY sc.sort_order ASC, sc.code ASC
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
  const sizeResult = await queryDb<SizeSetRow>(
    `
      SELECT ss.code, ss.display_name, csa.is_enabled,
             so.code AS option_code, so.display_label AS option_label, so.sort_order AS option_sort_order
      FROM system_size_sets ss
      LEFT JOIN company_size_set_activations csa
        ON csa.size_set_code = ss.code AND csa.company_id = $1
      LEFT JOIN system_size_options so ON so.size_set_code = ss.code
      WHERE ss.catalog_version_code = $2
      ORDER BY ss.sort_order ASC, so.sort_order ASC
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );
  const pomResult = await queryDb<PomRow>(
    `
      SELECT sp.code, sp.display_name, sp.measurement_unit, sp.measurement_type, sp.sort_order, cpa.is_enabled
      FROM system_pom_definitions sp
      LEFT JOIN company_pom_activations cpa
        ON cpa.pom_code = sp.code AND cpa.company_id = $1
      WHERE sp.catalog_version_code = $2
      ORDER BY sp.sort_order ASC, sp.code ASC
    `,
    [companyId, SYSTEM_CATALOG_VERSION_CODE],
  );

  const sizeSets = new Map<string, CompanyCatalogSummary["sizeSets"][number]>();
  for (const row of sizeResult.rows) {
    const existing = sizeSets.get(row.code) ?? {
      code: row.code,
      displayName: row.display_name,
      isEnabled: row.is_enabled ?? true,
      options: [],
    };
    if (row.option_code && row.option_label) {
      existing.options.push({ code: row.option_code, label: row.option_label, sortOrder: row.option_sort_order ?? 0 });
    }
    sizeSets.set(row.code, existing);
  }

  return {
    catalogVersionCode: SYSTEM_CATALOG_VERSION_CODE,
    categories: categoryResult.rows.map((row) => ({
      code: row.code,
      parentCode: row.parent_code,
      depth: Number(row.depth),
      domain: row.domain,
      displayName: row.display_name,
      defaultEnabled: row.default_enabled,
      isOptional: row.is_optional,
      isEnabled: row.is_enabled ?? row.default_enabled,
      sortOrder: Number(row.sort_order),
    })),
    sizeSets: Array.from(sizeSets.values()),
    poms: pomResult.rows.map((row) => ({
      code: row.code,
      displayName: row.display_name,
      measurementUnit: row.measurement_unit,
      measurementType: row.measurement_type,
      isEnabled: row.is_enabled ?? true,
      sortOrder: Number(row.sort_order),
    })),
  };
}

export async function setCompanyCategoryEnabled(input: {
  companyId: string;
  categoryCode: string;
  isEnabled: boolean;
}): Promise<CompanyCatalogSummary> {
  const result = await queryDb(
    `
      UPDATE company_catalog_categories
      SET is_enabled = $3, updated_at = now()
      WHERE company_id = $1 AND category_code = $2
    `,
    [input.companyId, input.categoryCode, input.isEnabled],
  );
  if (result.rowCount !== 1) {
    throw new Error("COMPANY_CATALOG_CATEGORY_NOT_FOUND");
  }
  return listCompanyCatalog(input.companyId);
}
