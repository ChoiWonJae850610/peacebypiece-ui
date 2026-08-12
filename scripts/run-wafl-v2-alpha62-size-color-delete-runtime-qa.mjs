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
const localEnv = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
assert.equal(state.runtimeQaMode, "size-measurement-standards");
assert.equal(state.mutationMode, "size-measurement-standards");
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A62 size measurement isolated 20260811-${suffix}`;
const client = new Client({ connectionString: localEnv.DATABASE_URL, application_name: "wafl-alpha62-size-color-delete-runtime-qa" });

async function provision() {
  const child = spawn(process.execPath, [path.join(root, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: localEnv.DATABASE_URL,
      WAFL_SESSION_SECRET: localEnv.WAFL_SESSION_SECRET,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA62 ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: state.fingerprintVerified ? "01e5dcc7fea3" : "",
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a62-isolated-create-${suffix.toLowerCase()}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a62-isolated-create-${suffix.toLowerCase()}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  let error = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { error += chunk; });
  const exitCode = await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", resolve); });
  assert.equal(exitCode, 0, error);
  assert.match(output, /Result: PASS/u);
}

function metric(response, elapsedMs, followUpRequests = 0) {
  const number = (name) => {
    const value = response.headers.get(name);
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  return {
    elapsedMs: Number(elapsedMs.toFixed(2)),
    routeMs: number("x-wafl-timing-route-ms"),
    guardMs: number("x-wafl-timing-guard-ms"),
    productMs: number("x-wafl-timing-product-ms"),
    dbMs: number("x-wafl-command-db-ms"),
    statementCount: number("x-wafl-command-statement-count"),
    requestCount: 1 + followUpRequests,
    followUpRequests,
  };
}

async function cleanup(workOrderId, revisionId, templateId) {
  await client.query("BEGIN");
  try {
    const owned = (await client.query("SELECT product_name,current_revision_id::text revision_id FROM work_orders WHERE company_id=$1 AND id=$2::uuid FOR UPDATE", [companyId, workOrderId])).rows[0];
    assert.deepEqual(owned, { product_name: marker, revision_id: revisionId });
    const receipts = (await client.query("SELECT company_id,command_code,idempotency_key FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, workOrderId])).rows;
    for (const receipt of receipts) await client.query("UPDATE work_order_command_receipts SET work_order_id=NULL,result_revision_id=NULL WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3", [receipt.company_id, receipt.command_code, receipt.idempotency_key]);
    const specs = (await client.query("SELECT id::text FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId])).rows;
    for (const spec of specs) {
      await client.query("DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_specs WHERE company_id=$1 AND id=$2::uuid", [companyId, spec.id]);
    }
    await client.query("DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM size_spec_template_values WHERE template_id=$1::uuid", [templateId]);
    await client.query("DELETE FROM size_spec_template_sizes WHERE template_id=$1::uuid", [templateId]);
    await client.query("DELETE FROM size_spec_template_poms WHERE template_id=$1::uuid", [templateId]);
    assert.equal((await client.query("DELETE FROM size_spec_templates WHERE id=$1::uuid AND company_id IS NULL AND name=$2", [templateId, `A62 delete ${suffix}`])).rowCount, 1);
    await client.query("UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=$2::uuid AND current_revision_id=$3::uuid", [companyId, workOrderId, revisionId]);
    assert.equal((await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid", [companyId, revisionId])).rowCount, 1);
    assert.equal((await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND current_revision_id IS NULL", [companyId, workOrderId])).rowCount, 1);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  await client.connect();
  let workOrderId = null;
  let revisionId = null;
  let templateId = null;
  try {
    await provision();
    const work = (await client.query("SELECT id::text work_order_id,current_revision_id::text revision_id,entity_version FROM work_orders WHERE company_id=$1 AND product_name=$2", [companyId, marker])).rows[0];
    assert.ok(work);
    workOrderId = work.work_order_id;
    revisionId = work.revision_id;
    let version = Number(work.entity_version);
    templateId = crypto.randomUUID();
    const templateSizeId = crypto.randomUUID();
    const templatePomId = crypto.randomUUID();
    await client.query("BEGIN");
    await client.query("INSERT INTO size_spec_templates(id,company_id,source_kind,name,template_version,is_active) VALUES($1,NULL,'system',$2,1,true)", [templateId, `A62 delete ${suffix}`]);
    await client.query("INSERT INTO size_spec_template_sizes(id,template_id,size_code,display_label,display_order) VALUES($1,$2,'M','M',0)", [templateSizeId, templateId]);
    await client.query("INSERT INTO size_spec_template_poms(id,template_id,pom_code,display_name,measurement_type,display_order) VALUES($1,$2,'body_length','총장','length',0)", [templatePomId, templateId]);
    await client.query("COMMIT");

    let cookie = "";
    const base = `https://${state.tailscaleServeHostname}`;
    const auth = await fetch(`${base}/api/dev/mobile-connect/auto`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: "{}" });
    assert.equal(auth.status, 200);
    cookie = (auth.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
    const request = async (route, method, body, key) => {
      const started = performance.now();
      const response = await fetch(`${base}${route}`, { method, headers: { Accept: "application/json", "Content-Type": "application/json", Cookie: cookie, "Idempotency-Key": key }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
      const elapsed = performance.now() - started;
      const json = await response.json();
      return { response, json, metric: metric(response, elapsed) };
    };
    const command = async (route, method, payload, label) => {
      const key = `a62-delete-${label}-${suffix.toLowerCase()}`;
      const result = await request(route, method, { clientRequestId: key, expectedVersion: version, ...payload }, key);
      assert.ok([200, 201].includes(result.response.status), `${label}:${result.response.status}:${JSON.stringify(result.json)}`);
      version = result.json.data.nextVersion;
      return result;
    };

    await command(`/api/v2/work-orders/${workOrderId}/size-spec/commands`, "POST", { kind: "apply-template", templateId }, "apply");
    const sizeA = await command(`/api/v2/work-orders/${workOrderId}/size-color/sizes`, "POST", { displayLabel: `삭제-${suffix}-A` }, "size-a");
    const sizeB = await command(`/api/v2/work-orders/${workOrderId}/size-color/sizes`, "POST", { displayLabel: `유지-${suffix}-B` }, "size-b");
    const colorA = await command(`/api/v2/work-orders/${workOrderId}/size-color/colors`, "POST", { displayName: `유지-${suffix}-A`, hexValue: "#23375A" }, "color-a");
    const colorB = await command(`/api/v2/work-orders/${workOrderId}/size-color/colors`, "POST", { displayName: `삭제-${suffix}-B`, hexValue: "#909090" }, "color-b");
    const sizeAId = sizeA.json.data.result.targetId;
    const sizeBId = sizeB.json.data.result.targetId;
    const colorAId = colorA.json.data.result.targetId;
    const colorBId = colorB.json.data.result.targetId;
    await command(`/api/v2/work-orders/${workOrderId}/size-color/quantities/${colorAId}/${sizeAId}`, "PATCH", { quantity: 7 }, "qty-a");
    await command(`/api/v2/work-orders/${workOrderId}/size-color/quantities/${colorBId}/${sizeBId}`, "PATCH", { quantity: 5 }, "qty-b");

    const matrixBefore = await (await fetch(`${base}/api/v2/work-orders/${workOrderId}/size-color`, { headers: { Cookie: cookie } })).json();
    const specBefore = await (await fetch(`${base}/api/v2/work-orders/${workOrderId}/size-spec`, { headers: { Cookie: cookie } })).json();
    assert.ok(matrixBefore.data.sizes.some((item) => item.id === sizeAId));
    assert.ok(matrixBefore.data.colors.some((item) => item.id === colorBId));
    assert.equal(specBefore.data.sizes.find((item) => item.id === sizeAId)?.id, sizeAId, "finished spec must use WorkOrder Size identity");

    const sizeDeleteKey = `a62-delete-size-delete-${suffix.toLowerCase()}`;
    const sizeDeleteVersion = version;
    const sizeDelete = await request(`/api/v2/work-orders/${workOrderId}/size-color/sizes/${sizeAId}`, "DELETE", { clientRequestId: sizeDeleteKey, expectedVersion: sizeDeleteVersion }, sizeDeleteKey);
    assert.equal(sizeDelete.response.status, 200, JSON.stringify(sizeDelete.json));
    version = sizeDelete.json.data.nextVersion;
    assert.deepEqual([sizeDelete.json.data.result.deletedQuantityCellCount, sizeDelete.json.data.result.removedQuantity, sizeDelete.json.data.result.totalQuantity], [1, 7, 5]);
    const sizeReplay = await request(`/api/v2/work-orders/${workOrderId}/size-color/sizes/${sizeAId}`, "DELETE", { clientRequestId: sizeDeleteKey, expectedVersion: sizeDeleteVersion }, sizeDeleteKey);
    assert.equal(sizeReplay.response.status, 200);
    assert.equal(sizeReplay.json.data.result.totalQuantity, 5);

    const colorDeleteKey = `a62-delete-color-delete-${suffix.toLowerCase()}`;
    const colorDelete = await request(`/api/v2/work-orders/${workOrderId}/size-color/colors/${colorBId}`, "DELETE", { clientRequestId: colorDeleteKey, expectedVersion: version }, colorDeleteKey);
    assert.equal(colorDelete.response.status, 200, JSON.stringify(colorDelete.json));
    version = colorDelete.json.data.nextVersion;
    assert.deepEqual([colorDelete.json.data.result.deletedQuantityCellCount, colorDelete.json.data.result.removedQuantity, colorDelete.json.data.result.totalQuantity], [1, 5, 0]);

    const matrixAfter = await (await fetch(`${base}/api/v2/work-orders/${workOrderId}/size-color`, { headers: { Cookie: cookie } })).json();
    const specAfter = await (await fetch(`${base}/api/v2/work-orders/${workOrderId}/size-spec`, { headers: { Cookie: cookie } })).json();
    assert.equal(matrixAfter.data.sizes.some((item) => item.id === sizeAId), false);
    assert.equal(matrixAfter.data.colors.some((item) => item.id === colorBId), false);
    assert.deepEqual([matrixAfter.data.quantityCells.length, Number(matrixAfter.data.matrixTotal), specAfter.data.sizes.some((item) => item.id === sizeAId), specAfter.data.sizes.some((item) => item.id === sizeBId)], [0, 0, false, true]);

    const supplier = (await client.query("SELECT id FROM partners WHERE company_id=$1 AND COALESCE(is_active,true)=true ORDER BY created_at,id LIMIT 1", [companyId])).rows[0];
    assert.ok(supplier?.id, "approved-company-supplier-missing");
    const materialPayload = (materialType, name) => ({ materialType, materialId: null, name, partnerId: supplier.id, colorOption: null, requiredQuantity: "3.5", allowanceQuantity: "0", inventoryUsageQuantity: "0", orderQuantity: "3.5", unitCode: materialType === "fabric" ? "yd" : "ea", unitPrice: "1000", memo: null, usageArea: null });
    const protectedFabric = await command(`/api/v2/work-orders/${workOrderId}/materials`, "POST", materialPayload("fabric", `원단-${suffix}`), "material-fabric-create");
    const protectedFabricId = protectedFabric.json.data.result.materialLineId;
    await command(`/api/v2/work-orders/${workOrderId}/materials/${protectedFabricId}`, "PATCH", { patch: { memo: "alpha62 authoring composition" } }, "material-fabric-patch");
    await command(`/api/v2/work-orders/${workOrderId}/materials/${protectedFabricId}/order-request`, "POST", {}, "material-order-request");
    await command(`/api/v2/work-orders/${workOrderId}/materials/${protectedFabricId}/order-cancel`, "POST", { reason: "isolated runtime protection" }, "material-order-cancel");
    const accessory = await command(`/api/v2/work-orders/${workOrderId}/materials`, "POST", materialPayload("accessory", `부자재-${suffix}`), "material-accessory-create");
    const accessoryId = accessory.json.data.result.materialLineId;
    await command(`/api/v2/work-orders/${workOrderId}/materials/${accessoryId}`, "PATCH", { patch: { colorOption: "남색" } }, "material-accessory-patch");
    const deleteCandidate = await command(`/api/v2/work-orders/${workOrderId}/materials`, "POST", materialPayload("fabric", `삭제원단-${suffix}`), "material-delete-candidate-create");
    const deleteCandidateId = deleteCandidate.json.data.result.materialLineId;
    await command(`/api/v2/work-orders/${workOrderId}/materials/${deleteCandidateId}`, "DELETE", {}, "material-delete");
    const materialAudit = await client.query("SELECT id::text,name,status,requested_at,cancelled_at,archived_at FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY name", [companyId, revisionId]);
    assert.equal(materialAudit.rows.some((row) => row.id === deleteCandidateId), false);
    assert.equal(materialAudit.rows.some((row) => row.id === protectedFabricId && row.status === "editing" && row.requested_at !== null && row.cancelled_at !== null), true);
    assert.equal(materialAudit.rows.some((row) => row.id === accessoryId && row.archived_at === null), true);
    const evidence = (await client.query("SELECT (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_id=$2 AND command_code IN ('work_order.size_structure.delete','work_order.color_structure.delete')) events,(SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid AND command_code IN ('work_order.size_structure.delete','work_order.color_structure.delete')) receipts", [companyId, workOrderId])).rows[0];
    assert.deepEqual([Number(evidence.events), Number(evidence.receipts)], [2, 2]);
    assert.deepEqual([sizeDelete.metric.requestCount, sizeDelete.metric.followUpRequests, colorDelete.metric.requestCount, colorDelete.metric.followUpRequests], [1, 0, 1, 0]);
    assert.ok(sizeDelete.metric.dbMs !== null && colorDelete.metric.dbMs !== null);

    await cleanup(workOrderId, revisionId, templateId);
    const residual = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2", [companyId, marker]);
    assert.equal(Number(residual.rows[0].count), 0);
    fs.writeFileSync(path.join(root, ".tmp", "wafl-external-qa", "alpha62-size-color-delete-runtime-result.json"), `${JSON.stringify({ result: "PASS", markerHash: crypto.createHash("sha256").update(marker).digest("hex").slice(0, 12), sizeDelete: sizeDelete.metric, colorDelete: colorDelete.metric, replay: true, quantityCleanup: true, workOrderSizeSourceOfTruth: true, makerAuthoringComposition: { fabricCreatePatch: true, accessoryCreatePatch: true, orderRequestCancel: true, eligibleMaterialHardDelete: true }, businessResidual: 0 }, null, 2)}\n`, "utf8");
    console.log("ALPHA62_SIZE_COLOR_DELETE_RUNTIME_PASS");
  } catch (error) {
    if (workOrderId && revisionId && templateId) await cleanup(workOrderId, revisionId, templateId);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
