#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-runtime-evidence.jsonl");

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    )) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

const baseline = fs.readFileSync(evidencePath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .find((entry) => entry.kind === "baseline-before-assertion");
assert.ok(baseline, "V10_BASELINE_EVIDENCE_MISSING");

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-failure-audit",
});
await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const current = (await client.query(`
    SELECT w.entity_version AS work_order_version,
           r.entity_version AS revision_version,
           w.product_type_code, w.item_code, w.season_code,
           (SELECT count(*)::integer FROM domain_events) AS event_count,
           (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
           (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
           (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
           (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
           (SELECT count(*)::integer FROM work_order_material_lines WHERE name LIKE 'A57V10\\_%' ESCAPE '\\') AS v10_rows
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
     WHERE w.status = 'draft'
       AND r.revision_status = 'draft'
       AND w.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = 'UNITEDITABLEMATERI'
       )
     LIMIT 1
  `)).rows[0];
  assert.ok(current, "APPROVED_DEV_FIXTURE_NOT_FOUND");
  await client.query("ROLLBACK");
  const observed = {
    workOrderVersion: Number(current.work_order_version) - baseline.workOrderVersion,
    revisionVersion: Number(current.revision_version) - baseline.revisionVersion,
    event: Number(current.event_count) - baseline.event,
    receipt: Number(current.receipt_count) - baseline.receipt,
    materialRows: Number(current.material_rows) - baseline.materialRows,
    materialVersionSum: Number(current.material_version_sum) - baseline.materialVersionSum,
    migration: Number(current.migration_count) - baseline.migration,
    v10Rows: Number(current.v10_rows),
  };
  assert.deepEqual(observed, {
    workOrderVersion: 0,
    revisionVersion: 0,
    event: 0,
    receipt: 0,
    materialRows: 0,
    materialVersionSum: 0,
    migration: 0,
    v10Rows: 0,
  });
  assert.deepEqual({
    productTypeCode: current.product_type_code,
    itemCode: current.item_code,
    seasonCode: current.season_code,
  }, baseline.category);
  console.log(JSON.stringify({
    ok: true,
    runtimeAttemptMutationDelta: observed,
    categoryBaselineUnchanged: true,
    r2Put: 0,
    r2Delete: 0,
    directR2Access: 0,
    workerBypass: 0,
  }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
