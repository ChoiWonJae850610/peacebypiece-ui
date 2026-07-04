import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  clearPublicSignupFixtureSession,
  createPublicSignupApplicantSession,
  createPublicSignupSystemAdminSession,
  expectNoRawPublicSignupSecrets,
} from "./helpers/publicSignupAuth.mjs";

const artifactDir = resolve("artifacts/ui-qa/0.24.34.5/product-screens");

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

test.describe("0.24.34.5 product QA screenshots", () => {
  test.afterEach(async ({ page }) => {
    await clearPublicSignupFixtureSession(page);
  });

  test("signup canonical policy modal and system screens produce review evidence", async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const manifest = {
      screenshots: {},
      steps: {},
      consoleErrors: [],
      pageErrors: [],
    };

    page.on("console", (message) => {
      if (message.type() === "error") manifest.consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      manifest.pageErrors.push({ message: error.message, stack: error.stack ?? null });
    });

    const applicant = await createPublicSignupApplicantSession(page);
    test.skip(applicant.blocked, "dev/test signup fixture is blocked in this runtime");
    await page.goto("/pending?type=signup", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /7|가입|Trial/ })).toBeVisible();
    await expectNoRawPublicSignupSecrets(page);

    const policyButtons = page.getByRole("button", { name: "보기" });
    await expect(policyButtons.first()).toBeVisible();
    await policyButtons.first().click();
    await expect(page.getByRole("dialog")).toContainText(/이용약관|서비스 이용|WAFL/);
    await expect(page.getByRole("dialog")).toContainText(/v1\.0|시행 준비 중/);
    const projectName = testInfo.project.name.replace(/[^a-z0-9_-]+/gi, "-");
    const signupPolicyScreenshot = `signup-policy-modal-${projectName}.png`;
    const systemDashboardScreenshot = `system-dashboard-${projectName}.png`;
    const systemCompaniesScreenshot = `system-companies-${projectName}.png`;
    const systemSignupReviewScreenshot = `system-signup-review-${projectName}.png`;

    await page.screenshot({ path: resolve(artifactDir, signupPolicyScreenshot), fullPage: true });
    manifest.screenshots.signupPolicyModal = signupPolicyScreenshot;
    manifest.steps.signupCanonicalPolicyModal = "PASS";
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    manifest.steps.signupPolicyEscClose = "PASS";

    await clearPublicSignupFixtureSession(page);
    const systemAdmin = await createPublicSignupSystemAdminSession(page);
    test.skip(systemAdmin.blocked, "dev/test system-admin fixture is blocked in this runtime");

    await page.goto("/system", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/시스템|고객|가입|요금|저장/);
    await page.screenshot({ path: resolve(artifactDir, systemDashboardScreenshot), fullPage: true });
    manifest.screenshots.systemDashboard = systemDashboardScreenshot;
    manifest.steps.systemDashboard = "PASS";

    await page.goto("/system/companies", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/고객사|가입 신청|승인|거절/);
    await page.screenshot({ path: resolve(artifactDir, systemCompaniesScreenshot), fullPage: true });
    manifest.screenshots.systemCompanies = systemCompaniesScreenshot;
    manifest.steps.systemCompaniesRole = "PASS";

    await page.goto("/system/signup-applications", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/가입 신청 검토/);
    await page.screenshot({ path: resolve(artifactDir, systemSignupReviewScreenshot), fullPage: true });
    manifest.screenshots.systemSignupReview = systemSignupReviewScreenshot;
    manifest.steps.systemSignupReview = "PASS";

    manifest.consoleErrorCount = manifest.consoleErrors.length;
    manifest.pageErrorCount = manifest.pageErrors.length;
    writeJson(resolve(artifactDir, `product-screen-manifest-${projectName}.json`), manifest);
  });
});
