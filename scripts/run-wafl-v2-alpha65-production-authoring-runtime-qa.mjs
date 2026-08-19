#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const companyId = "wafl-fn-company-a";
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "wafl-external-qa", "state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const requestedResumeMarker = String(process.env.WAFL_ALPHA65_RESUME_MARKER ?? "").trim() || null;
const resumeSuffix = requestedResumeMarker?.match(/^QA A65 제작 공정 검증 ([A-F0-9]{8})$/u)?.[1] ?? null;
if (requestedResumeMarker && !resumeSuffix) throw new Error("resume-marker-invalid");
const suffix = resumeSuffix ?? crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = requestedResumeMarker ?? `QA A65 제작 공정 검증 ${suffix}`;
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "alpha65-production-authoring-runtime-result.json");
const short = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

assert.equal(state.status, "running");
assert.equal(state.makerQaProfile, "alpha65-current-maker");
assert.equal(state.mutationMode, "current-maker-alpha65");
assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);
assert.equal(state.developerAutoConnectReady, true);

let cookie = "";
let workOrderId = null;
let revisionId = null;
let version = 0;
let ownerBefore = null;
let resumeStartVersion = null;
let retainedBaseline = null;
const requestEvidence = [];
const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha65-production-authoring-runtime-qa" });

async function request(route, method = "GET", body = null, key = null) {
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
  const safeRoute = route
    .replace(workOrderId ?? "__none__", "fixture")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "process");
  requestEvidence.push({ method, route: safeRoute, status: response.status, elapsedMs: Number((performance.now() - started).toFixed(2)) });
  return { response, json };
}

async function ownerSnapshot() {
  const auditPath = path.join(root, ".tmp", "wafl-external-qa", "alpha64-real-sheet-owner-fixture-readonly-audit.json");
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  const row = (await client.query(`SELECT id::text,current_revision_id::text,entity_version,product_name,status,total_quantity,updated_at::text FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL`, [companyId, audit.marker])).rows[0];
  assert.ok(row, "owner-fixture-readonly-target-missing");
  return short(JSON.stringify(row));
}

async function dbProjection() {
  const result = await client.query(`
    SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,w.entity_version,w.total_quantity,
           r.process_total,r.estimated_total,r.fabric_total,r.accessory_total,
           p.id::text process_id,p.process_type_code,p.process_name_snapshot,p.partner_name_snapshot,
           p.quantity,p.unit_price,p.amount,p.memo,p.status,p.due_date,p.application_area,p.application_color_target
    FROM work_orders w
    JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
    LEFT JOIN work_order_processes p ON p.company_id=r.company_id AND p.revision_id=r.id
    WHERE w.company_id=$1 AND w.id=$2::uuid
    ORDER BY p.display_order,p.id
  `, [companyId, workOrderId]);
  assert.ok(result.rows.length >= 1);
  return result.rows;
}

async function processes() {
  const result = await request(`/api/v2/work-orders/${workOrderId}/processes`);
  assert.equal(result.response.status, 200);
  return result.json.data;
}

async function createProcess(process, label, replay = false) {
  const key = `a65-production-${suffix.toLowerCase()}-${label}`;
  const expectedVersion = version;
  const result = await request(`/api/v2/work-orders/${workOrderId}/processes`, "POST", { clientRequestId: key, expectedVersion, process }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  assert.equal(result.json.data.workOrderId, workOrderId);
  if (!replay) version = result.json.data.nextVersion;
  return { processId: result.json.data.processId, expectedVersion, nextVersion: result.json.data.nextVersion, replay: result.json.data.idempotentReplay };
}

async function patchProcess(processId, process, label) {
  const key = `a65-production-${suffix.toLowerCase()}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrderId}/processes/${processId}`, "PATCH", { clientRequestId: key, expectedVersion: version, process }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
}

async function deleteProcess(processId, label) {
  const key = `a65-production-${suffix.toLowerCase()}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrderId}/processes/${processId}`, "DELETE", { clientRequestId: key, expectedVersion: version }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
}

async function transitionOrder(processId, kind, label) {
  const key = `a65-production-${suffix.toLowerCase()}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrderId}/processes/${processId}/order-${kind}`, "POST", { clientRequestId: key, expectedVersion: version }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
}

async function patchTotal(totalQuantity, label) {
  const key = `a65-production-${suffix.toLowerCase()}-${label}`;
  const result = await request(`/api/v2/work-orders/${workOrderId}`, "PATCH", { clientRequestId: key, expectedVersion: version, patch: { totalQuantity } }, key);
  assert.equal(result.response.status, 200, `${label}:${result.response.status}`);
  version = result.json.data.nextVersion;
}

async function main() {
  await client.connect();
  try {
    const ledger = Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count);
    assert.equal(ledger, 18);
    ownerBefore = await ownerSnapshot();

    const auth = await request("/api/dev/mobile-connect/auto", "POST", {});
    assert.equal(auth.response.status, 200);
    assert.equal(auth.json.ok, true);

    if (requestedResumeMarker) {
      const retained = (await client.query(`SELECT id::text,current_revision_id::text revision_id,entity_version FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL`, [companyId, marker])).rows;
      assert.equal(retained.length, 1, "resume-fixture-must-exist-exactly-once");
      workOrderId = retained[0].id;
      revisionId = retained[0].revision_id;
      version = Number(retained[0].entity_version);
      resumeStartVersion = version;
    } else {
      const createKey = `a65-production-create-${suffix.toLowerCase()}`;
      const created = await request("/api/v2/work-orders", "POST", { clientRequestId: createKey, productName: marker, dueDate: null, totalQuantity: 100 }, createKey);
      assert.equal(created.response.status, 201);
      workOrderId = created.json.data.result.workOrderId;
      revisionId = created.json.data.result.revisionId;
      version = created.json.data.nextVersion;
    }

    const optionRead = await request(`/api/v2/work-orders/${workOrderId}/production-options`);
    assert.equal(optionRead.response.status, 200);
    const options = optionRead.json.data;
    assert.equal(options.editable, true);
    assert.ok(Number(options.totalQuantity) >= 0);
    assert.ok(options.factoryPartners.length >= 1, "dev-test-factory-option-required");
    const mapped = options.processStandards.map((standard) => ({
      standard,
      partner: options.processPartners.find((candidate) => candidate.processCode === standard.code),
    })).filter((candidate) => candidate.partner);
    assert.ok(mapped.length >= 1, "dev-test-process-partner-capability-required");
    const auditedStandards = ["플리츠", "본딩"].map((name) => {
      const standard = options.processStandards.find((candidate) => candidate.name.includes(name));
      assert.ok(standard, `canonical-process-standard-missing:${name}`);
      return {
        name,
        code: standard.code,
        enabled: true,
        eligiblePartnerCount: options.processPartners.filter((candidate) => candidate.processCode === standard.code).length,
      };
    });

    const existingPage = requestedResumeMarker ? await processes() : null;
    if (existingPage) {
      const factoryRows = existingPage.processes.filter((row) => row.role === "factory");
      const additionalRows = existingPage.processes.filter((row) => row.role === "additional");
      const currentTotalQuantity = Number(existingPage.totalQuantity);
      assert.equal(factoryRows.length, 1, "resume-fixture-requires-one-factory-row");
      assert.ok(additionalRows.length >= 1, "resume-fixture-requires-additional-row");
      assert.equal(existingPage.processes.every((row) => Number(row.quantity) === currentTotalQuantity), true, "resume-process-quantity-must-match-current-work-order-total");
      retainedBaseline = {
        entityVersion: resumeStartVersion,
        totalQuantity: currentTotalQuantity,
        processCount: existingPage.processes.length,
        processes: existingPage.processes.map((row) => ({
          processRef: short(row.id),
          role: row.role,
          processCode: row.processTypeCode,
          partnerRef: short(row.partnerId),
          unitPrice: String(Number(row.unitPrice)),
          memo: row.memo,
        })),
      };
    }
    const runLabel = (label) => requestedResumeMarker ? `resume-v${resumeStartVersion}-${label}` : label;
    const existingFactory = existingPage?.processes.find((row) => row.role === "factory") ?? null;
    const factoryWrite = existingFactory
      ? { role: "factory", processCode: null, partnerId: existingFactory.partnerId, unitPrice: String(Number(existingFactory.unitPrice)), memo: existingFactory.memo }
      : { role: "factory", processCode: null, partnerId: options.factoryPartners[0].id, unitPrice: "9800", memo: null };
    const factoryMemo = "봉제 전 방향과 마감 상태를 확인해 주세요.";
    const factory = existingFactory
      ? { processId: existingFactory.id, expectedVersion: 1, nextVersion: 2 }
      : await createProcess(factoryWrite, "factory-create");
    if (!requestedResumeMarker) {
      const replay = await request(`/api/v2/work-orders/${workOrderId}/processes`, "POST", { clientRequestId: `a65-production-${suffix.toLowerCase()}-factory-create`, expectedVersion: factory.expectedVersion, process: factoryWrite }, `a65-production-${suffix.toLowerCase()}-factory-create`);
      assert.equal(replay.response.status, 200);
      assert.equal(replay.json.data.nextVersion, factory.nextVersion);
      assert.equal(replay.json.data.idempotentReplay, true);
    }

    const factoryBaseUnitPrice = Number(factoryWrite.unitPrice);
    await patchProcess(factory.processId, { ...factoryWrite, memo: factoryMemo }, runLabel("factory-memo-save"));
    let factoryRead = (await processes()).processes.find((row) => row.id === factory.processId);
    assert.equal(factoryRead.memo, factoryMemo);
    await patchProcess(factory.processId, { ...factoryWrite, unitPrice: String(factoryBaseUnitPrice + 100), memo: factoryMemo }, runLabel("factory-cost-only-preserves-memo"));
    factoryRead = (await processes()).processes.find((row) => row.id === factory.processId);
    assert.equal(factoryRead.memo, factoryMemo);
    assert.equal(Number(factoryRead.unitPrice), factoryBaseUnitPrice + 100);
    const alternateFactory = options.factoryPartners.find((candidate) => candidate.id !== factoryWrite.partnerId) ?? options.factoryPartners[0];
    await patchProcess(factory.processId, { ...factoryWrite, partnerId: alternateFactory.id, memo: factoryMemo }, runLabel("factory-only-preserves-memo"));
    factoryRead = (await processes()).processes.find((row) => row.id === factory.processId);
    assert.equal(factoryRead.memo, factoryMemo);
    assert.equal(factoryRead.partnerId, alternateFactory.id);
    await patchProcess(factory.processId, { ...factoryWrite, partnerId: alternateFactory.id, memo: null }, runLabel("factory-memo-clear"));
    factoryRead = (await processes()).processes.find((row) => row.id === factory.processId);
    assert.equal(factoryRead.memo, null);
    await patchProcess(factory.processId, { ...factoryWrite, partnerId: alternateFactory.id, memo: factoryMemo }, runLabel("factory-memo-restore"));

    const first = mapped[0];
    const existingAdditionalRows = existingPage?.processes.filter((row) => row.role === "additional") ?? [];
    const existingAdditionalA = existingAdditionalRows[0] ?? null;
    const additionalAWrite = existingAdditionalA
      ? { role: "additional", processCode: existingAdditionalA.processTypeCode, partnerId: existingAdditionalA.partnerId, unitPrice: String(Number(existingAdditionalA.unitPrice)), memo: existingAdditionalA.memo }
      : { role: "additional", processCode: first.standard.code, partnerId: first.partner.partnerId, unitPrice: "500", memo: "alpha.65 제작 QA" };
    const additionalA = requestedResumeMarker
      ? { processId: existingAdditionalA.id }
      : await createProcess(additionalAWrite, "additional-a-create");
    let additionalB = null;
    const second = mapped.find((candidate) => candidate.standard.code !== first.standard.code) ?? first;
    const existingAdditionalB = existingAdditionalRows.at(-1) ?? null;
    const additionalBWrite = existingAdditionalB
      ? { role: "additional", processCode: existingAdditionalB.processTypeCode, partnerId: existingAdditionalB.partnerId, unitPrice: String(Number(existingAdditionalB.unitPrice)), memo: existingAdditionalB.memo }
      : { role: "additional", processCode: second.standard.code, partnerId: second.partner.partnerId, unitPrice: "300", memo: null };
    additionalB = requestedResumeMarker
      ? { processId: existingAdditionalB.id }
      : await createProcess(additionalBWrite, "additional-b-create");

    let page = await processes();
    const baselineTotalQuantity = retainedBaseline?.totalQuantity ?? 100;
    const baselineProcessCount = retainedBaseline?.processCount ?? 3;
    assert.equal(page.processes.filter((row) => row.role === "factory").length, 1);
    assert.equal(page.processes.length, baselineProcessCount);
    assert.equal(page.processes.every((row) => Number(row.quantity) === baselineTotalQuantity), true);
    assert.equal(page.processes.every((row) => Number(row.amount) === Number(row.quantity) * Number(row.unitPrice)), true);

    if (!requestedResumeMarker) {
      await patchProcess(additionalA.processId, { ...additionalAWrite, unitPrice: "550", memo: "수정 메모" }, "additional-a-update");
      await patchTotal(120, "total-120");
      page = await processes();
      assert.equal(Number(page.totalQuantity), 120);
      assert.equal(page.processes.every((row) => Number(row.quantity) === 120), true);
      assert.equal(page.processes.every((row) => Number(row.amount) === Number(row.quantity) * Number(row.unitPrice)), true);
      await patchTotal(100, "total-100-restore");
      await deleteProcess(additionalB.processId, "additional-b-delete");
      await createProcess(additionalBWrite, "additional-b-retain");
    }
    const additionalMemo = "공정 위치와 색상 기준을 확인해 주세요.";
    const additionalBaseUnitPrice = Number(additionalAWrite.unitPrice);
    await patchProcess(additionalA.processId, { ...additionalAWrite, memo: additionalMemo }, runLabel("additional-memo-save"));
    let additionalRead = (await processes()).processes.find((row) => row.id === additionalA.processId);
    assert.equal(additionalRead.memo, additionalMemo);
    await patchProcess(additionalA.processId, { ...additionalAWrite, unitPrice: String(additionalBaseUnitPrice + 10), memo: additionalMemo }, runLabel("additional-cost-only-preserves-memo"));
    additionalRead = (await processes()).processes.find((row) => row.id === additionalA.processId);
    assert.equal(additionalRead.memo, additionalMemo);
    await patchProcess(additionalA.processId, { ...additionalAWrite, memo: additionalMemo }, runLabel("additional-cost-restore"));
    const synchronizationProbeTotal = baselineTotalQuantity === 120 ? 100 : 120;
    await patchTotal(synchronizationProbeTotal, runLabel(`total-${synchronizationProbeTotal}-memo-probe`));
    page = await processes();
    assert.equal(page.processes.every((row) => Number(row.quantity) === synchronizationProbeTotal), true);
    assert.equal(page.processes.find((row) => row.id === factory.processId).memo, factoryMemo, "quantity-sync-must-preserve-factory-memo");
    assert.equal(page.processes.find((row) => row.id === additionalA.processId).memo, additionalMemo, "quantity-sync-must-preserve-additional-memo");
    await patchTotal(baselineTotalQuantity, runLabel(`total-${baselineTotalQuantity}-restore`));
    page = await processes();
    assert.equal(Number(page.totalQuantity), baselineTotalQuantity);
    assert.equal(page.processes.length, baselineProcessCount);
    assert.equal(page.processes.every((row) => Number(row.quantity) === baselineTotalQuantity), true);
    assert.equal(page.processes.find((row) => row.id === factory.processId).memo, factoryMemo, "quantity-sync-must-preserve-factory-memo");

    const factoryBeforeDelete = factory.processId;
    const retainedFactory = page.processes.find((row) => row.id === factoryBeforeDelete);
    await deleteProcess(factoryBeforeDelete, runLabel("factory-delete-with-memo"));
    assert.equal((await processes()).processes.some((row) => row.id === factoryBeforeDelete), false, "factory-delete-must-remove-row-and-memo");
    const recreatedFactory = await createProcess({ role: "factory", processCode: null, partnerId: retainedFactory.partnerId, unitPrice: String(Number(retainedFactory.unitPrice)), memo: factoryMemo }, runLabel("factory-recreate-with-memo"));
    page = await processes();
    assert.equal(page.processes.find((row) => row.id === recreatedFactory.processId).memo, factoryMemo);
    await transitionOrder(recreatedFactory.processId, "request", runLabel("factory-order-request"));
    let orderedFactory = (await processes()).processes.find((row) => row.id === recreatedFactory.processId);
    assert.equal(orderedFactory.status, "in_progress");
    assert.equal(orderedFactory.editable, false);
    assert.equal(orderedFactory.memo, factoryMemo);
    await transitionOrder(recreatedFactory.processId, "cancel", runLabel("factory-order-cancel"));
    page = await processes();
    orderedFactory = page.processes.find((row) => row.id === recreatedFactory.processId);
    assert.equal(orderedFactory.status, "ready");
    assert.equal(orderedFactory.editable, true);
    assert.equal(orderedFactory.memo, factoryMemo);

    const postCancelUnitPrice = Number(orderedFactory.unitPrice) + 1;
    const postCancelMemo = `${factoryMemo} QA`;
    const recreatedFactoryWrite = {
      role: "factory",
      processCode: null,
      partnerId: orderedFactory.partnerId,
      unitPrice: String(postCancelUnitPrice),
      memo: factoryMemo,
    };
    await patchProcess(recreatedFactory.processId, recreatedFactoryWrite, runLabel("factory-post-cancel-unit-cost-save"));
    await patchProcess(recreatedFactory.processId, { ...recreatedFactoryWrite, memo: postCancelMemo }, runLabel("factory-post-cancel-rapid-memo-save"));
    orderedFactory = (await processes()).processes.find((row) => row.id === recreatedFactory.processId);
    assert.equal(Number(orderedFactory.unitPrice), postCancelUnitPrice);
    assert.equal(orderedFactory.memo, postCancelMemo);
    await patchProcess(recreatedFactory.processId, {
      ...recreatedFactoryWrite,
      unitPrice: String(Number(retainedFactory.unitPrice)),
      memo: factoryMemo,
    }, runLabel("factory-post-cancel-retained-state-restore"));
    page = await processes();
    orderedFactory = page.processes.find((row) => row.id === recreatedFactory.processId);
    assert.equal(Number(orderedFactory.unitPrice), Number(retainedFactory.unitPrice));
    assert.equal(orderedFactory.memo, factoryMemo);
    assert.equal(requestEvidence.some((entry) => entry.status === 404), false, "production-save-must-not-return-not-found");

    const projection = await dbProjection();
    const processRows = projection.filter((row) => row.process_id);
    const processTotal = processRows.reduce((sum, row) => sum + Number(row.amount), 0);
    assert.equal(Number(projection[0].process_total), processTotal);
    assert.equal(Number(projection[0].estimated_total), Number(projection[0].fabric_total) + Number(projection[0].accessory_total) + processTotal);
    assert.equal(processRows.every((row) => row.due_date === null && row.application_area === null && row.application_color_target === null), true);
    assert.equal(await ownerSnapshot(), ownerBefore, "owner-fixture-must-remain-readonly");

    const evidence = {
      result: "PASS",
      checkpoint: "ALPHA65_PRODUCTION_PHYSICAL_PARITY_SAVE_PICKER_IPHONE_REQA_REQUIRED",
      marker,
      workOrderRef: short(workOrderId),
      revisionRef: short(revisionId),
      entityVersion: version,
      totalQuantity: baselineTotalQuantity,
      factory: { name: page.processes.find((row) => row.role === "factory").partnerName, unitPrice: page.processes.find((row) => row.role === "factory").unitPrice, expectedAmount: Number(page.processes.find((row) => row.role === "factory").amount), memo: factoryMemo },
      additionalProcesses: page.processes.filter((row) => row.role === "additional").map((row) => ({ name: row.processName, partnerName: row.partnerName, unitPrice: row.unitPrice, amount: row.amount })),
      costMath: { processTotal, estimatedTotal: Number(projection[0].estimated_total) },
      idempotentReplay: true,
      resumeBaseline: retainedBaseline,
      totalSynchronization: { testedTotal: synchronizationProbeTotal, restoredTotal: baselineTotalQuantity, allProcessRowsSynchronized: true },
      memoOwnership: { factorySaveRead: true, costPatchPreserved: true, factoryPatchPreserved: true, nullableClear: true, quantitySyncPreserved: true, factoryDeleteRemovedRowAndMemo: true, additionalMemoPreserved: true },
      productionLifecycle: { requestStatus: "in_progress", requestLocked: true, cancelStatus: "ready", cancelRestoredEditing: true, postCancelUnitCostSave: true, rapidUnitCostThenMemoSave: true, notFoundResponses: 0, completionPath: "static-contract-and-owner-physical-qa" },
      factoryLogicalCount: 1,
      retainedProcessRefs: page.processes.map((row) => short(row.id)),
      options: { factoryCount: options.factoryPartners.length, standardCount: options.processStandards.length, mappedPartnerCount: options.processPartners.length, auditedStandards },
      requests: requestEvidence,
      ownerFixtureReadOnly: true,
      ownerFixtureDigestBefore: ownerBefore,
      ownerFixtureDigestAfter: await ownerSnapshot(),
      migrationLedger: "18/18",
      productionMutation: 0,
      retainedDevTestFixture: true,
    };
    fs.writeFileSync(resultPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, checkpoint: evidence.checkpoint, fixture: marker, workOrderRef: evidence.workOrderRef, totalQuantity: evidence.totalQuantity, processCount: page.processes.length, ownerFixtureReadOnly: true, migrationLedger: evidence.migrationLedger, productionMutation: 0 }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("alpha65-production-runtime-qa-failed", { errorName: error instanceof Error ? error.name : "UnknownError", errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN", fixtureRef: workOrderId ? short(workOrderId) : null });
  process.exitCode = 1;
});
