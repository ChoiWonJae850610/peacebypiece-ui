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
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "alpha62-maker-authoring-runtime-result.json");
const alpha63MaterialRevalidation = process.env.WAFL_ALPHA63_MATERIAL_REVALIDATION === "1";
const currentMakerSmoke = process.env.WAFL_ALPHA64_CURRENT_MAKER_SMOKE === "1";
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("-", "");
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A62 size measurement isolated ${date}-${suffix}`;
const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAzSURBVFhH7c4hAQAwCABBkhCHTGs/PAHAnHjz6iLr/ctiju0AAAAAAAAAAAAAAAAAAAAap4xsahhU8gIAAAAASUVORK5CYII=", "base64");
const attachmentBytes = Buffer.from("%PDF-1.4\n% WAFL alpha.62 isolated attachment runtime QA\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n", "utf8");
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/g, "")] : null;
}).filter(Boolean));

const receiptKey = (row) => JSON.stringify([row.company_id, row.command_code, row.idempotency_key]);
const id = (label) => `a62-maker-${suffix.toLowerCase()}-${label}`;
const sanitizeLedgerRoute = (route) => {
  const parsed = new URL(route, "https://wafl-runtime.invalid");
  const keys = [...new Set([...parsed.searchParams.keys()])].sort();
  const pathname = parsed.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/giu, ":uuid");
  return keys.length ? `${pathname}?${keys.join("&")}` : pathname;
};

async function provision() {
  const child = spawn(process.execPath, [path.join(root, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: env.DATABASE_URL,
      WAFL_SESSION_SECRET: env.WAFL_SESSION_SECRET,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA62 ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: "01e5dcc7fea3",
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a62-isolated-create-${suffix.toLowerCase()}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a62-isolated-create-${suffix.toLowerCase()}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", resolve); });
  assert.equal(code, 0, stderr);
  assert.match(stdout, /Result: PASS/);
}

async function run() {
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, currentMakerSmoke ? "current-maker" : "size-measurement-standards");
  assert.equal(state.mutationMode, currentMakerSmoke ? "current-maker-alpha64" : "size-measurement-standards");
  if (currentMakerSmoke) assert.equal(state.makerQaProfile, "alpha64-current-maker");
  assert.equal(state.nextPort, 3100);
  assert.equal(state.expoPort, 8081);
  assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
  assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);
  const base = `https://${state.tailscaleServeHostname}`;
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha62-maker-authoring-runtime-qa" });
  await client.connect();
  let fixture;
  let cookie = "";
  const ledger = [];
  const materialRevalidation = [];

  async function request(route, { method = "GET", body, key, rawBody, headers = {} } = {}) {
    const started = performance.now();
    const response = await fetch(route.startsWith("http") ? route : `${base}${route}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined && rawBody === undefined ? {} : { "Content-Type": "application/json" }),
        ...(key ? { "Idempotency-Key": key } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* raw upload */ }
    ledger.push({ method, route: sanitizeLedgerRoute(route), status: response.status, elapsedMs: Number((performance.now() - started).toFixed(2)), routeMs: Number(response.headers.get("x-wafl-timing-route-ms")) || null, dbMs: Number(response.headers.get("x-wafl-command-db-ms")) || null, statementCount: Number(response.headers.get("x-wafl-command-statement-count")) || null });
    return { response, json, text };
  }

  const mutate = async (route, method, version, payload, label) => {
    const key = id(`${label}-key`);
    const result = await request(route, { method, key, body: { clientRequestId: id(`${label}-client`), expectedVersion: version, ...payload } });
    assert.ok([200, 201].includes(result.response.status), `${label}:${result.response.status}:${result.text}`);
    return result.json.data;
  };

  const revalidateMaterial = async (label, materialType, nextVersion, outcome = "success") => {
    const start = ledger.length;
    const detailProjection = await request(`/api/v2/work-orders/${fixture.work_order_id}`);
    const materialProjection = await request(`/api/v2/work-orders/${fixture.work_order_id}/materials?type=${materialType}&lifecycle=active&limit=30`);
    assert.equal(detailProjection.response.status, 200, `${label}:detail:${detailProjection.text}`);
    assert.equal(materialProjection.response.status, 200, `${label}:materials:${materialProjection.text}`);
    assert.equal(detailProjection.json.data.header.entityVersion, nextVersion, `${label}:detail-version`);
    assert.equal(materialProjection.json.data.entityVersion, nextVersion, `${label}:material-version`);
    const requests = ledger.slice(start);
    materialRevalidation.push({
      label,
      outcome,
      commandCount: 1,
      mutationCount: outcome === "success" ? 1 : 0,
      detailGetCount: requests.filter((entry) => entry.method === "GET" && entry.route === "/api/v2/work-orders/:uuid").length,
      materialGetCount: requests.filter((entry) => entry.method === "GET" && entry.route.startsWith("/api/v2/work-orders/:uuid/materials?")).length,
      authoritativeProjection: "detail+material-list",
      nextVersion,
      fallback: outcome === "success" ? "bounded-authoritative-revalidation" : "conflict-authoritative-revalidation",
    });
  };

  const prepareAsset = async (kind, filename, contentType, bytes) => {
    const prepared = await request(`/api/v2/work-orders/${fixture.work_order_id}/${kind}/upload`, { method: "POST", body: { file: { name: filename, type: contentType, size: bytes.byteLength } } });
    assert.equal(prepared.response.status, 200, `${kind}-prepare:${prepared.text}`);
    const target = prepared.json.data.uploadTarget;
    const uploaded = await request(target.uploadUrl, { method: "PUT", rawBody: bytes, headers: Object.fromEntries(Object.entries(target.headers).map(([key, value]) => [key, String(value)])) });
    assert.ok(uploaded.response.ok, `${kind}-put:${uploaded.response.status}`);
    return target;
  };

  try {
    await provision();
    fixture = (await client.query(`
      SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,w.entity_version::integer entity_version
      FROM work_orders w WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
    `, [companyId, marker])).rows[0];
    assert.ok(fixture?.work_order_id);
    const baseline = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) migrations,
        (SELECT count(*)::integer FROM generated_documents) documents,
        (SELECT count(*)::integer FROM document_access_tokens) tokens,
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1 AND id<>$2::uuid) other_work_orders
    `, [companyId, fixture.work_order_id])).rows[0];
    assert.equal(Number(baseline.migrations), currentMakerSmoke ? 16 : 15);
    const partner = (await client.query("SELECT id::text FROM partners WHERE company_id=$1 AND is_active ORDER BY id LIMIT 1", [companyId])).rows[0];
    assert.ok(partner?.id, "active-dev-test-partner-required");

    const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
    assert.equal(auth.response.status, 200);
    let version = Number(fixture.entity_version);
    const partnerOptions = await request(`/api/v2/work-orders/${fixture.work_order_id}/material-partners`);
    assert.equal(partnerOptions.response.status, 200, partnerOptions.text);
    assert.equal(partnerOptions.json.data.workOrderId, fixture.work_order_id);
    assert.equal(partnerOptions.json.data.entityVersion, version);
    assert.equal(partnerOptions.json.data.items.some((item) => item.id === partner.id), true);

    const basic = await mutate(`/api/v2/work-orders/${fixture.work_order_id}`, "PATCH", version, {
      patch: { dueDate: "2026-12-18", productTypeCode: "tshirt", seasonCode: "2026-fw", itemCode: `A62-${suffix}`, factoryDeliveryMemo: "alpha62 isolated maker authoring memo" },
    }, "basic");
    version = basic.nextVersion;
    const basicCleared = await mutate(`/api/v2/work-orders/${fixture.work_order_id}`, "PATCH", version, {
      patch: { seasonCode: null, itemCode: null, factoryDeliveryMemo: null },
    }, "basic-nullable-clear");
    version = basicCleared.nextVersion;
    const clearedBasicDetail = await request(`/api/v2/work-orders/${fixture.work_order_id}`);
    assert.equal(clearedBasicDetail.response.status, 200, clearedBasicDetail.text);
    assert.equal(clearedBasicDetail.json.data.header.itemCode, null);
    assert.equal(clearedBasicDetail.json.data.header.seasonCode, null);
    assert.equal(clearedBasicDetail.json.data.revision.factoryDeliveryMemo, null);

    const customSizeName = `회사 사이즈 ${suffix}`;
    const customColorName = `회사 색상 ${suffix}`;
    const sizeOption = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options`, "POST", version, { kind: "size", displayName: customSizeName }, "option-size");
    assert.equal(sizeOption.entityVersion, version);
    const colorOption = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options`, "POST", version, { kind: "color", displayName: customColorName, hexValue: "#456789" }, "option-color");
    assert.equal(colorOption.entityVersion, version);
    const duplicateColorOption = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options`, "POST", version, { kind: "color", displayName: `  ${customColorName}  `, hexValue: "#456789" }, "option-color-duplicate");
    assert.equal(duplicateColorOption.item.id, colorOption.item.id);
    assert.equal(duplicateColorOption.entityVersion, version);
    const options = await request(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options`);
    assert.equal(options.response.status, 200);
    assert.equal(options.json.data.items.filter((item) => [customSizeName, customColorName].includes(item.displayName)).length, 2);

    const size = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/sizes`, "POST", version, { displayLabel: customSizeName }, "size-add");
    version = size.nextVersion;
    const color = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/colors`, "POST", version, { displayName: "QA 남색", hexValue: "#13294B" }, "color-add");
    version = color.nextVersion;
    const quantity = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/quantities/${color.result?.targetId ?? color.targetId}/${size.result?.targetId ?? size.targetId}`, "PATCH", version, { quantity: 12 }, "quantity");
    version = quantity.nextVersion;
    const removedUsedOption = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options/${sizeOption.item.id}`, "DELETE", version, {}, "option-size-remove");
    assert.equal(removedUsedOption.deactivated, true);
    const removedUnusedOption = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/size-color/options/${colorOption.item.id}`, "DELETE", version, {}, "option-color-remove");
    assert.equal(removedUnusedOption.deactivated, false);

    const materialIds = [];
    const quantityBlocked = await request(`/api/v2/work-orders/${fixture.work_order_id}/materials`, {
      method: "POST",
      key: id("material-zero-quantity-key"),
      body: {
        clientRequestId: id("material-zero-quantity-client"),
        expectedVersion: version,
        materialType: "fabric",
        name: `QA A62 zero quantity ${suffix}`,
        partnerId: null,
        colorOption: null,
        usageArea: null,
        requiredQuantity: "0",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "0",
        unitCode: "m",
        unitPrice: "0",
        memo: null,
      },
    });
    assert.equal(quantityBlocked.response.status, 400, quantityBlocked.text);
    assert.equal(quantityBlocked.json.error.fieldErrors.some((item) => item.field === "requiredQuantity" && item.message === "필요수량을 0보다 크게 입력해 주세요."), true);
    for (const materialType of ["fabric", "accessory"]) {
      const label = materialType === "fabric" ? "원단" : "부자재";
      const created = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials`, "POST", version, {
        materialType,
        name: `QA A62 ${label} ${suffix}`,
        partnerId: materialType === "fabric" ? null : partner.id,
        colorOption: "남색",
        usageArea: "몸판",
        requiredQuantity: "3.5",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "3.5",
        unitCode: materialType === "fabric" ? "m" : "ea",
        unitPrice: materialType === "fabric" ? "0" : "1000",
        memo: "create",
      }, `${materialType}-create`);
      version = created.nextVersion;
      const materialLineId = created.result.materialLineId;
      materialIds.push(materialLineId);
      if (alpha63MaterialRevalidation) await revalidateMaterial(`${materialType}-create`, materialType, version);
      if (materialType === "fabric") {
        const blocked = await request(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}/order-request`, {
          method: "POST",
          key: id("fabric-readiness-blocked-key"),
          body: { clientRequestId: id("fabric-readiness-blocked-client"), expectedVersion: version },
        });
        assert.equal(blocked.response.status, 400, blocked.text);
        assert.equal(blocked.json.error.fieldErrors.some((item) => item.field === "partnerId"), true);
        assert.equal(blocked.json.error.fieldErrors.some((item) => item.field === "unitPrice"), true);
        if (alpha63MaterialRevalidation) {
          const pricePatch = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { unitPrice: "1000" } }, "fabric-price-patch");
          version = pricePatch.nextVersion;
          await revalidateMaterial("patch-unit-price", materialType, version);
          const partnerPatch = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { partnerId: partner.id } }, "fabric-partner-patch");
          version = partnerPatch.nextVersion;
          await revalidateMaterial("partner-change", materialType, version);
          const quantityPatch = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { requiredQuantity: "4" } }, "fabric-quantity-patch");
          version = quantityPatch.nextVersion;
          await revalidateMaterial("patch-quantity", materialType, version);
          const staleVersion = version - 1;
          const conflict = await request(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, {
            method: "PATCH",
            key: id("fabric-conflict-key"),
            body: { clientRequestId: id("fabric-conflict-client"), expectedVersion: staleVersion, patch: { memo: "must-not-apply" } },
          });
          assert.equal(conflict.response.status, 409, conflict.text);
          await revalidateMaterial("conflict-fallback", materialType, version, "conflict");
        } else {
          const readyPatch = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { partnerId: partner.id, unitPrice: "1000" } }, "fabric-readiness-patch");
          version = readyPatch.nextVersion;
        }
      }
      const patched = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { memo: "blur-save-changed" } }, `${materialType}-patch`);
      version = patched.nextVersion;
      const cleared = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}`, "PATCH", version, { patch: { usageArea: "", memo: "" } }, `${materialType}-nullable-clear`);
      version = cleared.nextVersion;
      if (alpha63MaterialRevalidation) await revalidateMaterial(`${materialType}-nullable-clear`, materialType, version);
      const clearedPage = await request(`/api/v2/work-orders/${fixture.work_order_id}/materials?type=${materialType}&lifecycle=active&limit=30`);
      assert.equal(clearedPage.response.status, 200, clearedPage.text);
      const clearedLine = clearedPage.json.data.items.find((item) => item.id === materialLineId);
      assert.equal(clearedLine?.usageArea, null);
      assert.equal(clearedLine?.memo, null);
      const requested = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}/order-request`, "POST", version, {}, `${materialType}-request`);
      version = requested.nextVersion;
      assert.equal(requested.result.status, "requested");
      if (alpha63MaterialRevalidation) await revalidateMaterial(`${materialType}-order-request`, materialType, version);
      const cancelled = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${materialLineId}/order-cancel`, "POST", version, { reason: "isolated runtime QA" }, `${materialType}-cancel`);
      version = cancelled.nextVersion;
      assert.equal(cancelled.result.status, "editing");
      if (alpha63MaterialRevalidation) await revalidateMaterial(`${materialType}-order-cancel`, materialType, version);

      const deletable = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials`, "POST", version, {
        materialType,
        name: `QA A62 ${label} delete ${suffix}`,
        partnerId: null,
        colorOption: null,
        usageArea: null,
        requiredQuantity: "1",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "1",
        unitCode: materialType === "fabric" ? "m" : "ea",
        unitPrice: "0",
        memo: "eligible-hard-delete",
      }, `${materialType}-deletable-create`);
      version = deletable.nextVersion;
      const deleted = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/materials/${deletable.result.materialLineId}`, "DELETE", version, {}, `${materialType}-hard-delete`);
      version = deleted.nextVersion;
      assert.equal(deleted.result.deleted, true);
      if (alpha63MaterialRevalidation) await revalidateMaterial(`${materialType}-delete`, materialType, version);
    }

    const imageTarget = await prepareAsset("images", `A62-${suffix}.png`, "image/png", imageBytes);
    const imageComplete = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/images/upload/complete`, "POST", version, { uploadTarget: imageTarget }, "image-complete");
    version = imageComplete.nextVersion;
    const imageId = imageComplete.imageId;
    assert.match(imageId, /^[0-9a-f-]{36}$/i);

    const attachmentFilename = `A62 한글 첨부 ${suffix}.pdf`;
    const attachmentTarget = await prepareAsset("attachments", attachmentFilename, "application/pdf", attachmentBytes);
    assert.equal(attachmentTarget.fileName, attachmentFilename);
    const attachmentComplete = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/attachments/upload/complete`, "POST", version, { uploadTarget: attachmentTarget }, "attachment-complete");
    version = attachmentComplete.nextVersion;
    const attachmentId = attachmentComplete.attachmentId;
    assert.match(attachmentId, /^[0-9a-f-]{36}$/i);

    const assets = await request(`/api/v2/work-orders/${fixture.work_order_id}/assets?limit=50`);
    assert.equal(assets.response.status, 200);
    assert.equal(assets.json.data.items.some((item) => item.id === imageId), true);
    assert.equal(assets.json.data.items.some((item) => item.id === attachmentId), true);
    assert.equal(assets.json.data.items.find((item) => item.id === attachmentId)?.filename, attachmentFilename);

    const imageDelete = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/images/${imageId}/delete`, "POST", version, {}, "image-delete");
    version = imageDelete.nextVersion;
    const attachmentDelete = await mutate(`/api/v2/work-orders/${fixture.work_order_id}/attachments/${attachmentId}/delete`, "POST", version, {}, "attachment-delete");
    version = attachmentDelete.nextVersion;

    const detail = await request(`/api/v2/work-orders/${fixture.work_order_id}`);
    assert.equal(detail.response.status, 200);
    assert.equal(detail.json.data.header.entityVersion, version);
    assert.equal(detail.json.data.header.dueDate, "2026-12-18");
    assert.equal(detail.json.data.revision.factoryDeliveryMemo, null);
    const materialPages = await Promise.all(["fabric", "accessory"].map((type) => request(`/api/v2/work-orders/${fixture.work_order_id}/materials?type=${type}&lifecycle=active&limit=30`)));
    for (const page of materialPages) {
      assert.equal(page.response.status, 200);
      assert.equal(page.json.data.items.length, 1);
      assert.equal(page.json.data.items[0].status, "editing");
      assert.equal(page.json.data.items[0].usageArea, null);
      assert.equal(page.json.data.items[0].memo, null);
    }

    const beforeCleanupReceipts = (await client.query("SELECT company_id,command_code,idempotency_key FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid ORDER BY company_id,command_code,idempotency_key", [companyId, fixture.work_order_id])).rows;
    await client.query("BEGIN");
    try {
      const owned = (await client.query("SELECT product_name,current_revision_id::text revision_id,status FROM work_orders WHERE company_id=$1 AND id=$2::uuid FOR UPDATE", [companyId, fixture.work_order_id])).rows[0];
      assert.deepEqual(owned, { product_name: marker, revision_id: fixture.revision_id, status: "draft" });
      const receiptRows = (await client.query("SELECT company_id,command_code,idempotency_key FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid FOR UPDATE", [companyId, fixture.work_order_id])).rows;
      for (const row of receiptRows) {
        const detached = await client.query("UPDATE work_order_command_receipts SET work_order_id=NULL,result_revision_id=NULL WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3 AND work_order_id=$4::uuid RETURNING company_id,command_code,idempotency_key", [row.company_id, row.command_code, row.idempotency_key, fixture.work_order_id]);
        assert.equal(detached.rowCount, 1);
      }
      assert.deepEqual(receiptRows.map(receiptKey).sort(), beforeCleanupReceipts.map(receiptKey).sort());
      await client.query("DELETE FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, fixture.revision_id]);
      await client.query("DELETE FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, fixture.work_order_id]);
      await client.query("DELETE FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, fixture.revision_id]);
      await client.query("DELETE FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid", [companyId, fixture.work_order_id]);
      await client.query("DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])", [companyId, fixture.revision_id, materialIds]);
      await client.query("DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, fixture.revision_id]);
      await client.query("DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, fixture.revision_id]);
      await client.query("DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, fixture.revision_id]);
      await client.query("DELETE FROM company_work_order_structure_options WHERE company_id=$1 AND display_name IN ($2,$3)", [companyId, customSizeName, customColorName]);
      await client.query("UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=$2::uuid AND current_revision_id=$3::uuid", [companyId, fixture.work_order_id, fixture.revision_id]);
      assert.equal((await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid AND work_order_id=$3::uuid RETURNING id", [companyId, fixture.revision_id, fixture.work_order_id])).rowCount, 1);
      assert.equal((await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND product_name=$3 AND current_revision_id IS NULL RETURNING id", [companyId, fixture.work_order_id, marker])).rowCount, 1);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const residual = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1 AND id=$2::uuid) work_orders,
        (SELECT count(*)::integer FROM work_order_revisions WHERE company_id=$1 AND id=$3::uuid) revisions,
        (SELECT count(*)::integer FROM company_work_order_structure_options WHERE company_id=$1 AND display_name IN ($4,$5)) options,
        (SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid) attached_receipts,
        (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND metadata->>'workOrderId'=$2::text OR company_id=$1 AND entity_id=$2::text) events
    `, [companyId, fixture.work_order_id, fixture.revision_id, customSizeName, customColorName])).rows[0];
    assert.deepEqual({ workOrders: Number(residual.work_orders), revisions: Number(residual.revisions), options: Number(residual.options), attachedReceipts: Number(residual.attached_receipts) }, { workOrders: 0, revisions: 0, options: 0, attachedReceipts: 0 });
    const after = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) migrations,
        (SELECT count(*)::integer FROM generated_documents) documents,
        (SELECT count(*)::integer FROM document_access_tokens) tokens,
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1) work_orders
    `, [companyId])).rows[0];
    assert.equal(Number(after.migrations), Number(baseline.migrations));
    assert.equal(Number(after.documents), Number(baseline.documents));
    assert.equal(Number(after.tokens), Number(baseline.tokens));
    assert.equal(Number(after.work_orders), Number(baseline.other_work_orders));
    if (alpha63MaterialRevalidation) {
      assert.equal(materialRevalidation.length, 14);
      assert.equal(materialRevalidation.every((entry) => entry.detailGetCount === 1 && entry.materialGetCount === 1), true);
      assert.equal(materialRevalidation.every((entry) => entry.commandCount === 1), true);
      assert.equal(materialRevalidation.find((entry) => entry.label === "conflict-fallback")?.mutationCount, 0);
    }

    const result = {
      result: "PASS",
      checkpoint: currentMakerSmoke ? "ALPHA64_CURRENT_MAKER_AUTHORING_RUNTIME_PASS" : "ALPHA62_MAKER_AUTHORING_RUNTIME_PASS",
      marker,
      mutationMatrix: {
        basic: ["dueDate", "productTypeCode", "seasonCode", "itemCode", "factoryDeliveryMemo"],
        basicNullableClear: ["seasonCode", "itemCode", "factoryDeliveryMemo"],
        sizeColorQuantity: true,
        companyCatalog: { create: 2, usedDeactivate: 1, unusedHardDelete: 1 },
        material: { create: 4, patch: alpha63MaterialRevalidation ? 7 : 5, nullableClear: 2, orderRequest: 3, orderCancel: 2, hardDelete: 2, readinessRejected: 1, createQuantityRejected: 1 },
        assets: { imagePutCompleteReadDelete: 1, attachmentUnicodePutCompleteReadDelete: 1 },
      },
      requestCount: ledger.length,
      requestLedger: ledger,
      materialRevalidation,
      receiptsPreservedAndDetached: beforeCleanupReceipts.length,
      eventsPreserved: Number(residual.events),
      businessResidual: 0,
      migrationDocumentTokenMutation: 0,
      runtime: { nextPort: state.nextPort, metroPort: state.expoPort, tailscaleIpv4: state.tailscaleIpv4 },
    };
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(currentMakerSmoke ? "ALPHA64_CURRENT_MAKER_AUTHORING_RUNTIME_PASS" : "ALPHA62_MAKER_AUTHORING_RUNTIME_PASS");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("ALPHA62_MAKER_AUTHORING_RUNTIME_FAIL", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
