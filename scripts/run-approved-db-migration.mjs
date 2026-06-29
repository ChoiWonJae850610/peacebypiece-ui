import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const migrations = {
  "signup-consents": "db/migrations/patch_0_24_26_signup_application_consents.sql",
};

const mode = process.argv[2] ?? "";
const sqlPath = migrations[mode];

if (!sqlPath) throw new Error(`Unknown approved migration mode: ${mode}`);
if (process.env.WAFL_DB_MIGRATION_APPROVED !== "1") throw new Error("Approved DB migration guard is missing.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const resolvedPath = path.resolve(sqlPath);
const sql = await fs.readFile(resolvedPath, "utf8");
const hash = crypto.createHash("sha256").update(sql).digest("hex");

if (!/CREATE TABLE IF NOT EXISTS signup_application_consents/.test(sql)) {
  throw new Error("Unexpected migration target.");
}
if (/signup_application_consents_active_version_unique/.test(sql)) {
  throw new Error("Unexpected duplicate active version unique index remains.");
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
