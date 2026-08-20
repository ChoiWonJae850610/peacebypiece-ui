#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const companyId = "wafl-fn-company-a";
const prefix = "QA A66 계보 필터";
const resultPath = path.resolve(".tmp/wafl-v2-alpha66/lineage-fixture.json");
const expectedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim();
const short = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function guard() {
  const url = process.env.DATABASE_URL;
  assert.ok(url, "database-url-missing");
  assert.ok(["development", "test"].includes(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.match(expectedFingerprint, /^[0-9a-f]{12}$/iu, "approved-fingerprint-missing");
  const parsed = new URL(url);
  assert.equal(short(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`), expectedFingerprint, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_ALPHA66_SYNTHETIC_LINEAGE_FIXTURE_APPROVED, "2.0.0-alpha.66-synthetic-lineage-fixture-reviewed", "fixture-approval-missing");
  return url;
}

async function main() {
  const client = new Client({ connectionString: guard(), application_name: "wafl-v2-alpha66-lineage-fixture", statement_timeout: 120000 });
  await client.connect();
  let marker = null;
  try {
    const ledger = Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count);
    assert.ok(ledger === 19 || ledger === 20, "migration-ledger-must-be-19-or-20");
    const existingIds = (await client.query("SELECT id::text FROM work_orders WHERE company_id=$1 AND product_name LIKE $2", [companyId, `${prefix}%`])).rows.map((row) => row.id);
    if (existingIds.length > 0) {
      await client.query("BEGIN");
      try {
        await client.query(`UPDATE work_orders SET current_revision_id=NULL,source_work_order_id=NULL,source_revision_id=NULL,series_root_work_order_id=NULL,derivation_kind='original',reorder_round=0,is_sample=false WHERE company_id=$1 AND id=ANY($2::uuid[])`, [companyId, existingIds]);
        await client.query("DELETE FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [companyId, existingIds]);
        await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [companyId, existingIds]);
        await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=ANY($2::uuid[])", [companyId, existingIds]);
        await client.query("COMMIT");
      } catch (error) { await client.query("ROLLBACK"); throw error; }
    }
    const actor = (await client.query("SELECT created_by_member_id FROM work_orders WHERE company_id=$1 AND created_by_member_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1", [companyId])).rows[0]?.created_by_member_id;
    assert.ok(actor, "dev-test-actor-missing");
    marker = `${prefix} ${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const definitions = [
      { key: "general", suffix: "01 본생산 원본", isSample: false, kind: "original", round: 0, source: null, root: null },
      { key: "sample", suffix: "02 Sample 원본", isSample: true, kind: "original", round: 0, source: null, root: null },
      { key: "reorder1", suffix: "03 1차 리오더", isSample: false, kind: "reorder", round: 1, source: "general", root: "general" },
      { key: "reorder2", suffix: "04 2차 리오더", isSample: false, kind: "reorder", round: 2, source: "reorder1", root: "general" },
      { key: "reworkOriginal", suffix: "05 원본 재작업", isSample: false, kind: "rework", round: 0, source: "general", root: "general" },
      { key: "reworkReorder2", suffix: "06 2차 리오더 재작업", isSample: false, kind: "rework", round: 2, source: "reorder2", root: "general" },
      { key: "sampleRework", suffix: "07 Sample 재작업", isSample: true, kind: "rework", round: 0, source: "sample", root: "sample" },
    ];
    const rows = new Map();
    await client.query("BEGIN");
    try {
      for (const definition of definitions) {
        const workOrderId = randomUUID();
        const revisionId = randomUUID();
        const source = definition.source ? rows.get(definition.source) : null;
        const root = definition.root ? rows.get(definition.root) : null;
        assert.equal(Boolean(definition.source), Boolean(source));
        assert.equal(Boolean(definition.root), Boolean(root));
        const productName = `${marker} ${definition.suffix}`;
        await client.query(`
          INSERT INTO work_orders(id,company_id,product_name,status,total_quantity,created_by_member_id,entity_version,is_sample,derivation_kind,source_work_order_id,source_revision_id,series_root_work_order_id,reorder_round)
          VALUES($1::uuid,$2,$3,'draft',100,$4,1,$5,$6,$7::uuid,$8::uuid,$9::uuid,$10)
        `, [workOrderId, companyId, productName, actor, definition.isSample, definition.kind, source?.workOrderId ?? null, source?.revisionId ?? null, root?.workOrderId ?? null, definition.round]);
        await client.query(`
          INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,product_name_snapshot,total_quantity_snapshot,author_member_id,entity_version)
          VALUES($1::uuid,$2,$3::uuid,0,'draft',$4,100,$5,1)
        `, [revisionId, companyId, workOrderId, productName, actor]);
        await client.query("UPDATE work_orders SET current_revision_id=$3::uuid WHERE company_id=$1 AND id=$2::uuid", [companyId, workOrderId, revisionId]);
        rows.set(definition.key, { workOrderId, revisionId, productName, ...definition });
      }
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const persisted = (await client.query(`SELECT id::text,product_name,is_sample,derivation_kind,source_work_order_id::text,source_revision_id::text,series_root_work_order_id::text,reorder_round,current_revision_id::text FROM work_orders WHERE company_id=$1 AND product_name LIKE $2 ORDER BY product_name`, [companyId, `${marker}%`])).rows;
    assert.equal(persisted.length, 7);
    assert.deepEqual(persisted.map((row) => row.derivation_kind), ["original", "original", "reorder", "reorder", "rework", "rework", "rework"]);
    assert.equal(persisted.filter((row) => row.is_sample).length, 2);
    assert.deepEqual(persisted.map((row) => Number(row.reorder_round)), [0, 0, 1, 2, 0, 2, 0]);
    const evidence = {
      result: "ALPHA66_SYNTHETIC_LINEAGE_FIXTURE_PASS",
      marker,
      markerRef: short(marker),
      rows: persisted.map((row) => ({ workOrderRef: short(row.id), name: row.product_name, isSample: row.is_sample, derivationKind: row.derivation_kind, reorderRound: Number(row.reorder_round), sourceRef: row.source_work_order_id ? short(row.source_work_order_id) : null, rootRef: row.series_root_work_order_id ? short(row.series_root_work_order_id) : null })),
      migrationLedger: `${ledger}/${ledger}`,
      retainedForPhysicalQa: true,
      productionMutation: 0,
      ownerFixtureMutation: 0,
    };
    await fs.mkdir(path.dirname(resultPath), { recursive: true });
    await fs.writeFile(resultPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, marker, markerRef: evidence.markerRef, rows: evidence.rows.length, migrationLedger: evidence.migrationLedger, productionMutation: 0, ownerFixtureMutation: 0 }));
  } finally { await client.end(); }
}

main().catch((error) => { console.error("alpha66-lineage-fixture-failed", { errorName: error instanceof Error ? error.name : "UnknownError", errorCode: error instanceof Error ? error.message : "UNKNOWN" }); process.exitCode = 1; });
