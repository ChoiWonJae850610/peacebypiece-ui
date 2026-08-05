#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import {
  buildNamedSemanticMarker,
  createCompiledSemanticViews,
  inspectCompiledSemantic,
  inspectSamePositionInlineCoreFieldSources,
  serializeRuntimeResult,
} from "./lib/alpha58-runtime-evidence.mjs";
import {
  BASIC_INFO_PATCH_RECEIPT_CONTRACT,
  createEmptyCurrentRunAccountingEvidence,
  createExactColorOrdinalQueue,
  normalizeCanonicalIntegerEvidence,
  summarizeValidatedStepLedger,
  validateAccountingStep,
  validateColorCleanupOwnership,
  validateImmutableFixtureOwnership,
} from "./lib/alpha59-runtime-accounting.mjs";
import {
  buildReadOnlyMarkerEvidence,
} from "./lib/alpha59-readonly-marker-evidence.mjs";
import {
  clearOwnedMaterialInlineEditSession,
  createMaterialInlineEditSession,
  ownsMaterialInlineEditSession,
} from "../apps/mobile/features/materials/materialInlineEditSession.ts";
import {
  acceptNestedStructureServerRow,
  applyNestedColorPalette,
  cancelNestedColorPalette,
  createNestedStructureEditorState,
  openNestedColorPalette,
  reconcileNestedStructureSelection,
  selectNestedStructureRow,
} from "../apps/mobile/features/work-orders/size-color/nestedStructureEditorState.ts";

const { Client } = pg;
const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const RESULT_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha59-inline-session-nested-editor-runtime-result.json");
const FIXTURE_EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha59-isolated-fixture-evidence.json");
const ACCOUNTING_EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha59-runtime-accounting-ledger.json");
const CLEANUP_OWNERSHIP_EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha59-color-cleanup-ownership.json");
const READ_ONLY_MARKER_EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha59-readonly-marker-evidence.json");
// Previous verified handoff: ALPHA59_CARET_MATRIX_TOTAL_IPHONE_REQA_REQUIRED; failure: ALPHA59_CARET_MATRIX_TOTAL_BLOCKED.
const SUCCESS_CHECKPOINT = "ALPHA59_INLINE_SESSION_NESTED_EDITOR_IPHONE_REQA_REQUIRED";
const FAILURE_CHECKPOINT = "ALPHA59_INLINE_SESSION_NESTED_EDITOR_BLOCKED";
const PRIMARY_DRAFT_PRODUCT = "QA 기본정보 저장 검증 A";
const ISOLATED_DRAFT_PREFIX = "QA A59 picker drag isolated";
const READ_ONLY_REGRESSION_PRODUCT = "리넨 라운드 셔츠 원피스";
const APPROVED_DEV_TEST_COMPANY = "wafl-fn-company-a";
const COMMAND_CODES = [
  "work_order.patch_basic_info",
  "work_order.size_structure.create",
  "work_order.size_structure.rename",
  "work_order.size_structure.reorder",
  "work_order.color_structure.create",
  "work_order.color_structure.patch",
  "work_order.color_structure.reorder",
  "work_order.color_size_quantity.upsert",
  "work_order.material.create",
  "work_order.material.patch",
];

function readDatabaseUrl() {
  const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const line = text.split(/\r?\n/).find((candidate) => /^\s*DATABASE_URL\s*=/.test(candidate));
  assert.ok(line, "DATABASE_URL_MISSING");
  let value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return value;
}

function readLocalEnvironment() {
  const values = {};
  const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  assert.ok(new Set(["postgres:", "postgresql:"]).has(parsed.protocol) && parsed.hostname && databaseName, "DATABASE_URL_INVALID");
  return crypto.createHash("sha256").update(`${parsed.hostname}/${databaseName}`).digest("hex").slice(0, 12);
}

function identityRef(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function persistAccountingEvidence(steps, summary = null) {
  fs.mkdirSync(path.dirname(ACCOUNTING_EVIDENCE_PATH), { recursive: true });
  const evidence = steps.length === 0 && summary === null
    ? createEmptyCurrentRunAccountingEvidence()
    : { steps, summary };
  fs.writeFileSync(ACCOUNTING_EVIDENCE_PATH, serializeRuntimeResult(evidence), "utf8");
}

function persistCleanupOwnershipEvidence(evidence, mode) {
  const serialized = {
    mode,
    fixture: {
      marker: evidence.fixture.marker,
      companyRef: identityRef(evidence.fixture.companyId),
      workOrderRef: identityRef(evidence.fixture.workOrderId),
      revisionRef: identityRef(evidence.fixture.revisionId),
    },
    prefix: {
      idRefs: evidence.prefix.ids.map(identityRef),
      markers: evidence.prefix.rows.map((row) => row.marker),
      expectedCount: evidence.prefix.expectedCount,
      pass: evidence.prefix.pass,
    },
    exactSequence: {
      idRefs: evidence.exactSequence.ids.map(identityRef),
      rows: evidence.exactSequence.rows.map((row) => ({
        idRef: identityRef(row.id),
        ordinal: row.ordinal,
        stepKey: row.stepKey,
        displayName: row.displayName,
      })),
      expectedCount: evidence.exactSequence.expectedCount,
      pass: evidence.exactSequence.pass,
    },
    union: {
      idRefs: evidence.union.ids.map(identityRef),
      uniqueIdCount: evidence.union.uniqueIdCount,
      duplicateCount: evidence.union.duplicateCount,
      foreignIdCount: evidence.union.foreignIdCount,
      pass: evidence.union.pass,
    },
  };
  fs.mkdirSync(path.dirname(CLEANUP_OWNERSHIP_EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(CLEANUP_OWNERSHIP_EVIDENCE_PATH, serializeRuntimeResult(serialized), "utf8");
  return serialized;
}

function createIsolatedFixtureMarker() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
  return `${ISOLATED_DRAFT_PREFIX} ${date}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function runTemporaryDraftProvisioner(marker) {
  const localEnvironment = readLocalEnvironment();
  const connectionString = localEnvironment.DATABASE_URL;
  const sessionSecret = localEnvironment.WAFL_SESSION_SECRET || localEnvironment.GOOGLE_OAUTH_CLIENT_SECRET;
  assert.ok(connectionString, "FIXTURE_DATABASE_URL_MISSING");
  assert.ok(sessionSecret, "FIXTURE_SESSION_SECRET_MISSING");
  const suffix = marker.slice(-8).toLowerCase();
  const child = spawn(process.execPath, [path.join(ROOT, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      WAFL_SESSION_SECRET: sessionSecret,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA59 ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: databaseFingerprint(connectionString),
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a59-isolated-create-${suffix}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a59-isolated-create-${suffix}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  assert.equal(exitCode, 0, `ISOLATED_FIXTURE_PROVISION_FAILED:${stderr.split(/\r?\n/).filter(Boolean).at(-1) ?? "unknown"}`);
  assert.match(stdout, /Result: PASS/);
}

function assertRunnerState() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "size-color-structure");
  assert.equal(state.mutationMode, "alpha59-qa-remediation");
  assert.equal(state.commandApi, "ready");
  assert.equal(state.nextPort, 3100);
  assert.equal(state.expoPort, 8081);
  assert.equal(state.previewTransport, "tailscale-serve-internal");
  assert.equal(state.quickTunnelReady, false);
  assert.equal(state.tailscaleServeReady, true);
  assert.equal(state.developerAutoConnectReady, true);
  assert.deepEqual(state.processes.map((record) => record.role).sort(), ["expo", "next", "tailscale-serve"]);
  for (const record of state.processes) {
    const marker = JSON.parse(fs.readFileSync(record.markerPath, "utf8"));
    assert.equal(marker.ownerMarker, state.ownerMarker);
    assert.equal(marker.pid, record.pid);
    assert.equal(marker.role, record.role);
    process.kill(Number(record.pid), 0);
  }
  return state;
}

async function snapshot(client, workOrderId) {
  await client.query("BEGIN READ ONLY");
  try {
    const identity = (await client.query(`
      SELECT w.company_id, w.current_revision_id, w.entity_version AS work_order_version,
             r.entity_version AS revision_version, r.revision_status, w.status
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.id = $1::uuid
    `, [workOrderId])).rows[0];
    assert.ok(identity, "TARGET_WORK_ORDER_NOT_FOUND");
    const sizes = (await client.query(`
      SELECT id, size_code, display_label, display_order
      FROM work_order_sizes
      WHERE company_id = $1 AND revision_id = $2::uuid
      ORDER BY display_order, id
    `, [identity.company_id, identity.current_revision_id])).rows;
    const colors = (await client.query(`
      SELECT id, color_code, display_name, hex_value, display_order
      FROM work_order_colors
      WHERE company_id = $1 AND revision_id = $2::uuid
      ORDER BY display_order, id
    `, [identity.company_id, identity.current_revision_id])).rows;
    const materials = (await client.query(`
      SELECT id, material_type, name, required_quantity, allowance_quantity,
             inventory_usage_quantity, order_quantity, unit_price, amount,
             status, entity_version, archived_at
      FROM work_order_material_lines
      WHERE company_id = $1 AND revision_id = $2::uuid
      ORDER BY material_type, display_order, id
    `, [identity.company_id, identity.current_revision_id])).rows;
    const amounts = (await client.query(`
      SELECT fabric_total, accessory_total, process_total, estimated_total
      FROM work_order_revisions
      WHERE company_id = $1 AND id = $2::uuid
    `, [identity.company_id, identity.current_revision_id])).rows[0];
    const inventoryAudit = (await client.query(`
      SELECT count(*)::integer AS nonzero_rows
      FROM work_order_material_lines
      WHERE inventory_usage_quantity <> 0
    `)).rows[0];
    const linkCounts = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM color_size_quantities WHERE company_id = $1 AND revision_id = $2::uuid) AS quantity_links,
        (SELECT count(*)::integer FROM work_order_size_spec_values WHERE company_id = $1 AND revision_id = $2::uuid) AS spec_values,
        (SELECT count(*)::integer FROM work_order_size_spec_sizes WHERE company_id = $1 AND revision_id = $2::uuid) AS spec_sizes
    `, [identity.company_id, identity.current_revision_id])).rows[0];
    const ledger = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM domain_events WHERE company_id = $1 AND entity_id = $2 AND command_code = ANY($3::text[])) AS events,
        (SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id = $1 AND work_order_id = $2::uuid AND command_code = ANY($3::text[])) AS receipts,
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migrations
    `, [identity.company_id, workOrderId, COMMAND_CODES])).rows[0];
    const foreign = (await client.query(`
      SELECT id FROM work_orders
      WHERE company_id <> $1 AND deleted_at IS NULL
      ORDER BY id LIMIT 1
    `, [identity.company_id])).rows[0] ?? null;
    await client.query("COMMIT");
    return {
      companyId: identity.company_id,
      revisionId: identity.current_revision_id,
      workOrderVersion: Number(identity.work_order_version),
      revisionVersion: Number(identity.revision_version),
      workOrderStatus: identity.status,
      revisionStatus: identity.revision_status,
      sizes,
      colors,
      materials,
      amounts: {
        fabric: String(amounts.fabric_total),
        accessory: String(amounts.accessory_total),
        process: String(amounts.process_total),
        estimated: String(amounts.estimated_total),
      },
      nonzeroInventoryUseRows: Number(inventoryAudit.nonzero_rows),
      linkCounts: {
        quantity: Number(linkCounts.quantity_links),
        specValues: Number(linkCounts.spec_values),
        specSizes: Number(linkCounts.spec_sizes),
      },
      events: Number(ledger.events),
      receipts: Number(ledger.receipts),
      migrations: Number(ledger.migrations),
      foreignWorkOrderId: foreign?.id ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupSyntheticSizes(client, input) {
  await client.query("BEGIN");
  try {
    const rows = (await client.query(`
      SELECT
        (
          SELECT count(*)::integer FROM work_order_sizes
          WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
            AND display_label LIKE 'A59-QA-SIZE-%'
        ) AS size_rows,
        (
          SELECT count(*)::integer FROM color_size_quantities
          WHERE company_id=$1 AND revision_id=$2::uuid
            AND size_id=ANY($3::uuid[])
        ) AS quantity_links,
        (
          SELECT count(*)::integer
          FROM work_order_size_spec_values value
          JOIN work_order_size_spec_sizes spec_size
            ON spec_size.company_id=value.company_id AND spec_size.revision_id=value.revision_id
              AND spec_size.id=value.size_row_id
          WHERE value.company_id=$1 AND value.revision_id=$2::uuid
            AND spec_size.size_code=ANY(
              SELECT size_code FROM work_order_sizes
              WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
            )
        ) AS spec_values,
        (
          SELECT count(*)::integer
          FROM work_order_size_spec_sizes
          WHERE company_id=$1 AND revision_id=$2::uuid
            AND size_code=ANY(
              SELECT size_code FROM work_order_sizes
              WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
            )
        ) AS spec_sizes
    `, [input.companyId, input.revisionId, input.sizeIds])).rows[0];
    assert.equal(Number(rows.size_rows), input.sizeIds.length);
    assert.equal(Number(rows.quantity_links), 0);
    assert.equal(Number(rows.spec_values), 0);
    assert.equal(Number(rows.spec_sizes), 0);
    const deletedSize = await client.query(`
      DELETE FROM work_order_sizes
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
        AND display_label LIKE 'A59-QA-SIZE-%'
      RETURNING id
    `, [input.companyId, input.revisionId, input.sizeIds]);
    assert.equal(deletedSize.rowCount, input.sizeIds.length);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupValidatedColorOwnership(client, input) {
  const prefixSyntheticColorIds = [...input.prefixSyntheticColorIds];
  const exactSequenceColors = input.exactSequenceColors.map((row) => ({ ...row }));
  const unionIds = [...prefixSyntheticColorIds, ...exactSequenceColors.map((row) => row.id)];
  if (!unionIds.length) return null;
  await client.query("BEGIN");
  try {
    const fixture = (await client.query(`
      SELECT w.id AS work_order_id, w.company_id, w.current_revision_id AS revision_id,
             w.product_name, w.status, r.revision_status
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id AND r.work_order_id=w.id
      WHERE w.id=$1::uuid AND w.company_id=$2 AND r.id=$3::uuid
      FOR UPDATE OF w, r
    `, [input.workOrderId, input.companyId, input.revisionId])).rows[0];
    assert.ok(fixture, "COLOR_CLEANUP_FIXTURE_NOT_FOUND");
    assert.match(input.fixtureMarker, /^QA A59 picker drag isolated [0-9]{8}-[A-F0-9]{8}$/);
    assert.equal(fixture.status, "draft");
    assert.equal(fixture.revision_status, "draft");
    const colorRows = (await client.query(`
      SELECT color.id, color.company_id, color.revision_id, revision.work_order_id, color.display_name
      FROM work_order_colors color
      JOIN work_order_revisions revision
        ON revision.company_id=color.company_id AND revision.id=color.revision_id
      WHERE color.id=ANY($1::uuid[])
      ORDER BY color.id
      FOR UPDATE OF color
    `, [unionIds])).rows;
    const ownership = validateColorCleanupOwnership({
      companyId: input.companyId,
      workOrderId: input.workOrderId,
      revisionId: input.revisionId,
      fixtureMarker: input.fixtureMarker,
      prefixSyntheticColorIds,
      exactSequenceColors,
      expectedPrefixCount: input.expectedPrefixCount,
      expectedExactCount: input.expectedExactCount,
      colorRows,
    });
    const serializedEvidence = persistCleanupOwnershipEvidence(ownership, input.mode);
    await client.query(`
      DELETE FROM color_size_quantities
      WHERE company_id=$1 AND revision_id=$2::uuid AND color_id=ANY($3::uuid[])
    `, [input.companyId, input.revisionId, ownership.union.ids]);
    const remainingLinks = Number((await client.query(`
      SELECT count(*)::integer AS count FROM color_size_quantities
      WHERE company_id=$1 AND revision_id=$2::uuid AND color_id=ANY($3::uuid[])
    `, [input.companyId, input.revisionId, ownership.union.ids])).rows[0].count);
    assert.equal(remainingLinks, 0, "COLOR_CLEANUP_QUANTITY_LINK_RESIDUAL");
    const deleted = await client.query(`
      DELETE FROM work_order_colors
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
      RETURNING id
    `, [input.companyId, input.revisionId, ownership.union.ids]);
    assert.equal(deleted.rowCount, ownership.union.uniqueIdCount, "COLOR_CLEANUP_DELETE_COUNT_MISMATCH");
    await client.query("COMMIT");
    return serializedEvidence;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupExactSequenceSizes(client, input) {
  if (!input.sizeIds.length) return;
  await client.query("BEGIN");
  try {
    const rows = (await client.query(`
      SELECT id, display_label FROM work_order_sizes
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
      ORDER BY display_order, id
      FOR UPDATE
    `, [input.companyId, input.revisionId, input.sizeIds])).rows;
    assert.deepEqual(rows.map((row) => row.id), input.sizeIds);
    assert.deepEqual(rows.map((row) => row.display_label), ["44", "55", "66"]);
    const links = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid AND size_id=ANY($3::uuid[])) AS quantity_links,
        (
          SELECT count(*)::integer FROM work_order_size_spec_sizes
          WHERE company_id=$1 AND revision_id=$2::uuid AND size_code=ANY(
            SELECT size_code FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
          )
        ) AS spec_sizes
    `, [input.companyId, input.revisionId, input.sizeIds])).rows[0];
    assert.equal(Number(links.quantity_links) + Number(links.spec_sizes), 0);
    const deleted = await client.query(`
      DELETE FROM work_order_sizes
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
        AND display_label=ANY($4::text[])
      RETURNING id
    `, [input.companyId, input.revisionId, input.sizeIds, ["44", "55", "66"]]);
    assert.equal(deleted.rowCount, 3);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupSyntheticQuantity(client, input) {
  await client.query("BEGIN");
  try {
    const deleted = await client.query(`
      DELETE FROM color_size_quantities
      WHERE company_id = $1 AND revision_id = $2::uuid
        AND color_id = $3::uuid AND size_id = $4::uuid
      RETURNING color_id, size_id
    `, [input.companyId, input.revisionId, input.colorId, input.sizeId]);
    assert.equal(deleted.rowCount, 1);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupSyntheticMaterials(client, input) {
  await client.query("BEGIN");
  try {
    const rows = (await client.query(`
      SELECT id, name, status, archived_at
      FROM work_order_material_lines
      WHERE company_id = $1 AND revision_id = $2::uuid AND id = ANY($3::uuid[])
      FOR UPDATE
    `, [input.companyId, input.revisionId, input.materialIds])).rows;
    assert.equal(rows.length, input.materialIds.length);
    assert.ok(rows.every((row) => row.name.startsWith("A59-REMEDIATION-") && row.status === "editing" && row.archived_at === null));
    const deleted = await client.query(`
      DELETE FROM work_order_material_lines
      WHERE company_id = $1 AND revision_id = $2::uuid AND id = ANY($3::uuid[])
        AND name LIKE 'A59-REMEDIATION-%' AND status = 'editing' AND archived_at IS NULL
      RETURNING id
    `, [input.companyId, input.revisionId, input.materialIds]);
    assert.equal(deleted.rowCount, input.materialIds.length);
    await client.query(`
      WITH totals AS (
        SELECT
          COALESCE(sum(amount) FILTER (WHERE material_type = 'fabric' AND archived_at IS NULL), 0)::numeric(14,2) AS fabric_total,
          COALESCE(sum(amount) FILTER (WHERE material_type = 'accessory' AND archived_at IS NULL), 0)::numeric(14,2) AS accessory_total
        FROM work_order_material_lines
        WHERE company_id = $1 AND revision_id = $2::uuid
      )
      UPDATE work_order_revisions revision
      SET fabric_total = totals.fabric_total,
          accessory_total = totals.accessory_total,
          estimated_total = totals.fabric_total + totals.accessory_total + revision.process_total
      FROM totals
      WHERE revision.company_id = $1 AND revision.id = $2::uuid
    `, [input.companyId, input.revisionId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupExactFixtureChildren(client, input) {
  const syntheticSizeIds = [...input.sizeIds];
  const exactSizeIds = [...input.exactSizeIds];
  const allSizeIds = [...syntheticSizeIds, ...exactSizeIds];
  const materialRecords = [...input.materialRecords];
  const materialIds = materialRecords.map((record) => record.id);
  assert.equal(new Set(allSizeIds).size, allSizeIds.length, "FIXTURE_SIZE_CLEANUP_DUPLICATE_ID");
  assert.equal(new Set(materialIds).size, materialIds.length, "FIXTURE_MATERIAL_CLEANUP_DUPLICATE_ID");
  await client.query("BEGIN");
  try {
    if (materialIds.length) {
      const rows = (await client.query(`
        SELECT line.id, line.material_type, line.name, line.status, line.archived_at,
               line.company_id, line.revision_id, revision.work_order_id
        FROM work_order_material_lines line
        JOIN work_order_revisions revision
          ON revision.company_id=line.company_id AND revision.id=line.revision_id
        WHERE line.id=ANY($1::uuid[])
        FOR UPDATE OF line
      `, [materialIds])).rows;
      assert.equal(rows.length, materialIds.length, "FIXTURE_MATERIAL_CLEANUP_ROW_COUNT_MISMATCH");
      const recordsById = new Map(materialRecords.map((record) => [record.id, record]));
      assert.ok(rows.every((row) => (
        row.company_id === input.companyId
          && row.revision_id === input.revisionId
          && row.work_order_id === input.workOrderId
          && row.material_type === recordsById.get(row.id)?.materialType
          && /^A59-REMEDIATION-/.test(row.name)
          && row.status === "editing"
          && row.archived_at === null
      )), "FIXTURE_MATERIAL_CLEANUP_OWNERSHIP_MISMATCH");
      const removed = await client.query(`
        DELETE FROM work_order_material_lines
        WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
        RETURNING id
      `, [input.companyId, input.revisionId, materialIds]);
      assert.equal(removed.rowCount, materialIds.length, "FIXTURE_MATERIAL_CLEANUP_DELETE_COUNT_MISMATCH");
      await client.query(`
        WITH totals AS (
          SELECT
            COALESCE(sum(amount) FILTER (WHERE material_type='fabric' AND archived_at IS NULL), 0)::numeric(14,2) AS fabric_total,
            COALESCE(sum(amount) FILTER (WHERE material_type='accessory' AND archived_at IS NULL), 0)::numeric(14,2) AS accessory_total
          FROM work_order_material_lines
          WHERE company_id=$1 AND revision_id=$2::uuid
        )
        UPDATE work_order_revisions revision
        SET fabric_total=totals.fabric_total,
            accessory_total=totals.accessory_total,
            estimated_total=totals.fabric_total + totals.accessory_total + revision.process_total
        FROM totals
        WHERE revision.company_id=$1 AND revision.id=$2::uuid
      `, [input.companyId, input.revisionId]);
    }
    if (allSizeIds.length) {
      const rows = (await client.query(`
        SELECT size.id, size.display_label, size.company_id, size.revision_id, revision.work_order_id
        FROM work_order_sizes size
        JOIN work_order_revisions revision
          ON revision.company_id=size.company_id AND revision.id=size.revision_id
        WHERE size.id=ANY($1::uuid[])
        FOR UPDATE OF size
      `, [allSizeIds])).rows;
      assert.equal(rows.length, allSizeIds.length, "FIXTURE_SIZE_CLEANUP_ROW_COUNT_MISMATCH");
      const rowsById = new Map(rows.map((row) => [row.id, row]));
      assert.ok(rows.every((row) => (
        row.company_id === input.companyId
          && row.revision_id === input.revisionId
          && row.work_order_id === input.workOrderId
      )), "FIXTURE_SIZE_CLEANUP_OWNERSHIP_MISMATCH");
      assert.ok(syntheticSizeIds.every((id) => /^A59-QA-SIZE-/.test(rowsById.get(id)?.display_label ?? "")), "FIXTURE_SYNTHETIC_SIZE_MARKER_MISMATCH");
      assert.ok(exactSizeIds.every((id, index) => rowsById.get(id)?.display_label === ["44", "55", "66"][index]), "FIXTURE_EXACT_SIZE_MAPPING_MISMATCH");
      await client.query(`
        DELETE FROM color_size_quantities
        WHERE company_id=$1 AND revision_id=$2::uuid
          AND size_id=ANY($3::uuid[])
      `, [input.companyId, input.revisionId, allSizeIds]);
      const links = (await client.query(`
        SELECT
          (SELECT count(*)::integer FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid AND size_id=ANY($3::uuid[])) AS quantity_links,
          (
            SELECT count(*)::integer
            FROM work_order_size_spec_values value
            JOIN work_order_size_spec_sizes spec_size
              ON spec_size.company_id=value.company_id AND spec_size.revision_id=value.revision_id
                AND spec_size.id=value.size_row_id
            WHERE value.company_id=$1 AND value.revision_id=$2::uuid
              AND spec_size.size_code=ANY(
                SELECT size_code FROM work_order_sizes
                WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
              )
          ) AS spec_values,
          (
            SELECT count(*)::integer
            FROM work_order_size_spec_sizes
            WHERE company_id=$1 AND revision_id=$2::uuid
              AND size_code=ANY(
                SELECT size_code FROM work_order_sizes
                WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
              )
          ) AS spec_sizes
      `, [input.companyId, input.revisionId, allSizeIds])).rows[0];
      assert.equal(Number(links.quantity_links) + Number(links.spec_values) + Number(links.spec_sizes), 0);
      const removed = await client.query(`
        DELETE FROM work_order_sizes
        WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[])
        RETURNING id
      `, [input.companyId, input.revisionId, allSizeIds]);
      assert.equal(removed.rowCount, allSizeIds.length, "FIXTURE_SIZE_CLEANUP_DELETE_COUNT_MISMATCH");
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
  if (input.prefixSyntheticColorIds.length || input.exactSequenceColors.length) {
    return cleanupValidatedColorOwnership(client, {
      ...input,
      expectedPrefixCount: input.prefixSyntheticColorIds.length,
      expectedExactCount: input.exactSequenceColors.length,
      mode: input.mode,
    });
  }
  return null;
}

async function readUserOwnedSnapshots(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT w.id, w.product_name, w.company_id, w.current_revision_id,
             w.entity_version AS work_order_version, w.updated_at AS work_order_updated_at,
             r.entity_version AS revision_version, r.updated_at AS revision_updated_at,
             (SELECT count(*)::integer FROM work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=w.current_revision_id) AS sizes,
             (SELECT count(*)::integer FROM work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=w.current_revision_id) AS colors,
             (SELECT count(*)::integer FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=w.current_revision_id) AS quantities,
             (SELECT count(*)::integer FROM work_order_size_spec_values v WHERE v.company_id=w.company_id AND v.revision_id=w.current_revision_id) AS specs,
             (SELECT count(*)::integer FROM work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=w.current_revision_id) AS materials,
             (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=w.company_id AND e.entity_id=w.id::text) AS events,
             (SELECT count(*)::integer FROM work_order_command_receipts receipt WHERE receipt.company_id=w.company_id AND receipt.work_order_id=w.id) AS receipts
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=ANY($2::text[]) AND w.deleted_at IS NULL
      ORDER BY w.product_name, w.id
    `, [APPROVED_DEV_TEST_COMPANY, [PRIMARY_DRAFT_PRODUCT, READ_ONLY_REGRESSION_PRODUCT]])).rows;
    assert.equal(rows.filter((row) => row.product_name === PRIMARY_DRAFT_PRODUCT).length, 1, "PRIMARY_USER_WORK_ORDER_NOT_UNIQUE");
    assert.equal(rows.filter((row) => row.product_name === READ_ONLY_REGRESSION_PRODUCT).length, 1, "READ_ONLY_USER_WORK_ORDER_NOT_UNIQUE");
    await client.query("COMMIT");
    return rows;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function readTemporaryFixtureIdentity(client, marker) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT w.id, w.company_id, w.current_revision_id, w.status, w.entity_version,
             w.product_name, w.total_quantity, w.due_date::text,
             r.revision_status, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=r.id) AS sizes,
             (SELECT count(*)::integer FROM work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=r.id) AS colors,
             (SELECT count(*)::integer FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS quantities,
             (SELECT count(*)::integer FROM work_order_size_specs spec WHERE spec.company_id=w.company_id AND spec.revision_id=r.id) AS size_specs,
             (SELECT count(*)::integer FROM work_order_size_spec_sizes ss WHERE ss.company_id=w.company_id AND ss.revision_id=r.id) AS spec_sizes,
             (SELECT count(*)::integer FROM work_order_size_spec_poms pom WHERE pom.company_id=w.company_id AND pom.revision_id=r.id) AS spec_poms,
             (SELECT count(*)::integer FROM work_order_size_spec_values value WHERE value.company_id=w.company_id AND value.revision_id=r.id) AS spec_values,
             (SELECT count(*)::integer FROM work_order_material_lines material WHERE material.company_id=w.company_id AND material.revision_id=r.id) AS materials,
             (SELECT count(*)::integer FROM work_order_processes process WHERE process.company_id=w.company_id AND process.revision_id=r.id) AS processes,
             (SELECT count(*)::integer FROM work_order_images image WHERE image.company_id=w.company_id AND image.work_order_id=w.id) AS images,
             (SELECT count(*)::integer FROM work_order_attachments attachment WHERE attachment.company_id=w.company_id AND attachment.work_order_id=w.id) AS attachments,
             (SELECT count(*)::integer FROM generated_documents document WHERE document.company_id=w.company_id AND document.work_order_id=w.id) AS documents
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
      ORDER BY w.created_at, w.id
    `, [APPROVED_DEV_TEST_COMPANY, marker])).rows;
    assert.equal(rows.length, 1, "ISOLATED_FIXTURE_NOT_UNIQUE");
    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertInitialTemporaryFixture(identity, marker) {
  assert.equal(identity.company_id, APPROVED_DEV_TEST_COMPANY);
  assert.equal(identity.product_name, marker);
  assert.equal(identity.status, "draft");
  assert.equal(identity.revision_status, "draft");
  assert.equal(Number(identity.entity_version), 1);
  assert.equal(Number(identity.revision_version), 1);
  assert.equal(Number(identity.total_quantity), 0);
  assert.equal(identity.due_date, null);
  for (const key of ["sizes", "colors", "quantities", "size_specs", "spec_sizes", "spec_poms", "spec_values", "materials", "processes", "images", "attachments", "documents"]) {
    assert.equal(Number(identity[key]), 0, `ISOLATED_FIXTURE_INITIAL_${key.toUpperCase()}_NOT_ZERO`);
  }
}

async function cleanupTemporaryIsolatedDraft(client, input) {
  await client.query("BEGIN");
  try {
    const identity = (await client.query(`
      SELECT w.id, w.company_id, w.current_revision_id, w.product_name, w.status,
             r.id AS revision_id, r.revision_status
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.id=$1::uuid AND w.company_id=$2 AND r.id=$3::uuid
      FOR UPDATE OF w, r
    `, [input.workOrderId, input.companyId, input.revisionId])).rows[0];
    assert.ok(identity, "ISOLATED_FIXTURE_CLEANUP_IDENTITY_MISSING");
    assert.equal(identity.company_id, APPROVED_DEV_TEST_COMPANY);

    const childRows = (await client.query(`
      SELECT 'sizes' AS kind, id::text AS id, NULL::text AS material_type
      FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid
      UNION ALL
      SELECT 'colors', id::text, NULL::text
      FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid
      UNION ALL
      SELECT 'quantities', color_id::text || ':' || size_id::text, NULL::text
      FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid
      UNION ALL
      SELECT 'specs', 'spec:' || id::text, NULL::text
      FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid
      UNION ALL
      SELECT CASE WHEN material_type='accessory' THEN 'accessories' ELSE 'materials' END,
             id::text, material_type
      FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid
    `, [input.companyId, input.revisionId])).rows;
    const observedChildIds = Object.fromEntries(
      ["sizes", "colors", "quantities", "specs", "materials", "accessories"]
        .map((key) => [key, childRows.filter((row) => row.kind === key).map((row) => row.id)]),
    );
    const ownership = validateImmutableFixtureOwnership({
      companyId: input.companyId,
      workOrderId: input.workOrderId,
      revisionId: input.revisionId,
      creationMarker: input.creationMarker,
      originalProductName: input.originalProductName,
      current: identity,
      createdChildIds: input.createdChildIds,
      observedChildIds,
    });
    assert.ok(Object.values(observedChildIds).every((ids) => ids.length === 0), "ISOLATED_FIXTURE_CHILD_CLEANUP_INCOMPLETE");

    const unexpected = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid) AS processes,
        (SELECT count(*)::integer FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$2::uuid) AS revision_images,
        (SELECT count(*)::integer FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=$2::uuid) AS revision_attachments,
        (SELECT count(*)::integer FROM work_order_images WHERE company_id=$1 AND work_order_id=$3::uuid) AS images,
        (SELECT count(*)::integer FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$3::uuid) AS attachments,
        (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$3::uuid) AS documents
    `, [input.companyId, input.revisionId, input.workOrderId])).rows[0];
    assert.ok(Object.values(unexpected).every((value) => Number(value) === 0), "ISOLATED_FIXTURE_UNEXPECTED_CHILD_ROWS");

    const eventCount = Number((await client.query(`
      SELECT count(*)::integer AS count FROM domain_events
      WHERE company_id=$1 AND entity_id=$2
    `, [input.companyId, input.workOrderId])).rows[0].count);
    const receipts = (await client.query(`
      SELECT command_code, idempotency_key FROM work_order_command_receipts
      WHERE company_id=$1 AND work_order_id=$2::uuid
        AND (result_revision_id=$3::uuid OR result_revision_id IS NULL)
      ORDER BY command_code, idempotency_key
      FOR UPDATE
    `, [input.companyId, input.workOrderId, input.revisionId])).rows;
    assert.ok(receipts.length >= 1, "ISOLATED_FIXTURE_RECEIPT_LEDGER_MISSING");
    const detached = await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id=NULL, result_revision_id=NULL
      WHERE company_id=$1 AND work_order_id=$2::uuid
        AND (result_revision_id=$3::uuid OR result_revision_id IS NULL)
      RETURNING command_code, idempotency_key
    `, [input.companyId, input.workOrderId, input.revisionId]);
    assert.equal(detached.rowCount, receipts.length);

    const detachedRefs = detached.rows.map((row) => identityRef(`${row.command_code}\0${row.idempotency_key}`));
    await client.query(`
      UPDATE work_orders SET current_revision_id=NULL
      WHERE id=$1::uuid AND company_id=$2 AND current_revision_id=$3::uuid
        AND status='draft'
    `, [input.workOrderId, input.companyId, input.revisionId]);
    const revisionDelete = await client.query(`
      DELETE FROM work_order_revisions
      WHERE id=$1::uuid AND company_id=$2 AND work_order_id=$3::uuid AND revision_status='draft'
      RETURNING id
    `, [input.revisionId, input.companyId, input.workOrderId]);
    assert.equal(revisionDelete.rowCount, 1);
    const workOrderDelete = await client.query(`
      DELETE FROM work_orders
      WHERE id=$1::uuid AND company_id=$2 AND status='draft' AND current_revision_id IS NULL
      RETURNING id
    `, [input.workOrderId, input.companyId]);
    assert.equal(workOrderDelete.rowCount, 1);

    const residual = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_orders WHERE id=$1::uuid) AS work_orders,
        (SELECT count(*)::integer FROM work_order_revisions WHERE id=$2::uuid) AS revisions,
        (SELECT count(*)::integer FROM work_order_sizes WHERE revision_id=$2::uuid) AS sizes,
        (SELECT count(*)::integer FROM work_order_colors WHERE revision_id=$2::uuid) AS colors,
        (SELECT count(*)::integer FROM color_size_quantities WHERE revision_id=$2::uuid) AS quantities,
        (SELECT count(*)::integer FROM work_order_size_spec_values WHERE revision_id=$2::uuid) AS specs,
        (SELECT count(*)::integer FROM work_order_material_lines WHERE revision_id=$2::uuid) AS materials,
        (SELECT count(*)::integer FROM work_order_command_receipts WHERE work_order_id=$1::uuid OR result_revision_id=$2::uuid) AS receipt_refs,
        (SELECT count(*)::integer FROM domain_events WHERE company_id=$3 AND entity_id=$1::text) AS events
    `, [input.workOrderId, input.revisionId, input.companyId])).rows[0];
    for (const key of ["work_orders", "revisions", "sizes", "colors", "quantities", "specs", "materials", "receipt_refs"]) {
      assert.equal(Number(residual[key]), 0, `ISOLATED_FIXTURE_RESIDUAL_${key.toUpperCase()}`);
    }
    assert.equal(Number(residual.events), eventCount);
    await client.query("COMMIT");
    return {
      temporaryWorkOrder: 0,
      revision: 0,
      size: 0,
      color: 0,
      quantity: 0,
      spec: 0,
      material: 0,
      receiptReferences: 0,
      preservedEvents: eventCount,
      preservedReceipts: receipts.length,
      receiptRefs: detachedRefs,
      immutableOwnership: {
        creationMarker: ownership.fixture.creationMarker,
        originalProductName: ownership.fixture.originalProductName,
        currentProductName: ownership.fixture.currentProductName,
        productNameChanged: ownership.fixture.productNameChanged,
        exactIdPolicy: "PASS",
      },
      userOwnedMutation: 0,
      migration: 0,
      r2: 0,
      productionMutation: 0,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function proveInlineSessionAndNestedEditorStateMachines() {
  const sessionA = createMaterialInlineEditSession({
    workOrderId: "work-order-a", itemId: "material-a", field: "name", token: 1, workOrderGeneration: 7,
  });
  const sessionB = createMaterialInlineEditSession({
    workOrderId: "work-order-a", itemId: "material-a", field: "colorOption", token: 2, workOrderGeneration: 7,
  });
  assert.equal(ownsMaterialInlineEditSession(sessionB, sessionA), false);
  assert.equal(clearOwnedMaterialInlineEditSession(sessionB, sessionA), sessionB);
  assert.equal(clearOwnedMaterialInlineEditSession(sessionB, sessionB), null);

  const rows = [
    { id: "color-a", name: "화이트", hex: "#FFFFFF" },
    { id: "color-b", name: "그레이", hex: "#8A8F98" },
  ];
  let nested = createNestedStructureEditorState(rows[0]);
  nested = selectNestedStructureRow(nested, rows[1]);
  nested = openNestedColorPalette(nested);
  const paletteCanceled = cancelNestedColorPalette(nested, "#8A8F98");
  assert.equal(paletteCanceled.child, "row");
  assert.equal(paletteCanceled.selectedId, "color-b");
  nested = applyNestedColorPalette(openNestedColorPalette(paletteCanceled), "#111111");
  nested = acceptNestedStructureServerRow(nested, { id: "color-b", name: "그레이 수정", hex: "#111111" });
  nested = reconcileNestedStructureSelection(nested, [rows[1], rows[0]]);
  assert.equal(nested.selectedId, "color-b");
  assert.equal(nested.nameDraft, "그레이 수정");
  assert.equal(nested.child, "row");
  return {
    staleBlurCannotClearNewerSession: true,
    directFieldSwitch: true,
    paletteCancelReturnsToParent: true,
    paletteApplyReturnsToParent: true,
    stableSelectedIdAfterSort: true,
  };
}

async function verifyMetro(state, runtimeEvidence) {
  const manifestResponse = await fetch(`http://127.0.0.1:${state.expoPort}/`, {
    headers: { Accept: "application/expo+json", "Expo-Platform": "ios" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(typeof manifest?.launchAsset?.url, "string");
  const bundleResponse = await fetch(manifest.launchAsset.url, { signal: AbortSignal.timeout(180_000) });
  assert.equal(bundleResponse.status, 200);
  const bundleText = await bundleResponse.text();
  const views = createCompiledSemanticViews(bundleText);
  const apiClientSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "lib", "apiClient.ts"), "utf8");
  const displaySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "lib", "mobileDisplay.ts"), "utf8");
  const materialPolicySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "materials", "materialFieldPolicy.ts"), "utf8");
  const materialViewSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "materials", "WorkOrderMaterialsReadOnly.tsx"), "utf8");
  const materialEditorSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "materials", "WorkOrderMaterialEditor.tsx"), "utf8");
  const inputShellSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "inputs", "WaflInputSheet.tsx"), "utf8");
  const controlledInlineSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "components", "ControlledInlineEditValue.tsx"), "utf8");
  const inlineEditableFieldsSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "components", "InlineEditableFields.tsx"), "utf8");
  const reelPickerSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "inputs", "reel-picker", "WaflReelPickerSheet.tsx"), "utf8");
  const reelModelSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "inputs", "reel-picker", "reelPickerModel.ts"), "utf8");
  const sizeColorSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "WorkOrderSizeColorReadOnly.tsx"), "utf8");
  const structureEditorSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "WorkOrderSizeColorStructureEditor.tsx"), "utf8");
  const sortPolicySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "sizeColorAutoSortPolicy.ts"), "utf8");
  const structureControllerSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "useSizeColorStructureEditController.ts"), "utf8");
  const readControllerSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "useSizeColorReadController.ts"), "utf8");
  const workOrderPolicySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "domain", "workOrderPolicy.ts"), "utf8");
  const experienceSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "MobileWorkOrderExperience.tsx"), "utf8");
  const overviewSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "overview", "WorkOrderDetailOverview.tsx"), "utf8");
  const gallerySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "images", "WorkOrderImageGallery.tsx"), "utf8");
  const memoPolicySource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "domain", "factoryDeliveryMemoPolicy.ts"), "utf8");
  const externalQaSource = fs.readFileSync(path.join(ROOT, "lib", "external-qa", "configCore.mjs"), "utf8");
  const workOrderMigrationSource = fs.readFileSync(path.join(ROOT, "db", "v2", "migrations", "002_v2_work_orders_revisions.sql"), "utf8");
  const quantityMigrationSource = fs.readFileSync(path.join(ROOT, "db", "v2", "migrations", "003_v2_revision_content.sql"), "utf8");
  const quantityCommandRepositorySource = fs.readFileSync(path.join(ROOT, "lib", "domain", "work-orders", "command", "sizeColorStructureCommandRepository.ts"), "utf8");
  const detailRepositorySource = fs.readFileSync(path.join(ROOT, "lib", "domain", "work-orders", "read", "detailRepository.ts"), "utf8");
  const listRepositorySource = fs.readFileSync(path.join(ROOT, "lib", "domain", "work-orders", "read", "listRepository.ts"), "utf8");
  const inlineSessionSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "materials", "materialInlineEditSession.ts"), "utf8");
  const nestedEditorStateSource = fs.readFileSync(path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "nestedStructureEditorState.ts"), "utf8");
  const editorStateProof = proveInlineSessionAndNestedEditorStateMachines();

  const present = (expected, options) => inspectCompiledSemantic(views, expected, options);
  const allPresent = (expected) => {
    const checks = expected.map((term) => present(term));
    const failed = checks.find((check) => !check.passed);
    return failed ?? {
      passed: true,
      normalizedEvidence: checks.map((check) => check.normalizedEvidence).join(" | "),
      absenceReason: null,
    };
  };
  const marker = (input) => {
    const compiled = input.compiled;
    const sourcePassed = input.sourcePassed ?? true;
    return buildNamedSemanticMarker({
      key: input.key,
      meaning: input.meaning,
      source: input.source,
      expectedSemantic: input.expectedSemantic,
      normalizedCompiledCheck: input.normalizedCompiledCheck,
      passed: compiled.passed && sourcePassed,
      normalizedEvidence: `${compiled.normalizedEvidence}${input.sourceEvidence ? ` | SOURCE:${input.sourceEvidence}` : ""}`,
      absenceReason: compiled.passed
        ? (sourcePassed ? null : input.sourceAbsenceReason)
        : compiled.absenceReason,
    });
  };

  const costComposition = present(["비용 구성", "1벌 원가", "예상 총원가"], { maxGap: 12_000 });
  const representativeNeedle = createCompiledSemanticViews("대표 아님").syntaxNeutral;
  const representativeAbsent = !views.syntaxNeutral.includes(representativeNeedle);
  const memoCounter = present("자 /");
  const quantityRoute = allPresent(["/size-color/", "quantities/"]);
  const readOnlyMatrix = present("색상×사이즈");
  const canonicalEditPolicy = allPresent(["workorder.update", "draft"]);
  const scopedManualDragAbsent = !/PanResponder|GripVertical|onLongPress|onReorder(?:Size|Color)Ids/.test(`${structureEditorSource}\n${structureControllerSource}`);
  const compiledDragHandle = { passed: scopedManualDragAbsent, normalizedEvidence: "SCOPED_ACTIVE_SOURCE:manual-drag-absent", absenceReason: scopedManualDragAbsent ? null : "active size/color source still contains manual drag" };
  const loadingTerms = allPresent(["refreshing", "사이즈·색상 정보를 불러오는 중입니다."]);
  const readOnlyColorValues = allPresent(["시각 색상 선택", "RGB", "HEX"]);
  const materialLabels = allPresent(["거래처", "색상·옵션", "필요수량", "단가", "로스·여유"]);
  const calculationLabels = allPresent(["필요수량", "로스·여유", "발주수량"]);
  const sizeChooserTerms = allPresent(["사이즈 선택", "직접 입력", "XS", "2XL", "FREE"]);
  const cardTerms = allPresent(["사이즈", "색상", "추가", "편집"]);
  const inputShellTerms = allPresent(["WAFL INPUT", "사이즈", "색상"]);
  const inlineFieldTerms = allPresent(["제품명", "원단명", "부자재명", "색상·옵션", "단가"]);
  const circularReelTerms = allPresent(["대상", "대분류", "사이즈", "색상", "단위"]);
  const quarterQuantityTerms = allPresent(["필요수량", "로스·여유", "정수", "소수"]);
  const totalQuantityTerms = present("총 수량");
  const addCountTerms = present("개 추가");
  const numericReelNeedles = ["숫자 사이즈", "선택 목록에 추가"].map((term) => createCompiledSemanticViews(term).syntaxNeutral);
  const numericReelAbsent = numericReelNeedles.every((needle) => !views.syntaxNeutral.includes(needle));
  const directSizeTerms = allPresent(["직접 입력", "사이즈 이름"]);
  const colorChooserTerms = allPresent(["색상 선택", "직접 색상 만들기", "블랙", "네이비", "퍼플"]);
  const dragTerms = allPresent(["사이즈", "색상", "편집"]);
  const accessibilityTerms = { passed: scopedManualDragAbsent, normalizedEvidence: "SCOPED_ACTIVE_SOURCE:mobile-reorder-absent", absenceReason: scopedManualDragAbsent ? null : "active size/color source still contains reorder actions" };
  const canonicalPaletteEntries = [
    ["블랙", "#111111"], ["화이트", "#FFFFFF"], ["아이보리", "#F5F0E6"],
    ["베이지", "#D8C3A5"], ["브라운", "#7A5135"], ["그레이", "#8A8F98"],
    ["네이비", "#1F2A44"], ["블루", "#3E6FB0"], ["민트", "#A8DCCB"],
    ["그린", "#4D7A54"], ["옐로우", "#E9C84A"], ["오렌지", "#E48A3A"],
    ["레드", "#B94A48"], ["핑크", "#D98FA5"], ["퍼플", "#80669D"],
  ];
  const materialOrder = ["partner", "colorOption", "requiredQuantity", "unitPrice", "allowanceQuantity"];
  const materialOrderPassed = materialOrder.every((field, index) => (
    index === 0 || materialPolicySource.indexOf(`"${materialOrder[index - 1]}"`) < materialPolicySource.indexOf(`"${field}"`)
  ));
  const activeMaterialSource = `${materialViewSource}\n${materialEditorSource}`;
  const readOnlyMarkerEvidence = buildReadOnlyMarkerEvidence({
    sources: {
      policy: workOrderPolicySource,
      experience: experienceSource,
      editor: structureEditorSource,
      readOnly: sizeColorSource,
    },
    compiled: {
      readOnlyMatrix,
      canonicalPolicy: canonicalEditPolicy,
      addControls: cardTerms,
      dragHandle: compiledDragHandle,
      reorderAccessibility: accessibilityTerms,
    },
    runtime: runtimeEvidence.readOnly,
  });
  fs.mkdirSync(path.dirname(READ_ONLY_MARKER_EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(
    READ_ONLY_MARKER_EVIDENCE_PATH,
    serializeRuntimeResult(readOnlyMarkerEvidence),
    "utf8",
  );
  const samePositionInlineEvidence = inspectSamePositionInlineCoreFieldSources({
    overview: overviewSource,
    materialView: materialViewSource,
    materialEditor: materialEditorSource,
    controlledInline: controlledInlineSource,
    reelPicker: reelPickerSource,
    display: displaySource,
    experience: experienceSource,
  });
  const markers = [
    marker({
      key: "costCompositionHierarchy",
      meaning: "개요가 비용 구성, 1벌 원가, 예상 총원가 계층을 표시한다",
      source: "WorkOrderDetailOverview.tsx",
      expectedSemantic: ["비용 구성", "1벌 원가", "예상 총원가"],
      normalizedCompiledCheck: "escaped Unicode decode + quote/whitespace/concatenation-neutral ordered search",
      compiled: costComposition,
      sourcePassed: ["비용 구성", "1벌 원가", "예상 총원가"].every((term) => overviewSource.includes(term)),
      sourceEvidence: "three canonical cost labels present",
      sourceAbsenceReason: "overview cost hierarchy source is incomplete",
    }),
    buildNamedSemanticMarker({
      key: "nonRepresentativeVisibleCopyAbsent",
      meaning: "비대표 이미지에는 visible '대표 아님' 문구가 없다",
      source: "WorkOrderImageGallery.tsx",
      expectedSemantic: "대표 아님 absent",
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral negative search, confirmed by active gallery source",
      passed: representativeAbsent && !gallerySource.includes(">대표 아님<"),
      normalizedEvidence: representativeAbsent ? "ABSENT:대표아님" : "FOUND:대표아님",
      absenceReason: representativeAbsent ? null : "compiled bundle contains the prohibited visible copy",
    }),
    marker({
      key: "factoryMemoCounter",
      meaning: "공장 전달 메모가 {n}자 / 500자 형식으로 표시된다",
      source: "WorkOrderImageGallery.tsx",
      expectedSemantic: "{n}자 / 500자",
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral counter separator search; source owns the dynamic value and 500 limit",
      compiled: memoCounter,
      sourcePassed: /\{memoLength\}자\s*\/\s*\{FACTORY_DELIVERY_MEMO_MAX_LENGTH\}자/.test(gallerySource)
        && /FACTORY_DELIVERY_MEMO_MAX_LENGTH\s*=\s*500/.test(memoPolicySource),
      sourceEvidence: "{memoLength}자 / {MAX}자; MAX=500",
      sourceAbsenceReason: "memo counter behavior source is missing",
    }),
    marker({
      key: "draftQuantityCellEdit",
      meaning: "draft 수량 셀 편집이 exact quantity command route에 연결된다",
      source: "WorkOrderSizeColorReadOnly.tsx + apiClient.ts compiled route composition",
      expectedSemantic: ["/size-color/", "quantities/"],
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral search for separately compiled base and quantity path fragments",
      compiled: quantityRoute,
      sourcePassed: /edit\?\.canEdit[\s\S]*<QuantityCellEditor/.test(sizeColorSource)
        && sizeColorSource.includes("onSetQuantity")
        && apiClientSource.includes("/size-color/${path}")
        && apiClientSource.includes("`quantities/${encodeURIComponent(colorId)}/${encodeURIComponent(sizeRowId)}`"),
      sourceEvidence: "edit.canEdit -> QuantityCellEditor -> onSetQuantity; base /size-color/${path} + quantities/{color}/{size}",
      sourceAbsenceReason: "draft quantity-cell behavior boundary is missing",
    }),
    marker({
      key: "issuedQuantityMatrixReadOnly",
      meaning: "issued/read-only 작업지시서는 기존 수량 matrix를 text로 유지한다",
      source: "WorkOrderSizeColorReadOnly.tsx",
      expectedSemantic: "색상×사이즈",
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral heading search",
      compiled: readOnlyMatrix,
      sourcePassed: /edit\?\.canEdit\s*\?\s*\([\s\S]*QuantityCellEditor[\s\S]*:\s*\([\s\S]*<Text/.test(sizeColorSource),
      sourceEvidence: "canEdit conditional keeps Text read path",
      sourceAbsenceReason: "read-only matrix fallback is missing",
    }),
    marker({
      key: "loadingStateSeparation",
      meaning: "initial loading과 refreshing-with-data가 분리된다",
      source: "useSizeColorReadController.ts + WorkOrderSizeColorReadOnly.tsx",
      expectedSemantic: ["refreshing", "사이즈·색상 정보를 불러오는 중입니다."],
      normalizedCompiledCheck: "escaped Unicode decode + individual syntax-neutral semantic search",
      compiled: loadingTerms,
      sourcePassed: readControllerSource.includes('"refreshing"') && /if \(!state\.bundle/.test(sizeColorSource),
      sourceEvidence: "refreshing status + full loader only without bundle",
      sourceAbsenceReason: "loading state behavior separation is missing",
    }),
    marker({
      key: "readOnlyColorValues",
      meaning: "직접 색상은 시각 grid로 선택하고 RGB/HEX는 읽기 전용으로 표시한다",
      source: "WorkOrderSizeColorStructureEditor.tsx + compiled UI",
      expectedSemantic: ["시각 색상 선택", "RGB", "HEX"],
      normalizedCompiledCheck: "compiled visual-grid and read-only color value labels",
      compiled: readOnlyColorValues,
      sourcePassed: structureEditorSource.includes("CUSTOM_COLOR_GROUPS")
        && structureEditorSource.includes("ReadOnlyColorValues")
        && !/manualHex|setManualHex|placeholder="HEX|placeholder="RGB|placeholder="HSL/.test(structureEditorSource),
      sourceEvidence: "deterministic grid; RGB/HEX Text only; editable HSL/RGB/HEX absent",
      sourceAbsenceReason: "visual grid or read-only RGB/HEX boundary is incomplete",
    }),
    marker({
      key: "materialAccessoryFieldOrder",
      meaning: "원단·부자재 입력 순서가 거래처→색상·옵션→필요수량→단가→로스·여유다",
      source: "materialFieldPolicy.ts",
      expectedSemantic: ["거래처", "색상·옵션", "필요수량", "단가", "로스·여유"],
      normalizedCompiledCheck: "each decoded syntax-neutral label present; canonical source order verified separately",
      compiled: materialLabels,
      sourcePassed: materialOrderPassed,
      sourceEvidence: materialOrder.join(" -> "),
      sourceAbsenceReason: "canonical mobile material field order differs",
    }),
    marker({
      key: "mobileInventoryUseHidden",
      meaning: "Maker 모바일 원단·부자재 UI에 재고사용 필드가 없다",
      source: "materialFieldPolicy.ts + active material read/editor components",
      expectedSemantic: "active material labels compiled; inventory-use policy false and active UI field absent",
      normalizedCompiledCheck: "compiled active material labels + active component source boundary (inactive bundled mocks are excluded)",
      compiled: materialLabels,
      sourcePassed: materialPolicySource.includes("MOBILE_MATERIAL_INVENTORY_USAGE_VISIBLE = false")
        && !/label="재고사용"|field="inventoryUsageQuantity"/.test(activeMaterialSource),
      sourceEvidence: "inventory usage visibility false; active read/editor field absent",
      sourceAbsenceReason: "active Maker material UI still exposes inventory usage",
    }),
    marker({
      key: "requiredPlusAllowanceCalculation",
      meaning: "발주수량은 필요수량 + 로스·여유로 계산된다",
      source: "mobileDisplay.ts",
      expectedSemantic: ["필요수량", "로스·여유", "발주수량"],
      normalizedCompiledCheck: "decoded UI operands/results present; canonical formula source verified separately",
      compiled: calculationLabels,
      sourcePassed: /return scaledQuantityToString\(required \+ allowance\)/.test(displaySource),
      sourceEvidence: "scaledQuantityToString(required + allowance)",
      sourceAbsenceReason: "required + allowance formula is missing",
    }),
    marker({
      key: "sizePresetChooser",
      meaning: "draft 사이즈 추가가 alpha/numbered multi-select preset과 직접 입력을 제공한다",
      source: "WorkOrderSizeColorStructureEditor.tsx + sizeColorAutoSortPolicy.ts",
      expectedSemantic: ["사이즈 선택", "직접 입력", "XS", "2XL", "FREE"],
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral independent chooser term search",
      compiled: sizeChooserTerms,
      sourcePassed: structureEditorSource.includes("SIZE_ALPHA_PRESETS")
        && structureEditorSource.includes("SIZE_NUMERIC_PRESETS")
        && structureEditorSource.includes("onAddSizes")
        && !structureEditorSource.includes("SIZE_NUMERIC_REEL_RANGE"),
      sourceEvidence: "alpha/numbered presets + onAddSizes + direct input; numeric reel absent",
      sourceAbsenceReason: "size chooser behavior boundary is incomplete",
    }),
    marker({
      key: "independentSizeColorCards",
      meaning: "사이즈와 색상은 원단 추가 grammar를 재사용한 compact navy action으로 표시된다",
      source: "WorkOrderSizeColorStructureEditor.tsx",
      expectedSemantic: ["사이즈", "색상", "추가", "편집"],
      normalizedCompiledCheck: "compiled compact action terms plus source structure",
      compiled: cardTerms,
      sourcePassed: structureEditorSource.includes("function StructureCard")
        && structureEditorSource.includes('count={matrix.sizes.length} editable={edit.canEdit} kind="size"')
        && structureEditorSource.includes('count={matrix.colors.length} editable={edit.canEdit} kind="color"')
        && structureEditorSource.includes("structureAction")
        && structureEditorSource.includes("addAction")
        && structureEditorSource.includes("editAction")
        && structureEditorSource.includes("ExistingStructureEditor")
        && structureEditorSource.includes("WaflInputSheet")
        && structureEditorSource.includes('backgroundColor: "#17263d"')
        && structureEditorSource.includes("minHeight: 44")
        && !structureEditorSource.includes("structureCard:")
        && !structureEditorSource.includes('textDecorationLine: "underline"')
        && !structureEditorSource.includes("fontSize: 22"),
      sourceEvidence: "two compact 44px navy action bars; plus/add and count/edit semantics; hero card and underline absent",
      sourceAbsenceReason: "compact size/color action grammar is missing",
    }),
    marker({
      key: "selectionAddCountGrammar",
      meaning: "선택 완료 action은 비선택 추가 또는 N개 추가 문법을 사용한다",
      source: "WorkOrderSizeColorStructureEditor.tsx",
      expectedSemantic: "개 추가",
      normalizedCompiledCheck: "compiled add-count copy plus behavior source",
      compiled: addCountTerms,
      sourcePassed: structureEditorSource.includes('count > 0 ? `${count}개 추가` : "추가"')
        && !structureEditorSource.includes("선택 목록 수"),
      sourceEvidence: "AddLabel owns disabled 추가 / N개 추가; confusing copy absent",
      sourceAbsenceReason: "add-count grammar or confusing-copy removal is incomplete",
    }),
    buildNamedSemanticMarker({
      key: "sizeNumericReelAbsent",
      meaning: "사용자용 숫자 사이즈 reel과 관련 문구가 없다",
      source: "WorkOrderSizeColorStructureEditor.tsx + compiled UI",
      expectedSemantic: "숫자 사이즈/선택 목록에 추가 absent",
      normalizedCompiledCheck: "compiled and active-source negative search",
      passed: numericReelAbsent && !/숫자 사이즈|선택 목록에 추가|SIZE_NUMERIC_REEL_RANGE/.test(structureEditorSource),
      normalizedEvidence: numericReelAbsent ? "ABSENT:numeric-size-reel-copy" : "FOUND:numeric-size-reel-copy",
      absenceReason: numericReelAbsent ? null : "compiled bundle contains removed numeric reel copy",
    }),
    marker({
      key: "sizeDirectInput",
      meaning: "recommended sizes 외 label을 current validation과 sequential create 경로로 직접 입력할 수 있다",
      source: "WorkOrderSizeColorStructureEditor.tsx + useSizeColorStructureEditController.ts",
      expectedSemantic: ["직접 입력", "사이즈 이름"],
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral direct-input label/placeholder search",
      compiled: directSizeTerms,
      sourcePassed: structureEditorSource.includes('placeholder="사이즈 이름"')
        && structureEditorSource.includes("direct.trim()")
        && structureEditorSource.includes("immutableSelection")
        && structureControllerSource.includes("createImmutableAddSnapshot")
        && structureControllerSource.includes("onRefreshLatest"),
      sourceEvidence: "direct TextInput -> immutable selection -> normalized sequential expectedVersion create",
      sourceAbsenceReason: "direct size input or canonical validation path is missing",
    }),
    marker({
      key: "colorPaletteAndCustomBuilder",
      meaning: "draft 색상 추가가 15색 palette와 deterministic visual-grid custom builder를 제공한다",
      source: "WorkOrderSizeColorStructureEditor.tsx + sizeColorAutoSortPolicy.ts",
      expectedSemantic: ["색상 선택", "직접 색상 만들기", "블랙", "네이비", "퍼플"],
      normalizedCompiledCheck: "escaped Unicode decode + syntax-neutral independent palette/custom-builder term search",
      compiled: colorChooserTerms,
      sourcePassed: structureEditorSource.includes("COLOR_PALETTE_PRESETS")
        && structureEditorSource.includes("CUSTOM_COLOR_GROUPS")
        && structureEditorSource.includes("ReadOnlyColorValues")
        && structureEditorSource.includes("onAddColors")
        && canonicalPaletteEntries.every(([name, hex]) => (
          sortPolicySource.includes(`{ name: "${name}", hex: "${hex}" }`)
        )),
      sourceEvidence: "15 palettes + deterministic visual grid + read-only RGB/HEX + onAddColors",
      sourceAbsenceReason: "color palette/custom builder behavior boundary is incomplete",
    }),
    marker({
      key: "automaticSizeColorOrdering",
      meaning: "size/color create와 rename이 shared deterministic policy로 자동 정렬된다",
      source: "sizeColorAutoSortPolicy.ts + sizeColorStructureCommandRepository.ts + controller",
      expectedSemantic: ["사이즈", "색상", "편집"],
      normalizedCompiledCheck: "compiled editor boundary plus shared source authority",
      compiled: dragTerms,
      sourcePassed: sortPolicySource.includes('Intl.Collator("ko-KR"')
        && sortPolicySource.includes("sortSizeRows")
        && sortPolicySource.includes("sortColorRows")
        && structureControllerSource.includes("withSizeOrder")
        && structureControllerSource.includes("withColorOrder"),
      sourceEvidence: "shared ko-KR natural sort; mobile optimistic mirror; server transaction authority",
      sourceAbsenceReason: "shared automatic size/color ordering is incomplete",
    }),
    marker({
      key: "existingSizeColorReelEditor",
      meaning: "count link가 stable row ID 기반 WAFL reel editor와 fixed input을 연다",
      source: "WorkOrderSizeColorStructureEditor.tsx + WaflReelPickerSheet.tsx",
      expectedSemantic: ["사이즈", "색상", "편집"],
      normalizedCompiledCheck: "compiled editable labels plus shared reel source boundary",
      compiled: dragTerms,
      sourcePassed: structureEditorSource.includes("WaflOptionReel")
        && structureEditorSource.includes("selectedId")
        && structureEditorSource.includes("fixedEditor")
        && structureEditorSource.includes("confirmDisabled={!selectedRow || unchanged}")
        && !structureEditorSource.includes("doneButton")
        && !structureEditorSource.includes("onSubmitEditing={() => void save()}"),
      sourceEvidence: "stable selected row ID; centered WAFL option reel; fixed input; X/Check-only shell; unchanged and blur request 0",
      sourceAbsenceReason: "WAFL reel existing-item editor is incomplete",
    }),
    marker({
      key: "sharedWaflInputShell",
      meaning: "사이즈·색상 릴은 keyboard-safe WAFL INPUT shell을 공유하고 사용법 도움말은 노출하지 않는다",
      source: "WaflInputSheet.tsx + WaflReelPickerSheet.tsx + size/color consumer",
      expectedSemantic: ["WAFL INPUT", "사이즈", "색상"],
      normalizedCompiledCheck: "compiled shared eyebrow/title terms plus active-source shell and help-copy absence",
      compiled: inputShellTerms,
      sourcePassed: inputShellSource.includes("createWaflInputCommitGuard")
        && inputShellSource.includes("KeyboardAvoidingView")
        && inputShellSource.includes("Math.max(insets.bottom")
        && !/X는 변경을 취소|Check는 입력을 저장|사용법|공통 입력 모듈/.test(inputShellSource)
        && reelPickerSource.includes("<WaflInputSheet")
        && structureEditorSource.includes("<WaflInputSheet")
        && structureEditorSource.includes('title={props.kind === "size" ? "사이즈" : "색상"}'),
      sourceEvidence: "single shell owns safe area, keyboard avoidance, cancel, guarded Check; help copy absent; simple titles",
      sourceAbsenceReason: "shared WAFL INPUT or help-copy removal is incomplete",
    }),
    {
      ...marker({
        key: "samePositionInlineCoreFields",
        meaning: "제품명·원단/부자재명·색상옵션·단가는 same-position submit/blur inline edit를 사용한다",
        source: "ControlledInlineEditValue.tsx + overview/material consumers + MobileWorkOrderExperience.tsx + mobileDisplay.ts",
        expectedSemantic: ["제품명", "원단명", "부자재명", "색상·옵션", "단가"],
        normalizedCompiledCheck: "compiled field labels plus behavior-first active-source sub-checks",
        compiled: inlineFieldTerms,
        sourcePassed: samePositionInlineEvidence.passed,
        sourceEvidence: samePositionInlineEvidence.subchecks.map((check) => `${check.key}=${check.passed ? "PASS" : "FAIL"}`).join("; "),
        sourceAbsenceReason: `same-position inline behavior failures: ${samePositionInlineEvidence.failureKeys.join(",")}`,
      }),
      sourceBehavior: samePositionInlineEvidence,
    },
    buildNamedSemanticMarker({
      key: "inlineSessionNestedEditorLifecycle",
      meaning: "late blur is exact-session scoped and size/color child operations return to the stable parent row",
      source: "materialInlineEditSession.ts + MobileWorkOrderExperience.tsx + nestedStructureEditorState.ts + WorkOrderSizeColorStructureEditor.tsx",
      expectedSemantic: ["stale blur isolation", "direct field switch", "parent remains open", "palette returns to parent", "stable row ID"],
      normalizedCompiledCheck: "behavior-first pure transition proof plus active consumer source boundaries",
      passed: Object.values(editorStateProof).every(Boolean)
        && inlineSessionSource.includes("ownsMaterialInlineEditSession")
        && experienceSource.includes("closeOwnedMaterialEditorSession")
        && experienceSource.includes("activeMaterialInlineSession")
        && nestedEditorStateSource.includes("reconcileNestedStructureSelection")
        && !/if \(!saved\)[\s\S]{0,280}props\.onClose\(\)/.test(structureEditorSource)
        && structureEditorSource.includes("cancelPalette")
        && structureEditorSource.includes("applyPalette"),
      normalizedEvidence: Object.entries(editorStateProof).map(([key, value]) => `${key}=${value ? "PASS" : "FAIL"}`).join("; "),
      absenceReason: Object.values(editorStateProof).every(Boolean) ? null : "inline-session or nested-editor state transition failed",
    }),
    buildNamedSemanticMarker({
      key: "nativeCaretSelectionPreserved",
      meaning: "same-position inline fields preserve the native iOS caret and manual selection without forcing a full-value selection",
      source: "ControlledInlineEditValue.tsx + InlineEditableFields.tsx + active overview/material consumers",
      expectedSemantic: "native caret/manual selection; forced full selection absent",
      normalizedCompiledCheck: "active-source behavior boundary; compiled bundle is not used to infer private caret state",
      passed: !/selectTextOnFocus|setNativeProps\s*\([\s\S]{0,120}selection|\bselection\s*=/.test([
        controlledInlineSource,
        inlineEditableFieldsSource,
        overviewSource,
        materialViewSource,
        materialEditorSource,
      ].join("\n")),
      normalizedEvidence: "ABSENT:selectTextOnFocus/selection/setNativeProps full-range selection in active same-position field boundary",
      absenceReason: /selectTextOnFocus|setNativeProps\s*\([\s\S]{0,120}selection|\bselection\s*=/.test([
        controlledInlineSource,
        inlineEditableFieldsSource,
        overviewSource,
        materialViewSource,
        materialEditorSource,
      ].join("\n")) ? "forced full-value selection remains in an active same-position inline field" : null,
    }),
    marker({
      key: "circularFiniteOptionReels",
      meaning: "대상·대분류·사이즈·색상·단위가 finite ID 기반 circular reel과 settled recenter를 사용한다",
      source: "reelPickerModel.ts + WaflReelPickerSheet.tsx + overview/size-color consumers",
      expectedSemantic: ["대상", "대분류", "사이즈", "색상", "단위"],
      normalizedCompiledCheck: "compiled labels plus modulo/repeated-window/recenter source behavior",
      compiled: circularReelTerms,
      sourcePassed: reelModelSource.includes("createCircularReelWindow")
        && reelModelSource.includes("circularLogicalIndex")
        && reelModelSource.includes("circularRecenterIndex")
        && reelPickerSource.includes("CircularOptionReelColumn")
        && reelPickerSource.includes('accessibilityLabel="원단·부자재 단위 릴"')
        && structureEditorSource.includes("WaflOptionReel")
        && overviewSource.includes('field="targetAudience"')
        && overviewSource.includes('field="categoryMajor"'),
      sourceEvidence: "canonical option IDs; nine-copy visual window; modulo logical selection; middle recenter; logical accessibility",
      sourceAbsenceReason: "circular finite-option integration is incomplete",
    }),
    marker({
      key: "quarterMaterialQuantityReels",
      meaning: "필요수량·로스여유는 정수부와 0/0.25/0.5/0.75 소수부를 결합하고 legacy 값을 보존한다",
      source: "reelPickerModel.ts + WaflReelPickerSheet.tsx",
      expectedSemantic: ["필요수량", "로스·여유", "정수", "소수"],
      normalizedCompiledCheck: "compiled quantity labels plus exact quarter compose/decompose source",
      compiled: quarterQuantityTerms,
      sourcePassed: reelModelSource.includes('QUARTER_FRACTION_VALUES = ["0", "0.25", "0.5", "0.75"]')
        && reelModelSource.includes("composeQuarterQuantity")
        && reelModelSource.includes("preservedValue")
        && reelPickerSource.includes(">소수</Text>")
        && reelPickerSource.includes("기존값 {quantityParts.preservedValue}"),
      sourceEvidence: "integer step one; exact quarter strings; no floating accumulation; non-quarter value retained until interaction",
      sourceAbsenceReason: "quarter quantity or legacy preservation boundary is incomplete",
    }),
    marker({
      key: "totalQuantityDecimalDeferred",
      meaning: "총수량은 integer UI/schema/matrix를 유지하고 decimal migration 경계를 기록한다",
      source: "overview + migrations 002/003 + Runtime evidence",
      expectedSemantic: "총 수량",
      normalizedCompiledCheck: "compiled total-quantity label plus integer source/schema checks",
      compiled: totalQuantityTerms,
      sourcePassed: overviewSource.includes('label="총 수량"')
        && overviewSource.includes('header.totalQuantity.toLocaleString("ko-KR")')
        && !overviewSource.includes('field="totalQuantity"')
        && quantityCommandRepositorySource.includes("readCanonicalQuantityTotal")
        && quantityCommandRepositorySource.includes("canonicalTotalQuantity")
        && quantityCommandRepositorySource.includes("total_quantity_snapshot = CASE")
        && detailRepositorySource.includes("FROM color_size_quantities q")
        && listRepositorySource.includes("quantity_totals AS")
        && /total_quantity integer NOT NULL/.test(workOrderMigrationSource)
        && /total_quantity_snapshot integer NOT NULL/.test(workOrderMigrationSource)
        && /quantity integer NOT NULL/.test(quantityMigrationSource),
      sourceEvidence: "TOTAL_QUANTITY_DECIMAL_MIGRATION_REQUIRED; calculated integer display only; work order/revision/matrix remain integer",
      sourceAbsenceReason: "integer total-quantity boundary is missing",
    }),
    buildNamedSemanticMarker({
      key: "mobileManualReorderAbsent",
      meaning: "mobile size/color UI와 controller에는 drag, up/down, reorder request가 없다",
      source: "WorkOrderSizeColorStructureEditor.tsx + useSizeColorStructureEditController.ts",
      expectedSemantic: "manual drag/reorder absent from active mobile boundary",
      normalizedCompiledCheck: "active-source scoped negative check; server compatibility API may remain",
      passed: scopedManualDragAbsent,
      normalizedEvidence: scopedManualDragAbsent ? "ABSENT:mobile-manual-reorder" : "FOUND:mobile-manual-reorder",
      absenceReason: scopedManualDragAbsent ? null : "active mobile source retains a manual reorder path",
    }),
    marker({
      key: "dedicatedCustomColorMode",
      meaning: "direct color mode는 base palette를 숨기고 grouped visual palette와 read-only RGB/HEX만 표시한다",
      source: "WorkOrderSizeColorStructureEditor.tsx + sizeColorAutoSortPolicy.ts",
      expectedSemantic: ["직접 색상 만들기", "RGB", "HEX"],
      normalizedCompiledCheck: "compiled color semantics plus dedicated-mode source boundary",
      compiled: readOnlyColorValues,
      sourcePassed: structureEditorSource.includes('mode === "custom"')
        && structureEditorSource.includes("CUSTOM_COLOR_GROUPS")
        && sortPolicySource.includes("CUSTOM_COLOR_GROUPS")
        && !/manualHex|setManualHex|placeholder="HEX|placeholder="RGB|placeholder="HSL/.test(structureEditorSource),
      sourceEvidence: "dedicated custom branch; 7 deterministic groups; selected swatch; RGB/HEX Text only",
      sourceAbsenceReason: "dedicated visual custom-color mode is incomplete",
    }),
    marker({
      key: "collapsibleQuantityAndMeasurements",
      meaning: "quantity와 finished measurement는 WorkOrder session별 기본 접힘 상태와 독립 chevron을 가진다",
      source: "WorkOrderSizeColorReadOnly.tsx",
      expectedSemantic: ["색상×사이즈", "완성 치수표"],
      normalizedCompiledCheck: "compiled section headings plus session-state source boundary",
      compiled: readOnlyMatrix,
      sourcePassed: sizeColorSource.includes("sectionSessions")
        && sizeColorSource.includes("quantityExpanded: false")
        && sizeColorSource.includes("measurementExpanded: false")
        && sizeColorSource.includes("onEditingChange")
        && sizeColorSource.includes('<Text style={styles.sectionTitle}>색상×사이즈</Text>')
        && sizeColorSource.includes('<Text style={styles.sectionTitle}>완성 치수표</Text>'),
      sourceEvidence: "per-identity session map; default collapsed; quantity edit expands; independent measurement fold",
      sourceAbsenceReason: "collapsible quantity/measurement lifecycle is incomplete",
    }),
    marker({
      key: "robustSizeColorBatchQueue",
      meaning: "size/color multi-add는 refresh-before, immutable snapshot, sequential nextVersion, item idempotency, bounded 409 retry를 사용한다",
      source: "WorkOrderSizeColorStructureEditor.tsx + useSizeColorStructureEditController.ts + Runtime exact queues",
      expectedSemantic: ["개 추가", "사이즈", "색상"],
      normalizedCompiledCheck: "compiled add grammar plus behavior source/runtime exact sequence",
      compiled: addCountTerms,
      sourcePassed: structureEditorSource.includes("const immutableSelection = Object.freeze")
        && structureControllerSource.includes("await snapshot.onRefreshLatest()")
        && structureControllerSource.includes("expectedVersion = result.nextVersion")
        && structureControllerSource.includes("const ids = identity()")
        && structureControllerSource.includes("if (!isConflict(error))")
        && structureControllerSource.includes("retryError"),
      sourceEvidence: "immutable selection; latest projection; sequential chain; per-item identity; reconcile-or-retry once; final refresh",
      sourceAbsenceReason: "robust size/color batch queue is incomplete",
    }),
    marker({
      key: "readOnlyControlsAbsent",
      meaning: "issued/read-only work order에는 chooser, drag handle, reorder action이 노출되지 않는다",
      source: "canonical edit policy + editable branch reachability + read-only target-scoped Runtime ledger",
      expectedSemantic: readOnlyMarkerEvidence.subchecks.map((check) => check.key),
      normalizedCompiledCheck: "branch-aware source/compiled/Runtime sub-check map; edit strings are expected in the shared bundle",
      compiled: {
        passed: readOnlyMarkerEvidence.aggregate.pass,
        normalizedEvidence: readOnlyMarkerEvidence.aggregate.classification,
        absenceReason: readOnlyMarkerEvidence.aggregate.pass
          ? null
          : `failed sub-checks: ${readOnlyMarkerEvidence.aggregate.failedKeys.join(",")}`,
      },
      sourceEvidence: `subchecks=${readOnlyMarkerEvidence.subchecks.length}; failed=${readOnlyMarkerEvidence.aggregate.failedKeys.join(",") || "none"}`,
      sourceAbsenceReason: "read-only branch-aware evidence failed",
    }),
    marker({
      key: "matrixIdentityPreserved",
      meaning: "size/color 자동 정렬 전후 quantity cell의 stable IDs와 values 및 totals가 유지된다",
      source: "Runtime automatic-sort identity assertions + stable row.id reel keys",
      expectedSemantic: "색상×사이즈",
      normalizedCompiledCheck: "compiled matrix heading plus exact Runtime identity evidence",
      compiled: readOnlyMatrix,
      sourcePassed: structureEditorSource.includes("key: row.id")
        && runtimeEvidence.matrixIdentityPreserved,
      sourceEvidence: `stableRowKeys=true; runtimeMatrixIdentity=${runtimeEvidence.matrixIdentityPreserved}`,
      sourceAbsenceReason: "matrix ID/value/total identity changed across reorder",
    }),
    marker({
      key: "specIdentityPreserved",
      meaning: "size 자동 정렬과 synthetic cleanup 후 finished-measurement spec identity와 link counts가 유지된다",
      source: "Runtime before/after size-spec link assertions",
      expectedSemantic: "완성 치수표",
      normalizedCompiledCheck: "compiled finished-measurement heading plus exact Runtime spec identity evidence",
      compiled: present("완성 치수표"),
      sourcePassed: runtimeEvidence.specIdentityPreserved,
      sourceEvidence: `runtimeSpecIdentity=${runtimeEvidence.specIdentityPreserved}`,
      sourceAbsenceReason: "finished-measurement spec identity or link counts changed",
    }),
    buildNamedSemanticMarker({
      key: "deleteArchiveBoundary",
      meaning: "size/color picker와 editor에 delete/archive/restore UI 또는 command가 없다",
      source: "WorkOrderSizeColorStructureEditor.tsx + sizeColorAutoSortPolicy.ts",
      expectedSemantic: "delete/archive/restore absent from active size/color editor",
      normalizedCompiledCheck: "active source boundary negative check; global bundle may contain unrelated lifecycle features",
      passed: !/delete|archive|restore/i.test(`${structureEditorSource}\n${sortPolicySource}`),
      normalizedEvidence: "ABSENT:delete/archive/restore in active picker/editor boundary",
      absenceReason: /delete|archive|restore/i.test(`${structureEditorSource}\n${sortPolicySource}`)
        ? "active picker/editor source contains a forbidden lifecycle action"
        : null,
    }),
    buildNamedSemanticMarker({
      key: "deleteArchiveControlsAbsent",
      meaning: "active size/color picker/editor에 delete/archive/restore control 또는 command가 없다",
      source: "WorkOrderSizeColorStructureEditor.tsx + sizeColorAutoSortPolicy.ts",
      expectedSemantic: "delete/archive/restore absent from active size/color UI boundary",
      normalizedCompiledCheck: "active-source negative check scoped away from unrelated bundled lifecycle features",
      passed: !/delete|archive|restore/i.test(`${structureEditorSource}\n${sortPolicySource}`),
      normalizedEvidence: "ABSENT:delete/archive/restore in active picker/editor boundary",
      absenceReason: /delete|archive|restore/i.test(`${structureEditorSource}\n${sortPolicySource}`)
        ? "active picker/editor source contains a forbidden lifecycle action"
        : null,
    }),
    buildNamedSemanticMarker({
      key: "productionBlocked",
      meaning: "alpha.59 command mutation은 승인된 dev/test runner에서만 가능하고 production은 차단된다",
      source: "runner state + lib/external-qa/configCore.mjs",
      expectedSemantic: "alpha59-qa-remediation and production blocked",
      normalizedCompiledCheck: "runtime-state semantic check; server security source is authoritative rather than a UI bundle literal",
      passed: state.mutationMode === "alpha59-qa-remediation"
        && state.commandApi === "ready"
        && externalQaSource.includes("isProductionEnvironment")
        && externalQaSource.includes("PRODUCTION_DEVELOPER_ORIGIN_FORBIDDEN"),
      normalizedEvidence: `mutationMode=${state.mutationMode}; commandApi=${state.commandApi}; productionGuard=present`,
      absenceReason: "approved dev/test mutation mode or production guard is missing",
    }),
  ];
  const markerMap = Object.fromEntries(markers.map((entry) => [entry.key, entry]));
  const failedMarkerKeys = markers.filter((entry) => !entry.passed).map((entry) => entry.key);
  return {
    manifest: 200,
    bundle: 200,
    bundleBytes: Buffer.byteLength(bundleText),
    normalization: "unicode-decoded + whitespace/quote/concatenation-neutral semantic views",
    markerMap,
    readOnlyMarkerEvidence,
    failedMarkerKeys,
    allMarkersPassed: failedMarkerKeys.length === 0,
  };
}

function logIssueCounts(state) {
  const patterns = {
    fatal: /\bFATAL\b/gi,
    redScreen: /red[- ]screen/gi,
    uncaught: /\buncaught\b/gi,
    unhandled: /unhandled(?:rejection)?/gi,
  };
  const counts = Object.fromEntries(Object.keys(patterns).map((key) => [key, 0]));
  for (const record of state.processes) {
    for (const key of ["stdoutPath", "stderrPath"]) {
      if (!record[key] || !fs.existsSync(record[key])) continue;
      const log = fs.readFileSync(record[key], "utf8");
      for (const [issue, pattern] of Object.entries(patterns)) {
        counts[issue] += log.match(pattern)?.length ?? 0;
      }
    }
  }
  return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

async function run() {
  const state = assertRunnerState();
  fs.mkdirSync(path.dirname(CLEANUP_OWNERSHIP_EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(CLEANUP_OWNERSHIP_EVIDENCE_PATH, serializeRuntimeResult({ status: "NOT_REACHED" }), "utf8");
  const baseUrl = `https://${state.tailscaleServeHostname}`;
  let cookie = "";
  const requests = [];

  async function jsonRequest(route, options = {}) {
    const safeRoute = route.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      ":uuid",
    );
    console.log(JSON.stringify({ runtimeQaStep: "request-start", kind: options.kind ?? "read", method: options.method ?? "GET", route: safeRoute }));
    const headers = {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      ...(options.anonymous || !cookie ? {} : { Cookie: cookie }),
    };
    const response = await fetch(`${baseUrl}${route}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    console.log(JSON.stringify({ runtimeQaStep: "request-complete", kind: options.kind ?? "read", method: options.method ?? "GET", route: safeRoute, status: response.status }));
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length && !options.anonymous) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* status is asserted by caller */ }
    requests.push({
      kind: options.kind ?? "read",
      method: options.method ?? "GET",
      route: safeRoute,
      status: response.status,
      targetScope: options.targetScope ?? "other",
    });
    return { response, body };
  }

  const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST", kind: "auto-connect" });
  assert.equal(auth.response.status, 200);
  assert.equal(auth.body?.connected, true);
  assert.ok(cookie);

  const list = await jsonRequest("/api/v2/work-orders?limit=30", { kind: "list" });
  assert.equal(list.response.status, 200);
  assert.ok(Array.isArray(list.body?.data?.items));
  const candidates = list.body.data.items;
  const qaItem = candidates.find((item) => item.productName === PRIMARY_DRAFT_PRODUCT && item.status === "draft");
  let targetItem = null;
  assert.ok(qaItem, "PRIMARY_DRAFT_WORK_ORDER_NOT_FOUND");

  const qaDetail = await jsonRequest(`/api/v2/work-orders/${qaItem.workOrderId}`, { kind: "qa-detail-read-only" });
  const qaMatrix = await jsonRequest(`/api/v2/work-orders/${qaItem.workOrderId}/size-color`, { kind: "qa-size-color-read-only" });
  const qaSpec = await jsonRequest(`/api/v2/work-orders/${qaItem.workOrderId}/size-spec`, { kind: "qa-size-spec-read-only" });
  assert.equal(qaDetail.response.status, 200);
  assert.equal(qaMatrix.response.status, 200);
  assert.equal(qaSpec.response.status, 200);

  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha59-size-color-structure-runtime-qa",
  });
  await client.connect();
  let userOwnedBefore = null;
  let isolatedMarker = null;
  let fixtureContext = null;
  const syntheticSizeIds = [];
  const exactSequenceSizeIds = [];
  const exactSequenceColorIds = [];
  const exactSequenceColorRecords = [];
  const prefixSyntheticColorIds = [];
  const syntheticMaterialIds = [];
  const syntheticMaterialRecords = [];
  let cleanupContext = null;
  let cleanupCompleted = false;
  let colorCleanupCompleted = false;
  let cleanupOwnershipEvidence = null;
  let fixtureCleanup = null;
  persistAccountingEvidence([]);
  try {
  userOwnedBefore = await readUserOwnedSnapshots(client);
  const primaryUserSnapshot = userOwnedBefore.find((row) => row.product_name === PRIMARY_DRAFT_PRODUCT);
  const readOnlyUserSnapshot = userOwnedBefore.find((row) => row.product_name === READ_ONLY_REGRESSION_PRODUCT);
  assert.equal(primaryUserSnapshot.id, qaItem.workOrderId);
  assert.ok(readOnlyUserSnapshot, "READ_ONLY_REGRESSION_WORK_ORDER_NOT_FOUND");
  const readOnlyRequestOptions = { targetScope: "read-only-user" };
  const readOnlyDetailRegression = await jsonRequest(`/api/v2/work-orders/${readOnlyUserSnapshot.id}`, { ...readOnlyRequestOptions, kind: "read-only-detail" });
  const readOnlyMatrixRegression = await jsonRequest(`/api/v2/work-orders/${readOnlyUserSnapshot.id}/size-color`, { ...readOnlyRequestOptions, kind: "read-only-size-color" });
  const readOnlySpecRegression = await jsonRequest(`/api/v2/work-orders/${readOnlyUserSnapshot.id}/size-spec`, { ...readOnlyRequestOptions, kind: "read-only-size-spec" });
  assert.equal(readOnlyDetailRegression.response.status, 200);
  assert.equal(readOnlyMatrixRegression.response.status, 200);
  assert.equal(readOnlySpecRegression.response.status, 200);
  assert.equal(readOnlyDetailRegression.body?.data?.header?.id, readOnlyUserSnapshot.id);
  assert.equal(readOnlyDetailRegression.body?.data?.header?.productName, READ_ONLY_REGRESSION_PRODUCT);
  const readOnlyProjection = {
    sizes: readOnlyMatrixRegression.body?.data?.sizes?.length,
    colors: readOnlyMatrixRegression.body?.data?.colors?.length,
    quantityCells: readOnlyMatrixRegression.body?.data?.quantityCells?.length,
    pomColumns: readOnlySpecRegression.body?.data?.pomColumns?.length,
    specificationCells: readOnlySpecRegression.body?.data?.cells?.length,
  };
  assert.deepEqual(readOnlyProjection, {
    sizes: 3,
    colors: 3,
    quantityCells: 9,
    pomColumns: 5,
    specificationCells: 15,
  });
  const readOnlyEditability = {
    canEdit: readOnlyDetailRegression.body?.data?.header?.status === "draft"
      && readOnlyDetailRegression.body?.data?.revision?.status === "draft",
    reason: `header=${readOnlyDetailRegression.body?.data?.header?.status};revision=${readOnlyDetailRegression.body?.data?.revision?.status}`,
  };
  assert.equal(readOnlyEditability.canEdit, false);
  const targetScopedRequests = requests.filter((request) => request.targetScope === "read-only-user");
  const targetScopedCommands = targetScopedRequests.filter((request) => request.method !== "GET");
  const readOnlyRequestLedger = {
    getRequests: targetScopedRequests.filter((request) => request.method === "GET").length,
    addCommandRequests: targetScopedCommands.filter((request) => /\/sizes(?:\?|$)|\/colors(?:\?|$)/.test(request.route)).length,
    dragCommandRequests: targetScopedCommands.filter((request) => /\/reorder(?:\?|$)/.test(request.route)).length,
    reorderCommandRequests: targetScopedCommands.filter((request) => /\/reorder(?:\?|$)/.test(request.route)).length,
    commandRequests: targetScopedCommands.length,
    commandAllowlistInvocations: targetScopedCommands.filter((request) => request.kind === "mutation").length,
  };
  assert.deepEqual(readOnlyRequestLedger, {
    getRequests: 3,
    addCommandRequests: 0,
    dragCommandRequests: 0,
    reorderCommandRequests: 0,
    commandRequests: 0,
    commandAllowlistInvocations: 0,
  });

  isolatedMarker = createIsolatedFixtureMarker();
  const isolatedBeforeCount = Number((await client.query(`
    SELECT count(*)::integer AS count FROM work_orders
    WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL
  `, [APPROVED_DEV_TEST_COMPANY, isolatedMarker])).rows[0].count);
  assert.equal(isolatedBeforeCount, 0, "ISOLATED_FIXTURE_ALREADY_EXISTS");
  await runTemporaryDraftProvisioner(isolatedMarker);
  const isolatedIdentity = await readTemporaryFixtureIdentity(client, isolatedMarker);
  assertInitialTemporaryFixture(isolatedIdentity, isolatedMarker);
  targetItem = {
    workOrderId: isolatedIdentity.id,
    productName: isolatedIdentity.product_name,
    status: isolatedIdentity.status,
  };
  assert.notEqual(targetItem.workOrderId, qaItem.workOrderId);
  assert.notEqual(targetItem.workOrderId, readOnlyUserSnapshot.id);
  fixtureContext = Object.freeze({
    companyId: isolatedIdentity.company_id,
    workOrderId: isolatedIdentity.id,
    revisionId: isolatedIdentity.current_revision_id,
    creationMarker: isolatedMarker,
    originalProductName: isolatedIdentity.product_name,
  });
  fs.writeFileSync(FIXTURE_EVIDENCE_PATH, serializeRuntimeResult({
    phase: "fixture-provisioned-before-command-mutation",
    companyRef: identityRef(fixtureContext.companyId),
    workOrderRef: identityRef(fixtureContext.workOrderId),
    revisionRef: identityRef(fixtureContext.revisionId),
    creationMarker: fixtureContext.creationMarker,
    originalProductName: fixtureContext.originalProductName,
    generatedIdRefs: [identityRef(fixtureContext.workOrderId), identityRef(fixtureContext.revisionId)],
    status: isolatedIdentity.status,
    revisionStatus: isolatedIdentity.revision_status,
    initialCounts: {
      size: 0,
      color: 0,
      quantity: 0,
      spec: 0,
      material: 0,
    },
  }), "utf8");
    const before = await snapshot(client, targetItem.workOrderId);
    cleanupContext = {
      companyId: before.companyId,
      workOrderId: targetItem.workOrderId,
      revisionId: before.revisionId,
      fixtureMarker: isolatedMarker,
    };
    assert.equal(before.workOrderStatus, "draft");
    assert.equal(before.revisionStatus, "draft");
    assert.equal(before.sizes.some((row) => ["44", "55", "66"].includes(row.display_label)), false, "ISOLATED_DRAFT_EXACT_SEQUENCE_MUST_BE_ABSENT");
    const originalSizeIds = before.sizes.map((row) => row.id);
    const originalColorIds = before.colors.map((row) => row.id);
    const originalMaterialIds = before.materials.map((row) => row.id);
    const visibleDraftIds = candidates.filter((item) => item.status === "draft").map((item) => item.workOrderId);
    const richTargets = (await client.query(`
      SELECT w.id, w.product_name,
             count(*) FILTER (WHERE material.material_type='fabric' AND material.archived_at IS NULL)::integer AS fabric_count,
             count(*) FILTER (WHERE material.material_type='accessory' AND material.archived_at IS NULL)::integer AS accessory_count
      FROM work_orders w
      LEFT JOIN work_order_material_lines material
        ON material.company_id=w.company_id AND material.revision_id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=ANY($2::uuid[]) AND w.status='draft'
      GROUP BY w.id, w.product_name
      ORDER BY w.product_name, w.id
    `, [before.companyId, visibleDraftIds])).rows;
    const materialRichDraftProductName = richTargets
      .filter((row) => Number(row.fabric_count) > 0)
      .sort((left, right) => Number(right.fabric_count) - Number(left.fabric_count))[0]?.product_name
      ?? PRIMARY_DRAFT_PRODUCT;
    const accessoryRichDraftProductName = richTargets
      .filter((row) => Number(row.accessory_count) > 0)
      .sort((left, right) => Number(right.accessory_count) - Number(left.accessory_count))[0]?.product_name
      ?? PRIMARY_DRAFT_PRODUCT;

    const detail = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}`, { kind: "detail" });
    const initialMatrix = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "size-color" });
    const initialSpec = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-spec`, { kind: "size-spec" });
    assert.equal(detail.response.status, 200);
    assert.equal(initialMatrix.response.status, 200);
    assert.equal(initialSpec.response.status, 200);
    assert.equal(detail.body?.data?.header?.status, "draft");
    assert.equal(detail.body?.data?.revision?.status, "draft");
    assert.equal(initialMatrix.body?.data?.entityVersion, before.workOrderVersion);
    assert.equal(initialSpec.body?.data?.entityVersion, before.workOrderVersion);
    assert.equal(normalizeCanonicalIntegerEvidence(initialMatrix.body?.data?.matrixTotal, "INITIAL_MATRIX_TOTAL"), 0);
    assert.equal(normalizeCanonicalIntegerEvidence(initialMatrix.body?.data?.workOrderTotal, "INITIAL_WORK_ORDER_TOTAL"), 0);
    assert.equal(normalizeCanonicalIntegerEvidence(initialMatrix.body?.data?.revisionTotal, "INITIAL_REVISION_TOTAL"), 0);
    assert.equal(initialMatrix.body?.data?.projectionsMatch, true);
    assert.equal(normalizeCanonicalIntegerEvidence(detail.body?.data?.header?.totalQuantity, "INITIAL_DETAIL_TOTAL"), 0);

    const readOnlyRegression = "PASS_GET_ONLY_DETAIL_MATRIX_SPEC";

    let version = before.workOrderVersion;
    const accountingSteps = [];
    const suffix = crypto.randomBytes(5).toString("hex").toUpperCase();
    const sizeCreateName = `A59-QA-SIZE-${suffix}`;
    const sizeRenamedName = `${sizeCreateName}-R`;
    const sizeAnchorName = `${sizeCreateName}-ANCHOR`;
    const colorCreateName = `A59-QA-COLOR-${suffix}`;
    const colorRenamedName = `${colorCreateName}-R`;
    const colorAnchorName = `${colorCreateName}-ANCHOR`;
    let requestSequence = 0;
    const identity = (kind) => {
      requestSequence += 1;
      const id = `a59-${kind}-${suffix.toLowerCase()}-${requestSequence}`;
      return { clientRequestId: id, idempotencyKey: id };
    };
    const accountingState = (value) => ({
      workOrderVersion: value.workOrderVersion,
      revisionVersion: value.revisionVersion,
      events: value.events,
      receipts: value.receipts,
    });
    const orderFromSnapshot = (value, kind) => {
      if (kind === "size") return value.sizes.map((row) => identityRef(row.id));
      if (kind === "color") return value.colors.map((row) => identityRef(row.id));
      return [];
    };
    const executeTrackedRequest = async (input) => {
      const accountingBefore = await snapshot(client, targetItem.workOrderId);
      const response = await input.request();
      const accountingAfter = await snapshot(client, targetItem.workOrderId);
      const payloadOrder = (input.payloadOrder ?? []).map(identityRef);
      const step = validateAccountingStep({
        key: input.key,
        expectedSemantic: input.expectedSemantic,
        expectedDeltas: input.expectedDeltas,
        payloadOrder,
        beforeOrder: orderFromSnapshot(accountingBefore, input.orderKind),
        afterOrder: orderFromSnapshot(accountingAfter, input.orderKind),
        before: accountingState(accountingBefore),
        after: accountingState(accountingAfter),
        httpStatus: response.response.status,
        replay: response.response.headers.get("x-wafl-idempotent-replay") === "1",
        contractBasis: input.contractBasis,
      });
      accountingSteps.push(step);
      persistAccountingEvidence(accountingSteps);
      assert.equal(step.pass, true, `ACCOUNTING_STEP_FAILED:${step.key}:${step.failures.join(",")}`);
      return response;
    };
    const mutate = async (route, method, body, idempotencyKey, expectedStatus, accounting) => {
      assert.ok(accounting?.key && accounting?.expectedSemantic && accounting?.expectedDeltas, "ACCOUNTING_DECLARATION_REQUIRED");
      return executeTrackedRequest({
        ...accounting,
        payloadOrder: body.orderedColorIds ?? body.orderedSizeRowIds ?? [],
        request: async () => {
          const response = await jsonRequest(route, { method, body, idempotencyKey, kind: "mutation" });
          assert.equal(response.response.status, expectedStatus, `${method} ${route}`);
          if (expectedStatus < 300) {
            assert.equal(response.body?.ok, true);
            assert.ok(Number.isSafeInteger(response.body?.data?.nextVersion));
          }
          return response;
        },
      });
    };
    const trackedJsonRequest = async (input) => executeTrackedRequest({
      key: input.key,
      expectedSemantic: input.expectedSemantic,
      expectedDeltas: input.expectedDeltas,
      request: async () => {
        const response = await jsonRequest(input.route, input.options);
        assert.equal(response.response.status, input.expectedStatus);
        return response;
      },
    });
    const changedWithReceipt = (key, orderKind) => ({
      key,
      expectedSemantic: "changed",
      expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
      orderKind,
    });
    const changedWithoutReceipt = (key, contractBasis = null) => ({
      key,
      expectedSemantic: "changed",
      expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 0 },
      contractBasis,
    });
    const zeroDelta = (key, expectedSemantic, orderKind) => ({
      key,
      expectedSemantic,
      expectedDeltas: { workOrderVersion: 0, revisionVersion: 0, events: 0, receipts: 0 },
      orderKind,
    });

    const inlineProductName = `${isolatedMarker} inline`;
    const productNamePatchIdentity = identity("product-name-inline-patch");
    const productNamePatch = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}`,
      "PATCH",
      {
        clientRequestId: productNamePatchIdentity.clientRequestId,
        expectedVersion: version,
        patch: { productName: inlineProductName },
      },
      undefined,
      200,
      changedWithoutReceipt("product-name-inline-patch", BASIC_INFO_PATCH_RECEIPT_CONTRACT),
    );
    version = productNamePatch.body.data.nextVersion;
    const productNamePatchRead = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}`, { kind: "read-after-product-name-inline-patch" });
    assert.equal(productNamePatchRead.body?.data?.header?.productName, inlineProductName);

    const exactSequenceStart = {
      workOrderVersion: version,
      labels: before.sizes.map((row) => row.display_label),
    };
    const exactSequenceRequests = [];
    for (const displayLabel of ["44", "55", "66"]) {
      const exactIdentity = identity(`exact-size-${displayLabel}`);
      const expectedVersion = version;
      const created = await mutate(
        `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes`,
        "POST",
        { clientRequestId: exactIdentity.clientRequestId, expectedVersion, displayLabel },
        exactIdentity.idempotencyKey,
        201,
        changedWithReceipt(`exact-size-${displayLabel}`),
      );
      assert.ok(created.body.data.result.targetId, `EXACT_${displayLabel}_TARGET_ID_MISSING`);
      exactSequenceSizeIds.push(created.body.data.result.targetId);
      version = created.body.data.nextVersion;
      exactSequenceRequests.push({
        displayLabel,
        expectedVersion,
        nextVersion: version,
        rowRef: identityRef(created.body.data.result.targetId),
        idempotencyRef: identityRef(exactIdentity.idempotencyKey),
        status: created.response.status,
      });
    }
    assert.deepEqual(exactSequenceRequests.map((request) => request.displayLabel), ["44", "55", "66"]);
    assert.deepEqual(exactSequenceRequests.map((request) => request.expectedVersion), [
      exactSequenceStart.workOrderVersion,
      exactSequenceStart.workOrderVersion + 1,
      exactSequenceStart.workOrderVersion + 2,
    ]);
    const exactSequenceRead = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-exact-44-55-66" });
    assert.equal(exactSequenceRead.response.status, 200);
    assert.deepEqual(
      exactSequenceRead.body.data.sizes.filter((row) => exactSequenceSizeIds.includes(row.id)).map((row) => row.displayLabel),
      ["44", "55", "66"],
    );

    const exactColorSequenceStart = { workOrderVersion: version, names: before.colors.map((row) => row.display_name) };
    const exactColorQueue = createExactColorOrdinalQueue([
      { displayName: "화이트", hexValue: "#FFFFFF" },
      { displayName: "아이보리", hexValue: "#F5F0E6" },
      { displayName: "그레이", hexValue: "#8A8F98" },
    ]);
    const exactColorSequenceRequests = [];
    for (const colorRequest of exactColorQueue) {
      const exactIdentity = identity(colorRequest.requestIdentityClass);
      const expectedVersion = version;
      const created = await mutate(
        `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors`,
        "POST",
        {
          clientRequestId: exactIdentity.clientRequestId,
          expectedVersion,
          displayName: colorRequest.displayName,
          hexValue: colorRequest.hexValue,
        },
        exactIdentity.idempotencyKey,
        201,
        changedWithReceipt(colorRequest.stepKey),
      );
      assert.ok(created.body.data.result.targetId, `EXACT_COLOR_${colorRequest.ordinal}_TARGET_ID_MISSING`);
      const exactColorId = created.body.data.result.targetId;
      exactSequenceColorIds.push(exactColorId);
      exactSequenceColorRecords.push({
        id: exactColorId,
        stepKey: colorRequest.stepKey,
        ordinal: colorRequest.ordinal,
        displayName: colorRequest.displayName,
      });
      version = created.body.data.nextVersion;
      exactColorSequenceRequests.push({
        stepKey: colorRequest.stepKey,
        ordinal: colorRequest.ordinal,
        displayName: colorRequest.displayName,
        requestIdentityClass: colorRequest.requestIdentityClass,
        expectedVersion,
        nextVersion: version,
        httpStatus: created.response.status,
        mutationSemantic: "changed",
        pass: true,
        rowRef: identityRef(created.body.data.result.targetId),
        idempotencyRef: identityRef(exactIdentity.idempotencyKey),
        status: created.response.status,
      });
    }
    assert.deepEqual(exactColorSequenceRequests.map((request) => request.displayName), ["화이트", "아이보리", "그레이"]);
    assert.deepEqual(exactColorSequenceRequests.map((request) => request.expectedVersion), [
      exactColorSequenceStart.workOrderVersion,
      exactColorSequenceStart.workOrderVersion + 1,
      exactColorSequenceStart.workOrderVersion + 2,
    ]);
    const exactColorSequenceRead = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-exact-white-ivory-gray" });
    assert.equal(exactColorSequenceRead.response.status, 200);
    assert.deepEqual(
      exactColorSequenceRead.body.data.colors.filter((row) => exactSequenceColorIds.includes(row.id)).map((row) => row.displayName),
      ["화이트", "아이보리", "그레이"],
    );

    const sizeCreateIdentity = identity("size-create");
    const sizeCreateBody = { clientRequestId: sizeCreateIdentity.clientRequestId, expectedVersion: version, displayLabel: sizeCreateName };
    const sizeCreate = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes`,
      "POST",
      sizeCreateBody,
      sizeCreateIdentity.idempotencyKey,
      201,
      changedWithReceipt("size-create"),
    );
    const syntheticSizeId = sizeCreate.body.data.result.targetId;
    syntheticSizeIds.push(syntheticSizeId);
    version = sizeCreate.body.data.nextVersion;
    const sizeReplay = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes`,
      "POST",
      sizeCreateBody,
      sizeCreateIdentity.idempotencyKey,
      200,
      zeroDelta("size-create-replay", "replay"),
    );
    assert.equal(sizeReplay.response.headers.get("x-wafl-idempotent-replay"), "1");
    assert.equal(sizeReplay.body.data.nextVersion, version);
    const sizeAnchorIdentity = identity("size-anchor-create");
    const sizeAnchorCreate = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes`,
      "POST",
      { clientRequestId: sizeAnchorIdentity.clientRequestId, expectedVersion: version, displayLabel: sizeAnchorName },
      sizeAnchorIdentity.idempotencyKey,
      201,
      changedWithReceipt("size-anchor-create"),
    );
    const syntheticSizeAnchorId = sizeAnchorCreate.body.data.result.targetId;
    syntheticSizeIds.push(syntheticSizeAnchorId);
    version = sizeAnchorCreate.body.data.nextVersion;
    const duplicateIdentity = identity("size-duplicate");
    await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes`,
      "POST",
      { clientRequestId: duplicateIdentity.clientRequestId, expectedVersion: version, displayLabel: sizeCreateName.toLocaleLowerCase("en-US") },
      duplicateIdentity.idempotencyKey,
      409,
      zeroDelta("size-duplicate-rejected", "rejected"),
    );
    const afterSizeCreate = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-size-create" });
    assert.ok(afterSizeCreate.body.data.sizes.some((row) => row.id === syntheticSizeId && row.displayLabel === sizeCreateName));

    const sizeRenameIdentity = identity("size-rename");
    const sizeRename = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes/${syntheticSizeId}`,
      "PATCH",
      { clientRequestId: sizeRenameIdentity.clientRequestId, expectedVersion: version, displayLabel: sizeRenamedName },
      sizeRenameIdentity.idempotencyKey,
      200,
      changedWithReceipt("size-rename"),
    );
    version = sizeRename.body.data.nextVersion;

    const sizeReorderIdentity = identity("size-reorder");
    const sizeReorder = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes/reorder`,
      "POST",
      {
        clientRequestId: sizeReorderIdentity.clientRequestId,
        expectedVersion: version,
        orderedSizeRowIds: [syntheticSizeAnchorId, syntheticSizeId, ...exactSequenceSizeIds, ...originalSizeIds],
      },
      sizeReorderIdentity.idempotencyKey,
      200,
      changedWithReceipt("size-changed-reorder", "size"),
    );
    version = sizeReorder.body.data.nextVersion;
    const sizeRestoreIdentity = identity("size-restore-order");
    const sizeRestore = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes/reorder`,
      "POST",
      {
        clientRequestId: sizeRestoreIdentity.clientRequestId,
        expectedVersion: version,
        orderedSizeRowIds: [...exactSequenceSizeIds, ...originalSizeIds, syntheticSizeId, syntheticSizeAnchorId],
      },
      sizeRestoreIdentity.idempotencyKey,
      200,
      changedWithReceipt("size-restore-reorder", "size"),
    );
    version = sizeRestore.body.data.nextVersion;

    const colorCreateIdentity = identity("color-create");
    const colorCreateBody = {
      clientRequestId: colorCreateIdentity.clientRequestId,
      expectedVersion: version,
      displayName: colorCreateName,
      hexValue: "#A1B2C3",
    };
    const colorCreate = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors`,
      "POST",
      colorCreateBody,
      colorCreateIdentity.idempotencyKey,
      201,
      changedWithReceipt("color-create"),
    );
    const syntheticColorId = colorCreate.body.data.result.targetId;
    prefixSyntheticColorIds.push(syntheticColorId);
    version = colorCreate.body.data.nextVersion;
    const colorReplay = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors`,
      "POST",
      colorCreateBody,
      colorCreateIdentity.idempotencyKey,
      200,
      zeroDelta("color-create-replay", "replay"),
    );
    assert.equal(colorReplay.response.headers.get("x-wafl-idempotent-replay"), "1");
    const colorAnchorIdentity = identity("color-anchor-create");
    const colorAnchorCreate = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors`,
      "POST",
      {
        clientRequestId: colorAnchorIdentity.clientRequestId,
        expectedVersion: version,
        displayName: colorAnchorName,
        hexValue: null,
      },
      colorAnchorIdentity.idempotencyKey,
      201,
      changedWithReceipt("color-anchor-create"),
    );
    const syntheticColorAnchorId = colorAnchorCreate.body.data.result.targetId;
    prefixSyntheticColorIds.push(syntheticColorAnchorId);
    version = colorAnchorCreate.body.data.nextVersion;

    const colorPatchIdentity = identity("color-patch");
    const colorPatch = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors/${syntheticColorId}`,
      "PATCH",
      {
        clientRequestId: colorPatchIdentity.clientRequestId,
        expectedVersion: version,
        patch: { displayName: colorRenamedName, hexValue: "#C3B2A1" },
      },
      colorPatchIdentity.idempotencyKey,
      200,
      changedWithReceipt("color-patch"),
    );
    version = colorPatch.body.data.nextVersion;
    const afterColorPatch = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-color-patch" });
    assert.ok(afterColorPatch.body.data.colors.some((row) => row.id === syntheticColorId && row.displayName === colorRenamedName && row.hexValue === "#C3B2A1"));

    const colorReorderIdentity = identity("color-reorder");
    const colorReorder = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors/reorder`,
      "POST",
      {
        clientRequestId: colorReorderIdentity.clientRequestId,
        expectedVersion: version,
        orderedColorIds: [syntheticColorAnchorId, syntheticColorId, ...exactSequenceColorIds, ...originalColorIds],
      },
      colorReorderIdentity.idempotencyKey,
      200,
      changedWithReceipt("color-initial-changed-reorder", "color"),
    );
    version = colorReorder.body.data.nextVersion;
    const colorRestoreIdentity = identity("color-restore-order");
    const colorRestore = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors/reorder`,
      "POST",
      {
        clientRequestId: colorRestoreIdentity.clientRequestId,
        expectedVersion: version,
        orderedColorIds: [...exactSequenceColorIds, ...originalColorIds, syntheticColorId, syntheticColorAnchorId],
      },
      colorRestoreIdentity.idempotencyKey,
      200,
      changedWithReceipt("color-restore-changed-reorder", "color"),
    );
    version = colorRestore.body.data.nextVersion;
    const assertQuantityProjection = (response, expectedTotal, expectedCell) => {
      assert.equal(normalizeCanonicalIntegerEvidence(response.body?.data?.result?.totalQuantity, "COMMAND_TOTAL"), expectedTotal);
      assert.equal(normalizeCanonicalIntegerEvidence(response.body?.data?.result?.quantity, "COMMAND_CELL"), expectedCell);
    };
    const assertMatrixProjection = (response, expectedTotal, expectedCells) => {
      assert.equal(normalizeCanonicalIntegerEvidence(response.body?.data?.matrixTotal, "MATRIX_TOTAL"), expectedTotal);
      assert.equal(normalizeCanonicalIntegerEvidence(response.body?.data?.workOrderTotal, "WORK_ORDER_TOTAL"), expectedTotal);
      assert.equal(normalizeCanonicalIntegerEvidence(response.body?.data?.revisionTotal, "REVISION_TOTAL"), expectedTotal);
      assert.equal(response.body?.data?.projectionsMatch, true);
      for (const expected of expectedCells) {
        assert.ok(response.body.data.quantityCells.some(
          (cell) => cell.colorId === expected.colorId
            && cell.sizeRowId === expected.sizeRowId
            && normalizeCanonicalIntegerEvidence(cell.quantity, "MATRIX_CELL") === expected.quantity,
        ));
      }
    };
    const quantityCells = [
      { colorId: syntheticColorId, sizeRowId: syntheticSizeId, quantity: 3 },
      { colorId: syntheticColorId, sizeRowId: syntheticSizeAnchorId, quantity: 5 },
      { colorId: syntheticColorAnchorId, sizeRowId: syntheticSizeId, quantity: 7 },
    ];
    const quantityCreateIdentity = identity("quantity-create-three");
    const quantityCreateThree = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
      "PATCH",
      { clientRequestId: quantityCreateIdentity.clientRequestId, expectedVersion: version, quantity: 3 },
      quantityCreateIdentity.idempotencyKey,
      200,
      changedWithReceipt("quantity-create-three"),
    );
    assertQuantityProjection(quantityCreateThree, 3, 3);
    version = quantityCreateThree.body.data.nextVersion;
    const afterQuantityCreate = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-quantity-create" });
    assert.equal(afterQuantityCreate.response.status, 200);
    assertMatrixProjection(afterQuantityCreate, 3, quantityCells.slice(0, 1));
    const quantityCreateFiveIdentity = identity("quantity-create-five");
    const quantityCreateFive = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeAnchorId}`,
      "PATCH",
      { clientRequestId: quantityCreateFiveIdentity.clientRequestId, expectedVersion: version, quantity: 5 },
      quantityCreateFiveIdentity.idempotencyKey,
      200,
      changedWithReceipt("quantity-create-five"),
    );
    assertQuantityProjection(quantityCreateFive, 8, 5);
    version = quantityCreateFive.body.data.nextVersion;
    const afterQuantityFive = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-quantity-five" });
    assert.equal(afterQuantityFive.response.status, 200);
    assertMatrixProjection(afterQuantityFive, 8, quantityCells.slice(0, 2));
    const quantityCreateSevenIdentity = identity("quantity-create-seven");
    const quantityCreateSeven = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorAnchorId}/${syntheticSizeId}`,
      "PATCH",
      { clientRequestId: quantityCreateSevenIdentity.clientRequestId, expectedVersion: version, quantity: 7 },
      quantityCreateSevenIdentity.idempotencyKey,
      200,
      changedWithReceipt("quantity-create-seven"),
    );
    assertQuantityProjection(quantityCreateSeven, 15, 7);
    version = quantityCreateSeven.body.data.nextVersion;
    const afterQuantitySeven = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-quantity-seven" });
    assert.equal(afterQuantitySeven.response.status, 200);
    assertMatrixProjection(afterQuantitySeven, 15, quantityCells);

    const quantityUpdateIdentity = identity("quantity-update-five-to-six");
    const quantityUpdate = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeAnchorId}`,
      "PATCH",
      { clientRequestId: quantityUpdateIdentity.clientRequestId, expectedVersion: version, quantity: 6 },
      quantityUpdateIdentity.idempotencyKey,
      200,
      changedWithReceipt("quantity-update-five-to-six"),
    );
    assertQuantityProjection(quantityUpdate, 16, 6);
    version = quantityUpdate.body.data.nextVersion;
    const afterQuantityUpdate = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-quantity-update" });
    assert.equal(afterQuantityUpdate.response.status, 200);
    const updatedQuantityCells = quantityCells.map((cell, index) => index === 1 ? { ...cell, quantity: 6 } : cell);
    assertMatrixProjection(afterQuantityUpdate, 16, updatedQuantityCells);
    assert.equal(
      normalizeCanonicalIntegerEvidence(afterQuantityUpdate.body.data.matrixTotal, "MATRIX_TOTAL"),
      afterQuantityUpdate.body.data.quantityCells.reduce(
        (sum, cell) => sum + normalizeCanonicalIntegerEvidence(cell.quantity, "MATRIX_CELL"),
        0,
      ),
    );
    const quantityUnchangedIdentity = identity("quantity-unchanged-six");
    const quantityUnchanged = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeAnchorId}`,
      "PATCH",
      { clientRequestId: quantityUnchangedIdentity.clientRequestId, expectedVersion: version, quantity: 6 },
      quantityUnchangedIdentity.idempotencyKey,
      200,
      zeroDelta("quantity-unchanged-six-no-op", "no-op"),
    );
    assert.equal(quantityUnchanged.body.data.nextVersion, version);
    assertQuantityProjection(quantityUnchanged, 16, 6);
    const quantitySizeReorderIdentity = identity("quantity-size-identity-reorder");
    const quantitySizeReorder = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/sizes/reorder`,
      "POST",
      {
        clientRequestId: quantitySizeReorderIdentity.clientRequestId,
        expectedVersion: version,
        orderedSizeRowIds: [syntheticSizeId, ...exactSequenceSizeIds, ...originalSizeIds, syntheticSizeAnchorId],
      },
      quantitySizeReorderIdentity.idempotencyKey,
      200,
      changedWithReceipt("quantity-size-identity-changed-reorder", "size"),
    );
    version = quantitySizeReorder.body.data.nextVersion;

    const colorOrderBeforeChangedRead = await jsonRequest(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color`,
      { kind: "read-before-color-changed-reorder" },
    );
    assert.equal(colorOrderBeforeChangedRead.response.status, 200);
    const colorOrderBeforeChanged = colorOrderBeforeChangedRead.body.data.colors.map((row) => row.id);
    assert.ok(colorOrderBeforeChanged.length >= 2, "COLOR_CHANGED_REORDER_REQUIRES_TWO_ROWS");
    const changedColorOrder = [...colorOrderBeforeChanged].reverse();
    assert.notDeepEqual(changedColorOrder, colorOrderBeforeChanged, "COLOR_CHANGED_REORDER_PAYLOAD_MUST_DIFFER");
    const quantityColorChangedIdentity = identity("quantity-color-changed-reorder");
    const quantityColorChangedReorder = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors/reorder`,
      "POST",
      {
        clientRequestId: quantityColorChangedIdentity.clientRequestId,
        expectedVersion: version,
        orderedColorIds: changedColorOrder,
      },
      quantityColorChangedIdentity.idempotencyKey,
      200,
      changedWithReceipt("color-changed-reorder", "color"),
    );
    version = quantityColorChangedReorder.body.data.nextVersion;
    const colorOrderAfterChangedRead = await jsonRequest(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color`,
      { kind: "read-after-color-changed-reorder" },
    );
    assert.equal(colorOrderAfterChangedRead.response.status, 200);
    const colorOrderAfterChanged = colorOrderAfterChangedRead.body.data.colors.map((row) => row.id);
    assert.deepEqual(colorOrderAfterChanged, changedColorOrder);

    const quantityColorNoOpIdentity = identity("quantity-color-same-index-no-op");
    const quantityColorNoOp = await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/colors/reorder`,
      "POST",
      {
        clientRequestId: quantityColorNoOpIdentity.clientRequestId,
        expectedVersion: version,
        orderedColorIds: [...colorOrderAfterChanged],
      },
      quantityColorNoOpIdentity.idempotencyKey,
      200,
      zeroDelta("color-same-index-no-op", "no-op", "color"),
    );
    assert.equal(quantityColorNoOp.body.data.nextVersion, version);
    const afterIdentityReorder = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}/size-color`, { kind: "read-after-identity-reorder" });
    assertMatrixProjection(afterIdentityReorder, 16, updatedQuantityCells);
    const identityProjection = (data) => ({
      sizeIds: data.sizes.map((row) => row.id).sort(),
      colorIds: data.colors.map((row) => row.id).sort(),
      quantityCells: data.quantityCells
        .map((cell) => [cell.colorId, cell.sizeRowId, String(cell.quantity)])
        .sort((left, right) => left.join(":").localeCompare(right.join(":"))),
      matrixTotal: String(data.matrixTotal),
      expectedTotal: String(data.expectedTotal),
      totalsMatch: data.totalsMatch,
    });
    assert.deepEqual(
      identityProjection(afterIdentityReorder.body.data),
      identityProjection(afterQuantityUpdate.body.data),
    );

    const materialCollectionPath = `/api/v2/work-orders/${targetItem.workOrderId}/materials`;
    const materialMarker = `A59-REMEDIATION-${suffix}`;
    const createSyntheticMaterial = async (materialType, values) => {
      const createIdentity = identity(`${materialType}-material-create`);
      const response = await mutate(
        materialCollectionPath,
        "POST",
        {
          clientRequestId: createIdentity.clientRequestId,
          expectedVersion: version,
          materialType,
          materialId: null,
          name: `${materialMarker}-${materialType.toUpperCase()}`,
          partnerId: null,
          colorOption: values.colorOption,
          usageArea: "alpha.59 remediation exact synthetic",
          requiredQuantity: values.requiredQuantity,
          allowanceQuantity: values.allowanceQuantity,
          inventoryUsageQuantity: "0",
          orderQuantity: values.orderQuantity,
          unitCode: values.unitCode,
          unitPrice: values.unitPrice,
          memo: "alpha.59 exact synthetic cleanup target",
        },
        createIdentity.idempotencyKey,
        201,
        changedWithReceipt(`${materialType}-material-create`),
      );
      const materialLineId = response.body.data.result.materialLineId;
      assert.match(materialLineId, /^[0-9a-f-]{36}$/i);
      syntheticMaterialIds.push(materialLineId);
      syntheticMaterialRecords.push(Object.freeze({ id: materialLineId, materialType }));
      version = response.body.data.nextVersion;
      return materialLineId;
    };
    const fabricId = await createSyntheticMaterial("fabric", {
      colorOption: "NAVY",
      requiredQuantity: "2",
      allowanceQuantity: "0.5",
      orderQuantity: "2.5",
      unitCode: "m",
      unitPrice: "10000",
    });
    const accessoryId = await createSyntheticMaterial("accessory", {
      colorOption: "SILVER",
      requiredQuantity: "3",
      allowanceQuantity: "0.25",
      orderQuantity: "3.25",
      unitCode: "개",
      unitPrice: "2000",
    });
    const fabricPatchIdentity = identity("fabric-material-patch");
    const fabricPatch = await mutate(
      `${materialCollectionPath}/${fabricId}`,
      "PATCH",
      {
        clientRequestId: fabricPatchIdentity.clientRequestId,
        expectedVersion: version,
        patch: {
          name: `${materialMarker}-FABRIC-INLINE`,
          colorOption: "IVORY",
          requiredQuantity: "2.25",
          allowanceQuantity: "0.75",
          orderQuantity: "3",
          unitCode: "yd",
          unitPrice: "12000",
        },
      },
      undefined,
      200,
      changedWithoutReceipt("fabric-material-patch"),
    );
    version = fabricPatch.body.data.nextVersion;
    const accessoryPatchIdentity = identity("accessory-material-patch");
    const accessoryPatch = await mutate(
      `${materialCollectionPath}/${accessoryId}`,
      "PATCH",
      {
        clientRequestId: accessoryPatchIdentity.clientRequestId,
        expectedVersion: version,
        patch: {
          name: `${materialMarker}-ACCESSORY-INLINE`,
          colorOption: "GOLD",
          requiredQuantity: "2.25",
          allowanceQuantity: "0.75",
          orderQuantity: "3",
          unitCode: "장",
          unitPrice: "3000",
        },
      },
      undefined,
      200,
      changedWithoutReceipt("accessory-material-patch"),
    );
    version = accessoryPatch.body.data.nextVersion;
    const fabricRead = await jsonRequest(`${materialCollectionPath}?type=fabric&lifecycle=active&limit=30`, { kind: "fabric-read-after-patch" });
    const accessoryRead = await jsonRequest(`${materialCollectionPath}?type=accessory&lifecycle=active&limit=30`, { kind: "accessory-read-after-patch" });
    assert.equal(fabricRead.response.status, 200);
    assert.equal(accessoryRead.response.status, 200);
    const fabricLine = fabricRead.body.data.items.find((line) => line.id === fabricId);
    const accessoryLine = accessoryRead.body.data.items.find((line) => line.id === accessoryId);
    assert.deepEqual(
      [fabricLine?.name, fabricLine?.colorOption, fabricLine?.unitCode, fabricLine?.requiredQuantity, fabricLine?.allowanceQuantity, fabricLine?.inventoryUsageQuantity, fabricLine?.orderQuantity, fabricLine?.unitPrice, fabricLine?.amount],
      [`${materialMarker}-FABRIC-INLINE`, "IVORY", "yd", "2.250", "0.750", "0.000", "3.000", "12000.00", "36000.00"],
    );
    assert.deepEqual(
      [accessoryLine?.name, accessoryLine?.colorOption, accessoryLine?.unitCode, accessoryLine?.requiredQuantity, accessoryLine?.allowanceQuantity, accessoryLine?.inventoryUsageQuantity, accessoryLine?.orderQuantity, accessoryLine?.unitPrice, accessoryLine?.amount],
      [`${materialMarker}-ACCESSORY-INLINE`, "GOLD", "장", "2.250", "0.750", "0.000", "3.000", "3000.00", "9000.00"],
    );
    const detailAfterMaterials = await jsonRequest(`/api/v2/work-orders/${targetItem.workOrderId}`, { kind: "detail-after-materials" });
    assert.equal(detailAfterMaterials.response.status, 200);
    assert.equal(Number(detailAfterMaterials.body.data.amounts.fabricTotal), Number(before.amounts.fabric) + 36000);
    assert.equal(Number(detailAfterMaterials.body.data.amounts.accessoryTotal), Number(before.amounts.accessory) + 9000);
    assert.equal(Number(detailAfterMaterials.body.data.amounts.estimatedTotal), Number(before.amounts.estimated) + 45000);

    const conflictIdentity = identity("stale-conflict");
    await mutate(
      `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
      "PATCH",
      { clientRequestId: conflictIdentity.clientRequestId, expectedVersion: before.workOrderVersion, quantity: 11 },
      conflictIdentity.idempotencyKey,
      409,
      zeroDelta("stale-conflict-rejected", "rejected"),
    );

    const anonymousIdentity = identity("anonymous");
    await trackedJsonRequest({
      key: "anonymous-rejected",
      expectedSemantic: "rejected",
      expectedDeltas: zeroDelta("anonymous-rejected", "rejected").expectedDeltas,
      route: `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
      options: {
        method: "PATCH",
        body: { clientRequestId: anonymousIdentity.clientRequestId, expectedVersion: version, quantity: 11 },
        idempotencyKey: anonymousIdentity.idempotencyKey,
        anonymous: true,
        kind: "anonymous",
      },
      expectedStatus: 401,
    });
    const malformed = await trackedJsonRequest({
      key: "malformed-rejected",
      expectedSemantic: "rejected",
      expectedDeltas: zeroDelta("malformed-rejected", "rejected").expectedDeltas,
      route: `/api/v2/work-orders/not-a-uuid/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
      options: {
        method: "PATCH",
        body: { clientRequestId: "a59-malformed-route", expectedVersion: version, quantity: 11 },
        idempotencyKey: "a59-malformed-route",
        kind: "malformed",
      },
      expectedStatus: 404,
    });
    const methodBlocked = await trackedJsonRequest({
      key: "method-rejected",
      expectedSemantic: "rejected",
      expectedDeltas: zeroDelta("method-rejected", "rejected").expectedDeltas,
      route: `/api/v2/work-orders/${targetItem.workOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
      options: { method: "DELETE", kind: "method-blocked" },
      expectedStatus: 404,
    });
    let foreignWorkspace = "SKIPPED_NO_FOREIGN_CANDIDATE";
    if (before.foreignWorkOrderId) {
      const foreignIdentity = identity("foreign");
      await trackedJsonRequest({
        key: "foreign-rejected",
        expectedSemantic: "rejected",
        expectedDeltas: zeroDelta("foreign-rejected", "rejected").expectedDeltas,
        route: `/api/v2/work-orders/${before.foreignWorkOrderId}/size-color/quantities/${syntheticColorId}/${syntheticSizeId}`,
        options: {
          method: "PATCH",
          body: { clientRequestId: foreignIdentity.clientRequestId, expectedVersion: 1, quantity: 11 },
          idempotencyKey: foreignIdentity.idempotencyKey,
          kind: "foreign",
        },
        expectedStatus: 404,
      });
      foreignWorkspace = "PASS_404";
    }

    const accountingSummary = summarizeValidatedStepLedger(accountingSteps);
    persistAccountingEvidence(accountingSteps, accountingSummary);
    assert.equal(version, before.workOrderVersion + accountingSummary.workOrderVersion);
    assert.equal(prefixSyntheticColorIds.length, 2, "COLOR_CLEANUP_PREFIX_SCENARIO_COUNT_MISMATCH");
    assert.equal(exactSequenceColorRecords.length, 3, "COLOR_CLEANUP_EXACT_SCENARIO_COUNT_MISMATCH");
    cleanupOwnershipEvidence = await cleanupExactFixtureChildren(client, {
      ...cleanupContext,
      sizeIds: syntheticSizeIds,
      exactSizeIds: exactSequenceSizeIds,
      prefixSyntheticColorIds,
      exactSequenceColors: exactSequenceColorRecords,
      materialRecords: syntheticMaterialRecords,
      mode: "normal",
    });
    colorCleanupCompleted = true;
    cleanupCompleted = true;
    const after = await snapshot(client, targetItem.workOrderId);
    assert.equal(after.workOrderVersion - before.workOrderVersion, accountingSummary.workOrderVersion);
    assert.equal(after.revisionVersion - before.revisionVersion, accountingSummary.revisionVersion);
    assert.equal(after.events - before.events, accountingSummary.events);
    assert.equal(after.receipts - before.receipts, accountingSummary.receipts);
    assert.equal(after.migrations - before.migrations, 0);
    assert.deepEqual(after.sizes.map((row) => row.id), originalSizeIds);
    assert.deepEqual(after.colors.map((row) => row.id), originalColorIds);
    assert.deepEqual(after.sizes.map((row) => [row.id, row.size_code, row.display_label]), before.sizes.map((row) => [row.id, row.size_code, row.display_label]));
    assert.deepEqual(after.colors.map((row) => [row.id, row.color_code, row.display_name, row.hex_value]), before.colors.map((row) => [row.id, row.color_code, row.display_name, row.hex_value]));
    assert.deepEqual(after.linkCounts, before.linkCounts);
    assert.deepEqual(after.materials.map((row) => row.id), originalMaterialIds);
    assert.deepEqual(after.materials, before.materials);
    assert.deepEqual(after.amounts, before.amounts);
    assert.equal(after.nonzeroInventoryUseRows, before.nonzeroInventoryUseRows);
    assert.equal(after.sizes.some((row) => syntheticSizeIds.includes(row.id)), false);
    assert.equal(after.colors.some((row) => [...prefixSyntheticColorIds, ...exactSequenceColorIds].includes(row.id)), false);

    const metro = await verifyMetro(state, {
      automaticOrderingPassed: true,
      mobileManualReorderRequests: 0,
      readOnlyRegression,
      readOnly: {
        editability: readOnlyEditability,
        projection: readOnlyProjection,
        requestLedger: readOnlyRequestLedger,
      },
      matrixIdentityPreserved: true,
      specIdentityPreserved: JSON.stringify(after.linkCounts) === JSON.stringify(before.linkCounts),
    });
    const logIssues = logIssueCounts(state);
    const runtimeGateFailures = [
      ...metro.failedMarkerKeys.map((key) => `METRO_MARKER:${key}`),
      ...(logIssues.total === 0 ? [] : [`RUNTIME_LOG_ISSUES:${logIssues.total}`]),
    ];
    const output = {
      result: runtimeGateFailures.length === 0 ? "PASS" : "FAIL",
      checkpoint: runtimeGateFailures.length === 0 ? SUCCESS_CHECKPOINT : FAILURE_CHECKPOINT,
      navigation: `작업지시서 목록 → ${qaItem.productName} → 사이즈·색상`,
      exactDraftQaProductName: targetItem.productName,
      iphoneQaProductName: qaItem.productName,
      readOnlyRegressionProductName: READ_ONLY_REGRESSION_PRODUCT,
      materialRichDraftProductName,
      accessoryRichDraftProductName,
      readOnlyRegression,
      readOnlyEvidence: {
        editability: readOnlyEditability,
        projection: readOnlyProjection,
        requestLedger: readOnlyRequestLedger,
      },
      fixture: {
        helper: "scripts/run-wafl-v2-alpha46-create-qa-draft.mjs",
        count: 1,
        creationMarker: fixtureContext.creationMarker,
        originalProductName: fixtureContext.originalProductName,
        currentProductName: inlineProductName,
        productNameChangedBeforeCleanup: true,
        companyRef: identityRef(fixtureContext.companyId),
        workOrderRef: identityRef(fixtureContext.workOrderId),
        revisionRef: identityRef(fixtureContext.revisionId),
        status: "draft",
        revisionStatus: "draft",
        initialCounts: { size: 0, color: 0, quantity: 0, spec: 0, material: 0 },
        generatedIdRefs: {
          sizes: [...exactSequenceSizeIds, ...syntheticSizeIds].map(identityRef),
          colors: [...prefixSyntheticColorIds, ...exactSequenceColorIds].map(identityRef),
          materials: syntheticMaterialIds.map(identityRef),
          quantities: [
            `${identityRef(syntheticColorId)}:${identityRef(syntheticSizeId)}`,
            `${identityRef(syntheticColorId)}:${identityRef(syntheticSizeAnchorId)}`,
            `${identityRef(syntheticColorAnchorId)}:${identityRef(syntheticSizeId)}`,
          ],
        },
      },
      commands: {
        workOrderProductNameInlineCommandPath: "PASS_PATCH_200_RECEIPT_0_SOURCE_DERIVED",
        exact445566Sequence: {
          status: "PASS",
          start: exactSequenceStart,
          requests: exactSequenceRequests,
          finalOrder: ["44", "55", "66"],
          first44RequestedAndSucceeded: exactSequenceRequests[0]?.displayLabel === "44" && exactSequenceRequests[0]?.status === 201,
          sequentialNoParallelSameVersion: true,
          perItemIdempotency: exactSequenceRequests.every((request) => typeof request.idempotencyRef === "string"),
          firstItemFailure: false,
          cleanup: "PASS_EXACT_TEST_OWNED_IDS",
        },
        exactWhiteIvoryGraySequence: {
          status: "PASS",
          start: exactColorSequenceStart,
          requests: exactColorSequenceRequests,
          finalOrder: ["화이트", "아이보리", "그레이"],
          firstWhiteRequestedAndSucceeded: exactColorSequenceRequests[0]?.displayName === "화이트" && exactColorSequenceRequests[0]?.status === 201,
          sequentialNoParallelSameVersion: true,
          perItemIdempotency: exactColorSequenceRequests.every((request) => typeof request.idempotencyRef === "string"),
          cleanup: "PASS_EXACT_TEST_OWNED_IDS",
        },
        sizeCreateReadRenameAutomaticSort: "PASS",
        sizePresetDirectCreateSequence: "PASS_EXACT_44_55_66_AND_SHARED_CREATE_COMMAND",
        colorCreateReadPatchAutomaticSort: "PASS",
        colorPaletteVisualGridCreateSequence: "PASS_EXACT_WHITE_IVORY_GRAY_AND_SHARED_CREATE_COMMAND",
        unchangedMobileRequests: 0,
        idempotentReplays: 2,
        duplicateName: "PASS_409",
        staleConflict: "PASS_409",
        quantityCreateUpdateRead: "PASS_3_TO_8_TO_15_UPDATE_TO_16",
        quantityUnchangedCommandMutation: 0,
        quantityTotalProjection: "PASS_MATRIX_SUM_WORK_ORDER_REVISION_0_3_8_15_16",
        quantityIdentityAfterSizeColorAutomaticSort: "PASS",
        finishedMeasurementIdentityRegression: after.linkCounts.specValues === before.linkCounts.specValues
          && after.linkCounts.specSizes === before.linkCounts.specSizes ? "PASS" : "FAIL",
        actualIphoneReelAndVisualHierarchy: "REQA_REQUIRED",
        companyColorLibraryDeferred: "separate schema/permission/snapshot-copy scope required",
        sizeColorDeleteDeferred: "lifecycle/schema policy required",
        finishedMeasurementEditDeferred: true,
        totalQuantitySyncDeferred: false,
        totalQuantityCanonicalSource: "SUM(color_size_quantities.quantity)",
        materialCreatePatchFormula: "PASS",
        accessoryCreatePatchFormula: "PASS",
        materialAccessoryInlinePatchFields: ["name", "colorOption", "unitCode", "unitPrice"],
        quarterQuantityRuntime: {
          requiredQuantity: "2.25",
          allowanceQuantity: "0.75",
          orderQuantity: "3",
          fabricAmount: "36000.00",
          accessoryAmount: "9000.00",
          status: "PASS",
        },
        totalQuantityDecimalBoundary: "TOTAL_QUANTITY_DECIMAL_MIGRATION_REQUIRED",
        historicalRequestedCompletedCancelledMutation: 0,
      },
      security: {
        anonymous: 401,
        foreignWorkspace,
        malformedUuid: malformed.response.status,
        methodBlocked: methodBlocked.response.status,
        productionScope: "BLOCKED",
      },
      cleanup: {
        colorOwnership: cleanupOwnershipEvidence,
        syntheticSizeRows: 0,
        syntheticColorRows: 0,
        syntheticQuantityLinks: 0,
        syntheticSpecLinks: 0,
        syntheticMaterialRows: 0,
        existingNamesAndRelativeOrderRestored: true,
        temporaryWorkOrder: 0,
        revision: 0,
        userOwnedMutation: 0,
        productionMutation: 0,
      },
      mutation: {
        expectedCommandCount: accountingSummary.changed,
        workOrderVersionDelta: accountingSummary.workOrderVersion,
        revisionVersionDelta: accountingSummary.revisionVersion,
        eventDelta: accountingSummary.events,
        receiptDelta: accountingSummary.receipts,
        migrationDelta: 0,
        r2PutDeleteRequests: requests.filter((request) => request.method === "PUT").length,
        productionRequests: 0,
        userCreatedQaRowsDeletedOrRewritten: 0,
      },
      appendOnlyLedger: {
        previousRuns: [
          { name: "first-blocked", workOrderVersionDelta: 16, revisionVersionDelta: 16, eventDelta: 16, receiptDelta: 14 },
          { name: "second-blocked", workOrderVersionDelta: 16, revisionVersionDelta: 16, eventDelta: 16, receiptDelta: 14 },
          { name: "corrected-marker-pass", workOrderVersionDelta: 16, revisionVersionDelta: 16, eventDelta: 16, receiptDelta: 14 },
          { name: "first-picker-drag-blocked", workOrderVersionDelta: 18, revisionVersionDelta: 18, eventDelta: 18, receiptDelta: 16 },
        ],
        currentContinuationRun: {
          workOrderVersionDelta: accountingSummary.workOrderVersion,
          revisionVersionDelta: accountingSummary.revisionVersion,
          eventDelta: accountingSummary.events,
          receiptDelta: accountingSummary.receipts,
        },
      },
      accounting: {
        derivation: "sum-of-validated-step-ledger",
        summary: accountingSummary,
        steps: accountingSteps,
      },
      inventoryUseAudit: {
        approvedDevTestNonzeroRows: before.nonzeroInventoryUseRows,
        rowsMutated: 0,
        productionQueried: false,
      },
      metro,
      logs: logIssues,
      runtimeGateFailures,
      runtime: {
        next: 3100,
        metro: 8081,
        tailscaleServe: "443->3100",
        port3000: 0,
        cloudflared: 0,
        quickTunnel: 0,
        funnel: 0,
        commandApi: "alpha59-exact-routes-only",
      },
      requestCount: requests.length,
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, serializeRuntimeResult(output), "utf8");
    console.log(JSON.stringify(output));
    assert.equal(
      runtimeGateFailures.length,
      0,
      `METRO_OR_RUNTIME_FINAL_GATE_FAILED:${runtimeGateFailures.join(",")}`,
    );
  } finally {
    let childCleanupError = null;
    try {
      if (!cleanupCompleted && cleanupContext && (syntheticSizeIds.length || exactSequenceSizeIds.length || prefixSyntheticColorIds.length || exactSequenceColorRecords.length || syntheticMaterialIds.length)) {
        await cleanupExactFixtureChildren(client, {
          ...cleanupContext,
          sizeIds: syntheticSizeIds,
          exactSizeIds: exactSequenceSizeIds,
          prefixSyntheticColorIds: colorCleanupCompleted ? [] : prefixSyntheticColorIds,
          exactSequenceColors: colorCleanupCompleted ? [] : exactSequenceColorRecords,
          materialRecords: syntheticMaterialRecords,
          mode: "finally-fallback",
        });
      }
    } catch (error) {
      childCleanupError = error;
    }
    try {
      if (!fixtureContext && isolatedMarker) {
        const partial = (await client.query(`
          SELECT id, company_id, current_revision_id FROM work_orders
          WHERE company_id=$1 AND product_name=$2 AND status='draft' AND deleted_at IS NULL
          ORDER BY created_at, id
        `, [APPROVED_DEV_TEST_COMPANY, isolatedMarker])).rows;
        assert.ok(partial.length <= 1, "ISOLATED_FIXTURE_PARTIAL_NOT_UNIQUE");
        if (partial.length === 1) {
          fixtureContext = Object.freeze({
            companyId: partial[0].company_id,
            workOrderId: partial[0].id,
            revisionId: partial[0].current_revision_id,
            creationMarker: isolatedMarker,
            originalProductName: isolatedMarker,
          });
        }
      }
      if (fixtureContext) {
        const createdChildIds = {
          sizes: [...syntheticSizeIds, ...exactSequenceSizeIds],
          colors: [...prefixSyntheticColorIds, ...exactSequenceColorIds],
          quantities: syntheticSizeIds[0] && syntheticSizeIds[1] && prefixSyntheticColorIds[0] && prefixSyntheticColorIds[1]
            ? [
                `${prefixSyntheticColorIds[0]}:${syntheticSizeIds[0]}`,
                `${prefixSyntheticColorIds[0]}:${syntheticSizeIds[1]}`,
                `${prefixSyntheticColorIds[1]}:${syntheticSizeIds[0]}`,
              ]
            : [],
          specs: [],
          materials: syntheticMaterialRecords.filter((record) => record.materialType === "fabric").map((record) => record.id),
          accessories: syntheticMaterialRecords.filter((record) => record.materialType === "accessory").map((record) => record.id),
        };
        fixtureCleanup = await cleanupTemporaryIsolatedDraft(client, { ...fixtureContext, createdChildIds });
      }
      if (userOwnedBefore) {
        const userOwnedAfter = await readUserOwnedSnapshots(client);
        assert.deepEqual(userOwnedAfter, userOwnedBefore, "USER_OWNED_WORK_ORDER_MUTATION_DETECTED");
      }
      if (fixtureCleanup && fs.existsSync(RESULT_PATH)) {
        const persisted = JSON.parse(fs.readFileSync(RESULT_PATH, "utf8"));
        persisted.cleanup = { ...persisted.cleanup, ...fixtureCleanup };
        persisted.fixture = { ...persisted.fixture, cleanup: "PASS_EXACT_PARENT_AND_CHILD_IDS" };
        fs.writeFileSync(RESULT_PATH, serializeRuntimeResult(persisted), "utf8");
        console.log(JSON.stringify({ runtimeQaStep: "fixture-cleanup-complete", cleanup: fixtureCleanup }));
      }
      if (childCleanupError) throw childCleanupError;
    } finally {
      await client.end();
    }
  }
}

run().catch((error) => {
  let accounting = null;
  let cleanupOwnership = null;
  try {
    if (fs.existsSync(ACCOUNTING_EVIDENCE_PATH)) {
      accounting = JSON.parse(fs.readFileSync(ACCOUNTING_EVIDENCE_PATH, "utf8"));
    }
  } catch {
    accounting = { evidenceRead: "FAILED" };
  }
  try {
    if (fs.existsSync(CLEANUP_OWNERSHIP_EVIDENCE_PATH)) {
      cleanupOwnership = JSON.parse(fs.readFileSync(CLEANUP_OWNERSHIP_EVIDENCE_PATH, "utf8"));
    }
  } catch {
    cleanupOwnership = { evidenceRead: "FAILED" };
  }
  const failure = {
    result: "FAIL",
    checkpoint: FAILURE_CHECKPOINT,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message : "unknown",
    accounting,
    cleanupOwnership,
  };
  fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
  fs.writeFileSync(RESULT_PATH, serializeRuntimeResult(failure), "utf8");
  console.error(JSON.stringify(failure));
  process.exitCode = 1;
});
