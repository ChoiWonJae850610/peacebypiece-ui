#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { snapshotSizeColorTables } from "./lib/alpha58-readonly-snapshot.mjs";
import {
  normalizeCompiledBundleText,
  serializeMutationObservation,
  serializeRuntimeResult,
} from "./lib/alpha58-runtime-evidence.mjs";

const { Client } = pg;
const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const RESULT_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha58-size-color-runtime-result.json");
const TARGET_PRODUCT_NAME = "리넨 라운드 셔츠 원피스";
const NAVIGATION_PATH = `작업지시서 목록 → ${TARGET_PRODUCT_NAME} → 사이즈·색상`;
const SUCCESS_CHECKPOINT = "ALPHA58_FINAL_UX_CLEANUP_IPHONE_REQA_REQUIRED";
const EXPECTED_DATA = Object.freeze({
  sizes: 3,
  colors: 3,
  quantityCells: 9,
  pomColumns: 5,
  specificationCells: 15,
  measurementUnit: "cm",
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function shortRef(value) {
  return sha256(String(value)).slice(0, 12);
}

function readDatabaseUrl() {
  const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const line = text.split(/\r?\n/).find((candidate) => /^\s*DATABASE_URL\s*=/.test(candidate));
  assert.ok(line, "DATABASE_URL_MISSING");
  let value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return value;
}

function assertRunnerState() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "external-device");
  assert.equal(state.mutationMode, "read-only");
  assert.equal(state.commandApi, "blocked");
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

function assertReadOnlyNavigationContract() {
  const experienceSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "MobileWorkOrderExperience.tsx"),
    "utf8",
  );
  const detailSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "overview", "WorkOrderDetailOverview.tsx"),
    "utf8",
  );
  const componentSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "WorkOrderSizeColorReadOnly.tsx"),
    "utf8",
  );
  const controllerSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "size-color", "useSizeColorReadController.ts"),
    "utf8",
  );
  const imageSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "images", "WorkOrderImageGallery.tsx"),
    "utf8",
  );
  const loadingPolicySource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "loading", "delayedLoadingPolicy.ts"),
    "utf8",
  );
  const materialSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "materials", "WorkOrderMaterialsReadOnly.tsx"),
    "utf8",
  );
  const presentationSource = fs.readFileSync(
    path.join(ROOT, "apps", "mobile", "features", "work-orders", "overview", "workOrderDetailPresentation.ts"),
    "utf8",
  );
  assert.match(detailSource, /import WorkOrderSizeColorReadOnly from/);
  assert.match(detailSource, /import type \{ SizeColorReadBoundary \}/);
  assert.match(detailSource, /props\.sizeColor\.onOpen\(\)/);
  const boundary = controllerSource.slice(
    controllerSource.indexOf("export type SizeColorReadBoundary"),
    controllerSource.indexOf("type ActiveIdentity"),
  );
  assert.match(boundary, /readonly state:/);
  assert.match(boundary, /readonly onOpen:/);
  assert.match(boundary, /readonly onRetry:/);
  assert.doesNotMatch(boundary, /save|edit|add|delete|create|update|mutation/i);
  const componentImports = componentSource.match(/^import .*$/gm)?.join("\n") ?? "";
  assert.doesNotMatch(componentImports, /apiClient|Mutation|workOrderQueryController|fetch|axios/i);
  assert.doesNotMatch(
    componentSource,
    /<TextInput\b|\bon(?:Save|Delete|Add|Edit)\s*=|accessibilityLabel="(?:저장|추가|삭제|수정)"/,
  );
  const customerSources = [
    experienceSource,
    detailSource,
    imageSource,
    componentSource,
    materialSource,
  ].join("\n");
  for (const removedCopy of [
    "사이즈·색상은 실제 저장 데이터를 읽기 전용으로 표시합니다.",
    "제작과 문서는 다음 단계에서 연결합니다.",
    "발행된 작업지시서는 읽기 전용입니다.",
    "첫 이미지만 자동 대표가 됩니다.",
    "작업지시서 상세를 불러오는 중",
  ]) assert.equal(customerSources.includes(removedCopy), false);
  assert.equal(detailSource.includes('<Section title="기본정보">'), false);
  assert.equal(imageSource.includes(">작업지시서 이미지</Text>"), false);
  assert.equal(componentSource.includes(">사이즈·색상</Text>"), false);
  assert.match(detailSource, /readOnlyBadgeLabel/);
  assert.match(detailSource, /resolveWorkOrderTabVisualState/);
  assert.match(presentationSource, /return canEdit \? null : "읽기 전용"/);
  assert.match(loadingPolicySource, /DELAYED_LOADING_THRESHOLD_MS = 400/);
  for (const source of [experienceSource, componentSource, materialSource]) {
    assert.match(source, /DelayedLoadingMessage/);
    assert.doesNotMatch(source, /setTimeout\s*\(/);
  }
  return {
    activeTabSharedPolicy: true,
    delayedLoadingSharedPolicy: true,
    developerProgressCopyAbsent: true,
    duplicateTopHeadingsAbsent: true,
    navigationUsesReadOnlyComponent: true,
    readOnlyBadgePolicy: true,
    readOnlyBoundaryMutationActions: 0,
    readOnlyComponentNetworkDependencies: 0,
    editAddDeleteSaveControlsAbsent: true,
  };
}

async function verifyMeasurementConversionContract(actualCells, actualStoredUnit) {
  const displayModelUrl = pathToFileURL(path.join(
    ROOT,
    "apps",
    "mobile",
    "features",
    "work-orders",
    "size-color",
    "sizeColorDisplayModel.ts",
  )).href;
  const { displayMeasurement, normalizeSameUnitCentimeterDisplay } = await import(displayModelUrl);
  const cell = (decimalValue, displayValue = decimalValue) => ({
    sizeRowId: "runtime-size",
    pomColumnId: "runtime-pom",
    decimalValue,
    displayValue,
  });
  const examples = {
    sameUnitCmInteger: normalizeSameUnitCentimeterDisplay("50.0000"),
    sameUnitCmHalf: normalizeSameUnitCentimeterDisplay("50.5000"),
    sameUnitCmQuarter: normalizeSameUnitCentimeterDisplay("50.2500"),
    sameUnitCmEighth: normalizeSameUnitCentimeterDisplay("50.1250"),
    sameUnitCmZero: normalizeSameUnitCentimeterDisplay("0.0000"),
    sameUnitCmPrecisionPreserved: normalizeSameUnitCentimeterDisplay("50.1234000"),
    nonnumericStoredDisplayPreserved: displayMeasurement(cell("31.75", "31.75 cm"), "cm", "cm"),
    storedInchFractionPreserved: displayMeasurement(cell("0.125", "1/8"), "inch", "inch"),
    centimeterToWholeInch: displayMeasurement(cell("2.54"), "cm", "inch"),
    centimeterToEighthInch: displayMeasurement(cell("1"), "cm", "inch"),
    centimeterToMixedEighthInch: displayMeasurement(cell("31.75"), "cm", "inch"),
    inchToCentimeter: displayMeasurement(cell("1"), "inch", "cm"),
    inchToRoundedCentimeter: displayMeasurement(cell("12.5"), "inch", "cm"),
  };
  assert.deepEqual(examples, {
    sameUnitCmInteger: "50",
    sameUnitCmHalf: "50.5",
    sameUnitCmQuarter: "50.25",
    sameUnitCmEighth: "50.125",
    sameUnitCmZero: "0",
    sameUnitCmPrecisionPreserved: "50.1234",
    nonnumericStoredDisplayPreserved: "31.75 cm",
    storedInchFractionPreserved: "1/8",
    centimeterToWholeInch: "1",
    centimeterToEighthInch: "3/8",
    centimeterToMixedEighthInch: "12 1/2",
    inchToCentimeter: "2.5",
    inchToRoundedCentimeter: "31.8",
  });

  const decimalDisplayPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  const decimalTrailingZeroPattern = /^(?:0|[1-9]\d*)\.\d*0$/;
  let normalizedNumericCells = 0;
  let trailingZeroViolations = 0;
  let nonnumericPreservationViolations = 0;
  for (const actualCell of actualCells) {
    const source = actualCell.displayValue?.trim() || actualCell.decimalValue?.trim() || "";
    const rendered = displayMeasurement(actualCell, actualStoredUnit, actualStoredUnit);
    if (decimalDisplayPattern.test(source) && rendered !== source) normalizedNumericCells += 1;
    if (decimalTrailingZeroPattern.test(rendered)) trailingZeroViolations += 1;
    if (source && !decimalDisplayPattern.test(source) && rendered !== source) {
      nonnumericPreservationViolations += 1;
    }
  }
  assert.equal(trailingZeroViolations, 0);
  assert.equal(nonnumericPreservationViolations, 0);

  return {
    examples,
    actualFixture: {
      cellsChecked: actualCells.length,
      normalizedNumericCells,
      trailingZeroViolations,
      nonnumericPreservationViolations,
    },
  };
}

async function verifyMetroIosBundle(state) {
  const manifestResponse = await fetch(`http://127.0.0.1:${state.expoPort}/`, {
    headers: { Accept: "application/expo+json", "Expo-Platform": "ios" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/expo\+json/);
  const manifest = await manifestResponse.json();
  assert.equal(typeof manifest?.launchAsset?.url, "string");
  const bundleResponse = await fetch(manifest.launchAsset.url, { signal: AbortSignal.timeout(180_000) });
  assert.equal(bundleResponse.status, 200);
  assert.match(bundleResponse.headers.get("content-type") ?? "", /application\/javascript/);
  const text = await bundleResponse.text();
  const normalizedText = normalizeCompiledBundleText(text);
  const readOnlyStaticContract = assertReadOnlyNavigationContract();
  const markers = {
    sizeColorRoute: normalizedText.includes("/size-color"),
    sizeSpecRoute: normalizedText.includes("/size-spec"),
    readOnlyComponent: normalizedText.includes("사이즈·색상 읽기 전용 정보"),
    finishedMeasurements: normalizedText.includes("완성 치수"),
    unitDisplayControl: normalizedText.includes("완성 치수 표시 단위"),
    centimeterUnit: normalizedText.includes("cm"),
    inchUnit: normalizedText.includes("inch"),
    quantityMatrixUi: [
      "합계 일치",
      "합계 불일치",
      "매트릭스 합계",
      "개요 총수량",
    ].some((marker) => normalizedText.includes(marker)),
    loadingCopy: [
      "작업지시서를 불러오는 중입니다.",
      "이미지와 첨부파일을 불러오는 중입니다.",
      "사이즈·색상 정보를 불러오는 중입니다.",
      "원단 정보를 불러오는 중입니다.",
      "부자재 정보를 불러오는 중입니다.",
    ].every((marker) => normalizedText.includes(marker)),
    readOnlyBadge: normalizedText.includes("읽기 전용"),
  };
  assert.deepEqual(markers, {
    sizeColorRoute: true,
    sizeSpecRoute: true,
    readOnlyComponent: true,
    finishedMeasurements: true,
    unitDisplayControl: true,
    centimeterUnit: true,
    inchUnit: true,
    quantityMatrixUi: true,
    loadingCopy: true,
    readOnlyBadge: true,
  });
  assert.doesNotMatch(text, /WAFL_ALPHA58_SIZE_COLOR_MUTATION/);
  return {
    manifestStatus: 200,
    bundleStatus: 200,
    bundleBytes: Buffer.byteLength(text),
    markers,
    readOnlyStaticContract,
  };
}

async function run() {
  const state = assertRunnerState();
  const runtimeBaseUrl = `https://${state.tailscaleServeHostname}`;
  let cookie = "";
  const requests = [];

  async function jsonRequest(route, options = {}) {
    const response = await fetch(`${runtimeBaseUrl}${route}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      signal: AbortSignal.timeout(60_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* asserted by callers */ }
    requests.push({ routeKind: options.routeKind ?? "read", method: options.method ?? "GET", status: response.status });
    return { response, body };
  }

  const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST", routeKind: "developer-auto-connect" });
  assert.equal(auth.response.status, 200);
  assert.equal(auth.body?.ok, true);
  assert.equal(auth.body?.connected, true);
  assert.ok(cookie, "DEVELOPER_AUTO_CONNECT_COOKIE_MISSING");

  const candidates = [];
  let cursor = null;
  for (let pageIndex = 0; pageIndex < 4 && candidates.length < 150; pageIndex += 1) {
    const route = `/api/v2/work-orders?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page = await jsonRequest(route, { routeKind: "work-order-list" });
    assert.equal(page.response.status, 200);
    assert.equal(page.body?.ok, true);
    assert.ok(Array.isArray(page.body?.data?.items));
    candidates.push(...page.body.data.items);
    if (!page.body.data.hasMore) break;
    assert.equal(typeof page.body.data.nextCursor, "string");
    cursor = page.body.data.nextCursor;
  }
  assert.ok(candidates.length > 0, "VISIBLE_WORK_ORDER_NOT_FOUND");

  const targetItem = candidates.find((item) => item.productName === TARGET_PRODUCT_NAME);
  assert.ok(targetItem, "REQUIRED_IPHONE_QA_TARGET_NOT_VISIBLE");

  const client = new Client({ connectionString: readDatabaseUrl(), application_name: "wafl-alpha58-size-color-read-runtime-qa" });
  await client.connect();
  try {
    const before = await snapshotSizeColorTables(client, targetItem.workOrderId);
    const [matrix, specifications] = await Promise.all([
      jsonRequest(`/api/v2/work-orders/${encodeURIComponent(targetItem.workOrderId)}/size-color`, { routeKind: "size-color-target" }),
      jsonRequest(`/api/v2/work-orders/${encodeURIComponent(targetItem.workOrderId)}/size-spec`, { routeKind: "size-spec-target" }),
    ]);
    assert.equal(matrix.response.status, 200);
    assert.equal(specifications.response.status, 200);
    assert.equal(matrix.body?.ok, true);
    assert.equal(specifications.body?.ok, true);
    const selected = { item: targetItem, matrixData: matrix.body.data, specData: specifications.body.data };
    assert.equal(selected.matrixData.workOrderId, targetItem.workOrderId);
    assert.equal(selected.specData.workOrderId, targetItem.workOrderId);
    assert.equal(selected.matrixData.revisionId, selected.specData.revisionId);
    assert.equal(selected.matrixData.entityVersion, selected.specData.entityVersion);

    const detail = await jsonRequest(`/api/v2/work-orders/${encodeURIComponent(selected.item.workOrderId)}`, { routeKind: "detail" });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body?.data?.header?.id, selected.item.workOrderId);
    assert.equal(detail.body?.data?.header?.productName, TARGET_PRODUCT_NAME);

    const matrixSum = selected.matrixData.quantityCells.reduce((sum, cell) => sum + Number(cell.quantity), 0);
    assert.equal(matrixSum, Number(selected.matrixData.matrixTotal));
    assert.equal(
      selected.matrixData.totalsMatch,
      Number(selected.matrixData.matrixTotal) === Number(selected.matrixData.expectedTotal),
    );
    assert.ok(selected.matrixData.sizes.every((row) => typeof row.displayLabel === "string"));
    assert.ok(selected.matrixData.colors.every((row) => row.hexValue === null || /^#[0-9a-fA-F]{6}$/.test(row.hexValue)));
    assert.ok(selected.specData.pomColumns.every((row) => typeof row.displayName === "string"));
    assert.ok(["cm", "inch"].includes(selected.specData.measurementUnit));
    assert.equal(selected.matrixData.sizes.length, EXPECTED_DATA.sizes);
    assert.equal(selected.matrixData.colors.length, EXPECTED_DATA.colors);
    assert.equal(selected.matrixData.quantityCells.length, EXPECTED_DATA.quantityCells);
    assert.equal(selected.specData.pomColumns.length, EXPECTED_DATA.pomColumns);
    assert.equal(selected.specData.cells.length, EXPECTED_DATA.specificationCells);
    assert.equal(selected.specData.measurementUnit, EXPECTED_DATA.measurementUnit);

    const unsupported = await jsonRequest(
      `/api/v2/work-orders/${encodeURIComponent(selected.item.workOrderId)}/size-color?unexpected=1`,
      { routeKind: "unsupported-query" },
    );
    assert.equal(unsupported.response.status, 400);
    const anonymous = await fetch(`${runtimeBaseUrl}/api/v2/work-orders/${encodeURIComponent(selected.item.workOrderId)}/size-color`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    assert.equal(anonymous.status, 401);

    let foreignWorkspace = "SKIPPED_NO_FOREIGN_CANDIDATE";
    if (before.foreignWorkOrderId) {
      const foreign = await jsonRequest(`/api/v2/work-orders/${encodeURIComponent(before.foreignWorkOrderId)}/size-color`, { routeKind: "foreign-workspace" });
      assert.equal(foreign.response.status, 404);
      foreignWorkspace = "PASS_404";
    }

    const second = candidates.find((candidate) => candidate.workOrderId !== selected.item.workOrderId) ?? null;
    let crossWorkOrderIsolation = "SKIPPED_NO_SECOND_VISIBLE_WORKORDER";
    if (second) {
      const secondMatrix = await jsonRequest(`/api/v2/work-orders/${encodeURIComponent(second.workOrderId)}/size-color`, { routeKind: "second-work-order" });
      assert.equal(secondMatrix.response.status, 200);
      assert.equal(secondMatrix.body?.data?.workOrderId, second.workOrderId);
      assert.notEqual(secondMatrix.body?.data?.workOrderId, selected.item.workOrderId);
      crossWorkOrderIsolation = "PASS";
    }

    const conversionEvidence = await verifyMeasurementConversionContract(
      selected.specData.cells,
      selected.specData.measurementUnit,
    );
    const metro = await verifyMetroIosBundle(state);
    const after = await snapshotSizeColorTables(client, selected.item.workOrderId);
    assert.equal(after.workOrderVersion, before.workOrderVersion);
    assert.equal(after.revisionVersion, before.revisionVersion);
    assert.equal(after.events, before.events);
    assert.equal(after.receipts, before.receipts);
    assert.equal(after.migrations, before.migrations);
    assert.deepEqual(after.tableCounts, before.tableCounts);
    assert.equal(after.tableFingerprint, before.tableFingerprint);

    const output = {
      result: "PASS",
      checkpoint: SUCCESS_CHECKPOINT,
      navigation: NAVIGATION_PATH,
      selectedProductName: TARGET_PRODUCT_NAME,
      targetRef: shortRef(selected.item.workOrderId),
      revisionRef: shortRef(selected.matrixData.revisionId),
      dataEvidence: {
        richStructuredData: selected.matrixData.sizes.length > 0
          || selected.matrixData.colors.length > 0
          || selected.specData.pomColumns.length > 0,
        sizes: selected.matrixData.sizes.length,
        colors: selected.matrixData.colors.length,
        quantityCells: selected.matrixData.quantityCells.length,
        pomColumns: selected.specData.pomColumns.length,
        specificationCells: selected.specData.cells.length,
        measurementUnit: selected.specData.measurementUnit,
        totalsMatch: selected.matrixData.totalsMatch,
      },
      expectedData: EXPECTED_DATA,
      conversionEvidence,
      api: {
        developerAutoConnect: 200,
        list: 200,
        detail: 200,
        sizeColor: 200,
        sizeSpec: 200,
        unsupportedQuery: 400,
        anonymous: 401,
        foreignWorkspace,
        crossWorkOrderIsolation,
      },
      metro,
      mutation: {
        workOrderVersionDelta: 0,
        revisionVersionDelta: 0,
        eventDelta: 0,
        receiptDelta: 0,
        migrationDelta: 0,
        sizeColorSpecTableDelta: 0,
        r2PutDelete: serializeMutationObservation({
          observed: false,
          reason: "no approved R2 access-ledger observer in this read-only QA",
        }),
        productionMutation: serializeMutationObservation({
          observed: false,
          reason: "production is blocked; no approved production observer was queried",
        }),
      },
      runtime: {
        nextPort: 3100,
        metroPort: 8081,
        tailscaleServeHttps: true,
        cloudflared: false,
        funnel: false,
        commandApi: "blocked",
      },
      requestCount: requests.length,
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, serializeRuntimeResult(output), "utf8");
    console.log(JSON.stringify(output));
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({
    result: "FAIL",
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message : "unknown",
  }));
  process.exitCode = 1;
});
