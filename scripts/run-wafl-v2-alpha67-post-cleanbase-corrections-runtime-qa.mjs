#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const DB_FINGERPRINT = "01e5dcc7fea3";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha67", "post-cleanbase-corrections-runtime-qa.json");
const GUARDED_TRIGGERS = [
  ["work_order_revisions", "work_order_revisions_immutable_guard"],
  ["work_order_material_lines", "work_order_material_lines_mutable_revision_guard"],
  ["work_order_colors", "work_order_colors_mutable_revision_guard"],
  ["work_order_sizes", "work_order_sizes_mutable_revision_guard"],
  ["color_size_quantities", "color_size_quantities_mutable_revision_guard"],
  ["work_order_size_specs", "work_order_size_specs_mutable_revision_guard"],
  ["work_order_size_spec_sizes", "work_order_size_spec_sizes_mutable_revision_guard"],
  ["work_order_size_spec_values", "work_order_size_spec_values_mutable_revision_guard"],
  ["work_order_processes", "work_order_processes_mutable_revision_guard"],
  ["work_order_revision_images", "work_order_revision_images_mutable_revision_guard"],
  ["domain_events", "domain_events_append_only_guard"],
];

const short = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const uuid = () => crypto.randomUUID();
function environment() {
  return Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (!match) return null;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [match[1], value];
  }).filter(Boolean));
}
function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  return short(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`);
}

async function main() {
  const env = environment();
  assert.equal(databaseFingerprint(env.DATABASE_URL), DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.developerAutoConnectReady, true);
  const base = String(state.publicOrigin);
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const marker = `QA A67 post-cleanbase corrections ${suffix}`;
  const ids = {
    workOrder: uuid(), revision: uuid(), sizeXs: uuid(), sizeS: uuid(), color: uuid(),
    spec: uuid(), specXs: uuid(), specS: uuid(), fabric: uuid(), accessory: uuid(), image: uuid(),
  };
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha67-post-cleanbase-corrections-runtime-qa", statement_timeout: 120_000 });
  let cookie = "";
  const requests = [];
  let processId = null;
  const key = (label) => `a67-post-cleanbase-${suffix.toLowerCase()}-${label}`;
  async function request(route, options = {}) {
    const response = await fetch(`${base}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(120_000),
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const json = await response.json().catch(() => null);
    requests.push({ method: options.method ?? "GET", route: route.replace(ids.workOrder, "fixture").replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "entity"), status: response.status });
    return { response, json };
  }
  async function detail() {
    const result = await request(`/api/v2/work-orders/${ids.workOrder}`);
    assert.equal(result.response.status, 200, "DETAIL_READ_FAILED");
    return result.json.data;
  }
  async function cleanup() {
    await client.query("BEGIN");
    try {
      for (const [table, trigger] of GUARDED_TRIGGERS) await client.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
      await client.query("DELETE FROM work_order_command_receipts WHERE company_id=$1 AND (work_order_id=$2::uuid OR result_revision_id=$3::uuid)", [COMPANY_ID, ids.workOrder, ids.revision]);
      await client.query("DELETE FROM domain_events WHERE company_id=$1 AND entity_type='work_order' AND entity_id=$2", [COMPANY_ID, ids.workOrder]);
      await client.query("DELETE FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("UPDATE work_orders SET current_revision_id=NULL,representative_image_id=NULL WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.workOrder]);
      await client.query("DELETE FROM work_order_images WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.image]);
      await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.revision]);
      await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.workOrder]);
      for (const [table, trigger] of GUARDED_TRIGGERS) await client.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  await client.connect();
  try {
    const prerequisite = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) ledger,
        (SELECT id FROM company_members WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL ORDER BY created_at,id LIMIT 1) member_id,
        (SELECT COALESCE(NULLIF(btrim(document_number_prefix),''),NULLIF(btrim(company_code),'')) FROM company_settings WHERE company_id=$1) company_code,
        (SELECT storage_object_key FROM work_order_images WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1) storage_object_key,
        (SELECT mime_type FROM work_order_images WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1) mime_type,
        (SELECT size_bytes FROM work_order_images WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1) size_bytes,
        (SELECT content_sha256 FROM work_order_images WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1) content_sha256
    `, [COMPANY_ID])).rows[0];
    assert.equal(Number(prerequisite.ledger), 20, "MIGRATION_LEDGER_NOT_20");
    assert.ok(prerequisite.member_id && prerequisite.company_code && prerequisite.storage_object_key, "FIXTURE_PREREQUISITE_MISSING");

    await client.query("BEGIN");
    try {
      await client.query(`INSERT INTO work_orders(id,company_id,product_name,product_type_code,season_code,item_code,status,due_date,total_quantity,created_by_member_id,assignee_member_id,entity_version,is_sample,derivation_kind,reorder_round,series_root_work_order_id) VALUES($1,$2,$3,'wafl-c1|M|T','27SS','티셔츠','draft',current_date+30,20,$4,$4,1,false,'original',0,$1)`, [ids.workOrder, COMPANY_ID, marker, prerequisite.member_id]);
      await client.query(`INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,company_code_snapshot,season_code_snapshot,item_code_snapshot,product_name_snapshot,product_type_code_snapshot,due_date_snapshot,total_quantity_snapshot,memo,factory_delivery_memo,author_member_id,entity_version) VALUES($1,$2,$3,0,'draft',$4,'27SS','티셔츠',$5,'wafl-c1|M|T',current_date+30,20,'isolated QA general memo','legacy fallback memo',$6,1)`, [ids.revision, COMPANY_ID, ids.workOrder, prerequisite.company_code, marker, prerequisite.member_id]);
      await client.query("INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order) VALUES($1,$2,$3,'XS','XS',0),($4,$2,$3,'S','S',1)", [ids.sizeXs, COMPANY_ID, ids.revision, ids.sizeS]);
      await client.query("INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order) VALUES($1,$2,$3,'NAVY','남색','#1E2A44',0)", [ids.color, COMPANY_ID, ids.revision]);
      await client.query("INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity) VALUES($1,$2,$3,$4,10),($1,$2,$3,$5,10)", [COMPANY_ID, ids.revision, ids.color, ids.sizeXs, ids.sizeS]);
      await client.query("INSERT INTO work_order_size_specs(id,company_id,revision_id,gender_code,category_code,measurement_unit) VALUES($1,$2,$3,'male','T','cm')", [ids.spec, COMPANY_ID, ids.revision]);
      await client.query("INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order) VALUES($1,$2,$3,$4,'XS','XS',0),($5,$2,$3,$4,'S','S',1)", [ids.specXs, COMPANY_ID, ids.revision, ids.spec, ids.specS]);
      await client.query(`INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,required_quantity,allowance_quantity,inventory_usage_quantity,order_quantity,unit_code,unit_price,amount,status,memo,usage_area,display_order,entity_version) VALUES($1,$2,$3,'fabric','QA 원단',1,0,0,1,'m',1000,1000,'editing','valid memo','몸판',0,1),($4,$2,$3,'accessory','QA 부자재',1,0,0,1,'ea',100,100,'editing','valid memo','전체',1,1)`, [ids.fabric, COMPANY_ID, ids.revision, ids.accessory]);
      await client.query(`INSERT INTO work_order_images(id,company_id,work_order_id,storage_object_key,original_filename,mime_type,size_bytes,content_sha256,title,display_order,is_current_representative,created_by_member_id) VALUES($1,$2,$3,$4,'qa-reference-image',$5,$6,$7,'isolated read-only object reference',0,true,$8)`, [ids.image, COMPANY_ID, ids.workOrder, prerequisite.storage_object_key, prerequisite.mime_type, prerequisite.size_bytes, prerequisite.content_sha256, prerequisite.member_id]);
      await client.query(`INSERT INTO work_order_revision_images(company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot) VALUES($1,$2,$3,0,true,'qa-reference-image',$4,$5)`, [COMPANY_ID, ids.revision, ids.image, prerequisite.mime_type, prerequisite.storage_object_key]);
      await client.query("UPDATE work_orders SET current_revision_id=$3,representative_image_id=$4 WHERE company_id=$1 AND id=$2", [COMPANY_ID, ids.workOrder, ids.revision, ids.image]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
    assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
    assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");

    let current = await detail();
    assert.equal(current.header.readiness.hardBlockers.some((issue) => issue.code === "BASIC_PROCESS_REQUIRED"), true);
    const options = await request(`/api/v2/work-orders/${ids.workOrder}/production-options`);
    assert.equal(options.response.status, 200);
    assert.ok(options.json.data.factoryPartners.length > 0, "FACTORY_PARTNER_REQUIRED");
    const createKey = key("factory-create");
    const created = await request(`/api/v2/work-orders/${ids.workOrder}/processes`, { method: "POST", idempotencyKey: createKey, body: { clientRequestId: createKey, expectedVersion: current.header.entityVersion, process: { role: "factory", processCode: null, partnerId: options.json.data.factoryPartners[0].id, unitPrice: "1000", memo: "canonical factory delivery memo" } } });
    assert.equal(created.response.status, 200, "BASIC_PROCESS_CREATE_FAILED");
    processId = created.json.data.processId;
    current = await detail();
    assert.equal(current.header.readiness.hardBlockers.some((issue) => issue.code === "BASIC_PROCESS_ORDER_REQUIRED"), true);
    assert.equal(current.revision.factoryDeliveryMemo, "canonical factory delivery memo");

    const deleteKey = key("size-delete");
    const deleted = await request(`/api/v2/work-orders/${ids.workOrder}/size-color/sizes/${ids.sizeS}`, { method: "DELETE", idempotencyKey: deleteKey, body: { clientRequestId: deleteKey, expectedVersion: current.header.entityVersion } });
    assert.equal(deleted.response.status, 200, "SIZE_DELETE_FAILED");
    assert.equal(Number(deleted.json.data.result.totalQuantity), 10);
    const matrix = await request(`/api/v2/work-orders/${ids.workOrder}/size-color`);
    const spec = await request(`/api/v2/work-orders/${ids.workOrder}/size-spec`);
    current = await detail();
    assert.equal(Number(matrix.json.data.matrixTotal), 10);
    assert.equal(Number(matrix.json.data.workOrderTotal), 10);
    assert.equal(Number(matrix.json.data.revisionTotal), 10);
    assert.equal(current.header.totalQuantity, 10);
    assert.deepEqual(spec.json.data.sizes.map((row) => row.displayLabel), ["XS"]);

    const invalidBase = { materialType: "fabric", materialId: null, name: "invalid length probe", partnerId: null, colorOption: null, requiredQuantity: "1", allowanceQuantity: "0", inventoryUsageQuantity: "0", orderQuantity: "1", unitCode: "m", unitPrice: "0" };
    for (const [label, patch] of [["usage31", { usageArea: "가".repeat(31), memo: null }], ["memo101", { usageArea: null, memo: "나".repeat(101) }]]) {
      const invalidKey = key(label);
      const invalid = await request(`/api/v2/work-orders/${ids.workOrder}/materials`, { method: "POST", idempotencyKey: invalidKey, body: { clientRequestId: invalidKey, expectedVersion: current.header.entityVersion, ...invalidBase, ...patch } });
      assert.equal(invalid.response.status, 400, `${label}_NOT_REJECTED`);
    }

    const requestKey = key("basic-order-request");
    const requested = await request(`/api/v2/work-orders/${ids.workOrder}/processes/${processId}/order-request`, { method: "POST", idempotencyKey: requestKey, body: { clientRequestId: requestKey, expectedVersion: current.header.entityVersion } });
    assert.equal(requested.response.status, 200, "BASIC_PROCESS_ORDER_REQUEST_FAILED");
    current = await detail();
    assert.equal(current.header.readiness.canIssue, true, current.header.readiness.hardBlockers.map((item) => item.code).join(","));

    const issueKey = key("issue");
    const issueBody = { clientRequestId: issueKey, expectedWorkOrderVersion: current.header.entityVersion, expectedRevisionVersion: current.header.currentRevisionVersion, expectedRevisionId: ids.revision, issueNote: "isolated post-cleanbase issue QA" };
    const issued = await request(`/api/v2/work-orders/${ids.workOrder}/revisions/issue`, { method: "POST", idempotencyKey: issueKey, body: issueBody });
    assert.equal(issued.response.status, 200, `ISSUE_FAILED:${issued.json?.error?.code ?? "UNKNOWN"}`);
    const replay = await request(`/api/v2/work-orders/${ids.workOrder}/revisions/issue`, { method: "POST", idempotencyKey: issueKey, body: issueBody });
    assert.equal(replay.response.status, 200, "ISSUE_REPLAY_FAILED");
    assert.equal(replay.json.data.result.issuedRevisionId, issued.json.data.result.issuedRevisionId);

    const finalProjection = (await client.query(`SELECT w.status work_order_status,r.factory_delivery_memo,p.status process_status,(SELECT count(*)::integer FROM domain_events e WHERE e.company_id=w.company_id AND e.entity_id=w.id::text AND e.command_code='work_order.production_process.order_complete') complete_events FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id JOIN work_order_processes p ON p.company_id=w.company_id AND p.revision_id=r.id AND p.process_type_code='production_factory' WHERE w.company_id=$1 AND w.id=$2::uuid`, [COMPANY_ID, ids.workOrder])).rows[0];
    assert.deepEqual({ workOrder: finalProjection.work_order_status, process: finalProjection.process_status, memo: finalProjection.factory_delivery_memo, events: Number(finalProjection.complete_events) }, { workOrder: "issued", process: "completed", memo: "canonical factory delivery memo", events: 1 });

    const evidence = {
      result: "ALPHA67_POST_CLEANBASE_CORRECTIONS_RUNTIME_QA_PASS",
      executedAt: new Date().toISOString(),
      fixtureRef: short(ids.workOrder),
      assertions: { readiness: "PASS", sizeColorDelete: "PASS", finishedSpecSync: "PASS", materialLimits: "PASS", issueAutoComplete: "PASS", issueReplay: "PASS", factoryMemo: "PASS" },
      requests,
      productionMutation: 0,
      ownerFixtureMutation: 0,
      migrationMutation: 0,
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  } finally {
    const exists = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.workOrder]);
    if (Number(exists.rows[0].count) > 0) await cleanup();
    const residual = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, ids.workOrder]);
    assert.equal(Number(residual.rows[0].count), 0, "FIXTURE_RESIDUAL");
    await client.end();
  }
  console.log(JSON.stringify({ result: "ALPHA67_POST_CLEANBASE_CORRECTIONS_RUNTIME_QA_PASS", fixtureRef: short(ids.workOrder), residual: 0, productionMutation: 0, ownerFixtureMutation: 0 }));
}

main().catch((error) => {
  console.error("ALPHA67_POST_CLEANBASE_CORRECTIONS_RUNTIME_QA_FAILED", { name: error instanceof Error ? error.name : "UnknownError", code: error instanceof Error ? error.message : "UNKNOWN" });
  process.exitCode = 1;
});
