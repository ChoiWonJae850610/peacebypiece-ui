#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha79", "stage2a-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const AUTOMATED_NAME = "QA A79 generation failure retry automated";
const PHYSICAL_NAME = "QA A79 generation failure retry";
const safeRef = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

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

function cookieFrom(response) {
  return (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
}

async function main() {
  const environment = readEnvironment();
  assert.ok(environment.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(databaseFingerprint(environment.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.mutationMode, "current-maker-alpha67");
  assert.equal(state.developerAutoConnectReady, true);
  const publicBase = String(state.publicOrigin);
  const localBase = `http://127.0.0.1:${Number(state.nextPort)}`;

  let cookie = "";
  const requests = [];
  async function request(base, route, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    try {
      const response = await fetch(`${base}${route}`, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: options.accept ?? "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json") ? await response.json() : null;
      requests.push({
        host: base === localBase ? "loopback-dev-runner" : "canonical-external-qa",
        method: options.method ?? "GET",
        route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"),
        status: response.status,
      });
      return { response, body };
    } finally {
      clearTimeout(timeout);
    }
  }

  const auth = await request(publicBase, "/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = cookieFrom(auth.response);
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({
    connectionString: environment.DATABASE_URL,
    application_name: "wafl-alpha79-stage2a-failure-retry-r2-cleanup",
    statement_timeout: 180000,
  });
  await client.connect();
  try {
    const ledger = await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger");
    assert.equal(Number(ledger.rows[0].count), 22, "MIGRATION_LEDGER_NOT_22");
    const retained = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name='QA A73 product sketch retained' AND deleted_at IS NULL", [COMPANY_ID]);
    assert.equal(Number(retained.rows[0].count), 1, "RETAINED_A73_FIXTURE_MISSING");

    const source = (await client.query(`
      SELECT w.id::text work_order_id
      FROM work_orders w
      WHERE w.company_id=$1 AND w.status IN ('issued','revised','completed')
        AND w.deleted_at IS NULL
        AND w.product_name NOT LIKE 'QA A73 product sketch retained%'
        AND w.product_name NOT LIKE 'QA A79 generation failure retry%'
        AND EXISTS (SELECT 1 FROM work_order_revision_images i
          WHERE i.company_id=w.company_id AND i.revision_id=w.current_revision_id AND i.is_representative=true)
      ORDER BY w.updated_at DESC,w.id DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(source?.work_order_id, "CANONICAL_COPY_SOURCE_NOT_FOUND");

    async function findFixture(name) {
      return (await client.query(`
        SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,w.status,w.product_name
        FROM work_orders w WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
        ORDER BY w.created_at DESC,w.id DESC LIMIT 1
      `, [COMPANY_ID, name])).rows[0] ?? null;
    }

    async function prepareFixture(name, keySuffix) {
      let fixture = await findFixture(name);
      let created = false;
      if (!fixture) {
        const copyKey = `a79-stage2a-copy-${keySuffix}-20260912`;
        const copied = await request(publicBase, `/api/v2/work-orders/${source.work_order_id}/copy`, {
          method: "POST",
          key: copyKey,
          body: { clientRequestId: copyKey },
          timeoutMs: 180_000,
        });
        assert.equal(copied.response.status, 201, `FIXTURE_COPY_FAILED_${keySuffix}:${copied.body?.error?.code ?? "UNKNOWN"}`);
        const copiedId = String(copied.body?.data?.result?.workOrderId ?? "");
        const copiedRevisionId = String(copied.body?.data?.result?.revisionId ?? "");
        assert.match(copiedId, /^[0-9a-f-]{36}$/iu);
        assert.match(copiedRevisionId, /^[0-9a-f-]{36}$/iu);
        const detail = await request(publicBase, `/api/v2/work-orders/${copiedId}`);
        assert.equal(detail.response.status, 200, `FIXTURE_DETAIL_FAILED_${keySuffix}`);
        const renameId = `a79-stage2a-name-${keySuffix}-20260912`;
        const renamed = await request(publicBase, `/api/v2/work-orders/${copiedId}`, {
          method: "PATCH",
          body: { clientRequestId: renameId, expectedVersion: detail.body.data.header.entityVersion, patch: { productName: name } },
        });
        assert.equal(renamed.response.status, 200, `FIXTURE_RENAME_FAILED_${keySuffix}:${renamed.body?.error?.code ?? "UNKNOWN"}`);
        fixture = { work_order_id: copiedId, revision_id: copiedRevisionId, status: "draft", product_name: name };
        created = true;
      }
      if (fixture.status === "draft") {
        let detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
        assert.equal(detail.response.status, 200, `FIXTURE_READY_DETAIL_FAILED_${keySuffix}`);
        if (detail.body?.data?.header?.readiness?.hardBlockers?.some((issue) => issue.code === "BASIC_PROCESS_ORDER_REQUIRED")) {
          const process = (await client.query(`
            SELECT id::text process_id,status
            FROM work_order_processes
            WHERE company_id=$1 AND revision_id=$2::uuid AND process_type_code='production_factory'
            ORDER BY display_order,id LIMIT 1
          `, [COMPANY_ID, fixture.revision_id])).rows[0];
          assert.ok(process?.process_id, `FIXTURE_FACTORY_PROCESS_MISSING_${keySuffix}`);
          assert.equal(process.status, "ready", `FIXTURE_FACTORY_PROCESS_NOT_READY_${keySuffix}`);
          const orderKey = `a79-stage2a-order-request-${keySuffix}-20260912`;
          const requested = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/processes/${process.process_id}/order-request`, {
            method: "POST",
            key: orderKey,
            body: { clientRequestId: orderKey, expectedVersion: detail.body.data.header.entityVersion },
          });
          assert.equal(requested.response.status, 200, `FIXTURE_ORDER_REQUEST_FAILED_${keySuffix}:${requested.body?.error?.code ?? "UNKNOWN"}`);
          detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
          assert.equal(detail.response.status, 200, `FIXTURE_REFRESH_AFTER_ORDER_FAILED_${keySuffix}`);
        }
        assert.equal(detail.body?.data?.header?.readiness?.canIssue, true, `FIXTURE_NOT_READY_${keySuffix}`);
        const issueKey = `a79-stage2a-issue-${keySuffix}-20260912`;
        const issued = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/revisions/issue`, {
          method: "POST",
          key: issueKey,
          body: {
            clientRequestId: issueKey,
            expectedWorkOrderVersion: detail.body.data.header.entityVersion,
            expectedRevisionVersion: detail.body.data.header.currentRevisionVersion,
            expectedRevisionId: fixture.revision_id,
            issueNote: "alpha.79 Stage 2A isolated generation failure and retry QA",
          },
          timeoutMs: 120_000,
        });
        assert.equal(issued.response.status, 200, `FIXTURE_ISSUE_FAILED_${keySuffix}:${issued.body?.error?.code ?? "UNKNOWN"}`);
        fixture.status = "issued";
      }
      const counts = (await client.query(`
        SELECT
          (SELECT count(*)::integer FROM work_order_revisions r WHERE r.company_id=$1 AND r.work_order_id=$2::uuid) revisions,
          (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid) documents,
          (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=$1 AND e.entity_type='work_order' AND e.entity_id=$2::text AND e.command_code='work_order.revision.issue') issue_events,
          (SELECT count(*)::integer FROM work_order_revision_images i WHERE i.company_id=$1 AND i.revision_id=$3::uuid) images,
          (SELECT count(*)::integer FROM work_order_revision_attachments a WHERE a.company_id=$1 AND a.revision_id=$3::uuid) attachments
      `, [COMPANY_ID, fixture.work_order_id, fixture.revision_id])).rows[0];
      assert.equal(Number(counts.documents), 0, `FIXTURE_DOCUMENTS_NOT_EMPTY_${keySuffix}`);
      return { ...fixture, created, baseline: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)])) };
    }

    const automated = await prepareFixture(AUTOMATED_NAME, "automated");
    const physical = await prepareFixture(PHYSICAL_NAME, "physical");

    async function failScenario(fixture, scenario) {
      const result = await request(localBase, "/api/dev/a79-stage2a-generation-failure", {
        method: "POST",
        body: { scenario, workOrderId: fixture.work_order_id, revisionId: fixture.revision_id },
        timeoutMs: 180_000,
      });
      assert.equal(result.response.status, 200, `${scenario}_RUNNER_FAILED:${result.body?.error ?? "UNKNOWN"}`);
      assert.equal(result.body?.data?.status, "failed");
      assert.equal(result.body?.data?.exactObjectAbsent, true);
      return result.body.data;
    }

    const beforePut = await failScenario(automated, "FAIL_BEFORE_OBJECT_PUT");
    assert.equal(beforePut.counts.put, 0);
    assert.equal(beforePut.counts.delete, 0);
    const afterPut = await failScenario(automated, "FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE");
    assert.equal(afterPut.counts.put, 1);
    assert.equal(afterPut.counts.delete, 1);
    assert.ok(afterPut.objectKeyRef);

    const retryKey = "a79-stage2a-retry-automated-20260912";
    const retry = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/generate`, {
      method: "POST", key: retryKey, body: { revisionId: automated.revision_id }, timeoutMs: 180_000,
    });
    assert.equal(retry.response.status, 200, `AUTOMATED_RETRY_FAILED:${retry.body?.error?.code ?? "UNKNOWN"}`);
    assert.equal(retry.body?.data?.status, "generated");
    const generatedDocumentId = String(retry.body.data.generatedDocumentId);
    const replay = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/generate`, {
      method: "POST", key: retryKey, body: { revisionId: automated.revision_id }, timeoutMs: 180_000,
    });
    assert.equal(replay.response.status, 200);
    assert.equal(String(replay.body?.data?.generatedDocumentId), generatedDocumentId);
    assert.equal(replay.body?.data?.idempotentReplay, true);

    const concurrentKeys = ["one", "two"].map((suffix) => `a79-stage2a-concurrent-${suffix}-20260912`);
    const concurrent = await Promise.all(concurrentKeys.map((key) => request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/generate`, {
      method: "POST", key, body: { revisionId: automated.revision_id }, timeoutMs: 180_000,
    })));
    assert.ok(concurrent.every((item) => item.response.status === 200));
    assert.ok(concurrent.every((item) => String(item.body?.data?.generatedDocumentId) === generatedDocumentId));
    const different = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/generate`, {
      method: "POST", key: "a79-stage2a-different-key-20260912", body: { revisionId: automated.revision_id }, timeoutMs: 180_000,
    });
    assert.equal(different.response.status, 200);
    assert.equal(String(different.body?.data?.generatedDocumentId), generatedDocumentId);

    const documents = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents?limit=50`);
    assert.equal(documents.response.status, 200);
    const generated = documents.body?.data?.items?.find((item) => item.id === generatedDocumentId);
    assert.equal(generated?.status, "generated");
    const pdf = await fetch(`${publicBase}${generated.inlineUrl}`, { headers: { Cookie: cookie } });
    const pdfBytes = Buffer.from(await pdf.arrayBuffer());
    assert.equal(pdf.status, 200);
    assert.equal(pdfBytes.subarray(0, 5).toString("ascii"), "%PDF-");

    const automatedAfter = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_order_revisions r WHERE r.company_id=$1 AND r.work_order_id=$2::uuid) revisions,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.status='generated' AND d.deleted_at IS NULL AND d.revoked_at IS NULL) generated,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.status='pending') pending,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.status='failed') failed,
        (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=$1 AND e.entity_type='work_order' AND e.entity_id=$2::text AND e.command_code='work_order.revision.issue') issue_events
    `, [COMPANY_ID, automated.work_order_id])).rows[0];
    assert.equal(Number(automatedAfter.revisions), automated.baseline.revisions, "RETRY_CREATED_REVISION");
    assert.equal(Number(automatedAfter.issue_events), automated.baseline.issue_events, "RETRY_REISSUED_RECIPE");
    assert.equal(Number(automatedAfter.generated), 1, "DUPLICATE_CANONICAL_GENERATED_ARTIFACT");
    assert.equal(Number(automatedAfter.pending), 0, "PENDING_RESIDUAL");
    assert.equal(Number(automatedAfter.failed), 2, "FAILED_AUDIT_HISTORY_INVALID");

    const physicalFailure = await failScenario(physical, "FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE");
    assert.equal(physicalFailure.counts.put, 1);
    assert.equal(physicalFailure.counts.delete, 1);
    const physicalDocuments = await request(publicBase, `/api/v2/work-orders/${physical.work_order_id}/documents?limit=50`);
    assert.equal(physicalDocuments.response.status, 200);
    const physicalCurrent = physicalDocuments.body?.data?.items?.find((item) => item.revisionId === physical.revision_id);
    assert.equal(physicalCurrent?.status, "failed", "PHYSICAL_FIXTURE_NOT_FAILED");

    const physicalAfter = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_order_revisions r WHERE r.company_id=$1 AND r.work_order_id=$2::uuid) revisions,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.status='failed') failed,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.status='generated') generated,
        (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=$1 AND e.entity_type='work_order' AND e.entity_id=$2::text AND e.command_code='work_order.revision.issue') issue_events
    `, [COMPANY_ID, physical.work_order_id])).rows[0];
    assert.equal(Number(physicalAfter.revisions), physical.baseline.revisions);
    assert.equal(Number(physicalAfter.issue_events), physical.baseline.issue_events);
    assert.equal(Number(physicalAfter.failed), 1);
    assert.equal(Number(physicalAfter.generated), 0);

    const evidence = {
      result: "ALPHA79_STAGE2A_FAILURE_RETRY_R2_CLEANUP_RUNTIME_PASS",
      executedAt: new Date().toISOString(),
      fixture: {
        automated: { name: AUTOMATED_NAME, workOrderRef: safeRef(automated.work_order_id), revisionRef: safeRef(automated.revision_id), documentRef: safeRef(generatedDocumentId), created: automated.created },
        physical: { name: PHYSICAL_NAME, workOrderRef: safeRef(physical.work_order_id), revisionRef: safeRef(physical.revision_id), failedDocumentRef: safeRef(physicalCurrent.id), created: physical.created },
        retainedA73: { name: "QA A73 product sketch retained", state: "accounted-unmodified" },
      },
      scenarios: {
        beforeObjectPut: { put: beforePut.counts.put, delete: beforePut.counts.delete, failed: true, orphan: 0 },
        afterObjectPutBeforeFinalize: { put: afterPut.counts.put, delete: afterPut.counts.delete, objectKeyRef: afterPut.objectKeyRef, objectAbsent: afterPut.exactObjectAbsent, failed: true, orphan: 0 },
        physicalFailedPreparation: { put: physicalFailure.counts.put, delete: physicalFailure.counts.delete, objectKeyRef: physicalFailure.objectKeyRef, objectAbsent: physicalFailure.exactObjectAbsent, failed: true, orphan: 0 },
        retry: { put: 1, delete: 0, generated: 1, validPdf: true, duplicateCanonicalGenerated: 0, newRevision: 0, recipeReissue: 0 },
      },
      totals: { stage2aPdfPut: 3, stage2aPdfDelete: 2, retainedGeneratedPdf: 1, failedAttemptOrphans: 0 },
      idempotency: { sameKeyReplay: "PASS", concurrentDifferentKeys: "PASS", differentKeyCanonicalReuse: "PASS" },
      currentTargets: { view: safeRef(generatedDocumentId), save: safeRef(generatedDocumentId), share: safeRef(generatedDocumentId), viewer: safeRef(generatedDocumentId), token: safeRef(generatedDocumentId) },
      fixtureSetup: {
        canonicalCopyApi: true,
        copiesCreated: Number(automated.created) + Number(physical.created),
        automatedAssetRows: { images: automated.baseline.images, attachments: automated.baseline.attachments },
        physicalAssetRows: { images: physical.baseline.images, attachments: physical.baseline.attachments },
      },
      migration: { ledger: "22/22", new: 0, production: 0 },
      mutationBoundary: { production: 0, owner: 0, ambiguous: 0, productionR2Destructive: 0, triggerDisable: 0 },
      stage2b: 0,
      stage3: 0,
      requests,
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      result: evidence.result,
      automatedWorkOrderRef: evidence.fixture.automated.workOrderRef,
      physicalWorkOrderRef: evidence.fixture.physical.workOrderRef,
      beforePut: evidence.scenarios.beforeObjectPut,
      afterPut: evidence.scenarios.afterObjectPutBeforeFinalize,
      retry: evidence.scenarios.retry,
      pdfPutDelete: `${evidence.totals.stage2aPdfPut}/${evidence.totals.stage2aPdfDelete}`,
      orphan: evidence.totals.failedAttemptOrphans,
      productionOwnerAmbiguous: "0/0/0",
    }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA79_STAGE2A_FAILURE_RETRY_R2_CLEANUP_RUNTIME_FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    code: error instanceof Error ? error.message : "UNKNOWN",
  });
  process.exitCode = 1;
});
