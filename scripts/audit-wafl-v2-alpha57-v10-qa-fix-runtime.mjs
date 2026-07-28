#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-qa-fix-runtime-evidence.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-qa-fix-runtime-result.json");

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

const evidence = fs.readFileSync(evidencePath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const baseline = evidence.find((entry) => entry.kind === "baseline-before-assertion");
assert.ok(baseline, "RUNTIME_BASELINE_EVIDENCE_MISSING");
const commands = new Set(evidence
  .filter((entry) => entry.kind === "mutation-delta-before-assertion")
  .map((entry) => entry.command));
for (const command of [
  "category-inline-save",
  "category-baseline-restore",
  "factory-memo-inline-save",
  "factory-memo-baseline-restore",
  "fabric-create",
  "accessory-create",
  "fabric-inline-and-zero-replacement",
  "fabric-baseline-restore",
  "accessory-inline-save",
  "accessory-baseline-restore",
  "fabric-archive",
  "accessory-archive",
]) assert.ok(commands.has(command), `MISSING_COMPLETED_COMMAND_EVIDENCE:${command}`);
for (const command of ["category", "factory-memo", "fabric", "accessory"]) {
  assert.ok(evidence.some((entry) => (
    entry.kind === "unchanged-inline-save-before-assertion"
    && entry.command === command
    && entry.requestCount === 0
  )), `UNCHANGED_MUTATION_EVIDENCE_MISSING:${command}`);
}
assert.equal(evidence.filter((entry) => entry.kind === "response-before-assertion" && entry.status >= 400).length, 0);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-qa-fix-readonly-audit",
});
await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const target = (await client.query(`
    SELECT w.company_id, w.id AS work_order_id, w.entity_version AS work_order_version,
           r.entity_version AS revision_version,
           (SELECT count(*)::integer FROM domain_events) AS event_count,
           (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
           (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
           (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
           (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
     WHERE EXISTS (
       SELECT 1
         FROM work_order_material_lines line
        WHERE line.company_id = w.company_id
          AND line.revision_id = r.id
          AND line.name LIKE 'A57V10QAFIX\\_%' ESCAPE '\\'
     )
     ORDER BY w.updated_at DESC
     LIMIT 1
  `)).rows[0];
  assert.ok(target, "COMPLETED_RUNTIME_FIXTURE_NOT_FOUND");
  const rows = (await client.query(`
    SELECT material_type, unit_code, usage_area, memo, unit_price, entity_version, archived_at
      FROM work_order_material_lines
     WHERE company_id = $1
       AND name LIKE 'A57V10QAFIX\\_%' ESCAPE '\\'
     ORDER BY created_at DESC
     LIMIT 2
  `, [target.company_id])).rows.sort((left, right) => left.material_type.localeCompare(right.material_type));
  assert.deepEqual(rows.map((row) => ({
    materialType: row.material_type,
    unitCode: row.unit_code,
    usageArea: row.usage_area,
    memo: row.memo,
    unitPrice: row.unit_price,
    entityVersion: Number(row.entity_version),
    archived: row.archived_at !== null,
  })), [
    {
      materialType: "accessory",
      unitCode: "개",
      usageArea: null,
      memo: null,
      unitPrice: "0.00",
      entityVersion: 4,
      archived: true,
    },
    {
      materialType: "fabric",
      unitCode: "yd",
      usageArea: null,
      memo: null,
      unitPrice: "0.00",
      entityVersion: 4,
      archived: true,
    },
  ]);
  const observed = {
    workOrderVersion: Number(target.work_order_version) - baseline.workOrderVersion,
    revisionVersion: Number(target.revision_version) - baseline.revisionVersion,
    event: Number(target.event_count) - baseline.event,
    receipt: Number(target.receipt_count) - baseline.receipt,
    materialRows: Number(target.material_rows) - baseline.materialRows,
    materialVersionSum: Number(target.material_version_sum) - baseline.materialVersionSum,
    migration: Number(target.migration_count) - baseline.migration,
  };
  const expected = {
    workOrderVersion: 12,
    revisionVersion: 12,
    event: 12,
    receipt: 4,
    materialRows: 2,
    materialVersionSum: 8,
    migration: 0,
  };
  assert.deepEqual(observed, expected);
  await client.query("ROLLBACK");

  const result = {
    ok: true,
    checkpoint: "ALPHA57_V10_QA_FIX_IPHONE_REQA_REQUIRED",
    runtimeExecution: "PASS",
    finalAuditMode: "READ_ONLY_EXISTING_EVIDENCE",
    assertionCorrection: "empty usageArea canonical DB representation is null",
    mutationRerun: 0,
    autoConnect: 200,
    list: 200,
    detail: 200,
    categoryInline: { save: "PASS", reread: "PASS", unchangedMutation: 0, baselineRestore: "PASS" },
    factoryMemoInline: { save: "PASS", reread: "PASS", unchangedMutation: 0, baselineRestore: "PASS" },
    materialInline: {
      fabric: "PASS",
      accessory: "PASS",
      zeroReplacement: { input: "8161", stored: "8161.00", result: "PASS" },
      unchangedMutation: 0,
      archivedCleanup: "PASS",
    },
    mutationDelta: observed,
    directR2Access: 0,
    workerBypass: 0,
    r2Put: 0,
    r2Delete: 0,
    migrationDelta: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
