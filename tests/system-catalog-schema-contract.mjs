import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("db/migrations/patch_0_24_27_system_catalog.sql", "utf8");
const repo = readFileSync("lib/catalog/systemCatalogRepository.ts", "utf8");

for (const relation of [
  "system_catalog_versions",
  "system_catalog_categories",
  "company_catalog_categories",
  "system_size_sets",
  "system_size_options",
  "company_size_set_activations",
  "system_pom_definitions",
  "company_pom_activations",
  "company_catalog_provisioning",
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${relation}`), `missing ${relation}`);
}

const migrationForSafetyScan = migration.replace(/--.*$/gm, "").replace(/\bON\s+DELETE\b/gi, "ON_DELETE");
assert.doesNotMatch(migrationForSafetyScan, /\bDROP\b|\bTRUNCATE\b|\bDELETE\b|\bUPDATE\b/i, "migration must be additive only");
assert.doesNotMatch(
  migration,
  /INSERT\s+INTO\s+company_catalog_categories/i,
  "migration must not backfill existing companies",
);
assert.match(repo, /provisionCompanyCatalog/, "new company catalog provisioning must exist");
assert.match(repo, /ON CONFLICT \(company_id, category_code\) DO NOTHING/, "company category provisioning must be idempotent");
assert.match(repo, /default_enabled/, "company defaults must come from system category defaults");
assert.match(repo, /COMPANY_CATALOG_CATEGORY_NOT_FOUND/, "invalid company category patch must be denied");

console.log("system-catalog-schema-contract: PASS");
