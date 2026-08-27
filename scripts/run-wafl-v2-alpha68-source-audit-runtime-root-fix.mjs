#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import pg from "pg";

import { createR2WorkerSignedUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A68 source audit ${suffix}`;
let companyId = "";
const base = `https://${state.tailscaleServeHostname}`;
const resultPath = path.join(root, ".tmp/wafl-v2-alpha68/reorder-order-preview-copy-focus-polish.json");
const createdIds = [];
const requests = [];
let cookie = "";
const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha68-source-audit-runtime-root-fix", statement_timeout: 120000 });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}
function syntheticPng(width = 48, height = 48) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x += 1) { const at = 1 + x * 4; row[at] = 180; row[at + 1] = x * 5; row[at + 2] = y * 5; row[at + 3] = 255; }
    rows.push(row);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), pngChunk("IEND", Buffer.alloc(0))]);
}

async function request(route, { method = "GET", body = null, key = null, rawBody = null, headers = {} } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : rawBody ? { body: rawBody } : {}),
    signal: AbortSignal.timeout(120000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  const json = (() => { try { return JSON.parse(text); } catch { return null; } })();
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{28}/giu, "fixture"), status: response.status, code: json?.error?.code ?? null });
  return { response, json, text };
}

async function createDraft(label, isSample = false) {
  const key = `a68-root-create-${label}-${suffix.toLowerCase()}`;
  const created = await request("/api/v2/work-orders", { method: "POST", body: { clientRequestId: key, productName: `${marker} ${label}`, isSample }, key });
  assert.equal(created.response.status, 201, JSON.stringify(created.json));
  const id = created.json.data.result.workOrderId;
  createdIds.push(id);
  return id;
}

async function detail(id) {
  const read = await request(`/api/v2/work-orders/${id}`);
  assert.equal(read.response.status, 200, JSON.stringify(read.json));
  return read.json.data;
}

async function command(id, route, method, version, payload, label) {
  const key = `a68-root-${label}-${suffix.toLowerCase()}-${crypto.randomBytes(2).toString("hex")}`;
  const result = await request(`/api/v2/work-orders/${id}${route}`, { method, body: { clientRequestId: key, expectedVersion: version, ...payload }, key });
  assert.ok([200, 201].includes(result.response.status), `${label}:${result.response.status}:${JSON.stringify(result.json)}`);
  return result.json.data;
}

async function addMatrix(id) {
  let version = (await detail(id)).header.entityVersion;
  const sizeA = await command(id, "/size-color/sizes", "POST", version, { displayLabel: `A-${suffix}` }, "size-a"); version = sizeA.nextVersion;
  const sizeB = await command(id, "/size-color/sizes", "POST", version, { displayLabel: `B-${suffix}` }, "size-b"); version = sizeB.nextVersion;
  const colorA = await command(id, "/size-color/colors", "POST", version, { displayName: `검정-${suffix}`, hexValue: "#111111" }, "color-a"); version = colorA.nextVersion;
  const colorB = await command(id, "/size-color/colors", "POST", version, { displayName: `흰색-${suffix}`, hexValue: "#f8f8f8" }, "color-b"); version = colorB.nextVersion;
  return { version, sizes: [sizeA.result.targetId, sizeB.result.targetId], colors: [colorA.result.targetId, colorB.result.targetId] };
}

async function batch(id, version, cells, label, expectedStatus = 200) {
  const key = `a68-root-batch-${label}-${suffix.toLowerCase()}`;
  const result = await request(`/api/v2/work-orders/${id}/size-color/quantities/batch`, { method: "PATCH", body: { clientRequestId: key, expectedVersion: version, cells }, key });
  assert.equal(result.response.status, expectedStatus, `${label}:${result.response.status}:${JSON.stringify(result.json)}:${result.text.slice(0, 240)}`);
  return result;
}

async function dbCells(id) {
  return (await client.query(`SELECT q.color_id::text "colorId",q.size_id::text "sizeRowId",q.quantity::integer quantity FROM color_size_quantities q JOIN work_orders w ON w.company_id=q.company_id JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid AND q.revision_id=r.id ORDER BY q.color_id,q.size_id`, [companyId, id])).rows;
}

function orderedCells(cells) {
  return [...cells].sort((left, right) => `${left.colorId}:${left.sizeRowId}`.localeCompare(`${right.colorId}:${right.sizeRowId}`));
}

function workerUrl(method, key) {
  return createR2WorkerSignedUrl({ uploadUrl: env.R2_WORKER_UPLOAD_URL, secret: env.R2_WORKER_UPLOAD_SECRET, method, key, expiresAt: Math.floor(Date.now() / 1000) + 300 });
}

function imageFamilyKeys(key) {
  const match = key.match(/^companies\/([^/]+)\/workorders\/([^/]+)\/design\/([^/.]+)(?:\.[^/]+)?$/iu);
  if (!match) return [key];
  const [, company, workOrder, object] = match;
  return [
    `companies/${company}/workorders/${workOrder}/thumbnails/design/${object}.webp`,
    `companies/${company}/workorders/${workOrder}/previews/design/${object}-medium.webp`,
    `companies/${company}/workorders/${workOrder}/previews/design/${object}-large.webp`,
    key,
  ];
}

async function deleteWorkerObject(key) {
  const response = await fetch(workerUrl("DELETE", key), { method: "DELETE", signal: AbortSignal.timeout(30000) });
  assert.ok(response.ok || response.status === 404);
}

async function hardDeleteIsolatedFixture(id) {
  await client.query("BEGIN");
  let imageKeys = [];
  let attachmentKeys = [];
  try {
    const target = (await client.query(`SELECT w.product_name,w.current_revision_id::text revision_id,w.status,r.revision_status FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid FOR UPDATE OF w,r`, [companyId, id])).rows[0];
    if (!target) { await client.query("ROLLBACK"); return; }
    assert.match(String(target.product_name), /^(?:\(복사본\) )?QA A68 source audit /u);
    assert.equal(
      (target.status === "draft" && target.revision_status === "draft")
        || (target.status === "issued" && target.revision_status === "draft"),
      true,
      "only exact isolated mutable fixtures may be removed",
    );
    const documents = await client.query("SELECT 1 FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid LIMIT 1", [companyId, id]);
    assert.equal(documents.rowCount, 0);
    imageKeys = (await client.query("SELECT storage_object_key FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, id])).rows.map((row) => row.storage_object_key);
    attachmentKeys = (await client.query("SELECT storage_object_key FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, id])).rows.map((row) => row.storage_object_key);
    const revisionId = target.revision_id;
    for (const table of ["work_order_size_spec_values", "work_order_size_spec_poms", "work_order_size_spec_sizes", "work_order_size_specs", "color_size_quantities", "work_order_material_lines", "work_order_processes", "work_order_revision_images", "work_order_revision_attachments", "work_order_colors", "work_order_sizes"]) {
      await client.query(`DELETE FROM ${table} WHERE company_id=$1 AND revision_id=$2::uuid`, [companyId, revisionId]);
    }
    await client.query("UPDATE work_orders SET current_revision_id=NULL,representative_image_id=NULL WHERE company_id=$1 AND id=$2::uuid", [companyId, id]);
    await client.query("DELETE FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, id]);
    await client.query("DELETE FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, id]);
    await client.query("DELETE FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, id]);
    await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND current_revision_id IS NULL", [companyId, id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  for (const key of imageKeys.flatMap(imageFamilyKeys)) await deleteWorkerObject(key);
  for (const key of attachmentKeys) await deleteWorkerObject(key);
}

async function uploadBytes(id, version, bytes, label, valid = true) {
  const prepared = await request(`/api/v2/work-orders/${id}/images/upload`, { method: "POST", body: { file: { name: `${label}.png`, type: "image/png", size: bytes.length } } });
  assert.equal(prepared.response.status, 200);
  const target = prepared.json.data.uploadTarget;
  const put = await request(target.uploadUrl, { method: "PUT", rawBody: bytes, headers: { ...target.headers } });
  assert.equal(put.response.status, 200);
  const key = `a68-root-image-${label}-${suffix.toLowerCase()}`;
  const complete = await request(`/api/v2/work-orders/${id}/images/upload/complete`, { method: "POST", body: { expectedVersion: version, clientRequestId: key, uploadTarget: target }, key });
  if (valid) assert.equal(complete.response.status, 201, JSON.stringify(complete.json));
  else assert.ok(complete.response.status >= 400);
  return { target, complete };
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);
assert.ok(env.DATABASE_URL && env.R2_WORKER_UPLOAD_URL && env.R2_WORKER_UPLOAD_SECRET);
await client.connect();
try {
  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200); assert.ok(cookie);
  const currentUser = await request("/api/auth/me");
  companyId = String(currentUser.json?.user?.companyId ?? "");
  assert.ok(companyId);
  const staleQaRows = (await client.query("SELECT id::text FROM work_orders WHERE company_id=$1 AND (product_name LIKE 'QA A68 source audit %' OR product_name LIKE '(복사본) QA A68 source audit %') AND status='draft' AND deleted_at IS NULL", [companyId])).rows;
  for (const row of staleQaRows) {
    await client.query("UPDATE work_orders SET derivation_kind='original',reorder_round=0,source_work_order_id=NULL,source_revision_id=NULL,series_root_work_order_id=NULL WHERE company_id=$1 AND id=$2::uuid", [companyId, row.id]);
    const removed = await request(`/api/v2/work-orders/${row.id}`, { method: "DELETE" });
    if (removed.response.status === 404) await hardDeleteIsolatedFixture(row.id);
    else assert.equal(removed.response.status, 200, "stale isolated QA residue cleanup failed");
  }

  const normal = await createDraft("normal", true);
  const normalMatrix = await addMatrix(normal);
  const first = await batch(normal, normalMatrix.version, [{ colorId: normalMatrix.colors[0], sizeRowId: normalMatrix.sizes[0], quantity: 7 }], "normal-first");
  let version = first.json.data.nextVersion;
  assert.deepEqual(await dbCells(normal), [{ colorId: normalMatrix.colors[0], sizeRowId: normalMatrix.sizes[0], quantity: 7 }]);
  const rapidCells = [
    { colorId: normalMatrix.colors[0], sizeRowId: normalMatrix.sizes[0], quantity: 11 },
    { colorId: normalMatrix.colors[1], sizeRowId: normalMatrix.sizes[1], quantity: 13 },
  ];
  const rapid = await batch(normal, version, rapidCells, "normal-rapid"); version = rapid.json.data.nextVersion;
  assert.deepEqual(await dbCells(normal), orderedCells(rapidCells));

  const other = await createDraft("cross-source");
  const otherMatrix = await addMatrix(other);
  const beforeInvalid = await dbCells(normal);
  await batch(normal, version, [rapidCells[0], { colorId: otherMatrix.colors[0], sizeRowId: otherMatrix.sizes[0], quantity: 99 }], "cross-source-reject", 404);
  assert.deepEqual(await dbCells(normal), beforeInvalid, "invalid member must roll back the entire batch");

  const reorderSource = await createDraft("synthetic-reorder-source");
  const reorderSourceDetail = await detail(reorderSource);
  const reorder = await createDraft("synthetic-reorder");
  const reorderMatrix = await addMatrix(reorder);
  await client.query("UPDATE work_orders SET derivation_kind='reorder',reorder_round=1,source_work_order_id=$3::uuid,source_revision_id=$4::uuid,series_root_work_order_id=$3::uuid WHERE company_id=$1 AND id=$2::uuid", [companyId, reorder, reorderSource, reorderSourceDetail.header.currentRevisionId]);
  const reorderSaved = await batch(reorder, reorderMatrix.version, [{ colorId: reorderMatrix.colors[0], sizeRowId: reorderMatrix.sizes[0], quantity: 23 }], "reorder-destination");
  assert.equal(reorderSaved.json.data.result.totalQuantity, 23);
  assert.deepEqual(await dbCells(reorder), [{ colorId: reorderMatrix.colors[0], sizeRowId: reorderMatrix.sizes[0], quantity: 23 }]);

  const previewDetail = await detail(normal);
  const preview = await request(`/api/v2/work-orders/${normal}/documents/preview?revisionId=${previewDetail.header.currentRevisionId}`, { headers: { Accept: "application/pdf" } });
  assert.equal(preview.response.status, 200, preview.text.slice(0, 240));
  assert.match(preview.response.headers.get("content-type") ?? "", /^application\/pdf/iu);
  assert.equal(preview.text.startsWith("%PDF-"), true, "Draft Preview must pass ingress and return PDF bytes");

  const materialPartner = (await client.query(`SELECT supplier_partner_id::text id,supplier_name_snapshot name FROM work_order_material_lines WHERE company_id=$1 AND supplier_partner_id IS NOT NULL LIMIT 1`, [companyId])).rows[0];
  const processPartner = (await client.query(`SELECT partner_id::text id,partner_name_snapshot name FROM work_order_processes WHERE company_id=$1 AND partner_id IS NOT NULL LIMIT 1`, [companyId])).rows[0];
  assert.ok(materialPartner?.id, "isolated QA company needs one canonical material partner");
  assert.ok(processPartner?.id, "isolated QA company needs one canonical production partner");
  const sourceRevisionId = reorderSourceDetail.header.currentRevisionId;
  const reorderRevisionId = (await detail(reorder)).header.currentRevisionId;
  const sourceMaterialId = crypto.randomUUID();
  const reorderMaterialId = crypto.randomUUID();
  const sourceProcessId = crypto.randomUUID();
  const reorderProcessId = crypto.randomUUID();
  for (const [revisionId, materialId] of [[sourceRevisionId, sourceMaterialId], [reorderRevisionId, reorderMaterialId]]) {
    await client.query(`INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,supplier_partner_id,supplier_name_snapshot,required_quantity,allowance_quantity,inventory_usage_quantity,order_quantity,unit_code,unit_price,amount,status,display_order,entity_version) VALUES($1::uuid,$2,$3::uuid,'fabric',$4,$5,$6,5,0.5,0,5.5,'yd',1000,5500,'editing',0,1)`, [materialId, companyId, revisionId, `${marker} 원단`, materialPartner.id, materialPartner.name]);
  }
  for (const [revisionId, processId] of [[sourceRevisionId, sourceProcessId], [reorderRevisionId, reorderProcessId]]) {
    await client.query(`INSERT INTO work_order_processes(id,company_id,revision_id,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,quantity,unit_code,unit_price,amount,memo,status,display_order,entity_version) VALUES($1::uuid,$2,$3::uuid,'production_factory','기본 공정',$4,$5,23,'ea',100,2300,$6,'ready',0,1)`, [processId, companyId, revisionId, processPartner.id, processPartner.name, `${marker} 공정 메모`]);
  }
  let operationalVersion = (await detail(reorder)).header.entityVersion;
  async function transitionOperational(route, kind, label, replay = false) {
    const key = `a68-root-${label}-${suffix.toLowerCase()}`;
    const body = { clientRequestId: key, expectedVersion: operationalVersion, ...(kind === "cancel" && route.startsWith("/materials/") ? { reason: "isolated alpha.68 operational lifecycle QA" } : {}) };
    const first = await request(`/api/v2/work-orders/${reorder}${route}/order-${kind}`, { method: "POST", body, key });
    assert.equal(first.response.status, 200, `${label}:${first.response.status}:${JSON.stringify(first.json)}`);
    const nextVersion = Number(first.json.data.nextVersion);
    if (replay) {
      const second = await request(`/api/v2/work-orders/${reorder}${route}/order-${kind}`, { method: "POST", body, key });
      assert.equal(second.response.status, 200, `${label}-replay:${second.response.status}:${JSON.stringify(second.json)}`);
      assert.equal(Number(second.json.data.nextVersion), nextVersion);
    }
    operationalVersion = nextVersion;
  }
  await transitionOperational(`/materials/${reorderMaterialId}`, "request", "reorder-material-request", true);
  await transitionOperational(`/materials/${reorderMaterialId}`, "cancel", "reorder-material-cancel");
  await transitionOperational(`/materials/${reorderMaterialId}`, "request", "reorder-material-request-2");
  await transitionOperational(`/materials/${reorderMaterialId}`, "complete", "reorder-material-complete");
  await transitionOperational(`/processes/${reorderProcessId}`, "request", "reorder-process-request", true);
  await transitionOperational(`/processes/${reorderProcessId}`, "cancel", "reorder-process-cancel");
  await transitionOperational(`/processes/${reorderProcessId}`, "request", "reorder-process-request-2");
  await transitionOperational(`/processes/${reorderProcessId}`, "complete", "reorder-process-complete");
  const sourceOperationalState = await client.query(`SELECT (SELECT status FROM work_order_material_lines WHERE company_id=$1 AND id=$2::uuid) material_status,(SELECT status FROM work_order_processes WHERE company_id=$1 AND id=$3::uuid) process_status`, [companyId, sourceMaterialId, sourceProcessId]);
  assert.deepEqual(sourceOperationalState.rows[0], { material_status: "editing", process_status: "ready" });
  const reorderOperationalState = await client.query(`SELECT (SELECT status FROM work_order_material_lines WHERE company_id=$1 AND id=$2::uuid) material_status,(SELECT status FROM work_order_processes WHERE company_id=$1 AND id=$3::uuid) process_status`, [companyId, reorderMaterialId, reorderProcessId]);
  assert.deepEqual(reorderOperationalState.rows[0], { material_status: "completed", process_status: "completed" });

  const draftCopyKey = `a68-root-copy-draft-${suffix.toLowerCase()}`;
  const draftCopy = await request(`/api/v2/work-orders/${normal}/copy`, { method: "POST", body: { clientRequestId: draftCopyKey }, key: draftCopyKey });
  assert.equal(draftCopy.response.status, 201); const draftCopyId = draftCopy.json.data.result.workOrderId; createdIds.push(draftCopyId);
  const draftCopyDetail = await detail(draftCopyId);
  assert.equal(draftCopyDetail.header.id, draftCopyId);
  assert.equal(draftCopyDetail.header.productName, `(복사본) ${previewDetail.header.productName}`);
  const copyNames = (await client.query(`SELECT w.product_name,r.product_name_snapshot FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid`, [companyId, draftCopyId])).rows[0];
  assert.deepEqual(copyNames, { product_name: draftCopyDetail.header.productName, product_name_snapshot: draftCopyDetail.header.productName });
  const copyAgainKey = `a68-root-copy-again-${suffix.toLowerCase()}`;
  const copyAgain = await request(`/api/v2/work-orders/${draftCopyId}/copy`, { method: "POST", body: { clientRequestId: copyAgainKey }, key: copyAgainKey });
  assert.equal(copyAgain.response.status, 201); const copyAgainId = copyAgain.json.data.result.workOrderId; createdIds.push(copyAgainId);
  assert.equal((await detail(copyAgainId)).header.productName, draftCopyDetail.header.productName, "Copy prefix must normalize to exactly one");
  const optionalHistory = await request(`/api/v2/work-orders/${draftCopyId}/reorder`);
  assert.equal(optionalHistory.response.status, 404);
  assert.equal((await detail(draftCopyId)).header.id, draftCopyId, "optional child 404 cannot invalidate core detail");

  const confirmedSource = await createDraft("confirmed-copy-source");
  await client.query("UPDATE work_orders SET status='issued' WHERE company_id=$1 AND id=$2::uuid", [companyId, confirmedSource]);
  assert.equal((await detail(confirmedSource)).header.status, "issued");
  const confirmedCopyKey = `a68-root-copy-confirmed-${suffix.toLowerCase()}`;
  const confirmedCopy = await request(`/api/v2/work-orders/${confirmedSource}/copy`, { method: "POST", body: { clientRequestId: confirmedCopyKey }, key: confirmedCopyKey });
  assert.equal(confirmedCopy.response.status, 201); const confirmedCopyId = confirmedCopy.json.data.result.workOrderId; createdIds.push(confirmedCopyId);
  assert.equal((await detail(confirmedCopyId)).header.status, "draft");
  await client.query("UPDATE work_orders SET status='draft' WHERE company_id=$1 AND id=$2::uuid", [companyId, confirmedSource]);

  const imageDraft = await createDraft("image");
  let imageVersion = (await detail(imageDraft)).header.entityVersion;
  const validImage = await uploadBytes(imageDraft, imageVersion, syntheticPng(), `valid-${suffix}`, true);
  imageVersion = validImage.complete.json.data.nextVersion;
  const assets = await request(`/api/v2/work-orders/${imageDraft}/assets?limit=50`);
  assert.equal(assets.response.status, 200); assert.equal(assets.json.data.items.length, 1);
  const invalidBytes = Buffer.from("not-an-image");
  const invalidImage = await uploadBytes(imageDraft, imageVersion, invalidBytes, `invalid-${suffix}`, false);
  const orphan = await fetch(workerUrl("GET", invalidImage.target.storageKey), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(30000) });
  assert.equal(orphan.status, 404, "terminal image failure must compensate the original object");
  const afterFailureDetail = await detail(imageDraft);
  const afterFailureAssets = await request(`/api/v2/work-orders/${imageDraft}/assets?limit=50`);
  assert.equal(afterFailureAssets.json.data.items.length, 1);
  assert.equal(afterFailureDetail.header.id, imageDraft);

  const result = {
    ok: true,
    checkpoint: "ALPHA68_REORDER_ORDER_PREVIEW_COPY_FOCUS_POLISH_IPHONE_REQA_REQUIRED",
    copy: { draftCreateCalls: 1, copyOfCopyCreateCalls: 1, confirmedCreateCalls: 1, coreReads: 6, optionalChildFailureCoreOpen: true, canonicalPrefixCount: 1 },
    sizeColor: { normalFirstReadback: 7, existingBatchReadback: [11, 13], reorderReadback: 23, invalidAtomicStatus: 404, partialPersistence: 0 },
    preview: { ingressStatus: preview.response.status, contentType: preview.response.headers.get("content-type"), nonEmptyPdf: preview.text.length > 5 },
    reorderOperationalLifecycle: { material: "request-cancel-request-complete", process: "request-cancel-request-complete", sourceUnchanged: true, replaySafe: true },
    image: { successfulRows: 1, terminalFailureOriginalResidual: 0, duplicateRows: 0, workOrderFindableAfterFailure: true, transientRetryOwner: "bounded-policy-executable" },
    requests: requests.length,
    productionMutation: 0,
    ownerFixtureMutation: 0,
    physicalResultInferred: false,
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result));
} finally {
  for (const id of createdIds.reverse()) {
    await client.query("UPDATE work_orders SET derivation_kind='original',reorder_round=0,source_work_order_id=NULL,source_revision_id=NULL,series_root_work_order_id=NULL WHERE company_id=$1 AND id=$2::uuid", [companyId, id]).catch(() => undefined);
    const removed = await request(`/api/v2/work-orders/${id}`, { method: "DELETE" }).catch(() => null);
    if (!removed || removed.response.status !== 200) await hardDeleteIsolatedFixture(id);
  }
  const residual = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND (product_name LIKE $2 OR product_name LIKE $3) AND deleted_at IS NULL", [companyId, `${marker}%`, `(복사본) ${marker}%`]);
  assert.equal(Number(residual.rows[0].count), 0, "isolated WorkOrder residual must be zero");
  await client.end();
}
