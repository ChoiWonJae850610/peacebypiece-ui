#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const COMPANY_ID = "wafl-fn-company-a";
const evidencePath = path.resolve(".tmp/wafl-v2-alpha64/controlled-attachment-runtime.json");

async function envFile() {
  const result = {};
  for (const line of (await fs.readFile(path.resolve(".env.local"), "utf8")).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) result[match[1]] = match[2].trim().replace(/^(["'])|(["'])$/g, "");
  }
  return result;
}

async function main() {
  const runtime = JSON.parse(await fs.readFile(path.resolve(".tmp/wafl-external-qa/state.json"), "utf8"));
  assert.equal(runtime.status, "running");
  assert.equal(runtime.runtimeQaMode, "current-maker");
  assert.equal(runtime.mutationMode, "current-maker-alpha64");
  assert.equal(runtime.makerQaProfile, "alpha64-current-maker");
  const env = await envFile();
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha64-controlled-attachment-runtime" });
  await client.connect();
  try {
    const target = (await client.query(`
      SELECT d.id::text AS document_id,
        jsonb_array_length(COALESCE((d.snapshot->'assetManifest'), '[]'::jsonb)) AS manifest_count,
        (SELECT count(*)::integer FROM jsonb_array_elements(COALESCE(d.snapshot->'assetManifest','[]'::jsonb)) asset
          WHERE asset->>'assetType'='attachment' AND asset->>'includeInDocument'='true') AS selected_count
      FROM generated_documents d JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
      WHERE d.company_id=$1 AND w.product_name LIKE 'QA A64 작업지시서 R0 자동검증 %'
        AND d.status='generated' AND d.revoked_at IS NULL AND d.deleted_at IS NULL
      ORDER BY d.generated_at DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(target && Number(target.selected_count) > 0, "QA_GENERATED_DOCUMENT_WITH_ATTACHMENT_MISSING");
    const auth = await fetch(`${runtime.publicOrigin}/api/dev/mobile-connect/auto`, { method: "POST", redirect: "manual" });
    assert.equal(auth.status, 200);
    const authCookie = (auth.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
    const key = `alpha64-attachment-share-${crypto.randomBytes(6).toString("hex")}`;
    const create = await fetch(`${runtime.publicOrigin}/api/v2/work-orders/documents/${target.document_id}/access-tokens`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Cookie: authCookie, "Idempotency-Key": key },
      body: JSON.stringify({ expiresInDays: 1 }),
    });
    assert.equal(create.status, 201);
    const created = (await create.json()).data;
    assert.ok(created.tokenId && created.viewerUrl);
    const viewer = new URL(created.viewerUrl);
    const rawToken = new URLSearchParams(viewer.hash.slice(1)).get("t");
    assert.ok(rawToken);
    const sessionResponse = await fetch(`${runtime.publicOrigin}/api/public/document-viewer/session`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: rawToken }), redirect: "manual",
    });
    assert.equal(sessionResponse.status, 200);
    const sessionCookie = (sessionResponse.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
    const session = (await sessionResponse.json()).data;
    assert.ok(Array.isArray(session.attachments) && session.attachments.length === Number(target.selected_count));
    assert.doesNotMatch(JSON.stringify(session), /storageObjectKey|storage_object_key|signedUrl|contentSha256|revisionAssetId/);
    const attachment = session.attachments[0];
    assert.ok(attachment.ref && attachment.downloadUrl);
    const download = await fetch(`${runtime.publicOrigin}${attachment.downloadUrl}`, { headers: { Cookie: sessionCookie }, redirect: "manual" });
    assert.equal(download.status, 200);
    const bytes = Buffer.from(await download.arrayBuffer());
    assert.equal(bytes.byteLength, attachment.sizeBytes);
    if (attachment.inlineSupported) {
      const inline = await fetch(`${runtime.publicOrigin}${attachment.inlineUrl}`, { headers: { Cookie: sessionCookie }, redirect: "manual" });
      assert.equal(inline.status, 200);
      assert.equal(Buffer.from(await inline.arrayBuffer()).byteLength, attachment.sizeBytes);
    }
    const revoke = await fetch(`${runtime.publicOrigin}/api/v2/work-orders/documents/${target.document_id}/access-tokens/${created.tokenId}/revoke`, { method: "POST", headers: { Cookie: authCookie, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(revoke.status, 200);
    const revokedSession = await fetch(`${runtime.publicOrigin}/api/public/document-viewer/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: rawToken }) });
    assert.equal(revokedSession.status, 404);
    const revokedAttachment = await fetch(`${runtime.publicOrigin}${attachment.downloadUrl}`, { headers: { Cookie: sessionCookie } });
    assert.equal(revokedAttachment.status, 404);
    const evidence = { checkpoint: "ALPHA64_CONTROLLED_ATTACHMENT_RUNTIME_PASS", selectedAttachmentCount: session.attachments.length, inlineVerified: Boolean(attachment.inlineSupported), downloadVerified: true, rawStorageKeyExposed: false, revokeProtected: true, productionMutation: 0 };
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(evidence));
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
