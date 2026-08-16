#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const companyId = "wafl-fn-company-a";
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "wafl-external-qa", "state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const kstDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("-", "");
const marker = `QA A64 spec catalog isolated ${kstDate}-${suffix}`;
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "alpha64-spec-catalog-runtime-result.json");
const short = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

assert.equal(state.status, "running");
assert.equal(state.makerQaProfile, "alpha64-current-maker");
assert.equal(state.mutationMode, "current-maker-alpha64");
assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);

const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha64-spec-catalog-runtime-qa" });
let cookie = "";
let version = 0;
let workOrder = null;
let templateId = null;
let cleanupComplete = false;
const catalogIds = [];
const requests = [];
const commandKeys = new Map();

async function counts() {
  const row = (await client.query(`SELECT
    (SELECT count(*)::integer FROM work_orders) work_orders,
    (SELECT count(*)::integer FROM work_order_revisions) revisions,
    (SELECT count(*)::integer FROM work_order_sizes) sizes,
    (SELECT count(*)::integer FROM work_order_size_specs) specs,
    (SELECT count(*)::integer FROM work_order_size_spec_poms) poms,
    (SELECT count(*)::integer FROM work_order_size_spec_values) values,
    (SELECT count(*)::integer FROM size_spec_templates) templates,
    (SELECT count(*)::integer FROM company_work_order_structure_options) catalog_options,
    (SELECT count(*)::integer FROM generated_documents) generated_documents,
    (SELECT count(*)::integer FROM document_access_tokens) tokens,
    (SELECT count(*)::integer FROM wafl_v2_migration_ledger) migrations`)).rows[0];
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

async function provision() {
  const child = spawn(process.execPath, [path.join(root, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: env.DATABASE_URL,
      WAFL_SESSION_SECRET: env.WAFL_SESSION_SECRET,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA64 SPEC CATALOG ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: state.fingerprintVerified ? "01e5dcc7fea3" : "",
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a64-spec-isolated-create-${suffix.toLowerCase()}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a64-spec-isolated-create-${suffix.toLowerCase()}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => { stdout += data; });
  child.stderr.on("data", (data) => { stderr += data; });
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", resolve); });
  assert.equal(code, 0, stderr);
  assert.match(stdout, /Result: PASS/u);
}

async function request(route, method, body, key) {
  const started = performance.now();
  const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const json = await response.json().catch(() => null);
  requests.push({ method, route: route.replace(workOrder?.id ?? "__none__", "fixture"), status: response.status, elapsedMs: Number((performance.now() - started).toFixed(2)) });
  return { response, json };
}

async function structure(pathname, method, payload, label) {
  const key = `a64-spec-${suffix}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrder.id}/size-color/${pathname}`, method, { clientRequestId: key, expectedVersion: version, ...payload }, key);
  assert.ok([200, 201].includes(result.response.status), `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
  return result.json.data.result;
}

async function measurement(kind, payload, label, replay = false) {
  const key = `a64-spec-${suffix}-${label}`;
  const expectedVersion = replay ? commandKeys.get(key) : version;
  assert.ok(Number.isSafeInteger(expectedVersion), `missing-version:${label}`);
  const result = await request(`/api/v2/work-orders/${workOrder.id}/size-spec/commands`, "POST", { kind, clientRequestId: key, expectedVersion, ...payload }, key);
  assert.equal(result.response.status, replay ? 200 : 201, `${label}:${result.response.status}`);
  if (!replay) { commandKeys.set(key, expectedVersion); version = result.json.data.nextVersion; }
  return result.json.data.result;
}

async function createCatalog(name, label, expectedCategoryCode = "T") {
  const key = `a64-spec-${suffix}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrder.id}/size-color/options`, "POST", { clientRequestId: key, expectedVersion: version, kind: "spec_item", displayName: name, hexValue: null }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  assert.equal(result.json.data.item.kind, "spec_item");
  assert.equal(result.json.data.item.categoryCode, expectedCategoryCode);
  catalogIds.push(result.json.data.item.id);
  return result.json.data.item;
}

async function patchCategory(productTypeCode, label) {
  const key = `a64-spec-${suffix}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrder.id}`, "PATCH", { clientRequestId: key, expectedVersion: version, patch: { productTypeCode } }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
}

async function readCatalog() {
  const result = await request(`/api/v2/work-orders/${workOrder.id}/size-color/options`, "GET");
  assert.equal(result.response.status, 200);
  return result.json.data;
}

async function readSpec() {
  const result = await request(`/api/v2/work-orders/${workOrder.id}/size-spec`, "GET");
  assert.equal(result.response.status, 200);
  return result.json.data;
}

async function cleanup() {
  await client.query("BEGIN");
  try {
    const owned = (await client.query(`SELECT product_name,current_revision_id::text revision_id FROM work_orders WHERE company_id=$1 AND id=$2::uuid FOR UPDATE`, [companyId, workOrder.id])).rows[0];
    assert.deepEqual(owned, { product_name: marker, revision_id: workOrder.revisionId });
    const receipts = (await client.query(`SELECT company_id,command_code,idempotency_key FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid`, [companyId, workOrder.id])).rows;
    for (const receipt of receipts) await client.query(`UPDATE work_order_command_receipts SET work_order_id=NULL,result_revision_id=NULL WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [receipt.company_id, receipt.command_code, receipt.idempotency_key]);
    const specs = (await client.query(`SELECT id FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid`, [companyId, workOrder.revisionId])).rows;
    for (const spec of specs) {
      await client.query(`DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid`, [companyId, spec.id]);
      await client.query(`DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$2::uuid`, [companyId, spec.id]);
      await client.query(`DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid`, [companyId, spec.id]);
      await client.query(`DELETE FROM work_order_size_specs WHERE company_id=$1 AND id=$2::uuid`, [companyId, spec.id]);
    }
    await client.query(`DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid`, [companyId, workOrder.revisionId]);
    await client.query(`DELETE FROM company_work_order_structure_options WHERE company_id=$1 AND id=ANY($2::uuid[])`, [companyId, catalogIds]);
    await client.query(`DELETE FROM size_spec_template_values WHERE template_id=$1::uuid`, [templateId]);
    await client.query(`DELETE FROM size_spec_template_sizes WHERE template_id=$1::uuid`, [templateId]);
    await client.query(`DELETE FROM size_spec_template_poms WHERE template_id=$1::uuid`, [templateId]);
    await client.query(`DELETE FROM size_spec_templates WHERE id=$1::uuid AND company_id IS NULL AND name=$2`, [templateId, `A64 spec ${suffix}`]);
    await client.query(`UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=$2::uuid AND current_revision_id=$3::uuid`, [companyId, workOrder.id, workOrder.revisionId]);
    await client.query(`DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid`, [companyId, workOrder.revisionId]);
    await client.query(`DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND product_name=$3 AND current_revision_id IS NULL`, [companyId, workOrder.id, marker]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function main() {
  await client.connect();
  const before = await counts();
  try {
    await provision();
    const row = (await client.query(`SELECT id::text,current_revision_id::text revision_id,entity_version FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL`, [companyId, marker])).rows[0];
    assert.ok(row);
    workOrder = { id: row.id, revisionId: row.revision_id };
    version = Number(row.entity_version);
    templateId = crypto.randomUUID();
    await client.query("BEGIN");
    try {
      await client.query(`INSERT INTO size_spec_templates(id,company_id,source_kind,name,template_version,is_active) VALUES($1,NULL,'system',$2,1,true)`, [templateId, `A64 spec ${suffix}`]);
      const templateSize = (await client.query(`INSERT INTO size_spec_template_sizes(id,template_id,size_code,display_label,display_order) VALUES(gen_random_uuid(),$1,'L','L',0) RETURNING id`, [templateId])).rows[0];
      const templatePom = (await client.query(`INSERT INTO size_spec_template_poms(id,template_id,pom_code,display_name,measurement_type,display_order) VALUES(gen_random_uuid(),$1,'body_length','총장','length',0) RETURNING id`, [templateId])).rows[0];
      await client.query(`INSERT INTO size_spec_template_values(template_id,size_row_id,pom_column_id,decimal_value) VALUES($1,$2,$3,72.5)`, [templateId, templateSize.id, templatePom.id]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }

    const auth = await request("/api/dev/mobile-connect/auto", "POST", {}, "auth");
    assert.equal(auth.response.status, 200);
    await structure("sizes", "POST", { displayLabel: "L" }, "size-l");
    const neutralOption = await createCatalog(`중립 스펙 ${suffix}`, "catalog-neutral", null);
    await measurement("set-pom-selection", { selectedItems: [{ catalogOptionId: neutralOption.id, systemSpecItemKey: null, currentPomId: null, displayName: neutralOption.displayName }] }, "empty-bootstrap");
    let spec = await readSpec();
    assert.equal(spec.pomColumns.length, 1, "first explicit V must bootstrap the missing measurement aggregate");
    assert.equal(spec.pomColumns[0].displayName, neutralOption.displayName);
    assert.equal(spec.sizes.length, 1, "bootstrap must project current WorkOrder sizes");
    assert.equal(spec.cells.length, 0, "new POM values begin empty");
    await patchCategory("wafl-c1|U|T", "category-top");
    await measurement("apply-template", { templateId }, "apply-template");
    spec = await readSpec();
    const retainedPom = spec.pomColumns[0];
    const retainedCell = spec.cells[0];
    assert.equal(Number(retainedCell.decimalValue), 72.5);

    const optionA = await createCatalog(`소매길이 ${suffix}`, "catalog-a");
    const optionB = await createCatalog(`어깨너비 ${suffix}`, "catalog-b");
    let catalogPage = await readCatalog();
    assert.equal(catalogPage.categoryCode, "T");
    assert.equal(catalogPage.items.some((item) => item.id === optionA.id), true);

    const categoryPreservedBefore = await readSpec();
    await patchCategory("wafl-c1|U|B", "category-bottom");
    catalogPage = await readCatalog();
    assert.equal(catalogPage.categoryCode, "B");
    assert.equal(catalogPage.items.some((item) => item.id === optionA.id), false, "top custom must not pollute bottom category");
    let categoryPreservedAfter = await readSpec();
    assert.deepEqual(categoryPreservedAfter.pomColumns, categoryPreservedBefore.pomColumns, "category change must preserve POM rows");
    assert.deepEqual(categoryPreservedAfter.cells, categoryPreservedBefore.cells, "category change must preserve values");
    await patchCategory(null, "category-unset");
    catalogPage = await readCatalog();
    assert.equal(catalogPage.categoryCode, null);
    categoryPreservedAfter = await readSpec();
    assert.deepEqual(categoryPreservedAfter.pomColumns, categoryPreservedBefore.pomColumns, "category unset must preserve POM rows");
    assert.deepEqual(categoryPreservedAfter.cells, categoryPreservedBefore.cells, "category unset must preserve values");
    await patchCategory("wafl-c1|U|T", "category-top-restore");
    catalogPage = await readCatalog();
    assert.equal(catalogPage.items.some((item) => item.id === optionA.id), true);
    const crossCompanyCount = Number((await client.query(`SELECT count(*)::integer count FROM company_work_order_structure_options WHERE company_id<>$1 AND id=$2::uuid`, [companyId, optionA.id])).rows[0]?.count ?? -1);
    assert.equal(crossCompanyCount, 0);
    const selectedItems = [
      { catalogOptionId: null, systemSpecItemKey: "T:body_length", currentPomId: retainedPom.id, displayName: retainedPom.displayName },
      { catalogOptionId: null, systemSpecItemKey: "T:sleeve_length", currentPomId: null, displayName: "소매길이" },
      { catalogOptionId: optionA.id, systemSpecItemKey: null, currentPomId: null, displayName: optionA.displayName },
      { catalogOptionId: optionB.id, systemSpecItemKey: null, currentPomId: null, displayName: optionB.displayName },
    ];
    await measurement("set-pom-selection", { selectedItems }, "pom-selection");
    await measurement("set-pom-selection", { selectedItems }, "pom-selection", true);
    spec = await readSpec();
    assert.equal(spec.pomColumns.length, 4);
    assert.equal(spec.pomColumns.some((pom) => pom.code === "wafl_system_spec_item:T:sleeve_length" && pom.displayName === "소매길이"), true);
    assert.equal(Number(spec.cells.find((cell) => cell.pomColumnId === retainedPom.id)?.decimalValue), 72.5);
    assert.equal(spec.cells.filter((cell) => spec.pomColumns.some((pom) => pom.id === cell.pomColumnId && pom.displayName.includes(suffix))).length, 0);

    const renameKey = `a64-spec-${suffix}-rename-a`;
    const renamed = await request(`/api/v2/work-orders/${workOrder.id}/size-color/options/${optionA.id}`, "PATCH", { clientRequestId: renameKey, expectedVersion: version, displayName: `소매수정 ${suffix}` }, renameKey);
    assert.equal(renamed.response.status, 200);
    spec = await readSpec();
    assert.equal(spec.pomColumns.some((pom) => pom.displayName === optionA.displayName), true, "catalog rename must not rewrite snapshot");

    const removeKey = `a64-spec-${suffix}-remove-b`;
    const removed = await request(`/api/v2/work-orders/${workOrder.id}/size-color/options/${optionB.id}`, "DELETE", { clientRequestId: removeKey, expectedVersion: version }, removeKey);
    assert.equal(removed.response.status, 200);
    assert.equal(removed.json.data.deactivated, true);
    const retainedAfter = spec.pomColumns.filter((pom) => pom.displayName !== optionB.displayName).map((pom) => ({
      catalogOptionId: null,
      systemSpecItemKey: pom.code.startsWith("wafl_system_spec_item:") ? pom.code.slice("wafl_system_spec_item:".length) : null,
      currentPomId: pom.id,
      displayName: pom.displayName,
    }));
    await measurement("set-pom-selection", { selectedItems: retainedAfter }, "pom-remove-b");
    spec = await readSpec();
    assert.equal(spec.pomColumns.some((pom) => pom.displayName === optionB.displayName), false);
    assert.equal(Number(spec.cells.find((cell) => cell.pomColumnId === retainedPom.id)?.decimalValue), 72.5);

    const evidence = (await client.query(`SELECT
      (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_id=$2 AND command_code='work_order.measurement.pom_selection.batch') pom_events,
      (SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid AND command_code='work_order.measurement.pom_selection.batch') pom_receipts,
      (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid) documents,
      (SELECT count(*)::integer FROM document_access_tokens t JOIN generated_documents d ON d.id=t.generated_document_id WHERE d.company_id=$1 AND d.work_order_id=$2::uuid) tokens`, [companyId, workOrder.id])).rows[0];
    assert.deepEqual({ events: Number(evidence.pom_events), receipts: Number(evidence.pom_receipts), documents: Number(evidence.documents), tokens: Number(evidence.tokens) }, { events: 3, receipts: 3, documents: 0, tokens: 0 });

    const fixtureRef = short(workOrder.id);
    await cleanup();
    cleanupComplete = true;
    const after = await counts();
    assert.deepEqual(after, before, "isolated mutable business residual");
    const result = {
      result: "PASS",
      checkpoint: "ALPHA64_SPEC_CATALOG_RUNTIME_PASS",
      fixtureRef,
      requests: requests.length,
      requestLedger: requests,
      assertions: {
        sameCompanyCatalog: true,
        emptySpecBootstrap: true,
        nullCategoryDirectCreate: true,
        categoryScopedCatalog: true,
        unrelatedCategoryExcluded: true,
        crossCompanyExcluded: true,
        categoryChangeMutationZeroForSpec: true,
        categoryUnsetMutationZeroForSpec: true,
        systemSpecItemSnapshot: true,
        selectionBatchTransaction: true,
        xZeroMutationSourceContract: true,
        retainedValuePreserved: true,
        newItemEmpty: true,
        replay: true,
        renameSnapshotIndependent: true,
        deactivateHistoryPreserved: true,
        removedPomAndValues: true,
      },
      cleanup: { mutableBusinessResidual: 0, eventReceiptPreserved: true },
      migrationLedger: after.migrations,
      generatedDocumentMutation: 0,
      tokenMutation: 0,
      productionMutation: 0,
    };
    fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log("ALPHA64_SPEC_CATALOG_RUNTIME_PASS");
  } finally {
    if (workOrder && !cleanupComplete) {
      await cleanup();
      cleanupComplete = true;
    }
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA64_SPEC_CATALOG_RUNTIME_FAIL", error instanceof Error ? error.stack : String(error));
  console.error("ALPHA64_SPEC_CATALOG_RUNTIME_REQUEST_LEDGER", JSON.stringify(requests, null, 2));
  process.exitCode = 1;
});
