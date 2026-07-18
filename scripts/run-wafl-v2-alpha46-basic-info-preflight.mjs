#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.46";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA46 BASIC INFO PREFLIGHT";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMMAND_CODE = "work_order.patch_basic_info";
const CREATED = Object.freeze({
  productName: "QA 기본정보 저장 검증 A - 저장 전",
  dueDate: "2026-09-29",
  totalQuantity: 136,
});
const STATE_PATH = path.resolve(".tmp/wafl-v2-alpha46/basic-info-preflight.json");
const PROPOSED = Object.freeze({
  productName: "QA 기본정보 저장 검증 A",
  dueDate: "2026-09-30",
  totalQuantity: 137,
});

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) {
    fail("database-url-invalid");
  }
  return { fingerprint: sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12) };
}

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL?.trim();
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED || process.env.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED) {
    fail("mutation-approval-must-be-absent");
  }
  const identity = databaseIdentity(connectionString);
  if (!approvedFingerprint || identity.fingerprint !== approvedFingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint: identity.fingerprint, runtime };
}

async function readCandidate(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = await client.query("SELECT count(*)::integer AS count FROM public.wafl_v2_migration_ledger");
    const actor = await client.query(`
      SELECT id, user_id
      FROM public.company_members
      WHERE company_id = $1 AND status = 'approved' AND user_id IS NOT NULL
      ORDER BY created_at, id
      LIMIT 1
    `, [COMPANY_A]);
    const candidate = await client.query(`
      SELECT w.id, w.product_name, w.due_date::text, w.total_quantity,
             w.entity_version AS work_order_version, w.status,
             w.current_revision_id, r.entity_version AS revision_version,
             r.revision_status,
             (SELECT count(*)::integer FROM public.generated_documents d
               WHERE d.company_id = w.company_id AND d.work_order_id = w.id) AS document_count,
             (SELECT count(*)::integer FROM public.document_access_tokens t
               JOIN public.generated_documents d
                 ON d.company_id = t.company_id AND d.id = t.generated_document_id
               WHERE d.company_id = w.company_id AND d.work_order_id = w.id) AS token_count,
             (SELECT count(*)::integer FROM public.work_order_images i
               WHERE i.company_id = w.company_id AND i.work_order_id = w.id AND i.deleted_at IS NULL) AS image_object_count,
             (SELECT count(*)::integer FROM public.work_order_attachments a
               WHERE a.company_id = w.company_id AND a.work_order_id = w.id AND a.deleted_at IS NULL) AS attachment_object_count,
             (SELECT count(*)::integer FROM public.domain_events e
               WHERE e.company_id = w.company_id AND e.entity_type = 'work_order'
                 AND e.entity_id = w.id::text AND e.command_code = $2) AS target_patch_event_count
      FROM public.work_orders w
      JOIN public.work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1
        AND w.product_name = $3
        AND w.due_date = $4::date
        AND w.total_quantity = $5
        AND w.status = 'draft'
        AND r.revision_status = 'draft'
        AND w.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.generated_documents d
          WHERE d.company_id = w.company_id AND d.work_order_id = w.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.work_order_images i
          WHERE i.company_id = w.company_id AND i.work_order_id = w.id AND i.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.work_order_attachments a
          WHERE a.company_id = w.company_id AND a.work_order_id = w.id AND a.deleted_at IS NULL
        )
      ORDER BY w.legacy_source_id, w.id
      LIMIT 1
    `, [COMPANY_A, COMMAND_CODE, CREATED.productName, CREATED.dueDate, CREATED.totalQuantity]);
    const totals = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
        (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
        (SELECT count(*)::integer FROM public.domain_events) AS events,
        (SELECT count(*)::integer FROM public.generated_documents) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens
    `);
    await client.query("COMMIT");
    return {
      ledgerCount: Number(ledger.rows[0]?.count),
      actor: actor.rows[0],
      candidate: candidate.rows[0],
      totals: Object.fromEntries(Object.entries(totals.rows[0] ?? {}).map(([key, value]) => [key, Number(value)])),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString, application_name: "wafl-v2-alpha46-basic-info-preflight" });
  await client.connect();
  try {
    const result = await readCandidate(client);
    const target = result.candidate;
    assert.equal(result.ledgerCount, 12, "migration-ledger-must-remain-12");
    assert.ok(result.actor?.id && result.actor?.user_id, "company-a-approved-actor-missing");
    assert.ok(target?.id && target?.current_revision_id, "qa-draft-a-not-found");
    assert.equal(target.status, "draft");
    assert.equal(target.revision_status, "draft");
    assert.equal(Number(target.document_count), 0);
    assert.equal(Number(target.token_count), 0);
    assert.equal(Number(target.image_object_count), 0);
    assert.equal(Number(target.attachment_object_count), 0);
    assert.notEqual(target.product_name, PROPOSED.productName, "proposed-product-name-must-change");
    assert.notEqual(target.due_date, PROPOSED.dueDate, "proposed-due-date-must-change");
    assert.notEqual(Number(target.total_quantity), PROPOSED.totalQuantity, "proposed-quantity-must-change");

    const state = {
      schemaVersion: 1,
      version: VERSION,
      createdAt: new Date().toISOString(),
      targetAlias: "QA_DRAFT_A",
      runtime: guard.runtime,
      fingerprint: guard.fingerprint,
      companyId: COMPANY_A,
      actor: { companyMemberId: String(result.actor.id), userId: String(result.actor.user_id) },
      target: {
        workOrderId: String(target.id),
        revisionId: String(target.current_revision_id),
        productName: String(target.product_name),
        dueDate: target.due_date === null ? null : String(target.due_date),
        totalQuantity: Number(target.total_quantity),
        workOrderVersion: Number(target.work_order_version),
        revisionVersion: Number(target.revision_version),
        targetPatchEventCount: Number(target.target_patch_event_count),
      },
      proposed: PROPOSED,
      baseline: result.totals,
      evidence: { ledgerCount: result.ledgerCount, documents: 0, tokens: 0, r2ObjectTies: 0 },
    };
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

    console.log(`WAFL v2 alpha.46 basic-info preflight: ${VERSION}`);
    console.log("Target alias: QA_DRAFT_A");
    console.log(`Approved dev/test fingerprint prefix: ${guard.fingerprint.slice(0, 6)}`);
    console.log(`Migration ledger: ${result.ledgerCount}/12`);
    console.log("WorkOrder/revision status: draft/draft");
    console.log(`Current product name: ${target.product_name}`);
    console.log(`Current due date: ${target.due_date ?? "미정"}`);
    console.log(`Current total quantity: ${Number(target.total_quantity)}`);
    console.log(`Current entity versions: workOrder=${Number(target.work_order_version)}, revision=${Number(target.revision_version)}`);
    console.log(`Proposed product name: ${PROPOSED.productName}`);
    console.log(`Proposed due date: ${PROPOSED.dueDate}`);
    console.log(`Proposed total quantity: ${PROPOSED.totalQuantity}`);
    console.log("Generated document/token/R2 object ties: 0/0/0");
    console.log("DB/R2/PDF/token/production mutation: 0");
    console.log("Mutation approval present: false");
    console.log("Result: PASS — owner approval pending");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("WAFL v2 alpha.46 basic-info preflight failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
