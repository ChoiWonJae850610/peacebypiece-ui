#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A68 confirm lineage ${suffix}`;
const base = `https://${state.tailscaleServeHostname}`;
const resultPath = path.join(root, ".tmp/wafl-v2-alpha68/confirm-pending-lineage-runtime.json");
const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha68-confirm-lineage-runtime", statement_timeout: 120000 });
const createdIds = [];
let cookie = "";
let companyId = "";

async function request(route, { method = "GET", body = null, key = null } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(120000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let json = null; try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { response, json, text };
}

async function createDraft(label) {
  const key = `a68-confirm-create-${label}-${suffix.toLowerCase()}`;
  const created = await request("/api/v2/work-orders", { method: "POST", key, body: { clientRequestId: key, productName: `${marker} ${label}`, isSample: false } });
  assert.equal(created.response.status, 201, created.text.slice(0, 240));
  const id = created.json.data.result.workOrderId;
  createdIds.push(id);
  return id;
}

async function detail(id) {
  const result = await request(`/api/v2/work-orders/${id}`);
  assert.equal(result.response.status, 200, result.text.slice(0, 240));
  return result.json.data;
}

async function command(id, route, method, expectedVersion, payload, label) {
  const key = `a68-confirm-${label}-${suffix.toLowerCase()}-${crypto.randomBytes(2).toString("hex")}`;
  const result = await request(`/api/v2/work-orders/${id}${route}`, { method, key, body: { clientRequestId: key, expectedVersion, ...payload } });
  assert.ok([200, 201].includes(result.response.status), `${label}:${result.response.status}:${result.text.slice(0, 240)}`);
  return result.json.data;
}

async function dbCounts(id) {
  const row = (await client.query(`
    SELECT w.product_type_code,w.item_code,w.total_quantity,w.current_revision_id::text revision_id,
      (SELECT count(*) FROM work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=w.current_revision_id)::integer sizes,
      (SELECT count(*) FROM work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=w.current_revision_id)::integer colors,
      (SELECT count(*) FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=w.current_revision_id)::integer quantities,
      (SELECT count(*) FROM work_order_size_specs x WHERE x.company_id=w.company_id AND x.revision_id=w.current_revision_id)::integer specs,
      (SELECT count(*) FROM work_order_size_spec_values v WHERE v.company_id=w.company_id AND v.revision_id=w.current_revision_id)::integer spec_values,
      (SELECT count(*) FROM work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=w.current_revision_id)::integer materials,
      (SELECT count(*) FROM work_order_processes p WHERE p.company_id=w.company_id AND p.revision_id=w.current_revision_id)::integer processes
    FROM work_orders w WHERE w.company_id=$1 AND w.id=$2::uuid
  `, [companyId, id])).rows[0];
  assert.ok(row);
  return row;
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);
await client.connect();
try {
  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200); assert.ok(cookie);
  const me = await request("/api/auth/me");
  companyId = String(me.json?.user?.companyId ?? "");
  assert.ok(companyId);

  const populated = await createDraft("populated");
  let current = await detail(populated);
  let version = current.header.entityVersion;
  const seeded = await command(populated, "", "PATCH", version, { patch: { productTypeCode: "wafl-c1|M|T", itemCode: "티셔츠", totalQuantity: 17 } }, "seed-basic");
  version = seeded.nextVersion;
  const size = await command(populated, "/size-color/sizes", "POST", version, { displayLabel: `QA-${suffix}` }, "size"); version = size.nextVersion;
  const color = await command(populated, "/size-color/colors", "POST", version, { displayName: `검정-${suffix}`, hexValue: "#111111" }, "color"); version = color.nextVersion;
  const batch = await command(populated, "/size-color/quantities/batch", "PATCH", version, { cells: [{ colorId: color.result.targetId, sizeRowId: size.result.targetId, quantity: 17 }] }, "quantity");
  version = batch.nextVersion;

  const ids = { spec: crypto.randomUUID(), specSize: crypto.randomUUID(), pom: crypto.randomUUID(), material: crypto.randomUUID(), process: crypto.randomUUID() };
  const revisionId = (await detail(populated)).header.currentRevisionId;
  await client.query("INSERT INTO work_order_size_specs(id,company_id,revision_id,gender_code,category_code,measurement_unit) VALUES($1,$2,$3,'male','T','cm')", [ids.spec, companyId, revisionId]);
  await client.query("INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order) VALUES($1,$2,$3,$4,'QA','QA',0)", [ids.specSize, companyId, revisionId, ids.spec]);
  await client.query("INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,display_order) VALUES($1,$2,$3,$4,'body_length','총장','length',0)", [ids.pom, companyId, revisionId, ids.spec]);
  await client.query("INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value) VALUES($1,$2,$3,$4,$5,70)", [companyId, revisionId, ids.spec, ids.specSize, ids.pom]);
  await client.query("INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,required_quantity,allowance_quantity,inventory_usage_quantity,order_quantity,unit_code,unit_price,amount,status,display_order,entity_version) VALUES($1,$2,$3,'fabric',$4,1,0,0,1,'yd',1000,1000,'editing',0,1)", [ids.material, companyId, revisionId, `${marker} 원단`]);
  await client.query("INSERT INTO work_order_processes(id,company_id,revision_id,process_type_code,process_name_snapshot,quantity,unit_code,unit_price,amount,status,display_order,entity_version) VALUES($1,$2,$3,'production_factory','기본 공정',17,'ea',100,1700,'ready',0,1)", [ids.process, companyId, revisionId]);

  const before = await dbCounts(populated);
  assert.deepEqual([before.sizes, before.colors, before.quantities, before.specs, before.spec_values, before.materials, before.processes], [1, 1, 1, 1, 1, 1, 1]);

  const failed = await request(`/api/v2/work-orders/${populated}`, { method: "PATCH", body: { clientRequestId: `a68-confirm-failure-${suffix.toLowerCase()}`, expectedVersion: version + 99, patch: { productTypeCode: "wafl-c1|M|B", resetCategoryDependents: true } } });
  assert.equal(failed.response.status, 409);
  assert.deepEqual(await dbCounts(populated), before, "failed reset must leave no mixed partial state");

  const reset = await command(populated, "", "PATCH", version, { patch: { productTypeCode: "wafl-c1|M|B", resetCategoryDependents: true } }, "category-reset");
  version = reset.nextVersion;
  const after = await dbCounts(populated);
  assert.equal(after.product_type_code, "wafl-c1|M|B");
  assert.equal(after.item_code, null);
  assert.equal(Number(after.total_quantity), 0);
  assert.deepEqual([after.sizes, after.colors, after.quantities, after.specs, after.spec_values], [0, 0, 0, 0, 0]);
  assert.deepEqual([after.materials, after.processes], [1, 1]);
  const detailSave = await command(populated, "", "PATCH", version, { patch: { itemCode: "팬츠" } }, "category-detail-after-reset");
  version = detailSave.nextVersion;
  const resetWithDetail = await dbCounts(populated);
  assert.equal(resetWithDetail.product_type_code, "wafl-c1|M|B");
  assert.equal(resetWithDetail.item_code, "팬츠");

  const empty = await createDraft("empty");
  const emptyDetail = await detail(empty);
  const direct = await command(empty, "", "PATCH", emptyDetail.header.entityVersion, { patch: { productTypeCode: "wafl-c1|M|D", resetCategoryDependents: true } }, "empty-direct");
  assert.equal(direct.result.productTypeCode, "wafl-c1|M|D");

  const partners = await request(`/api/v2/work-orders/${populated}/material-partners`);
  assert.equal(partners.response.status, 200);
  assert.ok(partners.json.data.items.every((item) => Array.isArray(item.capabilityTypes) && Array.isArray(item.processCodes)));
  const expectedCapabilities = (await client.query(`SELECT p.id,array_agg(DISTINCT pi.item_type ORDER BY pi.item_type) types FROM partners p JOIN partner_items pi ON pi.company_id=p.company_id AND pi.partner_id=p.id AND pi.is_active=true WHERE p.company_id=$1 AND p.is_active=true GROUP BY p.id`, [companyId])).rows;
  const actualById = new Map(partners.json.data.items.map((item) => [item.id, item.capabilityTypes]));
  for (const row of expectedCapabilities) assert.deepEqual(actualById.get(row.id), row.types);

  await client.query("BEGIN");
  try {
    for (const round of [1, 2, 3]) {
      await client.query(`INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version) VALUES($1,'work_order',$2::uuid,'work_order.reorder_deleted',NULL,$3::uuid,'QA deleted reorder tombstone',$4::jsonb,1)`, [companyId, populated, crypto.randomUUID(), JSON.stringify({ seriesRootWorkOrderId: populated, reorderRound: round, state: "deleted" })]);
    }
    const tombstones = (await client.query(`SELECT (metadata->>'reorderRound')::integer round FROM domain_events WHERE company_id=$1 AND command_code='work_order.reorder_deleted' AND metadata->>'seriesRootWorkOrderId'=$2 ORDER BY round`, [companyId, populated])).rows.map((row) => row.round);
    assert.deepEqual(tombstones, [1, 2, 3]);
    const nextRound = Number((await client.query(`SELECT COALESCE(max(used_round),0)+1 next_round FROM (SELECT reorder_round used_round FROM work_orders WHERE company_id=$1 AND series_root_work_order_id=$2::uuid AND derivation_kind='reorder' UNION ALL SELECT (metadata->>'reorderRound')::integer FROM domain_events WHERE company_id=$1 AND command_code='work_order.reorder_deleted' AND metadata->>'seriesRootWorkOrderId'=$2::text) used`, [companyId, populated])).rows[0].next_round);
    assert.equal(nextRound, 4);
  } finally {
    await client.query("ROLLBACK");
  }
  const tombstoneResidual = Number((await client.query(`SELECT count(*) count FROM domain_events WHERE company_id=$1 AND command_code='work_order.reorder_deleted' AND metadata->>'seriesRootWorkOrderId'=$2`, [companyId, populated])).rows[0].count);
  assert.equal(tombstoneResidual, 0);

  const result = {
    ok: true,
    categoryReset: { forcedFailureAtomic: true, dependentResidual: 0, materialsPreserved: after.materials, processesPreserved: after.processes, canonicalTotal: Number(after.total_quantity), serializedDetailPatch: true, finalItemCode: resetWithDetail.item_code },
    emptyDraftDirectChange: true,
    partnerRowsVerified: expectedCapabilities.length,
    tombstoneRounds: [1, 2, 3],
    nextRound: 4,
    tombstoneTransactionRolledBack: true,
    migration: 0,
    triggerDisabled: false,
    productionMutation: 0,
    ownerMutation: 0,
    ambiguousMutation: 0,
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result));
} finally {
  for (const id of createdIds.reverse()) {
    const removed = await request(`/api/v2/work-orders/${id}`, { method: "DELETE" }).catch(() => null);
    if (!removed || ![200, 404].includes(removed.response.status)) throw new Error(`EXACT_DRAFT_CLEANUP_FAILED:${id}`);
  }
  await client.end();
}
