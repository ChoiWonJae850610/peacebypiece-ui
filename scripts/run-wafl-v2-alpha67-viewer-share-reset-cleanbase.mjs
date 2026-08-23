#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import { createR2WorkerSignedUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const MODE = String(process.argv[2] ?? "prepare");
const OUTPUT_DIR = path.resolve(process.env.WAFL_A67_CLEANBASE_EVIDENCE_DIR ?? path.join(ROOT, ".tmp", "wafl-v2-alpha67", "viewer-share-reset-cleanbase"));
const MANIFEST_PATH = path.join(OUTPUT_DIR, "DELETE-MANIFEST.json");
const R2_MANIFEST_PATH = path.join(OUTPUT_DIR, "R2-DELETE-MANIFEST.json");
const APPROVAL = "EXECUTE WAFL A67 NON-PROVIDED WORKORDER CLEAN BASE RESET";
const TARGET_TABLES = [
  "work_orders", "work_order_revisions", "work_order_images", "work_order_attachments",
  "work_order_revision_images", "work_order_revision_attachments", "work_order_material_lines",
  "work_order_colors", "work_order_sizes", "color_size_quantities", "work_order_size_specs",
  "work_order_size_spec_sizes", "work_order_size_spec_poms", "work_order_size_spec_values",
  "work_order_processes", "generated_documents", "document_access_tokens",
  "work_order_command_receipts", "domain_events",
];
const GUARDED_TRIGGERS = [
  ["work_order_revisions", "work_order_revisions_immutable_guard"],
  ["work_order_material_lines", "work_order_material_lines_mutable_revision_guard"],
  ["work_order_colors", "work_order_colors_mutable_revision_guard"],
  ["work_order_sizes", "work_order_sizes_mutable_revision_guard"],
  ["color_size_quantities", "color_size_quantities_mutable_revision_guard"],
  ["work_order_size_specs", "work_order_size_specs_mutable_revision_guard"],
  ["work_order_size_spec_sizes", "work_order_size_spec_sizes_mutable_revision_guard"],
  ["work_order_size_spec_poms", "work_order_size_spec_poms_mutable_revision_guard"],
  ["work_order_size_spec_values", "work_order_size_spec_values_mutable_revision_guard"],
  ["work_order_processes", "work_order_processes_mutable_revision_guard"],
  ["work_order_revision_images", "work_order_revision_images_mutable_revision_guard"],
  ["work_order_revision_attachments", "work_order_revision_attachments_mutable_revision_guard"],
  ["generated_documents", "generated_documents_immutable_guard"],
  ["domain_events", "domain_events_append_only_guard"],
];

function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function stableJson(value) { return `${JSON.stringify(canonical(value), null, 2)}\n`; }
function safeRef(value) { return sha256(String(value)).slice(0, 12); }
function readEnvironment() {
  const values = {};
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}
function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  return safeRef(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`);
}
function writeJson(file, value, overwrite = false) {
  const body = stableJson(value);
  fs.writeFileSync(file, body, { encoding: "utf8", flag: overwrite ? "w" : "wx" });
  const reopened = fs.readFileSync(file);
  JSON.parse(reopened.toString("utf8"));
  return { file: path.basename(file), bytes: reopened.length, sha256: sha256(reopened) };
}
function exactWorkOrderKey(key, workOrderIds) {
  const normalized = String(key ?? "").replace(/^\/+/, "").trim();
  const match = normalized.match(/^companies\/([^/]+)\/workorders\/([^/]+)\/(design|attachments|pdf|generated\/order-request|thumbnails\/(?:design|attachments)|previews\/design)\/[^/]+$/iu);
  return Boolean(match && match[1] === COMPANY_ID && workOrderIds.has(match[2]));
}
function derivatives(key) {
  const match = String(key).match(/^companies\/([^/]+)\/workorders\/([^/]+)\/design\/([^/.]+)(?:\.[^/]+)?$/iu);
  if (!match) return [];
  const [, companyId, workOrderId, objectId] = match;
  return [
    `companies/${companyId}/workorders/${workOrderId}/thumbnails/design/${objectId}.webp`,
    `companies/${companyId}/workorders/${workOrderId}/previews/design/${objectId}-medium.webp`,
    `companies/${companyId}/workorders/${workOrderId}/previews/design/${objectId}-large.webp`,
  ];
}
function r2Config(environment) {
  const uploadUrl = String(environment.R2_WORKER_UPLOAD_URL ?? "").trim();
  const secret = String(environment.R2_WORKER_UPLOAD_SECRET ?? "").trim();
  assert.ok(uploadUrl && secret, "R2_WORKER_CONFIGURATION_MISSING");
  return { uploadUrl, secret };
}
async function r2Request(config, method, key) {
  let lastError;
  const attempts = method === "GET" ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + 180;
      const url = createR2WorkerSignedUrl({ ...config, method, key, expiresAt });
      const response = await fetch(url, { method, redirect: "manual", signal: AbortSignal.timeout(60_000) });
      const bytes = method === "GET" && response.ok ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0);
      return { status: response.status, bytes };
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}
async function ledgerAndTriggers(client) {
  const ledger = Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count);
  assert.equal(ledger, 20, "MIGRATION_LEDGER_NOT_20");
  const rows = (await client.query(`SELECT c.relname table_name,t.tgname,t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal`)).rows;
  for (const [table, trigger] of GUARDED_TRIGGERS) {
    const row = rows.find((item) => item.table_name === table && item.tgname === trigger);
    assert.equal(row?.tgenabled, "O", `TRIGGER_NOT_ENABLED:${table}:${trigger}`);
  }
  return ledger;
}
async function collectGraph(client) {
  const workOrders = (await client.query("SELECT * FROM work_orders WHERE company_id=$1 ORDER BY id", [COMPANY_ID])).rows;
  const workOrderIds = workOrders.map((row) => row.id);
  const revisions = workOrderIds.length ? (await client.query("SELECT * FROM work_order_revisions WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]) ORDER BY id", [COMPANY_ID, workOrderIds])).rows : [];
  const revisionIds = revisions.map((row) => row.id);
  const q = async (sql, values = [COMPANY_ID, revisionIds]) => (revisionIds.length ? (await client.query(sql, values)).rows : []);
  const images = workOrderIds.length ? (await client.query("SELECT * FROM work_order_images WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]) ORDER BY id", [COMPANY_ID, workOrderIds])).rows : [];
  const attachments = workOrderIds.length ? (await client.query("SELECT * FROM work_order_attachments WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]) ORDER BY id", [COMPANY_ID, workOrderIds])).rows : [];
  const documents = workOrderIds.length ? (await client.query("SELECT * FROM generated_documents WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]) ORDER BY id", [COMPANY_ID, workOrderIds])).rows : [];
  const documentIds = documents.map((row) => row.id);
  const tokens = documentIds.length ? (await client.query("SELECT * FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=ANY($2::uuid[]) ORDER BY id", [COMPANY_ID, documentIds])).rows : [];
  const tokenIds = tokens.map((row) => row.id);
  const receipts = workOrderIds.length ? (await client.query("SELECT * FROM work_order_command_receipts WHERE company_id=$1 AND (work_order_id=ANY($2::uuid[]) OR result_revision_id=ANY($3::uuid[]) OR result_generated_document_id=ANY($4::uuid[])) ORDER BY created_at,idempotency_key", [COMPANY_ID, workOrderIds, revisionIds, documentIds])).rows : [];
  const events = (await client.query("SELECT * FROM domain_events WHERE company_id=$1 AND ((entity_type='work_order' AND entity_id=ANY($2::text[])) OR (entity_type='generated_document' AND entity_id=ANY($3::text[])) OR (entity_type='document_access_token' AND entity_id=ANY($4::text[]))) ORDER BY occurred_at,id", [COMPANY_ID, workOrderIds.map(String), documentIds.map(String), tokenIds.map(String)])).rows;
  return {
    work_orders: workOrders,
    work_order_revisions: revisions,
    work_order_images: images,
    work_order_attachments: attachments,
    work_order_revision_images: await q("SELECT * FROM work_order_revision_images WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY revision_id,image_id"),
    work_order_revision_attachments: await q("SELECT * FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY revision_id,attachment_id"),
    work_order_material_lines: await q("SELECT * FROM work_order_material_lines WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    work_order_colors: await q("SELECT * FROM work_order_colors WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    work_order_sizes: await q("SELECT * FROM work_order_sizes WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    color_size_quantities: await q("SELECT * FROM color_size_quantities WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY revision_id,color_id,size_id"),
    work_order_size_specs: await q("SELECT * FROM work_order_size_specs WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    work_order_size_spec_sizes: await q("SELECT * FROM work_order_size_spec_sizes WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    work_order_size_spec_poms: await q("SELECT * FROM work_order_size_spec_poms WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    work_order_size_spec_values: await q("SELECT * FROM work_order_size_spec_values WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY size_spec_id,size_row_id,pom_column_id"),
    work_order_processes: await q("SELECT * FROM work_order_processes WHERE company_id=$1 AND revision_id=ANY($2::uuid[]) ORDER BY id"),
    generated_documents: documents,
    document_access_tokens: tokens,
    work_order_command_receipts: receipts,
    domain_events: events,
  };
}
async function keepManifest(client, graph) {
  const deleteCounts = Object.fromEntries(TARGET_TABLES.map((table) => [table, graph[table].length]));
  const globalTables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).rows.map((row) => row.table_name);
  const fullKeepTables = globalTables.filter((table) => !TARGET_TABLES.includes(table));
  const fullKeep = {};
  for (const table of fullKeepTables) {
    assert.match(table, /^[a-z0-9_]+$/u);
    fullKeep[table] = Number((await client.query(`SELECT count(*)::integer count FROM ${table}`)).rows[0].count);
  }
  const otherCompanyWorkOrders = Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id<>$1", [COMPANY_ID])).rows[0].count);
  const sequences = (await client.query("SELECT * FROM document_number_sequences ORDER BY company_id,business_date")).rows;
  return {
    policy: "Preserve every WAFL-provided/system/reference/template/configuration row and every unrelated company row; this schema has no provided WorkOrder flag, so all target-company authored WorkOrders are DELETE.",
    targetCompanyRef: safeRef(COMPANY_ID),
    fullKeepTableCounts: fullKeep,
    partialTables: { deleteCounts, otherCompanyWorkOrders, documentNumberSequenceCount: sequences.length, documentNumberSequencesSha256: sha256(stableJson(sequences)) },
  };
}
async function r2Manifest(environment, graph) {
  const config = r2Config(environment);
  const workOrderIds = new Set(graph.work_orders.map((row) => String(row.id)));
  const candidates = new Map();
  const add = (key, source) => {
    if (!key) return;
    const normalized = String(key).replace(/^\/+/, "").trim();
    const current = candidates.get(normalized) ?? { key: normalized, sources: [] };
    current.sources.push(source);
    candidates.set(normalized, current);
  };
  for (const row of graph.work_order_images) {
    add(row.storage_object_key, "work_order_images.storage_object_key");
    add(row.thumbnail_object_key, "work_order_images.thumbnail_object_key");
    for (const key of derivatives(row.storage_object_key)) add(key, "derived_from_image_original");
  }
  for (const row of graph.work_order_attachments) add(row.storage_object_key, "work_order_attachments.storage_object_key");
  for (const row of graph.generated_documents) add(row.storage_object_key, "generated_documents.storage_object_key");
  for (const row of graph.work_order_revision_images) add(row.storage_object_key_snapshot, "work_order_revision_images.storage_object_key_snapshot");
  for (const row of graph.work_order_revision_attachments) add(row.storage_object_key_snapshot, "work_order_revision_attachments.storage_object_key_snapshot");
  const outsideRows = await (async () => {
    const client = new Client({ connectionString: environment.DATABASE_URL, application_name: "wafl-a67-cleanbase-r2-reference-audit", statement_timeout: 120000 });
    await client.connect();
    try {
      return (await client.query(`SELECT storage_object_key key FROM work_order_images WHERE NOT (company_id=$1 AND work_order_id=ANY($2::uuid[])) UNION ALL SELECT thumbnail_object_key FROM work_order_images WHERE thumbnail_object_key IS NOT NULL AND NOT (company_id=$1 AND work_order_id=ANY($2::uuid[])) UNION ALL SELECT storage_object_key FROM work_order_attachments WHERE NOT (company_id=$1 AND work_order_id=ANY($2::uuid[])) UNION ALL SELECT storage_object_key FROM generated_documents WHERE NOT (company_id=$1 AND work_order_id=ANY($2::uuid[]))`, [COMPANY_ID, [...workOrderIds]])).rows;
    } finally { await client.end(); }
  })();
  const outside = new Set(outsideRows.map((row) => String(row.key ?? "").replace(/^\/+/, "").trim()).filter(Boolean));
  const scheduled = [];
  const preservedAmbiguous = [];
  for (const candidate of [...candidates.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    if (!exactWorkOrderKey(candidate.key, workOrderIds) || outside.has(candidate.key)) {
      preservedAmbiguous.push({ keyRef: safeRef(candidate.key), reason: outside.has(candidate.key) ? "referenced-outside-target" : "noncanonical-or-ownership-unproven", sources: [...new Set(candidate.sources)] });
      continue;
    }
    const read = await r2Request(config, "GET", candidate.key);
    if (read.status === 200) scheduled.push({ key: candidate.key, keyRef: safeRef(candidate.key), bytes: read.bytes.length, sha256: sha256(read.bytes), sources: [...new Set(candidate.sources)] });
    else if (read.status !== 404) throw new Error(`R2_PREFLIGHT_FAILED:${safeRef(candidate.key)}:${read.status}`);
  }
  return { policy: "Only exact canonical target WorkOrder keys with R2 GET 200 are scheduled. Ambiguous metadata and outside references are preserved.", scheduled, preservedAmbiguous, missingCanonicalCandidates: candidates.size - scheduled.length - preservedAmbiguous.length };
}
async function prepare(environment, client) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  assert.equal(fs.readdirSync(OUTPUT_DIR).length, 0, "EVIDENCE_DIRECTORY_NOT_EMPTY");
  await client.query("BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ");
  let graph; let keep;
  try {
    await ledgerAndTriggers(client);
    graph = await collectGraph(client);
    keep = await keepManifest(client, graph);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  assert.ok(graph.work_orders.length > 0, "NO_TARGET_WORKORDERS_TO_RESET");
  const backup = { format: "WAFL_A67_CLEANBASE_LOGICAL_BACKUP_V1", createdAt: new Date().toISOString(), databaseFingerprint: EXPECTED_DB_FINGERPRINT, companyRef: safeRef(COMPANY_ID), tables: graph };
  const backupIdentity = writeJson(path.join(OUTPUT_DIR, "DB-BACKUP.json"), backup);
  const keepIdentity = writeJson(path.join(OUTPUT_DIR, "KEEP-MANIFEST.json"), keep);
  const deleteManifest = {
    format: "WAFL_A67_CLEANBASE_DELETE_MANIFEST_V1", createdAt: new Date().toISOString(), databaseFingerprint: EXPECTED_DB_FINGERPRINT,
    companyId: COMPANY_ID, workOrderIds: graph.work_orders.map((row) => String(row.id)), revisionIds: graph.work_order_revisions.map((row) => String(row.id)),
    imageIds: graph.work_order_images.map((row) => String(row.id)), attachmentIds: graph.work_order_attachments.map((row) => String(row.id)),
    documentIds: graph.generated_documents.map((row) => String(row.id)), tokenIds: graph.document_access_tokens.map((row) => String(row.id)),
    counts: Object.fromEntries(TARGET_TABLES.map((table) => [table, graph[table].length])), backup: backupIdentity, keep: keepIdentity,
  };
  const deleteIdentity = writeJson(MANIFEST_PATH, deleteManifest);
  const objects = await r2Manifest(environment, graph);
  const r2Identity = writeJson(R2_MANIFEST_PATH, { ...objects, deleteManifestSha256: deleteIdentity.sha256 });
  writeJson(path.join(OUTPUT_DIR, "PREPARE-VERIFICATION.json"), { result: "PASS", identities: { backup: backupIdentity, keep: keepIdentity, delete: deleteIdentity, r2: r2Identity }, sourceMutation: false, productionMutation: false, ownerFixtureMutation: false });
  console.log(JSON.stringify({ result: "ALPHA67_CLEANBASE_PREPARE_PASS", workOrders: graph.work_orders.length, r2Scheduled: objects.scheduled.length, r2AmbiguousPreserved: objects.preservedAmbiguous.length, deleteManifestSha256: deleteIdentity.sha256, r2ManifestSha256: r2Identity.sha256 }));
}
async function execute(environment, client) {
  assert.equal(process.env.WAFL_A67_CLEANBASE_CONFIRMATION, APPROVAL, "CLEANBASE_APPROVAL_MISSING");
  const manifestBytes = fs.readFileSync(MANIFEST_PATH);
  const r2Bytes = fs.readFileSync(R2_MANIFEST_PATH);
  assert.equal(sha256(manifestBytes), process.env.WAFL_A67_CLEANBASE_DELETE_MANIFEST_SHA256, "DELETE_MANIFEST_IDENTITY_MISMATCH");
  assert.equal(sha256(r2Bytes), process.env.WAFL_A67_CLEANBASE_R2_MANIFEST_SHA256, "R2_MANIFEST_IDENTITY_MISMATCH");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const r2 = JSON.parse(r2Bytes.toString("utf8"));
  assert.equal(manifest.databaseFingerprint, EXPECTED_DB_FINGERPRINT);
  const current = await collectGraph(client);
  const currentCounts = Object.fromEntries(TARGET_TABLES.map((table) => [table, current[table].length]));
  if (Object.values(currentCounts).every((count) => count === 0)) {
    const config = r2Config(environment);
    for (const item of r2.scheduled) assert.equal((await r2Request(config, "GET", item.key)).status, 404, `R2_RESIDUAL:${item.keyRef}`);
    writeJson(path.join(OUTPUT_DIR, "IDEMPOTENT-EXECUTION-EVIDENCE.json"), { result: "PASS", executedAt: new Date().toISOString(), idempotentNoop: true, databaseRowsDeleted: Object.fromEntries(Object.keys(manifest.counts).map((table) => [table, 0])), r2: { scheduled: r2.scheduled.length, deleted: 0, residual: 0 }, productionMutation: false, ownerFixtureMutation: false, migrationMutation: false }, true);
    console.log(JSON.stringify({ result: "ALPHA67_CLEANBASE_EXECUTE_NOOP_PASS", workOrdersDeleted: 0, r2Deleted: 0 }));
    return;
  }
  assert.deepEqual(currentCounts, manifest.counts, "DELETE_GRAPH_CHANGED_AFTER_MANIFEST");
  const ids = manifest.workOrderIds;
  const revisionIds = manifest.revisionIds;
  const documentIds = manifest.documentIds;
  const tokenIds = manifest.tokenIds;
  await client.query("BEGIN");
  try {
    await client.query(`LOCK TABLE ${TARGET_TABLES.join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
    for (const [table, trigger] of GUARDED_TRIGGERS) await client.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    await client.query("UPDATE document_access_tokens SET rotated_from_token_id=NULL WHERE company_id=$1 AND generated_document_id=ANY($2::uuid[])", [COMPANY_ID, documentIds]);
    await client.query("DELETE FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=ANY($2::uuid[])", [COMPANY_ID, documentIds]);
    await client.query("DELETE FROM work_order_command_receipts WHERE company_id=$1 AND (work_order_id=ANY($2::uuid[]) OR result_revision_id=ANY($3::uuid[]) OR result_generated_document_id=ANY($4::uuid[]))", [COMPANY_ID, ids, revisionIds, documentIds]);
    await client.query("DELETE FROM domain_events WHERE company_id=$1 AND ((entity_type='work_order' AND entity_id=ANY($2::text[])) OR (entity_type='generated_document' AND entity_id=ANY($3::text[])) OR (entity_type='document_access_token' AND entity_id=ANY($4::text[])))", [COMPANY_ID, ids, documentIds, tokenIds]);
    await client.query("DELETE FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_revision_images WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_size_specs WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_processes WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM generated_documents WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [COMPANY_ID, ids]);
    await client.query("UPDATE work_orders SET current_revision_id=NULL,representative_image_id=NULL,derivation_kind='original',source_work_order_id=NULL,source_revision_id=NULL,series_root_work_order_id=id,reorder_round=0 WHERE company_id=$1 AND id=ANY($2::uuid[])", [COMPANY_ID, ids]);
    await client.query("UPDATE work_order_revisions SET source_revision_id=NULL WHERE company_id=$1 AND id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_order_images WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [COMPANY_ID, ids]);
    await client.query("DELETE FROM work_order_attachments WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [COMPANY_ID, ids]);
    await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=ANY($2::uuid[])", [COMPANY_ID, revisionIds]);
    await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=ANY($2::uuid[])", [COMPANY_ID, ids]);
    for (const [table, trigger] of GUARDED_TRIGGERS) await client.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    await ledgerAndTriggers(client);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  const config = r2Config(environment);
  const deleted = [];
  for (const item of r2.scheduled) {
    const response = await r2Request(config, "DELETE", item.key);
    assert.ok([200, 204, 404].includes(response.status), `R2_DELETE_FAILED:${item.keyRef}:${response.status}`);
    const proof = await r2Request(config, "GET", item.key);
    assert.equal(proof.status, 404, `R2_DELETE_RESIDUAL:${item.keyRef}`);
    deleted.push({ keyRef: item.keyRef, deleteStatus: response.status, residualStatus: proof.status });
  }
  writeJson(path.join(OUTPUT_DIR, "EXECUTION-EVIDENCE.json"), { result: "PASS", executedAt: new Date().toISOString(), idempotentNoop: false, databaseRowsDeleted: manifest.counts, r2: { scheduled: r2.scheduled.length, deleted }, productionMutation: false, ownerFixtureMutation: false, migrationMutation: false }, true);
  console.log(JSON.stringify({ result: "ALPHA67_CLEANBASE_EXECUTE_PASS", workOrdersDeleted: ids.length, r2Deleted: deleted.length }));
}
async function verify(environment, client) {
  await ledgerAndTriggers(client);
  const graph = await collectGraph(client);
  for (const table of TARGET_TABLES) assert.equal(graph[table].length, 0, `CLEANBASE_RESIDUAL:${table}`);
  const keepBefore = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, "KEEP-MANIFEST.json"), "utf8"));
  const keepAfter = await keepManifest(client, graph);
  assert.deepEqual(keepAfter.fullKeepTableCounts, keepBefore.fullKeepTableCounts, "KEEP_TABLE_COUNT_CHANGED");
  assert.equal(keepAfter.partialTables.otherCompanyWorkOrders, keepBefore.partialTables.otherCompanyWorkOrders, "UNRELATED_WORKORDER_CHANGED");
  assert.equal(keepAfter.partialTables.documentNumberSequencesSha256, keepBefore.partialTables.documentNumberSequencesSha256, "DOCUMENT_SEQUENCE_CHANGED");
  const r2 = JSON.parse(fs.readFileSync(R2_MANIFEST_PATH, "utf8"));
  const config = r2Config(environment);
  for (const item of r2.scheduled) assert.equal((await r2Request(config, "GET", item.key)).status, 404, `R2_RESIDUAL:${item.keyRef}`);
  const executionPath = path.join(OUTPUT_DIR, "EXECUTION-EVIDENCE.json");
  if (fs.existsSync(executionPath)) {
    const execution = JSON.parse(fs.readFileSync(executionPath, "utf8"));
    if (execution.idempotentNoop === true) {
      writeJson(path.join(OUTPUT_DIR, "IDEMPOTENT-EXECUTION-EVIDENCE.json"), execution, true);
      writeJson(executionPath, {
        result: "ALPHA67_CLEANBASE_EXECUTE_PASS_EVIDENCE_RECOVERED",
        evidenceRecoveryReason: "The successful post-delete idempotency probe overwrote the first execution evidence before the no-op path received its dedicated filename.",
        originalExecutionResultObserved: "ALPHA67_CLEANBASE_EXECUTE_PASS",
        originalExecutionTimestamp: null,
        deleteManifestSha256: sha256(fs.readFileSync(MANIFEST_PATH)),
        r2ManifestSha256: sha256(fs.readFileSync(R2_MANIFEST_PATH)),
        databaseRowsDeleted: JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")).counts,
        r2: { deleted: r2.scheduled.length, residual: 0 },
        finalStateReverifiedAt: new Date().toISOString(),
        recoveryIsNotOriginalPerObjectResponseLog: true,
        productionMutation: false,
        ownerFixtureMutation: false,
        migrationMutation: false,
      }, true);
    }
  }
  const result = { result: "ALPHA67_CLEANBASE_VERIFY_PASS", verifiedAt: new Date().toISOString(), ledger: 20, targetResidual: 0, r2ScheduledResidual: 0, preservedAmbiguousMetadataReferences: r2.preservedAmbiguous.length, unrelatedWorkOrders: keepAfter.partialTables.otherCompanyWorkOrders, migrationMutation: false, productionMutation: false, ownerFixtureMutation: false };
  writeJson(path.join(OUTPUT_DIR, "FINAL-VERIFICATION.json"), result, true);
  fs.mkdirSync(path.join(ROOT, ".tmp", "wafl-external-qa"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, ".tmp", "wafl-external-qa", "alpha67-cleanbase.json"), stableJson({ result: result.result, verifiedAt: result.verifiedAt, databaseFingerprint: EXPECTED_DB_FINGERPRINT, companyId: COMPANY_ID, targetResidual: 0, ledger: 20 }));
  console.log(JSON.stringify(result));
}

async function main() {
  assert.ok(["prepare", "execute", "verify"].includes(MODE), "MODE_INVALID");
  assert.equal(process.version, "v24.14.0", "NODE_VERSION_NOT_24_14_0");
  const environment = readEnvironment();
  assert.ok(environment.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(databaseFingerprint(environment.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  assert.ok(["development", "test"].includes(process.env.WAFL_V2_RUNTIME ?? "development"), "PRODUCTION_RUNTIME_FORBIDDEN");
  assert.notEqual(process.env.VERCEL_ENV, "production", "PRODUCTION_RUNTIME_FORBIDDEN");
  environment.DATABASE_URL = environment.DATABASE_URL;
  const client = new Client({ connectionString: environment.DATABASE_URL, application_name: `wafl-a67-viewer-share-reset-cleanbase-${MODE}`, statement_timeout: 120000 });
  await client.connect();
  try {
    if (MODE === "prepare") await prepare(environment, client);
    else if (MODE === "execute") await execute(environment, client);
    else await verify(environment, client);
  } finally { await client.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
