#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import { WAFL_BASIC_SPEC_V1_TEMPLATE_IDS } from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A68 local authoring spec ${suffix}`;
const companyTemplateName = `${marker} company template`;
const base = `https://${state.tailscaleServeHostname}`;
const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha68-local-authoring-spec-runtime" });
const createdIds = [];
const requests = [];
let cookie = "";

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
  const json = (() => { try { return JSON.parse(text); } catch { return null; } })();
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "fixture"), status: response.status, code: json?.error?.code ?? null });
  return { response, json, text };
}

async function createDraft(label) {
  const key = `a68-local-spec-create-${label}-${suffix.toLowerCase()}`;
  const response = await request("/api/v2/work-orders", { method: "POST", key, body: { clientRequestId: key, productName: `${marker} ${label}`, isSample: false } });
  assert.equal(response.response.status, 201, response.text.slice(0, 300));
  const workOrderId = response.json.data.result.workOrderId;
  createdIds.push(workOrderId);
  return { workOrderId, version: response.json.data.nextVersion };
}

async function command(workOrderId, route, method, version, payload, label) {
  const key = `a68-local-spec-${label}-${suffix.toLowerCase()}`;
  const response = await request(`/api/v2/work-orders/${workOrderId}${route}`, { method, key, body: { clientRequestId: key, expectedVersion: version, ...payload } });
  assert.ok([200, 201].includes(response.response.status), `${label}:${response.response.status}:${response.text.slice(0, 400)}`);
  return response.json.data;
}

async function readSpec(workOrderId) {
  const response = await request(`/api/v2/work-orders/${workOrderId}/size-spec`);
  assert.equal(response.response.status, 200, response.text.slice(0, 300));
  return response.json.data;
}

async function readTemplateContent(workOrderId, templateId) {
  const response = await request(`/api/v2/work-orders/${workOrderId}/size-spec/templates?templateId=${encodeURIComponent(templateId)}`);
  assert.equal(response.response.status, 200, response.text.slice(0, 300));
  assert.equal(response.json.data.content.templateId, templateId);
  assert.ok(response.json.data.content.values.length > 0);
  return response.json.data.content;
}

async function configureTops(draft, label) {
  const result = await command(draft.workOrderId, "", "PATCH", draft.version, { patch: { productTypeCode: "wafl-c1|M|T", itemCode: "니트" } }, `${label}-category`);
  draft.version = result.nextVersion;
}

async function applyTemplate(draft, templateId, label) {
  const result = await command(draft.workOrderId, "/size-spec/commands", "POST", draft.version, { kind: "apply-template", templateId }, `${label}-apply`);
  draft.version = result.nextVersion;
}

async function addSize(draft, displayLabel, label) {
  const result = await command(draft.workOrderId, "/size-color/sizes", "POST", draft.version, { displayLabel }, label);
  draft.version = result.nextVersion;
  return result.result.targetId;
}

async function deleteDraft(workOrderId) {
  const response = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" });
  assert.equal(response.response.status, 200, response.text.slice(0, 300));
  assert.equal(response.json.data.deleted, true);
}

async function main() {
  assert.equal(state.status, "running");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  await client.connect();
  try {
    const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
    assert.equal(auth.response.status, 200);

    const systemDraft = await createDraft("system");
    await configureTops(systemDraft, "system");
    await applyTemplate(systemDraft, WAFL_BASIC_SPEC_V1_TEMPLATE_IDS.T, "system");
    const systemContent = await readTemplateContent(systemDraft.workOrderId, WAFL_BASIC_SPEC_V1_TEMPLATE_IDS.T);
    assert.ok(systemContent.values.some((value) => value.sizeCode === "M" && value.pomCode === "chest_width"));
    let spec = await readSpec(systemDraft.workOrderId);
    assert.equal(spec.templateId, WAFL_BASIC_SPEC_V1_TEMPLATE_IDS.T);
    assert.equal(spec.sizes.length, 0);
    assert.equal(spec.sourceTemplateModified, false);

    await addSize(systemDraft, "XS", "system-add-xs");
    await addSize(systemDraft, "S", "system-add-s");
    const mId = await addSize(systemDraft, "M", "system-add-m");
    spec = await readSpec(systemDraft.workOrderId);
    assert.deepEqual(spec.sizes.map((size) => size.code), ["XS", "S", "M"]);
    const chest = spec.pomColumns.find((pom) => pom.code === "chest_width");
    assert.ok(chest);
    const mTemplateCell = spec.cells.find((cell) => cell.sizeRowId === mId && cell.pomColumnId === chest.id);
    assert.ok(mTemplateCell?.decimalValue, "late M size must receive WAFL values");
    assert.equal(spec.sourceTemplateModified, false);

    const manual = await command(systemDraft.workOrderId, "/size-spec/commands", "POST", systemDraft.version, { kind: "set-cell", sizeRowId: mId, pomColumnId: chest.id, measurementUnit: "cm", displayValue: "99" }, "system-manual-m");
    systemDraft.version = manual.nextVersion;
    await addSize(systemDraft, "L", "system-add-l");
    spec = await readSpec(systemDraft.workOrderId);
    assert.equal(spec.cells.find((cell) => cell.sizeRowId === mId && cell.pomColumnId === chest.id)?.decimalValue, "99.0000", "manual M value must not be overwritten");
    const lId = spec.sizes.find((size) => size.code.toUpperCase() === "L")?.id;
    assert.ok(spec.cells.some((cell) => cell.sizeRowId === lId && cell.decimalValue !== null), "late L size must backfill missing cells");
    assert.equal(spec.sourceTemplateModified, true);

    const save = await command(systemDraft.workOrderId, "/size-spec/commands", "POST", systemDraft.version, { kind: "save-company-template", templateName: companyTemplateName }, "company-save");
    systemDraft.version = save.nextVersion;
    let templateRow = (await client.query(`SELECT id::text,template_version::integer FROM size_spec_templates WHERE company_id=(SELECT company_id FROM work_orders WHERE id=$1::uuid) AND source_kind='company' AND name=$2 AND is_active`, [systemDraft.workOrderId, companyTemplateName])).rows;
    assert.equal(templateRow.length, 1);
    spec = await readSpec(systemDraft.workOrderId);
    assert.equal(spec.templateId, templateRow[0].id);
    assert.equal(spec.templateName, companyTemplateName);
    assert.equal(spec.templateVersion, 1);
    assert.equal(spec.sourceTemplateModified, false, "saving a company template must rebase the current WorkOrder baseline");

    const lSize = spec.sizes.find((size) => size.code.toUpperCase() === "L");
    assert.ok(lSize);
    const reedited = await command(systemDraft.workOrderId, "/size-spec/commands", "POST", systemDraft.version, { kind: "set-cell", sizeRowId: lSize.id, pomColumnId: chest.id, measurementUnit: "cm", displayValue: "101" }, "company-reedit");
    systemDraft.version = reedited.nextVersion;
    spec = await readSpec(systemDraft.workOrderId);
    assert.equal(spec.sourceTemplateModified, true, "manual edit after company rebase must mark the source modified");

    const updated = await command(systemDraft.workOrderId, "/size-spec/commands", "POST", systemDraft.version, { kind: "update-company-template", templateId: templateRow[0].id }, "company-update");
    systemDraft.version = updated.nextVersion;
    templateRow = (await client.query(`SELECT id::text,template_version::integer FROM size_spec_templates WHERE company_id=(SELECT company_id FROM work_orders WHERE id=$1::uuid) AND source_kind='company' AND name=$2 AND is_active`, [systemDraft.workOrderId, companyTemplateName])).rows;
    assert.equal(templateRow.length, 1);
    assert.equal(templateRow[0].template_version, 2);
    spec = await readSpec(systemDraft.workOrderId);
    assert.equal(spec.templateId, templateRow[0].id);
    assert.equal(spec.templateName, companyTemplateName);
    assert.equal(spec.templateVersion, 2);
    assert.equal(spec.sourceTemplateModified, false, "updating a company template must rebase to the newest version");
    const copiedValue = await client.query(`SELECT v.decimal_value::text FROM size_spec_template_values v JOIN size_spec_template_sizes s ON s.id=v.size_row_id JOIN size_spec_template_poms p ON p.id=v.pom_column_id WHERE v.template_id=$1::uuid AND upper(s.size_code)='L' AND p.pom_code='chest_width'`, [templateRow[0].id]);
    assert.equal(copiedValue.rows[0]?.decimal_value, "101.0000");

    const companyDraft = await createDraft("company");
    await configureTops(companyDraft, "company");
    await applyTemplate(companyDraft, templateRow[0].id, "company");
    const companyContent = await readTemplateContent(companyDraft.workOrderId, templateRow[0].id);
    assert.ok(companyContent.values.some((value) => value.sizeCode.toUpperCase() === "M"));
    spec = await readSpec(companyDraft.workOrderId);
    assert.equal(spec.sizes.length, 0);
    assert.equal(spec.sourceTemplateModified, false);
    await addSize(companyDraft, "M", "company-add-m");
    spec = await readSpec(companyDraft.workOrderId);
    assert.ok(spec.cells.some((cell) => cell.decimalValue !== null), "late company-template size must backfill values");
    assert.equal(spec.sourceTemplateModified, false);

    for (const workOrderId of [...createdIds].reverse()) await deleteDraft(workOrderId);
    const mutableResidual = await client.query(`SELECT count(*)::integer AS count FROM work_orders WHERE product_name LIKE $1`, [`${marker}%`]);
    assert.equal(Number(mutableResidual.rows[0].count), 0);

    await client.query("BEGIN");
    try {
      const exact = await client.query(`SELECT id::text FROM size_spec_templates WHERE source_kind='company' AND name=$1`, [companyTemplateName]);
      assert.equal(exact.rows.length, 2);
      const exactIds = exact.rows.map((row) => row.id);
      await client.query(`DELETE FROM size_spec_template_values WHERE template_id=ANY($1::uuid[])`, [exactIds]);
      await client.query(`DELETE FROM size_spec_template_sizes WHERE template_id=ANY($1::uuid[])`, [exactIds]);
      await client.query(`DELETE FROM size_spec_template_poms WHERE template_id=ANY($1::uuid[])`, [exactIds]);
      await client.query(`DELETE FROM size_spec_templates WHERE id=ANY($1::uuid[]) AND source_kind='company' AND name=$2`, [exactIds, companyTemplateName]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const templateResidual = await client.query(`SELECT count(*)::integer AS count FROM size_spec_templates WHERE name=$1`, [companyTemplateName]);
    assert.equal(Number(templateResidual.rows[0].count), 0);

    const result = {
      result: "PASS",
      checkpoint: "ALPHA68_LOCAL_AUTHORING_SPEC_RUNTIME_PASS",
      fixtureRef: crypto.createHash("sha256").update(marker).digest("hex").slice(0, 12),
      requests,
      lateSize: { system: true, company: true, localContentRead: true, multiSize: ["XS", "S", "M"], missingOnly: true, automaticModified: false, manualModifiedPreserved: true },
      companyTemplateRebase: { saveNew: true, updateExisting: true, sourceName: companyTemplateName, newestVersion: 2, modifiedAfterRebase: false, manualEditAfterRebase: true, exactValueCopy: true },
      cleanup: { workOrders: 0, templates: 0, r2: 0 },
    };
    const resultPath = path.join(root, ".tmp/wafl-v2-alpha68/local-authoring-spec-runtime.json");
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log("ALPHA68_LOCAL_AUTHORING_SPEC_RUNTIME_PASS");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA68_LOCAL_AUTHORING_SPEC_RUNTIME_FAIL", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
