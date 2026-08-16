#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const COMPANY_ID = "wafl-fn-company-a";
const DB_FINGERPRINT = "01e5dcc7fea3";
const PREFIX = "QA A64 작업지시서 R0 문서UI2 ";
const OLD_OWNER_PREFIX = "QA A64 작업지시서 R0 iPhone ";
const EVIDENCE_PATH = path.resolve(".tmp/wafl-v2-alpha64/document-attachments-owner-fixture.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const safeRef = (value) => sha256(String(value)).slice(0, 12);

async function environment() {
  const values = {};
  for (const line of (await fs.readFile(path.resolve(".env.local"), "utf8")).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(["'])|(["'])$/g, "");
  }
  return values;
}

function fingerprint(url) {
  const parsed = new URL(url);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

async function jsonRequest(base, pathname, cookie) {
  const response = await fetch(`${base}${pathname}`, { headers: { Accept: "application/json", Cookie: cookie }, redirect: "manual" });
  const body = (response.headers.get("content-type") ?? "").includes("application/json") ? await response.json() : null;
  return { response, body };
}

async function oldOwnerAudit(client) {
  const result = await client.query(`
    SELECT w.id::text,w.product_name,w.status,w.entity_version,r.id::text AS revision_id,
      r.revision_status,r.entity_version AS revision_version,
      (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS documents,
      (SELECT count(*)::integer FROM work_order_attachments a WHERE a.company_id=w.company_id AND a.work_order_id=w.id AND a.deleted_at IS NULL) AS attachments
    FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
    WHERE w.company_id=$1 AND w.product_name LIKE $2 ORDER BY w.id
  `, [COMPANY_ID, `${OLD_OWNER_PREFIX}%`]);
  return { count: result.rows.length, sha256: sha256(JSON.stringify(result.rows)) };
}

async function main() {
  const env = await environment();
  assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(fingerprint(env.DATABASE_URL), DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const runtime = JSON.parse(await fs.readFile(path.resolve(".tmp/wafl-external-qa/state.json"), "utf8"));
  assert.equal(runtime.status, "running");
  assert.equal(runtime.runtimeQaMode, "current-maker");
  assert.equal(runtime.mutationMode, "current-maker-alpha64");
  assert.equal(runtime.makerQaProfile, "alpha64-current-maker");
  assert.equal(runtime.developerAutoConnectReady, true);

  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha64-document-attachments-owner-fixture" });
  await client.connect();
  let fixture;
  try {
    const baseline = await oldOwnerAudit(client);
    assert.equal(baseline.count, 1, "OLD_OWNER_FIXTURE_IDENTITY_INVALID");
    const existing = await client.query("SELECT id FROM work_orders WHERE company_id=$1 AND product_name LIKE $2", [COMPANY_ID, `${PREFIX}%`]);
    assert.equal(existing.rowCount, 0, "NEW_OWNER_FIXTURE_ALREADY_EXISTS");
    const preflight = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger,
        (SELECT id FROM company_members WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL ORDER BY created_at,id LIMIT 1) AS member_id,
        (SELECT COALESCE(NULLIF(btrim(document_number_prefix),''),NULLIF(btrim(company_code),'')) FROM company_settings WHERE company_id=$1) AS company_code,
        (SELECT p.id FROM partners p WHERE p.company_id=$1 AND p.is_active=true ORDER BY p.created_at,p.id LIMIT 1) AS supplier_id,
        (SELECT count(DISTINCT p.id)::integer FROM partners p JOIN partner_items pi ON pi.partner_id=p.id AND pi.company_id=$1 AND pi.item_type='factory' AND pi.is_active=true WHERE p.company_id=$1 AND p.is_active=true) AS factory_count
    `, [COMPANY_ID])).rows[0];
    assert.equal(Number(preflight.ledger), 16, "MIGRATION_LEDGER_NOT_16");
    assert.ok(preflight.member_id && preflight.company_code && preflight.supplier_id, "FIXTURE_PREREQUISITE_MISSING");
    assert.ok(Number(preflight.factory_count) > 0, "FACTORY_OPTION_PREREQUISITE_MISSING");
    const imageAsset = (await client.query(`
      SELECT i.storage_object_key,i.mime_type,i.size_bytes,i.content_sha256
      FROM work_order_images i JOIN work_orders w ON w.company_id=i.company_id AND w.id=i.work_order_id
      WHERE i.company_id=$1 AND w.product_name LIKE 'QA A64 %' AND i.deleted_at IS NULL
        AND i.mime_type IN ('image/jpeg','image/png','image/webp') AND i.storage_object_key IS NOT NULL
        AND i.size_bytes>0 AND i.content_sha256 IS NOT NULL ORDER BY i.created_at DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    const pdfAsset = (await client.query(`
      SELECT d.storage_object_key,'application/pdf'::text AS mime_type,d.file_size_bytes AS size_bytes,d.content_sha256
      FROM generated_documents d JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
      WHERE d.company_id=$1 AND w.product_name LIKE 'QA A64 %' AND d.status='generated'
        AND d.revoked_at IS NULL AND d.deleted_at IS NULL AND d.storage_object_key IS NOT NULL
        AND d.file_size_bytes>0 AND d.content_sha256 IS NOT NULL ORDER BY d.generated_at DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(imageAsset && pdfAsset, "QA_OWNED_ASSET_PREREQUISITE_MISSING");

    const token = crypto.randomBytes(4).toString("hex").toUpperCase();
    const marker = `${PREFIX}${token}`;
    const ids = Object.fromEntries(["workOrderId","revisionId","sizeLId","sizeXlId","colorNavyId","colorGrayId","imageId","imageAttachmentId","pdfAttachmentId","fabricId","accessoryId"].map((key) => [key, crypto.randomUUID()]));
    await client.query("BEGIN");
    try {
      await client.query(`INSERT INTO work_orders(id,company_id,legacy_source_id,product_name,product_type_code,season_code,item_code,status,due_date,total_quantity,current_revision_id,representative_image_id,created_by_member_id,assignee_member_id,entity_version)
        VALUES($1,$2,$3,$4,'tshirt','26FW','A64DOCUI2','draft',(current_date+30),100,NULL,NULL,$5,$5,1)`, [ids.workOrderId, COMPANY_ID, `qa-a64-document-ui2-${token.toLowerCase()}`, marker, preflight.member_id]);
      await client.query(`INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,company_code_snapshot,season_code_snapshot,item_code_snapshot,product_name_snapshot,product_type_code_snapshot,due_date_snapshot,total_quantity_snapshot,memo,factory_delivery_memo,author_member_id,entity_version)
        VALUES($1,$2,$3,0,'draft',$4,'26FW','A64DOCUI2',$5,'tshirt',(current_date+30),100,'alpha.64 document attachments and Quick Delivery owner QA','봉제 전 첨부 자료와 발주 항목을 확인해 주세요.',$6,1)`, [ids.revisionId, COMPANY_ID, ids.workOrderId, preflight.company_code, marker, preflight.member_id]);
      await client.query("INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order) VALUES($1,$2,$3,'L','L',0),($4,$2,$3,'XL','XL',1)", [ids.sizeLId, COMPANY_ID, ids.revisionId, ids.sizeXlId]);
      await client.query("INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order) VALUES($1,$2,$3,'NAVY','남색','#1E2A44',0),($4,$2,$3,'GRAY','회색','#8A8D91',1)", [ids.colorNavyId, COMPANY_ID, ids.revisionId, ids.colorGrayId]);
      await client.query("INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity) VALUES($1,$2,$3,$4,40),($1,$2,$3,$5,30),($1,$2,$6,$4,20),($1,$2,$6,$5,10)", [COMPANY_ID, ids.revisionId, ids.colorNavyId, ids.sizeLId, ids.sizeXlId, ids.colorGrayId]);
      await client.query(`INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,supplier_partner_id,supplier_name_snapshot,required_quantity,order_quantity,unit_code,unit_price,status,requested_at,display_order,entity_version)
        SELECT $1::uuid,$2,$3::uuid,'fabric','QA A64 요청 원단',$4,p.name,10,10,'m',1000,'requested',now(),0,1 FROM partners p WHERE p.company_id=$2 AND p.id=$4
        UNION ALL SELECT $5::uuid,$2,$3::uuid,'accessory','QA A64 요청 부자재',$4,p.name,100,100,'ea',100,'requested',now(),1,1 FROM partners p WHERE p.company_id=$2 AND p.id=$4`, [ids.fabricId, COMPANY_ID, ids.revisionId, preflight.supplier_id, ids.accessoryId]);
      await client.query(`INSERT INTO work_order_images(id,company_id,work_order_id,storage_object_key,original_filename,mime_type,size_bytes,content_sha256,title,display_order,is_current_representative,created_by_member_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'QA A64 대표 이미지',0,true,$9)`, [ids.imageId, COMPANY_ID, ids.workOrderId, imageAsset.storage_object_key, `QA-A64-${token}.png`, imageAsset.mime_type, imageAsset.size_bytes, imageAsset.content_sha256, preflight.member_id]);
      await client.query(`INSERT INTO work_order_revision_images(company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot)
        VALUES($1,$2,$3,0,true,$4,$5,$6)`, [COMPANY_ID, ids.revisionId, ids.imageId, `QA-A64-${token}.png`, imageAsset.mime_type, imageAsset.storage_object_key]);
      for (const [attachmentId, asset, filename, order] of [[ids.imageAttachmentId,imageAsset,`QA A64 참고 이미지 ${token}.png`,0],[ids.pdfAttachmentId,pdfAsset,`QA A64 봉제 가이드 ${token}.pdf`,1]]) {
        await client.query(`INSERT INTO work_order_attachments(id,company_id,work_order_id,attachment_kind,storage_object_key,original_filename,mime_type,size_bytes,content_sha256,output_include_default,created_by_member_id)
          VALUES($1,$2,$3,'file',$4,$5,$6,$7,$8,true,$9)`, [attachmentId, COMPANY_ID, ids.workOrderId, asset.storage_object_key, filename, asset.mime_type, asset.size_bytes, asset.content_sha256, preflight.member_id]);
        await client.query(`INSERT INTO work_order_revision_attachments(company_id,revision_id,attachment_id,display_order,output_include,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot)
          VALUES($1,$2,$3,$4,true,$5,$6,$7)`, [COMPANY_ID, ids.revisionId, attachmentId, order, filename, asset.mime_type, asset.storage_object_key]);
      }
      await client.query("UPDATE work_orders SET current_revision_id=$3,representative_image_id=$4 WHERE company_id=$1 AND id=$2", [COMPANY_ID, ids.workOrderId, ids.revisionId, ids.imageId]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const auth = await fetch(`${runtime.publicOrigin}/api/dev/mobile-connect/auto`, { method: "POST", redirect: "manual" });
    assert.equal(auth.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
    const cookie = (auth.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
    const [detail, assets, matrix, fabrics, accessories, partners] = await Promise.all([
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}`, cookie),
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}/assets?limit=50`, cookie),
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}/size-color`, cookie),
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}/materials?type=fabric&lifecycle=active&limit=30`, cookie),
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}/materials?type=accessory&lifecycle=active&limit=30`, cookie),
      jsonRequest(runtime.publicOrigin, `/api/v2/work-orders/${ids.workOrderId}/material-partners`, cookie),
    ]);
    for (const result of [detail, assets, matrix, fabrics, accessories, partners]) assert.equal(result.response.status, 200, "OWNER_FIXTURE_READ_FAILED");
    assert.equal(detail.body.data.header.readiness.canIssue, true, "OWNER_FIXTURE_NOT_READY");
    assert.equal(detail.body.data.header.readiness.hardBlockers.length, 0);
    assert.equal(detail.body.data.header.totalQuantity, 100);
    assert.equal(Number(matrix.body.data.matrixTotal), 100);
    assert.equal(assets.body.data.items.filter((item) => item.assetType === "image").length, 1);
    const ownerAttachments = assets.body.data.items.filter((item) => item.assetType === "attachment");
    assert.equal(ownerAttachments.length, 2);
    assert.ok(ownerAttachments.some((item) => item.mimeType === "application/pdf" && item.includeInDocument));
    assert.ok(ownerAttachments.some((item) => item.mimeType.startsWith("image/") && item.includeInDocument));
    assert.equal(fabrics.body.data.items.filter((item) => item.status === "requested").length, 1);
    assert.equal(accessories.body.data.items.filter((item) => item.status === "requested").length, 1);
    const factoryOptions = partners.body.data.items.filter((item) => item.role === "factory").length;
    assert.ok(factoryOptions > 0);
    const after = await oldOwnerAudit(client);
    assert.deepEqual(after, baseline, "OLD_OWNER_FIXTURE_MUTATED");
    const generated = Number((await client.query("SELECT count(*) FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid", [COMPANY_ID, ids.workOrderId])).rows[0].count);
    assert.equal(generated, 0);
    fixture = { marker, workOrderId: ids.workOrderId, workOrderRef: safeRef(ids.workOrderId), readiness: "PASS", totalQuantity: 100, matrixTotal: 100, imageCount: 1, attachmentCount: 2, pdfAttachmentCount: 1, requestedFabricCount: 1, requestedAccessoryCount: 1, factoryOptionCount: factoryOptions, generatedDocuments: generated, oldOwnerUnchanged: true, migrationLedger: 16, productionMutation: 0 };
    await fs.mkdir(path.dirname(EVIDENCE_PATH), { recursive: true });
    await fs.writeFile(EVIDENCE_PATH, `${JSON.stringify({ checkpoint: "ALPHA64_DOCUMENT_ATTACHMENTS_OWNER_FIXTURE_READY", fixture }, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ checkpoint: "ALPHA64_DOCUMENT_ATTACHMENTS_OWNER_FIXTURE_READY", fixture: { ...fixture, workOrderId: undefined } }));
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
