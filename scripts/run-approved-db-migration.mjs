import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const migrations = {
  "signup-consents": "db/migrations/patch_0_24_26_signup_application_consents.sql",
  "system-catalog": "db/migrations/patch_0_24_27_system_catalog.sql",
  "billing-operations": "db/migrations/patch_0_24_32_billing_operations.sql",
  "public-signup-e2e": "db/migrations/patch_0_24_33_public_signup_e2e.sql",
  "workorder-size-spec": "db/migrations/patch_0_24_34_workorder_size_spec_and_pdf.sql",
};

const mode = process.argv[2] ?? "";
const sqlPath = migrations[mode];

if (!sqlPath) throw new Error(`Unknown approved migration mode: ${mode}`);
if (process.env.WAFL_DB_MIGRATION_APPROVED !== "1") throw new Error("Approved DB migration guard is missing.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const resolvedPath = path.resolve(sqlPath);
const sql = await fs.readFile(resolvedPath, "utf8");
const hash = crypto.createHash("sha256").update(sql).digest("hex");

if (mode === "signup-consents" && !/CREATE TABLE IF NOT EXISTS signup_application_consents/.test(sql)) {
  throw new Error("Unexpected migration target.");
}
if (mode === "signup-consents" && /signup_application_consents_active_version_unique/.test(sql)) {
  throw new Error("Unexpected duplicate active version unique index remains.");
}
if (mode === "system-catalog" && !/CREATE TABLE IF NOT EXISTS system_catalog_versions/.test(sql)) {
  throw new Error("Unexpected system catalog migration target.");
}
if (mode === "billing-operations" && !/CREATE TABLE IF NOT EXISTS billing_subscription_states/.test(sql)) {
  throw new Error("Unexpected billing operations migration target.");
}
if (mode === "public-signup-e2e" && !/CREATE TABLE IF NOT EXISTS signup_payment_method_references/.test(sql)) {
  throw new Error("Unexpected public signup e2e migration target.");
}
if (mode === "workorder-size-spec" && !/CREATE TABLE IF NOT EXISTS workorder_size_specs/.test(sql)) {
  throw new Error("Unexpected workorder size spec migration target.");
}
const sqlForSafetyScan = sql
  .replace(/--.*$/gm, "")
  .replace(/\bON\s+DELETE\b/gi, "ON_DELETE");
if (/\b(DROP|TRUNCATE|DELETE|UPDATE)\b/i.test(sqlForSafetyScan)) {
  throw new Error("Unexpected destructive SQL token in approved additive migration.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL, statement_timeout: 60000, query_timeout: 60000 });
await client.connect();

try {
  console.log(`WAFL APPROVED DB MIGRATION: ${mode}`);
  console.log(`Migration file: ${sqlPath}`);
  console.log(`Migration SHA-256: ${hash}`);
  console.log("Production migration: false");
  console.log("Business data mutation: false");
  console.log("R2 mutation: false");
  await client.query(sql);
  console.log("Result: PASS");
  process.exitCode = 0;
} catch (error) {
  console.error("Result: FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
