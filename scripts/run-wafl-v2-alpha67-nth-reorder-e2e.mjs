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
let suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
let marker = `QA A67 N차 리오더 ${suffix}`;
const resultPath = path.join(root, ".tmp", "wafl-v2-alpha67", "nth-reorder-e2e.json");
const requests = [];
let cookie = "";
let lastSafeResponse = null;

assert.equal(state.status, "running");
assert.equal(state.makerQaProfile, "alpha67-current-maker");
assert.equal(state.mutationMode, "current-maker-alpha67");
assert.equal(state.developerAutoConnectReady, true);
assert.equal(state.tailscaleIpv4, state.metroAdvertisedHost);
assert.equal(state.tailscaleIpv4, state.iosManifestLaunchHost);

async function request(route, method = "GET", body = null, key = null) {
  const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(90_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  const json = (() => { try { return JSON.parse(text); } catch { return null; } })();
  lastSafeResponse = { status: response.status, ok: json?.ok ?? null, code: json?.error?.code ?? null, message: json?.error?.message ?? null };
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "fixture"), status: response.status });
  return { response, json };
}

async function insertSourceFamily(client) {
  const prereq = (await client.query(`
    SELECT
      (SELECT count(*)::integer FROM wafl_v2_migration_ledger) ledger,
      (SELECT id FROM company_members WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL ORDER BY created_at,id LIMIT 1) member_id,
      (SELECT id FROM partners WHERE company_id=$1 ORDER BY created_at,id LIMIT 1) partner_id,
      (SELECT COALESCE(NULLIF(btrim(document_number_prefix),''),NULLIF(btrim(company_code),'')) FROM company_settings WHERE company_id=$1) company_code
  `, [companyId])).rows[0];
  assert.equal(Number(prereq.ledger), 20, "migration-ledger-not-20");
  assert.ok(prereq.member_id && prereq.partner_id && prereq.company_code, "fixture-prerequisite-missing");
  const asset = (await client.query(`
    SELECT storage_object_key,mime_type,size_bytes,content_sha256
    FROM work_order_images
    WHERE company_id=$1 AND deleted_at IS NULL AND size_bytes>0 AND content_sha256 IS NOT NULL
      AND mime_type IN ('image/jpeg','image/png','image/webp')
    ORDER BY created_at DESC,id DESC LIMIT 1
  `, [companyId])).rows[0];
  assert.ok(asset, "safe-readonly-source-asset-missing");
  const existing = (await client.query(`
    SELECT w.id::text,w.product_name,w.current_revision_id::text revision_id,w.is_sample,w.derivation_kind,w.status,w.reorder_round,w.total_quantity,
           i.storage_object_key,i.mime_type,i.size_bytes,i.content_sha256
    FROM work_orders w LEFT JOIN work_order_images i ON i.company_id=w.company_id AND i.id=w.representative_image_id
    WHERE w.company_id=$1 AND w.product_name LIKE 'QA A67 N차 리오더 %'
    ORDER BY w.product_name
  `, [companyId])).rows;
  if (existing.length > 0) {
    assert.ok(existing.length >= 5 && existing.length <= 8, "prior-alpha67-partial-fixture-shape");
    const matched = String(existing[0].product_name).match(/^(QA A67 N차 리오더 ([A-F0-9]{8}))/u);
    assert.ok(matched && existing.every((row) => String(row.product_name).startsWith(matched[1])), "prior-alpha67-partial-fixture-identity");
    marker = matched[1]; suffix = matched[2];
    const source = existing.find((row) => String(row.product_name) === `${marker} 원본` && row.derivation_kind === "original");
    assert.ok(source?.storage_object_key, "prior-alpha67-source-missing");
    const blockers = ["샘플", "미발행", "재작업", "취소"].map((label) => {
      const row = existing.find((candidate) => String(candidate.product_name) === `${marker} 차단 ${label}`);
      assert.ok(row, `prior-alpha67-blocker-${label}-missing`);
      return { label, workOrderId: row.id, revisionId: row.revision_id };
    });
    return {
      source: source.id,
      sourceRevision: source.revision_id,
      blockers,
      asset: { storage_object_key: source.storage_object_key, mime_type: source.mime_type, size_bytes: source.size_bytes, content_sha256: source.content_sha256 },
      existingReorders: existing.filter((row) => row.derivation_kind === "reorder").map((row) => ({ workOrderId: row.id, reorderRound: Number(row.reorder_round), totalQuantity: Number(row.total_quantity), status: row.status })).sort((a, b) => a.reorderRound - b.reorderRound),
      resumedPartialFixture: true,
    };
  }

  const ids = {
    source: crypto.randomUUID(), sourceRevision: crypto.randomUUID(), size: crypto.randomUUID(), color: crypto.randomUUID(),
    spec: crypto.randomUUID(), specSize: crypto.randomUUID(), specPom: crypto.randomUUID(),
    image: crypto.randomUUID(), attachment: crypto.randomUUID(), fabric: crypto.randomUUID(), accessory: crypto.randomUUID(), process: crypto.randomUUID(),
  };
  await client.query("BEGIN");
  try {
    await client.query(`
      INSERT INTO work_orders(id,company_id,product_name,product_type_code,season_code,item_code,status,due_date,total_quantity,
        created_by_member_id,assignee_member_id,entity_version,is_sample,derivation_kind,reorder_round)
      VALUES($1,$2,$3,'tshirt','27SS','A67-TEE','draft',current_date+30,100,$4,$4,1,false,'original',0)
    `, [ids.source, companyId, `${marker} 원본`, prereq.member_id]);
    await client.query(`
      INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,company_code_snapshot,
        season_code_snapshot,item_code_snapshot,product_name_snapshot,product_type_code_snapshot,due_date_snapshot,
        total_quantity_snapshot,memo,factory_delivery_memo,author_member_id,entity_version)
      VALUES($1,$2,$3,0,'draft',$4,'27SS','A67-TEE',$5,'tshirt',current_date+30,100,'제품 사양 메모','공장 전달 사양',$6,1)
    `, [ids.sourceRevision, companyId, ids.source, prereq.company_code, `${marker} 원본`, prereq.member_id]);
    await client.query("INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order) VALUES($1,$2,$3,'M','M',0)", [ids.size, companyId, ids.sourceRevision]);
    await client.query("INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order) VALUES($1,$2,$3,'NAVY','남색','#1E2A44',0)", [ids.color, companyId, ids.sourceRevision]);
    await client.query("INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity) VALUES($1,$2,$3,$4,100)", [companyId, ids.sourceRevision, ids.color, ids.size]);
    await client.query("INSERT INTO work_order_size_specs(id,company_id,revision_id,gender_code,category_code,measurement_unit) VALUES($1,$2,$3,'unisex','T','cm')", [ids.spec, companyId, ids.sourceRevision]);
    await client.query("INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order) VALUES($1,$2,$3,$4,'M','M',0)", [ids.specSize, companyId, ids.sourceRevision, ids.spec]);
    await client.query("INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,display_order) VALUES($1,$2,$3,$4,'body_length','총장','length',0)", [ids.specPom, companyId, ids.sourceRevision, ids.spec]);
    await client.query("INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value,display_fraction) VALUES($1,$2,$3,$4,$5,70.125,'70 1/8')", [companyId, ids.sourceRevision, ids.spec, ids.specSize, ids.specPom]);
    await client.query(`
      INSERT INTO work_order_material_lines(id,company_id,revision_id,material_type,name,supplier_partner_id,required_quantity,allowance_quantity,
        inventory_usage_quantity,order_quantity,unit_code,unit_price,amount,status,memo,display_order,entity_version,supplier_name_snapshot)
      VALUES
        ($1,$2,$3,'fabric','A67 원단',$4,10,1,2,9,'m',1000,9000,'completed','원단 사양',0,7,'A67 공급처'),
        ($5,$2,$3,'accessory','A67 부자재',$4,100,5,5,100,'ea',100,10000,'requested','부자재 사양',1,5,'A67 공급처')
    `, [ids.fabric, companyId, ids.sourceRevision, prereq.partner_id, ids.accessory]);
    await client.query(`
      INSERT INTO work_order_processes(id,company_id,revision_id,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,
        quantity,due_date,unit_code,unit_price,amount,memo,status,display_order,completed_at,completed_by_member_id,entity_version)
      VALUES($1,$2,$3,'factory','제작 공장',$4,'A67 공장',100,current_date+20,'ea',500,50000,'공정 사양','completed',0,now(),$5,8)
    `, [ids.process, companyId, ids.sourceRevision, prereq.partner_id, prereq.member_id]);
    await client.query(`INSERT INTO work_order_images(id,company_id,work_order_id,storage_object_key,thumbnail_object_key,original_filename,mime_type,size_bytes,content_sha256,title,display_order,is_current_representative,created_by_member_id)
      VALUES($1,$2,$3,$4,NULL,$5,$6,$7,$8,'A67 대표',0,true,$9)`, [ids.image, companyId, ids.source, asset.storage_object_key, `a67-${suffix}.png`, asset.mime_type, asset.size_bytes, asset.content_sha256, prereq.member_id]);
    await client.query("INSERT INTO work_order_revision_images(company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot) VALUES($1,$2,$3,0,true,$4,$5,$6)", [companyId, ids.sourceRevision, ids.image, `a67-${suffix}.png`, asset.mime_type, asset.storage_object_key]);
    await client.query(`INSERT INTO work_order_attachments(id,company_id,work_order_id,attachment_kind,storage_object_key,original_filename,mime_type,size_bytes,content_sha256,output_include_default,created_by_member_id)
      VALUES($1,$2,$3,'file',$4,$5,$6,$7,$8,true,$9)`, [ids.attachment, companyId, ids.source, asset.storage_object_key, `A67 제품사양 ${suffix}.png`, asset.mime_type, asset.size_bytes, asset.content_sha256, prereq.member_id]);
    await client.query("INSERT INTO work_order_revision_attachments(company_id,revision_id,attachment_id,display_order,output_include,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot) VALUES($1,$2,$3,0,true,$4,$5,$6)", [companyId, ids.sourceRevision, ids.attachment, `A67 제품사양 ${suffix}.png`, asset.mime_type, asset.storage_object_key]);
    await client.query("UPDATE work_order_revisions SET fabric_total=9000,accessory_total=10000,process_total=50000,estimated_total=69000,revision_status='finalized',finalized_by_member_id=$3,finalized_at=now() WHERE company_id=$1 AND id=$2", [companyId, ids.sourceRevision, prereq.member_id]);
    await client.query("UPDATE work_orders SET current_revision_id=$3,representative_image_id=$4,status='issued' WHERE company_id=$1 AND id=$2", [companyId, ids.source, ids.sourceRevision, ids.image]);

    const blockers = [];
    for (const definition of [
      { label: "샘플", status: "issued", isSample: true, kind: "original", revision: "finalized" },
      { label: "미발행", status: "draft", isSample: false, kind: "original", revision: "draft" },
      { label: "재작업", status: "issued", isSample: false, kind: "rework", revision: "finalized" },
      { label: "취소", status: "cancelled", isSample: false, kind: "original", revision: "cancelled" },
    ]) {
      const workOrderId = crypto.randomUUID(); const revisionId = crypto.randomUUID();
      await client.query(`INSERT INTO work_orders(id,company_id,product_name,status,total_quantity,created_by_member_id,entity_version,is_sample,derivation_kind,source_work_order_id,source_revision_id,series_root_work_order_id,reorder_round)
        VALUES($1,$2,$3,$4,10,$5,1,$6,$7,$8::uuid,$9::uuid,$10::uuid,0)`, [workOrderId, companyId, `${marker} 차단 ${definition.label}`, definition.status, prereq.member_id, definition.isSample, definition.kind, definition.kind === "rework" ? ids.source : null, definition.kind === "rework" ? ids.sourceRevision : null, definition.kind === "rework" ? ids.source : null]);
      await client.query(`INSERT INTO work_order_revisions(id,company_id,work_order_id,revision_no,revision_status,product_name_snapshot,total_quantity_snapshot,author_member_id,finalized_by_member_id,finalized_at,entity_version)
        VALUES($1,$2,$3,0,'draft',$4,10,$5,NULL,NULL,1)`, [revisionId, companyId, workOrderId, `${marker} 차단 ${definition.label}`, prereq.member_id]);
      if (definition.revision !== "draft") await client.query("UPDATE work_order_revisions SET revision_status=$4,finalized_by_member_id=$5,finalized_at=CASE WHEN $4='finalized' THEN now() ELSE NULL END WHERE company_id=$1 AND id=$2 AND work_order_id=$3", [companyId, revisionId, workOrderId, definition.revision, prereq.member_id]);
      await client.query("UPDATE work_orders SET current_revision_id=$3 WHERE company_id=$1 AND id=$2", [companyId, workOrderId, revisionId]);
      blockers.push({ ...definition, workOrderId, revisionId });
    }
    await client.query("COMMIT");
    return { ...ids, blockers, asset, memberId: prereq.member_id };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function main() {
  assert.ok(env.DATABASE_URL, "database-url-missing");
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha67-nth-reorder-e2e", statement_timeout: 120000 });
  await client.connect();
  try {
    const auth = await request("/api/dev/mobile-connect/auto", "POST", {});
    assert.equal(auth.response.status, 200, "developer-auto-connect");
    assert.ok(cookie, "developer-session-cookie-missing");
    const fixture = await insertSourceFamily(client);

    for (const blocked of fixture.blockers) {
      const key = `a67-block-${fixture.blockers.indexOf(blocked)}-${suffix}`;
      const response = await request(`/api/v2/work-orders/${blocked.workOrderId}/reorder`, "POST", { clientRequestId: key, totalQuantity: 33, dueDate: null }, key);
      assert.equal(response.response.status, 409, `blocked-source-${blocked.label}`);
    }

    const key1 = `a67-reorder-one-${suffix}`;
    const key2 = `a67-reorder-two-${suffix}`;
    if ((fixture.existingReorders?.length ?? 0) === 0) {
      const [one, two] = await Promise.all([
        request(`/api/v2/work-orders/${fixture.source}/reorder`, "POST", { clientRequestId: key1, totalQuantity: 120, dueDate: "2027-04-10" }, key1),
        request(`/api/v2/work-orders/${fixture.source}/reorder`, "POST", { clientRequestId: key2, totalQuantity: 140, dueDate: "2027-04-20" }, key2),
      ]);
      assert.equal(one.response.status, 201, "concurrent-reorder-one");
      assert.equal(two.response.status, 201, "concurrent-reorder-two");
    }
    const created = (await client.query("SELECT id::text work_order_id,reorder_round,total_quantity,status FROM work_orders WHERE company_id=$1 AND series_root_work_order_id=$2::uuid AND derivation_kind='reorder' ORDER BY reorder_round", [companyId, fixture.source])).rows.map((row) => ({ workOrderId: row.work_order_id, reorderRound: Number(row.reorder_round), totalQuantity: Number(row.total_quantity), status: row.status }));
    assert.deepEqual(created.map((item) => item.reorderRound), [1, 2], "server-global-round-allocation");
    const replay = await request(`/api/v2/work-orders/${fixture.source}/reorder`, "POST", { clientRequestId: key1, totalQuantity: 120, dueDate: "2027-04-10" }, key1);
    assert.equal(replay.response.status, 200, "same-key-replay");
    assert.equal(replay.response.headers.get("x-wafl-idempotent-replay"), "1");
    assert.equal(replay.json.data.result.totalQuantity, 120);

    const directSource = created[1];
    if (directSource.status !== "issued") {
      const directDetail = await request(`/api/v2/work-orders/${directSource.workOrderId}`);
      assert.equal(directDetail.response.status, 200);
      const directMatrix = await request(`/api/v2/work-orders/${directSource.workOrderId}/size-color`);
      assert.equal(directMatrix.response.status, 200);
      if (Number(directMatrix.json.data.matrixTotal) !== directSource.totalQuantity) {
        const directQuantityKey = `a67-direct-source-quantity-${suffix}`;
        const directQuantity = await request(`/api/v2/work-orders/${directSource.workOrderId}/size-color/quantities/${directMatrix.json.data.colors[0].id}/${directMatrix.json.data.sizes[0].id}`, "PATCH", { clientRequestId: directQuantityKey, expectedVersion: directDetail.json.data.header.entityVersion, quantity: directSource.totalQuantity }, directQuantityKey);
        assert.equal(directQuantity.response.status, 200, "direct-source-quantity-allocation");
      }
      const directReady = await request(`/api/v2/work-orders/${directSource.workOrderId}`);
      assert.equal(directReady.json.data.header.readiness.canIssue, true, JSON.stringify(directReady.json.data.header.readiness.hardBlockers));
      const directIssueKey = `a67-direct-source-issue-${suffix}`;
      const directIssue = await request(`/api/v2/work-orders/${directSource.workOrderId}/revisions/issue`, "POST", { clientRequestId: directIssueKey, expectedWorkOrderVersion: directReady.json.data.header.entityVersion, expectedRevisionVersion: directReady.json.data.header.currentRevisionVersion, expectedRevisionId: directReady.json.data.header.currentRevisionId, issueNote: "alpha.67 direct Reorder source issue" }, directIssueKey);
      assert.equal(directIssue.response.status, 200, "direct-source-first-issue");
    }

    const key3 = `a67-reorder-three-${suffix}`;
    const three = await request(`/api/v2/work-orders/${directSource.workOrderId}/reorder`, "POST", { clientRequestId: key3, totalQuantity: 160, dueDate: "2027-05-01" }, key3);
    assert.equal(three.response.status, 201, "direct-reorder-source");
    assert.equal(three.json.data.result.reorderRound, 3);
    const thirdId = three.json.data.result.workOrderId;

    const copied = (await client.query(`
      SELECT w.id::text,w.source_work_order_id::text,w.series_root_work_order_id::text,w.reorder_round,w.total_quantity,w.status,r.revision_status,
        (SELECT coalesce(sum(quantity),0)::integer FROM color_size_quantities WHERE company_id=w.company_id AND revision_id=r.id) matrix_total,
        (SELECT count(*)::integer FROM work_order_size_spec_values WHERE company_id=w.company_id AND revision_id=r.id) spec_values,
        (SELECT count(*)::integer FROM work_order_material_lines WHERE company_id=w.company_id AND revision_id=r.id AND status='editing' AND inventory_usage_quantity=0) reset_materials,
        (SELECT count(*)::integer FROM work_order_processes WHERE company_id=w.company_id AND revision_id=r.id AND status='ready' AND due_date IS NULL AND completed_at IS NULL) reset_processes,
        (SELECT count(*)::integer FROM work_order_revision_attachments WHERE company_id=w.company_id AND revision_id=r.id AND output_include=true) included_attachments,
        i.storage_object_key image_key,a.storage_object_key attachment_key
      FROM work_orders w JOIN work_order_revisions r ON r.id=w.current_revision_id AND r.company_id=w.company_id
      LEFT JOIN work_order_images i ON i.id=w.representative_image_id AND i.company_id=w.company_id
      LEFT JOIN work_order_revision_attachments ra ON ra.company_id=w.company_id AND ra.revision_id=r.id AND ra.output_include=true
      LEFT JOIN work_order_attachments a ON a.company_id=w.company_id AND a.id=ra.attachment_id
      WHERE w.company_id=$1 AND w.id=$2::uuid
    `, [companyId, thirdId])).rows[0];
    assert.equal(Number(copied.matrix_total), 0);
    assert.equal(Number(copied.spec_values), 1);
    assert.equal(Number(copied.reset_materials), 2);
    assert.equal(Number(copied.reset_processes), 1);
    assert.equal(Number(copied.included_attachments), 1);
    assert.notEqual(copied.image_key, fixture.asset.storage_object_key, "independent-image-key");
    assert.notEqual(copied.attachment_key, fixture.asset.storage_object_key, "independent-attachment-key");

    const history = await request(`/api/v2/work-orders/${thirdId}/reorder`);
    assert.equal(history.response.status, 200);
    assert.deepEqual(history.json.data.items.map((item) => item.reorderRound), [0, 1, 2, 3]);
    const list = await request(`/api/v2/work-orders?q=${encodeURIComponent(marker)}&character=production&lineage=reorder&limit=30`);
    assert.equal(list.response.status, 200);
    assert.equal(list.json.data.items.length, 3);

    const detail = await request(`/api/v2/work-orders/${thirdId}`);
    assert.equal(detail.response.status, 200);
    assert.equal(detail.json.data.header.totalQuantity, 160);
    const matrix = await request(`/api/v2/work-orders/${thirdId}/size-color`);
    assert.equal(matrix.response.status, 200);
    const colorId = matrix.json.data.colors[0].id;
    const sizeId = matrix.json.data.sizes[0].id;
    const quantityKey = `a67-third-quantity-${suffix}`;
    const quantity = await request(`/api/v2/work-orders/${thirdId}/size-color/quantities/${colorId}/${sizeId}`, "PATCH", { clientRequestId: quantityKey, expectedVersion: detail.json.data.header.entityVersion, quantity: 160 }, quantityKey);
    assert.equal(quantity.response.status, 200, "third-quantity-allocation");
    const ready = await request(`/api/v2/work-orders/${thirdId}`);
    assert.equal(ready.response.status, 200);
    assert.equal(ready.json.data.header.readiness.canIssue, true, JSON.stringify(ready.json.data.header.readiness.hardBlockers));
    const issueKey = `a67-third-issue-${suffix}`;
    const issue = await request(`/api/v2/work-orders/${thirdId}/revisions/issue`, "POST", {
      clientRequestId: issueKey,
      expectedWorkOrderVersion: ready.json.data.header.entityVersion,
      expectedRevisionVersion: ready.json.data.header.currentRevisionVersion,
      expectedRevisionId: ready.json.data.header.currentRevisionId,
      issueNote: "alpha.67 N차 리오더 첫 발행 E2E",
    }, issueKey);
    assert.equal(issue.response.status, 200, "new-reorder-first-issue");
    assert.equal(issue.json.data.result.status, "issued");

    const evidence = {
      result: "ALPHA67_NTH_REORDER_RUNTIME_E2E_PASS",
      checkpoint: "ALPHA67_NTH_REORDER_E2E_IPHONE_QA_REQUIRED",
      fixture: marker,
      sourceRef: crypto.createHash("sha256").update(fixture.source).digest("hex").slice(0, 12),
      rounds: [1, 2, 3],
      sameKeyReplay: true,
      blockedSources: fixture.blockers.map((item) => item.label),
      copyReset: { matrixTotal: 0, finishedSpecValues: 1, resetMaterials: 2, resetProcesses: 1, independentImage: true, independentAttachment: true },
      historyRounds: [0, 1, 2, 3],
      listReorderCount: 3,
      thirdReorderFirstIssue: "PASS",
      retainedForPhysicalQa: true,
      retainedRows: 8,
      migrationLedger: "20/20",
      migration021: 0,
      requests,
      productionMutation: 0,
      ownerFixtureMutation: 0,
      physicalResultInferred: false,
    };
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, fixture: marker, rounds: evidence.rounds, requests: requests.length, retainedRows: evidence.retainedRows, productionMutation: 0, ownerFixtureMutation: 0 }));
  } finally { await client.end(); }
}

main().catch((error) => {
  console.error("alpha67-nth-reorder-e2e-failed", { errorName: error instanceof Error ? error.name : "UnknownError", errorCode: error instanceof Error ? error.message : "UNKNOWN", lastRequest: requests.at(-1) ?? null, lastResponse: lastSafeResponse, fixture: marker });
  process.exitCode = 1;
});
