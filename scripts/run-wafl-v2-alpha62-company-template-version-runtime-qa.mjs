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
const templateName = `A62 version ${suffix}`;
const client = new Client({ connectionString: localEnv.DATABASE_URL, application_name: "wafl-alpha62-template-version-runtime-qa" });

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

async function command(cookie, workOrderId, expectedVersion, kind, payload) {
  const key = `a62-version-${kind}-${suffix}`;
  const response = await fetch(`https://${state.tailscaleServeHostname}/api/v2/work-orders/${workOrderId}/size-spec/commands`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Cookie: cookie, "Idempotency-Key": key },
    body: JSON.stringify({ kind, clientRequestId: key, expectedVersion, ...payload }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.json();
  assert.equal(response.status, 201, `${kind}:${response.status}:${JSON.stringify(body)}`);
  return body.data.result;
}

async function cleanup(workOrderId, revisionId, systemTemplateId) {
  await client.query("BEGIN");
  try {
    const owned = (await client.query("SELECT product_name,current_revision_id::text revision_id FROM work_orders WHERE company_id=$1 AND id=$2::uuid FOR UPDATE", [companyId, workOrderId])).rows[0];
    assert.deepEqual(owned, { product_name: marker, revision_id: revisionId });
    const receipts = (await client.query("SELECT company_id,command_code,idempotency_key FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, workOrderId])).rows;
    for (const receipt of receipts) await client.query("UPDATE work_order_command_receipts SET work_order_id=NULL,result_revision_id=NULL WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3", [receipt.company_id, receipt.command_code, receipt.idempotency_key]);
    const specIds = (await client.query("SELECT id::text FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, revisionId])).rows;
    for (const spec of specIds) {
      await client.query("DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_specs WHERE company_id=$1 AND id=$2::uuid", [companyId, spec.id]);
    }
    const templates = (await client.query("SELECT id::text,source_kind FROM size_spec_templates WHERE (id=$1::uuid AND company_id IS NULL) OR (company_id=$2 AND name=$3)", [systemTemplateId, companyId, templateName])).rows;
    assert.equal(templates.length, 3);
    for (const template of templates) {
      await client.query("DELETE FROM size_spec_template_values WHERE template_id=$1::uuid", [template.id]);
      await client.query("DELETE FROM size_spec_template_sizes WHERE template_id=$1::uuid", [template.id]);
      await client.query("DELETE FROM size_spec_template_poms WHERE template_id=$1::uuid", [template.id]);
      await client.query("DELETE FROM size_spec_templates WHERE id=$1::uuid", [template.id]);
    }
    await client.query("UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=$2::uuid AND current_revision_id=$3::uuid", [companyId, workOrderId, revisionId]);
    await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid", [companyId, revisionId]);
    await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND current_revision_id IS NULL", [companyId, workOrderId]);
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
  let systemTemplateId = null;
  try {
    await provision();
    const work = (await client.query("SELECT id::text work_order_id,current_revision_id::text revision_id,entity_version FROM work_orders WHERE company_id=$1 AND product_name=$2", [companyId, marker])).rows[0];
    assert.ok(work);
    ({ work_order_id: workOrderId, revision_id: revisionId } = work);
    systemTemplateId = crypto.randomUUID();
    const sizeId = crypto.randomUUID();
    const pomId = crypto.randomUUID();
    await client.query("BEGIN");
    await client.query("INSERT INTO size_spec_templates(id,company_id,source_kind,name,template_version,is_active) VALUES($1,NULL,'system',$2,1,true)", [systemTemplateId, `A62 version system ${suffix}`]);
    await client.query("INSERT INTO size_spec_template_sizes(id,template_id,size_code,display_label,display_order) VALUES($1,$2,'L','L',0)", [sizeId, systemTemplateId]);
    await client.query("INSERT INTO size_spec_template_poms(id,template_id,pom_code,display_name,measurement_type,display_order) VALUES($1,$2,'body_length','총장','length',0)", [pomId, systemTemplateId]);
    await client.query("INSERT INTO size_spec_template_values(template_id,size_row_id,pom_column_id,decimal_value) VALUES($1,$2,$3,70)", [systemTemplateId, sizeId, pomId]);
    await client.query("COMMIT");
    let cookie = "";
    const auth = await fetch(`https://${state.tailscaleServeHostname}/api/dev/mobile-connect/auto`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: "{}" });
    assert.equal(auth.status, 200);
    cookie = (auth.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
    let version = Number(work.entity_version);
    version = (await command(cookie, workOrderId, version, "apply-template", { templateId: systemTemplateId })).nextVersion;
    version = (await command(cookie, workOrderId, version, "save-company-template", { templateName })).nextVersion;
    const first = (await client.query("SELECT id::text FROM size_spec_templates WHERE company_id=$1 AND name=$2 AND template_version=1", [companyId, templateName])).rows[0];
    assert.ok(first);
    version = (await command(cookie, workOrderId, version, "update-company-template", { templateId: first.id })).nextVersion;
    assert.ok(version > Number(work.entity_version));
    const versions = (await client.query("SELECT template_version,is_active,(SELECT count(*)::integer FROM size_spec_template_values WHERE template_id=t.id) value_count FROM size_spec_templates t WHERE company_id=$1 AND name=$2 ORDER BY template_version", [companyId, templateName])).rows;
    assert.deepEqual(versions.map((row) => [Number(row.template_version), row.is_active, Number(row.value_count)]), [[1, false, 0], [2, true, 0]], "template versions must preserve the WorkOrder-size intersection; no WorkOrder size means no values");
    const list = await fetch(`https://${state.tailscaleServeHostname}/api/v2/work-orders/${workOrderId}/size-spec/templates`, { headers: { Accept: "application/json", Cookie: cookie } });
    const listBody = await list.json();
    assert.equal(list.status, 200);
    assert.deepEqual(listBody.data.items.filter((item) => item.sourceKind === "company" && item.name === templateName).map((item) => item.templateVersion), [2]);
    await cleanup(workOrderId, revisionId, systemTemplateId);
    const residual = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2", [companyId, marker]);
    assert.equal(Number(residual.rows[0].count), 0);
    console.log("ALPHA62_COMPANY_TEMPLATE_VERSION_RUNTIME_PASS");
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
