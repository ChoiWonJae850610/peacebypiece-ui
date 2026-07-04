import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  addWaflSessionCookie,
  buildCompanyAdminSession,
} from "./helpers/waflSession.mjs";

const artifactDir = resolve("artifacts/ui-qa/0.24.34.5/live-workorder");
const pdfArtifactDir = resolve("artifacts/pdf-qa/0.24.34.5");
const pdfPath = resolve(pdfArtifactDir, "workorder-live-product.pdf");
const pdfPngPrefix = resolve(pdfArtifactDir, "workorder-live-product-page");

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readRuntimeMode() {
  const candidates = [
    process.env.WAFL_RUNTIME,
    process.env.NEXT_PUBLIC_WAFL_RUNTIME,
    process.env.NODE_ENV,
  ].filter(Boolean);
  const joined = candidates.join(" ").toLowerCase();
  if (/\bproduction\b/.test(joined)) return "production";
  return candidates[0] ?? "development";
}

function renderPdfToPngIfAvailable(inputPdfPath) {
  const candidates = [
    { command: "pdftoppm", argsPrefix: [], label: "pdftoppm" },
    {
      command: resolve(process.env.USERPROFILE ?? "", ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe"),
      argsPrefix: [],
      label: "bundled-pdftoppm-exe",
    },
  ];
  let lastReason = "pdftoppm unavailable";
  for (const candidate of candidates) {
    if (candidate.label !== "pdftoppm" && !existsSync(candidate.command)) continue;
    try {
      execFileSync(candidate.command, [...candidate.argsPrefix, "-png", inputPdfPath, pdfPngPrefix], {
        stdio: "pipe",
        timeout: 30_000,
      });
      return { ok: true, outputPrefix: pdfPngPrefix, command: candidate.label };
    } catch (error) {
      lastReason = error instanceof Error ? error.message : "pdftoppm unavailable";
    }
  }

  return {
    ok: false,
    reason: lastReason,
  };
}

test.describe("0.24.34.5 live workorder product verification", () => {
  test("actual dev/test workorder detail, factory save, PDF viewer, and PNG evidence", async ({ context, page }, testInfo) => {
    test.setTimeout(120_000);

    const runtimeMode = readRuntimeMode();
    const evidence = {
      project: testInfo.project.name,
      runtimeMode,
      productionMutation: false,
      businessDataMutation: false,
      startedAt: new Date().toISOString(),
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      http4xx5xx: [],
      observedRequests: [],
      steps: {},
      screenshots: {},
      pdf: {},
    };
    const projectName = testInfo.project.name.replace(/[^a-z0-9_-]+/gi, "-");
    const manifestPath = resolve(artifactDir, `workorder-live-product-manifest-${projectName}.json`);

    const persistEvidence = (extra = {}) => {
      Object.assign(evidence, extra);
      evidence.consoleErrorCount = evidence.consoleErrors.length;
      evidence.failedRequestCount = evidence.failedRequests.length;
      evidence.http4xx5xxCount = evidence.http4xx5xx.length;
      evidence.currentUrl = page.url();
      writeJson(manifestPath, evidence);
    };

    if (runtimeMode === "production") {
      evidence.steps.runtimeGuard = "BLOCKED_PRODUCTION";
      persistEvidence();
      test.fail(true, "production runtime is blocked for live workorder QA");
    }

    page.on("console", (message) => {
      if (message.type() !== "error") return;
      evidence.consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    });
    page.on("pageerror", (error) => {
      evidence.pageErrors.push({
        message: error.message,
        stack: error.stack ?? null,
      });
    });
    page.on("request", (request) => {
      if (request.url().includes("/api/workorders")) {
        evidence.observedRequests.push({
          method: request.method(),
          url: request.url().replace(/[?&]cacheBust=[^&]+/g, ""),
        });
      }
    });
    page.on("requestfailed", (request) => {
      evidence.failedRequests.push({
        method: request.method(),
        url: request.url(),
        failure: request.failure()?.errorText ?? null,
      });
    });
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400) {
        evidence.http4xx5xx.push({
          status,
          url: response.url(),
        });
      }
    });

    const sessionResult = await addWaflSessionCookie(context, buildCompanyAdminSession({
      userId: "wafl-fn-company-a-user-001",
      companyId: "wafl-fn-company-a",
      companyMemberId: "wafl-fn-company-a-member-001",
      companyName: "기본 운영사",
      role: "company_admin",
      email: "wafl.fn.company.a.admin@example.test",
      name: "기본 운영사 관리자",
      googleSub: "wafl-fn-company-a-admin",
    }));
    expect(sessionResult.ok, sessionResult.reason ?? "session cookie").toBe(true);

    await page.goto("/workspace/workorders?status=all&sort=updated_desc", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText("작업지시서", { timeout: 20_000 });
    evidence.steps.workspaceShell = "PASS";
    const listScreenshot = `${projectName}-workorder-list.png`;
    const detailScreenshot = `${projectName}-workorder-detail.png`;
    await page.screenshot({ path: resolve(artifactDir, listScreenshot), fullPage: true });
    evidence.screenshots.list = listScreenshot;

    const summaryResponse = await page.evaluate(async () => {
      const response = await fetch("/api/workorders/summary?status=all&sort=updated_desc", {
        cache: "no-store",
      });
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        text,
      };
    });
    evidence.steps.summary = {
      status: summaryResponse.status,
      ok: summaryResponse.ok,
    };
    const summaryJson = JSON.parse(summaryResponse.text || "{}");
    const workOrders = Array.isArray(summaryJson.workOrders) ? summaryJson.workOrders : [];
    evidence.steps.summary.count = workOrders.length;
    evidence.steps.summary.sampleIds = workOrders.slice(0, 5).map((workOrder) => workOrder.id);
    persistEvidence();
    expect(summaryResponse.ok, summaryResponse.text).toBe(true);
    expect(workOrders.length, "dev/test DB must expose at least one existing workorder").toBeGreaterThan(0);

    const workOrderId = workOrders[0].id;
    evidence.workOrderId = workOrderId;
    await page.goto(`/workspace/workorders?workOrderId=${encodeURIComponent(workOrderId)}&status=all&sort=updated_desc`, {
      waitUntil: "domcontentloaded",
    });

    const detailResponse = await page.evaluate(async (id) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(id)}`, { cache: "no-store" });
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        text,
      };
    }, workOrderId);
    evidence.steps.detail = {
      status: detailResponse.status,
      ok: detailResponse.ok,
      body: detailResponse.text,
    };
    persistEvidence();
    expect(detailResponse.ok, detailResponse.text).toBe(true);
    const detailJson = JSON.parse(detailResponse.text || "{}");
    expect(detailJson.workOrder?.id).toBe(workOrderId);
    await expect(page.locator("body")).toContainText(detailJson.workOrder.displayTitle ?? detailJson.workOrder.title, { timeout: 20_000 });
    await page.screenshot({ path: resolve(artifactDir, detailScreenshot), fullPage: true });
    evidence.screenshots.detail = detailScreenshot;

    const factoryBefore = await page.evaluate(async (id) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(id)}/factory-instruction`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, payload };
    }, workOrderId);
    evidence.steps.factoryReadBefore = {
      status: factoryBefore.status,
      ok: factoryBefore.ok,
    };
    persistEvidence();
    expect(factoryBefore.ok, JSON.stringify(factoryBefore.payload)).toBe(true);

    const marker = `0.24.34.5 live QA ${new Date().toISOString()}`;
    const factorySave = await page.evaluate(async ({ id, content }) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(id)}/factory-instruction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, includeInFactoryPdf: true }),
      });
      const payload = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, payload };
    }, { id: workOrderId, content: marker });
    evidence.steps.factorySave = {
      status: factorySave.status,
      ok: factorySave.ok,
      code: factorySave.payload?.code ?? null,
    };
    persistEvidence();
    expect(factorySave.ok, JSON.stringify(factorySave.payload)).toBe(true);
    expect(factorySave.payload?.data?.instruction?.content).toBe(marker);

    await page.reload({ waitUntil: "domcontentloaded" });
    const factoryAfter = await page.evaluate(async (id) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(id)}/factory-instruction`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, payload };
    }, workOrderId);
    evidence.steps.factoryReadAfterReload = {
      status: factoryAfter.status,
      ok: factoryAfter.ok,
      persisted: factoryAfter.payload?.data?.instruction?.content === marker,
    };
    persistEvidence();
    expect(factoryAfter.ok, JSON.stringify(factoryAfter.payload)).toBe(true);
    expect(factoryAfter.payload?.data?.instruction?.content).toBe(marker);

    const pdfCreate = await page.evaluate(async (id) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(id)}/generated/workorder-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "auto" }),
      });
      const payload = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, payload };
    }, workOrderId);
    evidence.steps.pdfCreate = {
      status: pdfCreate.status,
      ok: pdfCreate.ok,
      code: pdfCreate.payload?.code ?? pdfCreate.payload?.error ?? null,
      documentKind: pdfCreate.payload?.documentKind ?? null,
    };
    persistEvidence();
    expect(pdfCreate.ok, JSON.stringify(pdfCreate.payload)).toBe(true);
    expect(pdfCreate.payload?.attachment?.id).toBeTruthy();
    const viewerPath = pdfCreate.payload.url
      ?? pdfCreate.payload.previewUrl
      ?? pdfCreate.payload.attachment.url
      ?? pdfCreate.payload.attachment.previewUrl;
    expect(viewerPath).toMatch(/\/generated\/workorder-pdf\/.+\/view/);
    evidence.steps.pdfCreate.viewerPath = viewerPath;
    evidence.steps.pdfCreate.attachmentId = pdfCreate.payload.attachment.id;
    persistEvidence();

    const pdfResponse = await context.request.get(viewerPath);
    if (!pdfResponse.ok()) {
      const bodyPreview = (await pdfResponse.text().catch(() => "")).slice(0, 500);
      evidence.steps.pdfViewer = {
        status: pdfResponse.status(),
        contentType: pdfResponse.headers()["content-type"] ?? null,
        bodyPreview,
      };
      persistEvidence();
    }
    expect(pdfResponse.ok(), `viewer status ${pdfResponse.status()}`).toBe(true);
    const contentType = pdfResponse.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/pdf");
    const pdfBuffer = await pdfResponse.body();
    expect(pdfBuffer.byteLength).toBeGreaterThan(1024);
    ensureDir(pdfArtifactDir);
    writeFileSync(pdfPath, pdfBuffer);
    evidence.steps.pdfViewer = {
      status: pdfResponse?.status() ?? null,
      contentType,
      bytes: pdfBuffer.byteLength,
    };
    evidence.pdf.file = "workorder-live-product.pdf";
    evidence.pdf.render = renderPdfToPngIfAvailable(pdfPath);
    if (evidence.pdf.render.ok) {
      evidence.pdf.pngs = readdirSync(pdfArtifactDir)
        .filter((file) => /^workorder-live-product-page-\d+\.png$/i.test(file))
        .sort();
    }

    evidence.completedAt = new Date().toISOString();
    persistEvidence();
  });
});
