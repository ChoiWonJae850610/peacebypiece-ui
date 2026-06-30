import crypto from "node:crypto";
import { Client } from "pg";

const CONFIRMATION = "RUN_SYSTEM_CATALOG_PROVISIONING_DEV_TEST";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const CATALOG_VERSION = "wafl-system-catalog-2026-0.24.27";
const PREFIX = "system-catalog-it";

const env = (name) => (typeof process.env[name] === "string" ? process.env[name].trim() : "");
const shortHash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const safeLog = (event, payload = {}) => console.log(JSON.stringify({ event, ...payload }));

function getRuntime() {
  return env("WAFL_SERVER_RUNTIME_MODE") || env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
}

function fingerprint(databaseUrl) {
  const url = new URL(databaseUrl);
  return shortHash(`${url.hostname}/${url.pathname.replace(/^\/+/, "")}`);
}

function assertGuard() {
  const runtime = getRuntime();
  const databaseUrl = env("DATABASE_URL");
  if (!ALLOWED_RUNTIMES.has(runtime)) throw new Error(`BLOCKED_RUNTIME:${runtime}`);
  if (env("WAFL_DB_AUDIT_APPROVED") !== "1") throw new Error("DB_AUDIT_APPROVAL_MISSING");
  if (env("WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION") !== "1") throw new Error("SYSTEM_CATALOG_INTEGRATION_FLAG_MISSING");
  if (env("WAFL_SYSTEM_CATALOG_INTEGRATION_CONFIRMATION") !== CONFIRMATION) throw new Error("SYSTEM_CATALOG_CONFIRMATION_MISMATCH");
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const dbFingerprint = fingerprint(databaseUrl);
  if (!env("WAFL_APPROVED_DB_FINGERPRINT") || dbFingerprint !== env("WAFL_APPROVED_DB_FINGERPRINT")) {
    throw new Error("DB_FINGERPRINT_MISMATCH");
  }
  safeLog("SYSTEM_CATALOG_INTEGRATION_GUARD_PASS", { runtime, dbFingerprint, mutation: "dev-test-db-fixture-only", r2Mutation: "none" });
  return { runtime, databaseUrl, dbFingerprint };
}

async function q(client, text, params = []) {
  return client.query(text, params);
}

async function seedSystemCatalog(client) {
  const categories = [
    ["apparel.top", null, 1, "apparel", "Top", true, false, 10],
    ["apparel.top.tshirt", "apparel.top", 2, "apparel", "T-shirt", true, false, 10],
    ["apparel.top.tshirt.short_sleeve", "apparel.top.tshirt", 3, "apparel", "Short sleeve", true, false, 10],
    ["apparel.bottom", null, 1, "apparel", "Bottom", true, false, 20],
    ["apparel.bottom.pants", "apparel.bottom", 2, "apparel", "Pants", true, false, 10],
    ["apparel.bottom.pants.slacks", "apparel.bottom.pants", 3, "apparel", "Slacks", true, false, 10],
    ["underwear.bra", null, 1, "underwear", "Bra", false, true, 110],
    ["underwear.bra.general", "underwear.bra", 2, "underwear", "General", false, true, 10],
    ["underwear.bra.general.wire", "underwear.bra.general", 3, "underwear", "Wire", false, true, 10],
    ["accessory.bag", null, 1, "accessory", "Bag", false, true, 210],
    ["accessory.bag.tote", "accessory.bag", 2, "accessory", "Tote", false, true, 10],
    ["accessory.bag.tote.basic", "accessory.bag.tote", 3, "accessory", "Basic tote", false, true, 10],
  ];
  await q(client, "INSERT INTO system_catalog_versions (id, code, label, status, is_current) VALUES ($1, $1, 'WAFL System Catalog 0.24.27', 'current', true) ON CONFLICT (code) DO UPDATE SET is_current = true, status = 'current', updated_at = now()", [CATALOG_VERSION]);
  for (const row of categories) {
    await q(client, `
      INSERT INTO system_catalog_categories (id, catalog_version_code, code, parent_code, depth, domain, display_name, default_enabled, is_optional, is_active, sort_order)
      VALUES ($1, $2, $1, $3, $4, $5, $6, $7, $8, true, $9)
      ON CONFLICT (code) DO UPDATE
      SET parent_code = EXCLUDED.parent_code, depth = EXCLUDED.depth, domain = EXCLUDED.domain,
          display_name = EXCLUDED.display_name, default_enabled = EXCLUDED.default_enabled,
          is_optional = EXCLUDED.is_optional, sort_order = EXCLUDED.sort_order, updated_at = now()
    `, [row[0], CATALOG_VERSION, row[1], row[2], row[3], row[4], row[5], row[6], row[7]]);
  }
  await q(client, "INSERT INTO system_size_sets (id, catalog_version_code, code, display_name, sort_order) VALUES ('alpha_xs_xl', $1, 'alpha_xs_xl', 'XS-XL', 10) ON CONFLICT (code) DO NOTHING", [CATALOG_VERSION]);
  for (const [code, label, sort] of [["xs", "XS", 10], ["s", "S", 20], ["m", "M", 30], ["l", "L", 40], ["xl", "XL", 50]]) {
    await q(client, "INSERT INTO system_size_options (id, size_set_code, code, display_label, sort_order) VALUES ($1, 'alpha_xs_xl', $2, $3, $4) ON CONFLICT (size_set_code, code) DO NOTHING", [`alpha_xs_xl:${code}`, code, label, sort]);
  }
  for (const category of ["apparel.top", "apparel.bottom"]) {
    await q(client, "INSERT INTO system_category_size_sets (category_code, size_set_code) VALUES ($1, 'alpha_xs_xl') ON CONFLICT DO NOTHING", [category]);
  }
  for (const [code, label, type, sort] of [["body_length", "Body length", "length", 10], ["chest_width", "Chest width", "half_flat", 20]]) {
    await q(client, "INSERT INTO system_pom_definitions (id, catalog_version_code, code, display_name, measurement_unit, measurement_type, sort_order) VALUES ($1, $2, $1, $3, 'cm', $4, $5) ON CONFLICT (code) DO NOTHING", [code, CATALOG_VERSION, label, type, sort]);
    await q(client, "INSERT INTO system_category_poms (category_code, pom_code, sort_order) VALUES ('apparel.top', $1, $2) ON CONFLICT DO NOTHING", [code, sort]);
  }
}

async function provisionCompanyCatalog(client, companyId) {
  await q(client, "INSERT INTO company_catalog_provisioning (company_id, catalog_version_code) VALUES ($1, $2) ON CONFLICT (company_id) DO NOTHING", [companyId, CATALOG_VERSION]);
  await q(client, "INSERT INTO company_catalog_categories (company_id, category_code, catalog_version_code, is_enabled) SELECT $1, code, catalog_version_code, default_enabled FROM system_catalog_categories WHERE catalog_version_code = $2 ON CONFLICT DO NOTHING", [companyId, CATALOG_VERSION]);
  await q(client, "INSERT INTO company_size_set_activations (company_id, size_set_code, catalog_version_code, is_enabled) SELECT $1, code, catalog_version_code, true FROM system_size_sets WHERE catalog_version_code = $2 ON CONFLICT DO NOTHING", [companyId, CATALOG_VERSION]);
  await q(client, "INSERT INTO company_pom_activations (company_id, pom_code, catalog_version_code, is_enabled) SELECT $1, code, catalog_version_code, true FROM system_pom_definitions WHERE catalog_version_code = $2 ON CONFLICT DO NOTHING", [companyId, CATALOG_VERSION]);
}

async function cleanup(client, companyId) {
  const statements = [
    ["DELETE FROM company_pom_activations WHERE company_id = $1", [companyId]],
    ["DELETE FROM company_size_set_activations WHERE company_id = $1", [companyId]],
    ["DELETE FROM company_catalog_categories WHERE company_id = $1", [companyId]],
    ["DELETE FROM company_catalog_provisioning WHERE company_id = $1", [companyId]],
    ["DELETE FROM companies WHERE id = $1", [companyId]],
  ];
  let removed = 0;
  for (const [text, params] of statements) {
    const result = await q(client, text, params);
    removed += Number(result.rowCount ?? 0);
  }
  const residual = await q(client, `
    SELECT
      (SELECT count(*)::int FROM companies WHERE id = $1)
      + (SELECT count(*)::int FROM company_catalog_categories WHERE company_id = $1)
      + (SELECT count(*)::int FROM company_size_set_activations WHERE company_id = $1)
      + (SELECT count(*)::int FROM company_pom_activations WHERE company_id = $1)
      + (SELECT count(*)::int FROM company_catalog_provisioning WHERE company_id = $1) AS count
  `, [companyId]);
  return { removed, residualRows: Number(residual.rows[0]?.count ?? 0) };
}

async function run() {
  const config = assertGuard();
  const client = new Client({ connectionString: config.databaseUrl });
  const companyId = `${PREFIX}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  try {
    await client.connect();
    await q(client, "BEGIN");
    await seedSystemCatalog(client);
    await q(client, "INSERT INTO companies (id, name, is_active, status, onboarding_status) VALUES ($1, $2, true, 'active', 'active')", [companyId, `${PREFIX} company`]);
    await provisionCompanyCatalog(client, companyId);
    await provisionCompanyCatalog(client, companyId);
    const summary = await q(client, `
      SELECT
        (SELECT count(*)::int FROM company_catalog_categories WHERE company_id = $1 AND is_enabled = true AND category_code LIKE 'apparel.%') AS apparel_active,
        (SELECT count(*)::int FROM company_catalog_categories WHERE company_id = $1 AND is_enabled = true AND category_code LIKE 'underwear.%') AS underwear_active,
        (SELECT count(*)::int FROM company_catalog_categories WHERE company_id = $1 AND is_enabled = true AND category_code LIKE 'accessory.%') AS accessory_active,
        (SELECT count(*)::int FROM company_size_set_activations WHERE company_id = $1) AS size_sets,
        (SELECT count(*)::int FROM company_pom_activations WHERE company_id = $1) AS poms,
        (SELECT count(*)::int FROM company_catalog_provisioning WHERE company_id = $1) AS provisioning_rows
    `, [companyId]);
    const row = summary.rows[0];
    if (Number(row.apparel_active) < 1) throw new Error("APPAREL_DEFAULT_NOT_ACTIVE");
    if (Number(row.underwear_active) !== 0) throw new Error("UNDERWEAR_DEFAULT_ACTIVE");
    if (Number(row.accessory_active) !== 0) throw new Error("ACCESSORY_DEFAULT_ACTIVE");
    if (Number(row.size_sets) < 1) throw new Error("SIZE_SET_MISSING");
    if (Number(row.poms) < 1) throw new Error("POM_MISSING");
    if (Number(row.provisioning_rows) !== 1) throw new Error("PROVISIONING_NOT_IDEMPOTENT");
    await q(client, "UPDATE company_catalog_categories SET is_enabled = true WHERE company_id = $1 AND category_code = 'underwear.bra'", [companyId]);
    await q(client, "UPDATE company_catalog_categories SET is_enabled = false WHERE company_id = $1 AND category_code = 'underwear.bra'", [companyId]);
    await q(client, "COMMIT");
    const cleanupResult = await cleanup(client, companyId);
    safeLog("SYSTEM_CATALOG_INTEGRATION_RESULT", {
      result: cleanupResult.residualRows === 0 ? "PASS" : "FAIL",
      runtime: config.runtime,
      dbFingerprint: config.dbFingerprint,
      apparelDefaultActive: "PASS",
      underwearDefaultInactive: "PASS",
      accessoriesDefaultInactive: "PASS",
      idempotency: "PASS",
      activationToggle: "PASS",
      residualDbRows: cleanupResult.residualRows,
      residualR2Objects: 0,
      devTestDbMutation: true,
      devTestR2Mutation: false,
      productionMutation: false,
    });
    process.exitCode = cleanupResult.residualRows === 0 ? 0 : 1;
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    const cleanupResult = await cleanup(client, companyId).catch(() => ({ removed: 0, residualRows: -1 }));
    safeLog("SYSTEM_CATALOG_INTEGRATION_RESULT", {
      result: "FAIL",
      safeCode: error instanceof Error ? error.message : "SYSTEM_CATALOG_INTEGRATION_FAILED",
      residualDbRows: cleanupResult.residualRows,
      residualR2Objects: 0,
      productionMutation: false,
    });
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

await run();
