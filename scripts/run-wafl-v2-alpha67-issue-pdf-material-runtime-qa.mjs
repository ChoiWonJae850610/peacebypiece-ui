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
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha67", "issue-pdf-material-runtime-qa.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
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

async function main() {
  const environment = readEnvironment();
  assert.ok(environment.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(databaseFingerprint(environment.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");

  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "current-maker");
  assert.equal(state.mutationMode, "current-maker-alpha67");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.developerAutoConnectReady, true);
  const base = String(state.publicOrigin);

  let cookie = "";
  const requests = [];
  async function request(route, options = {}) {
    const response = await fetch(`${base}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.key ? { "Idempotency-Key": options.key } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : null;
    requests.push({ method: options.method ?? "GET", route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"), status: response.status });
    return { response, body };
  }

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = (auth.response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({ connectionString: environment.DATABASE_URL, application_name: "wafl-alpha67-issue-pdf-material-runtime-qa", statement_timeout: 120000 });
  await client.connect();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const marker = `QA A67 발행 PDF 원부자재 ${suffix}`;
  const ids = {
    workOrder: crypto.randomUUID(), revision: crypto.randomUUID(), size: crypto.randomUUID(), color: crypto.randomUUID(), image: crypto.randomUUID(),
    baseFabric: crypto.randomUUID(), baseAccessory: crypto.randomUUID(),
  };
  const identity = (label) => `a67-doc-material-${suffix.toLowerCase()}-${label}`;

  try {
    const prerequisite = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) ledger,
        (SELECT id FROM company_members WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL ORDER BY created_at,id LIMIT 1) member_id,
        (SELECT id FROM partners WHERE company_id=$1 AND is_active=true ORDER BY created_at,id LIMIT 1) partner_id,
        (SELECT COALESCE(NULLIF(btrim(document_number_prefix),''),NULLIF(btrim(company_code),'')) FROM company_settings WHERE company_id=$1) company_code
    `, [COMPANY_ID])).rows[0];
    assert.equal(Number(prerequisite.ledger), 20, "MIGRATION_LEDGER_NOT_20");
    assert.ok(prerequisite.member_id && prerequisite.partner_id && prerequisite.company_code, "FIXTURE_PREREQUISITE_MISSING");
    const asset = (await client.query(`
      SELECT storage_object_key,mime_type,size_bytes,content_sha256
      FROM work_order_images
      WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL
        AND mime_type IN ('image/jpeg','image/png','image/webp') AND size_bytes>0 AND content_sha256 IS NOT NULL
      ORDER BY created_at DESC,id DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(asset, "READONLY_IMAGE_ASSET_MISSING");

    await client.query("BEGIN");
    try {
      await client.query(`
        INSERT INTO work_orders(id,company_id,product_name,product_type_code,season_code,item_code,status,due_date,total_quantity,
          created_by_member_id,assignee_member_id,entity_version,is_sample,derivation_kind,reorder_round)
        VALUES($1,$2,$3,'wafl-c1|U|T','27SS','티셔츠','draft',current_date+30,10,$4,$4,1,false,'original',0)
      `, [ids.workOrder, COMPANY_ID, marker, prerequisite.member_id]);
      await client.query(`
        INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,company_code_snapshot,
          season_code_snapshot,item_code_snapshot,product_name_snapshot,product_type_code_snapshot,due_date_snapshot,
          total_quantity_snapshot,memo,author_member_id,entity_version)
        VALUES($1,$2,$3,0,'draft',$4,'27SS','티셔츠',$5,'wafl-c1|U|T',current_date+30,10,'alpha.67 isolated issue/PDF QA',$6,1)
      `, [ids.revision, COMPANY_ID, ids.workOrder, prerequisite.company_code, marker, prerequisite.member_id]);
      await client.query("INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order) VALUES($1,$2,$3,'M','M',0)", [ids.size, COMPANY_ID, ids.revision]);
      await client.query("INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order) VALUES($1,$2,$3,'NAVY','남색','#1E2A44',0)", [ids.color, COMPANY_ID, ids.revision]);
      await client.query("INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity) VALUES($1,$2,$3,$4,10)", [COMPANY_ID, ids.revision, ids.color, ids.size]);
      await client.query(`
        INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,supplier_partner_id,required_quantity,allowance_quantity,
          inventory_usage_quantity,order_quantity,unit_code,unit_price,amount,status,memo,display_order,entity_version,supplier_name_snapshot)
        VALUES
          ($1,$2,$3,'fabric','A67 기본 원단',$4,3,0,0,3,'m',1000,3000,'editing','발행 기본 원단',0,1,'A67 공급처'),
          ($5,$2,$3,'accessory','A67 기본 부자재',$4,10,0,0,10,'ea',100,1000,'editing','발행 기본 부자재',1,1,'A67 공급처')
      `, [ids.baseFabric, COMPANY_ID, ids.revision, prerequisite.partner_id, ids.baseAccessory]);
      await client.query(`
        INSERT INTO work_order_images(id,company_id,work_order_id,storage_object_key,thumbnail_object_key,original_filename,mime_type,size_bytes,
          content_sha256,title,display_order,is_current_representative,created_by_member_id)
        VALUES($1,$2,$3,$4,NULL,$5,$6,$7,$8,'A67 발행 QA 대표',0,true,$9)
      `, [ids.image, COMPANY_ID, ids.workOrder, asset.storage_object_key, `a67-issue-${suffix}.png`, asset.mime_type, asset.size_bytes, asset.content_sha256, prerequisite.member_id]);
      await client.query(`
        INSERT INTO work_order_revision_images(company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot)
        VALUES($1,$2,$3,0,true,$4,$5,$6)
      `, [COMPANY_ID, ids.revision, ids.image, `a67-issue-${suffix}.png`, asset.mime_type, asset.storage_object_key]);
      await client.query("UPDATE work_orders SET current_revision_id=$3,representative_image_id=$4 WHERE company_id=$1 AND id=$2", [COMPANY_ID, ids.workOrder, ids.revision, ids.image]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    async function detail() {
      const result = await request(`/api/v2/work-orders/${ids.workOrder}`);
      assert.equal(result.response.status, 200, "DETAIL_READ_FAILED");
      return result.body.data;
    }
    async function materialCommand(materialId, endpoint, label, expectedStatus = 200, extra = {}) {
      const current = await detail();
      const key = identity(label);
      const result = await request(`/api/v2/work-orders/${ids.workOrder}/materials/${materialId}/${endpoint}`, {
        method: "POST", key,
        body: { clientRequestId: key, expectedVersion: current.header.entityVersion, ...extra },
      });
      assert.equal(result.response.status, expectedStatus, `${label}:${result.body?.error?.code ?? "UNKNOWN"}`);
      return result;
    }
    async function createMaterial(materialType, label) {
      const current = await detail();
      const key = identity(`${label}-create`);
      const result = await request(`/api/v2/work-orders/${ids.workOrder}/materials`, {
        method: "POST", key,
        body: {
          clientRequestId: key, expectedVersion: current.header.entityVersion, materialType, materialId: null,
          name: `A67 ${label} ${suffix}`, partnerId: prerequisite.partner_id, colorOption: "검증",
          usageArea: "alpha.67 isolated QA", requiredQuantity: "3", allowanceQuantity: "0.5",
          inventoryUsageQuantity: "0", orderQuantity: "3.5", unitCode: materialType === "fabric" ? "m" : "개",
          unitPrice: "1000", memo: "alpha.67 issue/PDF/material QA",
        },
      });
      assert.equal(result.response.status, 201, `${label}-create:${result.body?.error?.code ?? "UNKNOWN"}`);
      return String(result.body.data.result.materialLineId);
    }
    async function hardDelete(materialId, label, expectedStatus = 200) {
      const current = await detail();
      const key = identity(label);
      const result = await request(`/api/v2/work-orders/${ids.workOrder}/materials/${materialId}`, {
        method: "DELETE", key,
        body: { clientRequestId: key, expectedVersion: current.header.entityVersion },
      });
      assert.equal(result.response.status, expectedStatus, `${label}:${result.body?.error?.code ?? "UNKNOWN"}`);
      return result;
    }

    for (const materialType of ["fabric", "accessory"]) {
      const neverRequested = await createMaterial(materialType, `${materialType}-hard-delete`);
      await hardDelete(neverRequested, `${materialType}-hard-delete`);
      const absent = await client.query("SELECT count(*)::integer count FROM work_order_material_lines WHERE company_id=$1 AND id=$2::uuid", [COMPANY_ID, neverRequested]);
      assert.equal(Number(absent.rows[0].count), 0, `${materialType}-hard-delete-residual`);

      const cancelled = await createMaterial(materialType, `${materialType}-cancelled-archive`);
      await materialCommand(cancelled, "order-request", `${materialType}-request`);
      await materialCommand(cancelled, "order-cancel", `${materialType}-cancel`, 200, { reason: "alpha.67 history-preserving removal QA" });
      const active = await request(`/api/v2/work-orders/${ids.workOrder}/materials?type=${materialType}&lifecycle=active&limit=50`);
      const currentLine = active.body?.data?.items?.find((item) => item.id === cancelled);
      assert.equal(currentLine?.removalMode, "history_preserving_remove", `${materialType}-removal-mode`);
      await materialCommand(cancelled, "archive", `${materialType}-archive`);
      const archived = await client.query(`
        SELECT archived_at IS NOT NULL archived, requested_at IS NOT NULL requested, cancelled_at IS NOT NULL cancelled,
          (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_type='work_order'
            AND entity_id=$3::text AND metadata->>'materialLineId'=$2::text) events
        FROM work_order_material_lines WHERE company_id=$1 AND id=$2::uuid
      `, [COMPANY_ID, cancelled, ids.workOrder]);
      assert.deepEqual({ archived: archived.rows[0].archived, requested: archived.rows[0].requested, cancelled: archived.rows[0].cancelled }, { archived: true, requested: true, cancelled: true }, `${materialType}-archive-history`);
      assert.ok(Number(archived.rows[0].events) >= 4, `${materialType}-archive-event-history`);
    }

    const requested = await createMaterial("fabric", "requested-protected");
    await materialCommand(requested, "order-request", "requested-protected-request");
    await hardDelete(requested, "requested-protected-delete", 409);
    const completed = await createMaterial("accessory", "completed-protected");
    await materialCommand(completed, "order-request", "completed-protected-request");
    await materialCommand(completed, "order-complete", "completed-protected-complete");
    await hardDelete(completed, "completed-protected-delete", 409);

    const ready = await detail();
    assert.equal(ready.header.readiness.canIssue, true, `READINESS_NOT_READY:${ready.header.readiness.hardBlockers.map((item) => item.code).join(",")}`);
    assert.equal(ready.header.readiness.hardBlockers.some((item) => item.code === "ITEM_REQUIRED"), false, "KOREAN_ITEM_BLOCKED");
    const issueKey = identity("ordinary-issue");
    const issue = await request(`/api/v2/work-orders/${ids.workOrder}/revisions/issue`, {
      method: "POST", key: issueKey,
      body: {
        clientRequestId: issueKey, expectedWorkOrderVersion: ready.header.entityVersion,
        expectedRevisionVersion: ready.header.currentRevisionVersion, expectedRevisionId: ids.revision,
        issueNote: "alpha.67 Korean detail ordinary first issue/PDF QA",
      },
    });
    assert.equal(issue.response.status, 200, `ORDINARY_ISSUE_FAILED:${issue.body?.error?.code ?? "UNKNOWN"}`);
    assert.match(String(issue.body.data.result.displayDocumentNumber), /-T-/u, "CATEGORY_SEGMENT_NOT_USED");

    async function generateAndRead(workOrderId, revisionId, label) {
      const key = identity(`${label}-generate`);
      const generated = await request(`/api/v2/work-orders/${workOrderId}/documents/generate`, { method: "POST", key, body: { revisionId } });
      assert.equal(generated.response.status, 200, `${label}-generate:${generated.body?.error?.code ?? "UNKNOWN"}`);
      assert.equal(generated.body?.data?.status, "generated", `${label}-status`);
      const generatedDocumentId = String(generated.body.data.generatedDocumentId);
      const list = await request(`/api/v2/work-orders/${workOrderId}/documents?limit=50`);
      assert.equal(list.response.status, 200, `${label}-document-list`);
      const document = list.body?.data?.items?.find((item) => item.id === generatedDocumentId);
      assert.equal(document?.status, "generated", `${label}-document-read`);
      const pdf = await fetch(`${base}${document.inlineUrl}`, { headers: { Cookie: cookie } });
      const bytes = Buffer.from(await pdf.arrayBuffer());
      assert.equal(pdf.status, 200, `${label}-pdf-read`);
      assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-", `${label}-pdf-signature`);
      const metadata = (await client.query(`
        SELECT storage_object_key,file_size_bytes,content_sha256 FROM generated_documents
        WHERE company_id=$1 AND id=$2::uuid AND status='generated'
      `, [COMPANY_ID, generatedDocumentId])).rows[0];
      assert.ok(metadata?.storage_object_key, `${label}-r2-key`);
      assert.equal(Number(metadata.file_size_bytes), bytes.byteLength, `${label}-r2-size`);
      assert.equal(String(metadata.content_sha256), crypto.createHash("sha256").update(bytes).digest("hex"), `${label}-r2-hash`);
      return { generatedDocumentId, bytes: bytes.byteLength };
    }

    const ordinaryDocument = await generateAndRead(ids.workOrder, ids.revision, "ordinary");
    const reorder = (await client.query(`
      SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,w.reorder_round
      FROM work_orders w
      WHERE w.company_id=$1 AND w.derivation_kind='reorder' AND w.status='issued'
        AND w.product_name LIKE 'QA A67 N차 리오더 %'
        AND NOT EXISTS (
          SELECT 1 FROM generated_documents d WHERE d.company_id=w.company_id AND d.work_order_id=w.id
            AND d.status='generated' AND d.deleted_at IS NULL AND d.revoked_at IS NULL
        )
      ORDER BY w.reorder_round DESC,w.created_at DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(reorder?.work_order_id && reorder?.revision_id, "ISSUED_REORDER_WITHOUT_DOCUMENT_NOT_FOUND");
    const reorderDocument = await generateAndRead(reorder.work_order_id, reorder.revision_id, "reorder");
    assert.notEqual(ordinaryDocument.generatedDocumentId, reorderDocument.generatedDocumentId, "DOCUMENT_IDENTITY_COLLISION");

    const evidence = {
      result: "ALPHA67_ISSUE_PDF_MATERIAL_RUNTIME_QA_PASS",
      executedAt: new Date().toISOString(),
      ordinaryFixture: { marker, workOrderRef: safeRef(ids.workOrder), revisionRef: safeRef(ids.revision), documentRef: safeRef(ordinaryDocument.generatedDocumentId), retainedForPhysicalQa: true },
      reorderFixture: { workOrderRef: safeRef(reorder.work_order_id), revisionRef: safeRef(reorder.revision_id), round: Number(reorder.reorder_round), documentRef: safeRef(reorderDocument.generatedDocumentId), retainedExistingIsolatedFixture: true },
      assertions: {
        KoreanItemReadinessAndIssue: "PASS", ordinaryIssuePdfR2Read: "PASS", reorderPdfR2Read: "PASS",
        FabricHardDeleteAndHistoryArchive: "PASS", AccessoryHardDeleteAndHistoryArchive: "PASS",
        requestedAndCompletedProtected: "PASS", documentIdentitySeparation: "PASS",
      },
      retained: { newWorkOrders: 1, newGeneratedDocuments: 2, temporaryResidual: 0 },
      mutationBoundary: { production: 0, ownerFixture: 0, migration: 0 },
      requests,
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, ordinaryRef: safeRef(ids.workOrder), reorderRef: safeRef(reorder.work_order_id), requests: requests.length, retainedIsolatedFixtures: 2, productionMutation: 0, ownerFixtureMutation: 0 }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA67_ISSUE_PDF_MATERIAL_RUNTIME_QA_FAILED", { name: error instanceof Error ? error.name : "UnknownError", code: error instanceof Error ? error.message : "UNKNOWN" });
  process.exitCode = 1;
});
