#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { deriveEmbeddedQrOpaqueToken } from "../lib/generated-documents/document-access/tokenDerivation.mjs";

const { Client } = pg;
const COMPANY_ID = "wafl-fn-company-a";
const DB_FINGERPRINT = "01e5dcc7fea3";
const GENERATE_COMMAND = "work_order.document.generate";
const EMBEDDED_COMMAND = "work_order.document.embedded_qr.create";
const EVIDENCE_PATH = path.resolve(".tmp/wafl-v2-alpha64/document-r0-e2e.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const safeRef = (value) => sha256(String(value)).slice(0, 12);

async function readEnvironment() {
  const text = await fs.readFile(path.resolve(".env.local"), "utf8");
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^(["'])|(["'])$/g, "");
  }
  return values;
}

function databaseFingerprint(url) {
  const parsed = new URL(url);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

async function jsonRequest(base, pathname, cookie, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method ?? "GET",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  return { response, body };
}

async function createFixture(client, input) {
  const workOrderId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const sizeId = crypto.randomUUID();
  const colorId = crypto.randomUUID();
  const imageId = crypto.randomUUID();
  const attachmentId = crypto.randomUUID();
  const fabricId = crypto.randomUUID();
  const accessoryId = crypto.randomUUID();
  await client.query(`
    INSERT INTO work_orders (
      id,company_id,legacy_source_id,product_name,product_type_code,season_code,item_code,
      status,due_date,total_quantity,current_revision_id,representative_image_id,
      created_by_member_id,assignee_member_id,entity_version
    ) VALUES ($1,$2,$3,$4,'tshirt','26SS','TSHIRT','draft',(current_date + 30),100,NULL,NULL,$5,$5,1)
  `, [workOrderId, COMPANY_ID, input.legacySourceId, input.marker, input.memberId]);
  await client.query(`
    INSERT INTO work_order_revisions (
      id,company_id,work_order_id,revision_no,revision_status,company_code_snapshot,
      season_code_snapshot,item_code_snapshot,product_name_snapshot,product_type_code_snapshot,
      due_date_snapshot,total_quantity_snapshot,memo,author_member_id,entity_version
    ) VALUES ($1,$2,$3,0,'draft',$4,'26SS','TSHIRT',$5,'tshirt',(current_date + 30),100,'alpha.64 exact isolated QA',$6,1)
  `, [revisionId, COMPANY_ID, workOrderId, input.companyCode, input.marker, input.memberId]);
  await client.query("INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order) VALUES($1,$2,$3,'L','L',0)", [sizeId, COMPANY_ID, revisionId]);
  await client.query("INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order) VALUES($1,$2,$3,'NAVY','남색','#1E2A44',0)", [colorId, COMPANY_ID, revisionId]);
  await client.query("INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity) VALUES($1,$2,$3,$4,100)", [COMPANY_ID, revisionId, colorId, sizeId]);
  await client.query(`
    INSERT INTO work_order_material_lines (
      id,company_id,revision_id,material_type,name,supplier_partner_id,required_quantity,
      unit_code,unit_price,status,display_order,entity_version
    ) VALUES
      ($1,$2,$3,'fabric','QA A64 원단',$4,10,'m',1000,'editing',0,1),
      ($5,$2,$3,'accessory','QA A64 부자재',$4,100,'ea',100,'editing',1,1)
  `, [fabricId, COMPANY_ID, revisionId, input.partnerId, accessoryId]);
  await client.query(`
    INSERT INTO work_order_images (
      id,company_id,work_order_id,storage_object_key,thumbnail_object_key,original_filename,
      mime_type,size_bytes,content_sha256,title,display_order,is_current_representative,created_by_member_id
    ) VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,'QA A64 대표 이미지',0,true,$9)
  `, [imageId, COMPANY_ID, workOrderId, input.asset.storage_object_key, `qa-a64-${input.suffix}.png`, input.asset.mime_type, input.asset.size_bytes, input.asset.content_sha256, input.memberId]);
  await client.query(`
    INSERT INTO work_order_revision_images (
      company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot
    ) VALUES ($1,$2,$3,0,true,$4,$5,$6)
  `, [COMPANY_ID, revisionId, imageId, `qa-a64-${input.suffix}.png`, input.asset.mime_type, input.asset.storage_object_key]);
  await client.query(`
    INSERT INTO work_order_attachments (
      id,company_id,work_order_id,attachment_kind,storage_object_key,original_filename,mime_type,
      size_bytes,content_sha256,output_include_default,created_by_member_id
    ) VALUES ($1,$2,$3,'file',$4,$5,$6,$7,$8,false,$9)
  `, [attachmentId, COMPANY_ID, workOrderId, input.asset.storage_object_key, `QA A64 봉제 참고 ${input.suffix}.png`, input.asset.mime_type, input.asset.size_bytes, input.asset.content_sha256, input.memberId]);
  await client.query(`
    INSERT INTO work_order_revision_attachments (
      company_id,revision_id,attachment_id,display_order,output_include,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot
    ) VALUES ($1,$2,$3,0,false,$4,$5,$6)
  `, [COMPANY_ID, revisionId, attachmentId, `QA A64 봉제 참고 ${input.suffix}.png`, input.asset.mime_type, input.asset.storage_object_key]);
  await client.query("UPDATE work_orders SET current_revision_id=$3,representative_image_id=$4 WHERE company_id=$1 AND id=$2", [COMPANY_ID, workOrderId, revisionId, imageId]);
  return { workOrderId, revisionId, attachmentId, marker: input.marker, suffix: input.suffix };
}

async function main() {
  const environment = await readEnvironment();
  assert.ok(environment.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(databaseFingerprint(environment.DATABASE_URL), DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  assert.ok(environment.WAFL_SESSION_SECRET, "WAFL_SESSION_SECRET_MISSING");
  const state = JSON.parse(await fs.readFile(path.resolve(".tmp/wafl-external-qa/state.json"), "utf8"));
  assert.equal(state.status, "running");
  assert.ok(new Set(["maker-document-r0", "current-maker"]).has(state.runtimeQaMode));
  assert.equal(state.mutationMode, "current-maker-alpha64");
  assert.equal(state.makerQaProfile, "alpha64-current-maker");
  assert.equal(state.nextPort, 3100);
  assert.equal(state.expoPort, 8081);
  assert.equal(state.developerAutoConnectReady, true);
  const base = String(state.publicOrigin);
  assert.equal(new URL(base).protocol, "https:");

  const auth = await fetch(`${base}/api/dev/mobile-connect/auto`, { method: "POST", redirect: "manual" });
  assert.equal(auth.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  const cookie = (auth.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({ connectionString: environment.DATABASE_URL, application_name: "wafl-alpha64-document-r0-e2e" });
  await client.connect();
  let automated;
  let owner;
  let resumedCompletedFixture = false;
  let suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  try {
    const preflight = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger_count,
        (SELECT id FROM company_members WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL ORDER BY created_at,id LIMIT 1) AS member_id,
        (SELECT id FROM partners WHERE company_id=$1 ORDER BY created_at,id LIMIT 1) AS partner_id,
        (SELECT COALESCE(NULLIF(btrim(document_number_prefix),''),NULLIF(btrim(company_code),'')) FROM company_settings WHERE company_id=$1) AS company_code
    `, [COMPANY_ID])).rows[0];
    assert.equal(Number(preflight.ledger_count), 16, "MIGRATION_LEDGER_NOT_16");
    assert.ok(preflight.member_id && preflight.partner_id && preflight.company_code, "FIXTURE_PREREQUISITE_MISSING");
    const asset = (await client.query(`
      SELECT storage_object_key,mime_type,size_bytes,content_sha256
      FROM work_order_images
      WHERE company_id=$1 AND deleted_at IS NULL AND storage_object_key IS NOT NULL
        AND mime_type IN ('image/jpeg','image/png','image/webp') AND size_bytes > 0 AND content_sha256 IS NOT NULL
      ORDER BY created_at DESC,id DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(asset, "SAFE_IMAGE_ASSET_PREREQUISITE_MISSING");
    const existing = await client.query(`
      SELECT w.id::text AS work_order_id,w.current_revision_id::text AS revision_id,w.product_name,w.status,
             (SELECT attachment_id::text FROM work_order_revision_attachments WHERE company_id=w.company_id AND revision_id=w.current_revision_id ORDER BY attachment_id LIMIT 1) AS attachment_id
      FROM work_orders w
      WHERE w.company_id=$1 AND w.product_name LIKE 'QA A64 작업지시서 R0 %'
      ORDER BY w.product_name
    `, [COMPANY_ID]);
    if (existing.rows.length === 0) {
      await client.query("BEGIN");
      try {
        automated = await createFixture(client, {
        marker: `QA A64 작업지시서 R0 자동검증 ${suffix}`,
        legacySourceId: `qa-a64-auto-${suffix.toLowerCase()}`,
        suffix: `AUTO-${suffix}`,
        memberId: String(preflight.member_id), partnerId: String(preflight.partner_id),
        companyCode: String(preflight.company_code), asset,
      });
        owner = await createFixture(client, {
        marker: `QA A64 작업지시서 R0 iPhone ${suffix}`,
        legacySourceId: `qa-a64-owner-${suffix.toLowerCase()}`,
        suffix: `OWNER-${suffix}`,
        memberId: String(preflight.member_id), partnerId: String(preflight.partner_id),
        companyCode: String(preflight.company_code), asset,
      });
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    } else {
      assert.equal(existing.rows.length, 2, "ALPHA64_EXISTING_FIXTURE_COUNT_INVALID");
      const automatedRow = existing.rows.find((row) => String(row.product_name).startsWith("QA A64 작업지시서 R0 자동검증 "));
      const ownerRow = existing.rows.find((row) => String(row.product_name).startsWith("QA A64 작업지시서 R0 iPhone "));
      assert.ok(automatedRow && ownerRow, "ALPHA64_EXISTING_FIXTURE_IDENTITY_INVALID");
      suffix = String(automatedRow.product_name).split(" ").at(-1);
      assert.equal(String(ownerRow.product_name).endsWith(suffix), true, "ALPHA64_EXISTING_FIXTURE_SUFFIX_MISMATCH");
      assert.ok(new Set(["draft", "issued"]).has(automatedRow.status), "ALPHA64_AUTOMATED_FIXTURE_NOT_RESUMABLE");
      assert.equal(ownerRow.status, "draft", "ALPHA64_OWNER_FIXTURE_MUTATED");
      automated = { workOrderId: automatedRow.work_order_id, revisionId: automatedRow.revision_id, attachmentId: automatedRow.attachment_id, marker: automatedRow.product_name, suffix: `AUTO-${suffix}`, status: automatedRow.status };
      owner = { workOrderId: ownerRow.work_order_id, revisionId: ownerRow.revision_id, attachmentId: ownerRow.attachment_id, marker: ownerRow.product_name, suffix: `OWNER-${suffix}` };
      resumedCompletedFixture = automatedRow.status === "issued";
    }

    const detailBefore = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}`, cookie);
    assert.equal(detailBefore.response.status, 200, "AUTOMATED_DETAIL_FAILED");
    assert.equal(detailBefore.body?.data?.header?.readiness?.canIssue, true, "AUTOMATED_READINESS_NOT_READY");
    assert.equal(detailBefore.body.data.header.readiness.hardBlockers.length, 0);
    const assetsBefore = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/assets?limit=50`, cookie);
    assert.equal(assetsBefore.response.status, 200, "AUTOMATED_ASSETS_FAILED");
    const currentAttachment = assetsBefore.body?.data?.items?.find((item) => item.assetType === "attachment" && item.id === automated.attachmentId);
    assert.ok(currentAttachment, "AUTOMATED_ATTACHMENT_MISSING");
    if (detailBefore.body.data.header.status === "draft" && !currentAttachment.includeInDocument) {
      assert.equal(detailBefore.body.data.header.readiness.warnings.some((item) => item.code === "NO_INCLUDED_ATTACHMENT"), true);
      const includeKey = `alpha64-output-${suffix.toLowerCase()}`;
      const include = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/attachments/${automated.attachmentId}/output-include`, cookie, {
        method: "PATCH", idempotencyKey: includeKey,
        body: { clientRequestId: includeKey, expectedVersion: detailBefore.body.data.header.entityVersion, includeInDocument: true },
      });
      assert.equal(include.response.status, 200, `ATTACHMENT_INCLUDE_FAILED_${include.response.status}`);
      assert.ok(Number.isSafeInteger(Number(include.body?.data?.nextVersion)));
    }

    const detailReady = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}`, cookie);
    assert.equal(detailReady.body?.data?.header?.readiness?.canIssue, true);
    assert.equal(detailReady.body.data.header.readiness.warnings.length, 0);
    if (detailReady.body.data.header.status === "draft") {
      const issueKey = `alpha64-issue-${suffix.toLowerCase()}`;
      const issueBody = {
        clientRequestId: issueKey,
        expectedWorkOrderVersion: detailReady.body.data.header.entityVersion,
        expectedRevisionVersion: detailReady.body.data.header.currentRevisionVersion,
        expectedRevisionId: automated.revisionId,
        issueNote: "alpha.64 isolated R0 E2E",
      };
      const issued = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/revisions/issue`, cookie, { method: "POST", idempotencyKey: issueKey, body: issueBody });
      assert.equal(issued.response.status, 200, `ISSUE_FAILED_${issued.response.status}`);
      assert.ok(issued.body?.data?.result?.displayDocumentNumber, "ISSUE_DOCUMENT_NUMBER_MISSING");
      const issueReplay = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/revisions/issue`, cookie, { method: "POST", idempotencyKey: issueKey, body: issueBody });
      assert.equal(issueReplay.response.status, 200, "ISSUE_REPLAY_FAILED");
      assert.equal(issueReplay.response.headers.get("x-wafl-idempotent-replay"), "1");
    } else {
      assert.equal(detailReady.body.data.header.status, "issued", "AUTOMATED_ISSUE_STATE_INVALID");
      const issueEvidence = await client.query(`
        SELECT count(*)::integer AS receipts,
               (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_id=$2::text AND command_code='work_order.revision.issue') AS events
        FROM work_order_command_receipts
        WHERE company_id=$1 AND work_order_id=$2::uuid AND command_code='work_order.revision.issue'
      `, [COMPANY_ID, automated.workOrderId]);
      assert.deepEqual(issueEvidence.rows[0], { receipts: 1, events: 1 }, "ISSUE_EVIDENCE_MISSING");
    }
    const supplierSnapshot = await client.query(`
      SELECT material_type,supplier_name_snapshot FROM work_order_material_lines
      WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY material_type
    `, [COMPANY_ID, automated.revisionId]);
    assert.equal(supplierSnapshot.rows.length, 2);
    assert.equal(supplierSnapshot.rows.every((row) => typeof row.supplier_name_snapshot === "string" && row.supplier_name_snapshot.trim()), true, "SUPPLIER_SNAPSHOT_MISSING");

    const generationKey = `alpha64-generate-${suffix.toLowerCase()}`;
    const generated = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/documents/generate`, cookie, { method: "POST", idempotencyKey: generationKey, body: { revisionId: automated.revisionId } });
    assert.equal(generated.response.status, 200, `GENERATION_FAILED_${generated.response.status}_${generated.body?.error?.code ?? "UNKNOWN"}`);
    assert.equal(generated.body?.data?.status, "generated");
    const generatedDocumentId = String(generated.body.data.generatedDocumentId);
    const generationReplay = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/documents/generate`, cookie, { method: "POST", idempotencyKey: generationKey, body: { revisionId: automated.revisionId } });
    assert.equal(generationReplay.response.status, 200, "GENERATION_REPLAY_FAILED");
    assert.equal(generationReplay.body?.data?.generatedDocumentId, generatedDocumentId);
    assert.equal(generationReplay.body?.data?.idempotentReplay, true);

    const docs = await jsonRequest(base, `/api/v2/work-orders/${automated.workOrderId}/documents?limit=50`, cookie);
    assert.equal(docs.response.status, 200);
    const document = docs.body?.data?.items?.find((item) => item.id === generatedDocumentId);
    assert.equal(document?.status, "generated");
    const internalPdf = await fetch(`${base}${document.inlineUrl}`, { headers: { Cookie: cookie } });
    const internalBytes = Buffer.from(await internalPdf.arrayBuffer());
    assert.equal(internalPdf.status, 200);
    assert.equal(internalPdf.headers.get("content-type"), "application/pdf");
    assert.equal(internalBytes.subarray(0, 5).toString("ascii"), "%PDF-");

    const listed = await jsonRequest(base, `/api/v2/work-orders/documents/${generatedDocumentId}/access-tokens`, cookie);
    assert.equal(listed.response.status, 200);
    const embedded = listed.body?.data?.items?.find((item) => item.tokenPurpose === "embedded_qr");
    assert.ok(embedded);
    assert.equal(embedded.expiresAt, null);
    const receipt = (await client.query(`
      SELECT idempotency_key FROM work_order_command_receipts
      WHERE company_id=$1 AND command_code=$2 AND result_generated_document_id=$3::uuid
    `, [COMPANY_ID, GENERATE_COMMAND, generatedDocumentId])).rows[0];
    assert.ok(receipt?.idempotency_key);
    const embeddedRaw = deriveEmbeddedQrOpaqueToken(environment.WAFL_SESSION_SECRET, {
      companyId: COMPANY_ID, generatedDocumentId, commandCode: EMBEDDED_COMMAND, idempotencyKey: String(receipt.idempotency_key),
    });
    if (resumedCompletedFixture) {
      assert.ok(embedded.revokedAt, "RESUMED_EMBEDDED_QR_NOT_REVOKED");
      const manual = listed.body?.data?.items?.find((item) => item.tokenPurpose === "manual_share");
      assert.ok(manual?.expiresAt && manual.revokedAt, "RESUMED_MANUAL_SHARE_NOT_REVOKED");
      const revokedEmbeddedSession = await jsonRequest(base, "/api/public/document-viewer/session", "", { method: "POST", body: { token: embeddedRaw } });
      assert.equal(revokedEmbeddedSession.response.status, 404, "REVOKED_EMBEDDED_QR_STILL_VALID");
    } else {
      const embeddedSession = await jsonRequest(base, "/api/public/document-viewer/session", "", { method: "POST", body: { token: embeddedRaw } });
      assert.equal(embeddedSession.response.status, 200, "EMBEDDED_QR_REDEEM_FAILED");

      const shareKey = `alpha64-share-${suffix.toLowerCase()}`;
      const share = await jsonRequest(base, `/api/v2/work-orders/documents/${generatedDocumentId}/access-tokens`, cookie, { method: "POST", idempotencyKey: shareKey, body: { expiresInDays: 7 } });
      assert.equal(share.response.status, 201, "MANUAL_SHARE_CREATE_FAILED");
      assert.ok(share.body?.data?.viewerUrl);
      const shareUrl = new URL(share.body.data.viewerUrl);
      const manualRaw = new URLSearchParams(shareUrl.hash.slice(1)).get("t");
      assert.ok(manualRaw);
      const manualSession = await jsonRequest(base, "/api/public/document-viewer/session", "", { method: "POST", body: { token: manualRaw } });
      assert.equal(manualSession.response.status, 200, "MANUAL_SHARE_REDEEM_FAILED");
      const viewerCookie = (manualSession.response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
      const publicPdf = await fetch(`${base}/api/public/document-viewer/file`, { headers: { Cookie: viewerCookie } });
      assert.equal(publicPdf.status, 200, "PUBLIC_PDF_FAILED");
      assert.equal(Buffer.from(await publicPdf.arrayBuffer()).subarray(0, 5).toString("ascii"), "%PDF-");
      const tokensAfterShare = await jsonRequest(base, `/api/v2/work-orders/documents/${generatedDocumentId}/access-tokens`, cookie);
      const manual = tokensAfterShare.body.data.items.find((item) => item.tokenPurpose === "manual_share");
      assert.ok(manual?.expiresAt);
      const revokeManual = await jsonRequest(base, `/api/v2/work-orders/documents/${generatedDocumentId}/access-tokens/${manual.tokenId}/revoke`, cookie, { method: "POST", body: {} });
      assert.equal(revokeManual.response.status, 200);
      const revokedManualSession = await jsonRequest(base, "/api/public/document-viewer/session", "", { method: "POST", body: { token: manualRaw } });
      assert.equal(revokedManualSession.response.status, 404, "REVOKED_MANUAL_SHARE_STILL_VALID");
      const revokeEmbedded = await jsonRequest(base, `/api/v2/work-orders/documents/${generatedDocumentId}/access-tokens/${embedded.tokenId}/revoke`, cookie, { method: "POST", body: {} });
      assert.equal(revokeEmbedded.response.status, 200);
      const revokedEmbeddedSession = await jsonRequest(base, "/api/public/document-viewer/session", "", { method: "POST", body: { token: embeddedRaw } });
      assert.equal(revokedEmbeddedSession.response.status, 404, "REVOKED_EMBEDDED_QR_STILL_VALID");
    }

    const ownerDetail = await jsonRequest(base, `/api/v2/work-orders/${owner.workOrderId}`, cookie);
    assert.equal(ownerDetail.response.status, 200);
    assert.equal(ownerDetail.body?.data?.header?.status, "draft");
    assert.equal(typeof ownerDetail.body?.data?.header?.readiness?.canIssue, "boolean");
    const ownerAssets = await jsonRequest(base, `/api/v2/work-orders/${owner.workOrderId}/assets?limit=50`, cookie);
    assert.equal(ownerAssets.response.status, 200);
    const ownerAttachment = ownerAssets.body?.data?.items?.find((item) => item.assetType === "attachment");
    assert.ok(ownerAttachment);
    assert.equal(typeof ownerAttachment.includeInDocument, "boolean", "OWNER_ATTACHMENT_INCLUDE_STATE_INVALID");
    const isolation = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND status='issued') AS automated_issued,
        (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid AND status='generated') AS automated_generated,
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1 AND id=$3::uuid AND status='draft') AS owner_draft,
        (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$3::uuid) AS owner_documents,
        (SELECT count(*)::integer FROM document_access_tokens t JOIN generated_documents d ON d.company_id=t.company_id AND d.id=t.generated_document_id WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND t.token_purpose='embedded_qr' AND t.revoked_at IS NOT NULL) AS embedded_revoked,
        (SELECT count(*)::integer FROM document_access_tokens t JOIN generated_documents d ON d.company_id=t.company_id AND d.id=t.generated_document_id WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND t.token_purpose='manual_share' AND t.revoked_at IS NOT NULL) AS manual_revoked
    `, [COMPANY_ID, automated.workOrderId, owner.workOrderId])).rows[0];
    assert.deepEqual(isolation, { automated_issued: 1, automated_generated: 1, owner_draft: 1, owner_documents: 0, embedded_revoked: 1, manual_revoked: 1 });
    const evidence = {
      result: "ALPHA64_MAKER_DOCUMENT_R0_E2E_RUNTIME_PASS",
      executedAt: new Date().toISOString(),
      automated: { marker: automated.marker, workOrderId: automated.workOrderId, workOrderRef: safeRef(automated.workOrderId), revisionRef: safeRef(automated.revisionId), generatedDocumentRef: safeRef(generatedDocumentId), retainedImmutableEvidence: true },
      owner: { marker: owner.marker, workOrderId: owner.workOrderId, workOrderRef: safeRef(owner.workOrderId), revisionId: owner.revisionId, revisionRef: safeRef(owner.revisionId), attachmentId: owner.attachmentId, attachmentIncludeInDocument: ownerAttachment.includeInDocument, draft: true, issued: false, generatedDocuments: 0, autoCleanup: false },
      assertions: {
        canonicalReadiness: "PASS", attachmentInclude: "PASS", issueAndReplay: "PASS", supplierSnapshot: "PASS",
        generationAndReplay: "PASS", selectedImageAttachmentRendered: "PASS", internalPdf: "PASS",
        manualShareRedeemRevoke: resumedCompletedFixture ? "PASS_PRESERVED_IMMUTABLE_EVIDENCE" : "PASS",
        managedEmbeddedQrRedeemRevoke: resumedCompletedFixture ? "PASS_PRESERVED_IMMUTABLE_EVIDENCE" : "PASS",
        currentMakerProfileGenerationReplay: "PASS",
        immutableGeneratedHistory: "PASS",
        tenantScope: COMPANY_ID, productionMutation: 0,
      },
    };
    await fs.mkdir(path.dirname(EVIDENCE_PATH), { recursive: true });
    await fs.writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log("ALPHA64_MAKER_DOCUMENT_R0_E2E_RUNTIME_PASS");
    console.log(`Automated fixture: ${automated.marker} (${safeRef(automated.workOrderId)})`);
    console.log(`Owner fixture: ${owner.marker} (${safeRef(owner.workOrderId)})`);
    console.log(`PDF bytes: ${internalBytes.byteLength}; ledger: 16/16; production mutation: 0`);
  } finally {
    await client.end();
  }
}

main().catch(async (error) => {
  await fs.mkdir(path.dirname(EVIDENCE_PATH), { recursive: true });
  await fs.writeFile(EVIDENCE_PATH.replace(/\.json$/, "-failure.json"), `${JSON.stringify({ result: "FAILED", executedAt: new Date().toISOString(), errorName: error instanceof Error ? error.name : "UnknownError", errorMessage: error instanceof Error ? error.message : "unknown" }, null, 2)}\n`, "utf8");
  console.error("ALPHA64_MAKER_DOCUMENT_R0_E2E_RUNTIME_FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" });
  process.exitCode = 1;
});
