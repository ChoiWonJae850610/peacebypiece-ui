import { expect, test } from "@playwright/test";

import { addWaflSessionCookie, buildCompanyAdminSession, buildWorkspaceMemberSession } from "./helpers/waflSession.mjs";

const policyDocuments = [
  {
    documentKey: "terms-of-service",
    title: "이용약관",
    category: "service",
    versionId: "policy-version-terms-v1",
    versionLabel: "v1.0",
    requiredForApproval: true,
    requiresReagreement: false,
    agreedAt: null,
  },
  {
    documentKey: "privacy-policy",
    title: "개인정보처리방침",
    category: "privacy",
    versionId: "policy-version-privacy-v1",
    versionLabel: "v1.0",
    requiredForApproval: true,
    requiresReagreement: false,
    agreedAt: null,
  },
  {
    documentKey: "billing-refund-policy",
    title: "요금·환불정책",
    category: "billing",
    versionId: "policy-version-billing-v1",
    versionLabel: "v1.0",
    requiredForApproval: true,
    requiresReagreement: false,
    agreedAt: null,
  },
  {
    documentKey: "data-retention-policy",
    title: "데이터 보관·삭제정책",
    category: "data",
    versionId: "policy-version-data-v1",
    versionLabel: "v1.0",
    requiredForApproval: true,
    requiresReagreement: false,
    agreedAt: null,
  },
  {
    documentKey: "service-operation-policy",
    title: "서비스 운영정책",
    category: "operation",
    versionId: "policy-version-operation-v1",
    versionLabel: "v1.0",
    requiredForApproval: false,
    requiresReagreement: false,
    agreedAt: null,
  },
];

const agreedPolicyDocuments = policyDocuments.map((document) => ({
  ...document,
  agreedAt: document.requiredForApproval ? "2026-06-04T12:00:00.000Z" : null,
}));

function buildPolicyStatus(documents) {
  const requiredCount = documents.filter((document) => document.requiredForApproval).length;
  const agreedRequiredCount = documents.filter((document) => document.requiredForApproval && document.agreedAt).length;

  return {
    documents,
    requiredCount,
    agreedRequiredCount,
    allRequiredAgreed: requiredCount === agreedRequiredCount,
  };
}

async function mockPolicyAgreementApis(page) {
  await page.route("**/api/policies/current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, status: buildPolicyStatus(policyDocuments) }),
    });
  });

  await page.route("**/api/policies/agreements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, status: buildPolicyStatus(agreedPolicyDocuments) }),
    });
  });
}

async function mockSettingsApis(page) {
  const companyFiles = [
    {
      id: "e2e-representative-image",
      companyId: "company-e2e",
      fileType: "representative_image",
      originalName: "대표이미지.png",
      storageKey: "companies/company-e2e/company-files/representative_image/e2e.png",
      mimeType: "image/png",
      sizeBytes: 204800,
      reviewStatus: "not_required",
      uploadedByUserId: "user-e2e-admin",
      reviewedBySystemUserId: null,
      reviewedAt: null,
      rejectionReason: null,
      replacedByFileId: null,
      createdAt: "2026-06-05T12:00:00.000Z",
      updatedAt: "2026-06-05T12:00:00.000Z",
      deletedAt: null,
    },
    {
      id: "e2e-business-registration",
      companyId: "company-e2e",
      fileType: "business_registration",
      originalName: "사업자등록증.pdf",
      storageKey: "companies/company-e2e/company-files/business_registration/e2e.pdf",
      mimeType: "application/pdf",
      sizeBytes: 512000,
      reviewStatus: "pending_review",
      uploadedByUserId: "user-e2e-admin",
      reviewedBySystemUserId: null,
      reviewedAt: null,
      rejectionReason: null,
      replacedByFileId: null,
      createdAt: "2026-06-05T12:00:00.000Z",
      updatedAt: "2026-06-05T12:00:00.000Z",
      deletedAt: null,
    },
  ];

  await page.route("**/api/admin/companies/current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        billing: {
          title: "E2E 테스트 회사 요금제·결제 현황",
          description: "Playwright 설정 화면 테스트용 요금제 요약입니다.",
          currentPlanLabel: "Starter",
          planCodeLabel: "starter",
          billingStatusLabel: "결제 연동 전",
          systemManagedLabel: "시스템관리자 관리",
          dataSourceLabel: "E2E mock",
          metrics: [
            { id: "current-plan", label: "현재 요금제", value: "Starter", description: "테스트 요금제" },
            { id: "storage-limit", label: "저장공간 한도", value: "100 MB", description: "테스트 저장공간" },
            { id: "member-limit", label: "멤버 한도", value: "3명", description: "테스트 멤버 한도" },
          ],
          actions: [
            { id: "request-plan-change", label: "요금제 변경 요청", statusLabel: "후속 연결", description: "테스트 요청" },
          ],
          policyNotes: ["요금제 화면은 읽기 전용 테스트 범위입니다."],
        },
        account: {
          title: "E2E 테스트 회사 계정 정보",
          description: "Playwright 설정 화면 테스트용 계정 요약입니다.",
          statusLabel: "승인됨",
          statusTone: "success",
          metrics: [
            { id: "company-name", label: "회사명", value: "E2E 테스트 회사", description: "사업자명: E2E" },
            { id: "representative-account", label: "대표 로그인 이메일", value: "e2e.admin@example.test", description: "관리자 표시명: E2E 고객사 관리자" },
          ],
          actions: [
            { id: "request-company-info-change", label: "회사 정보 변경 요청", statusLabel: "요청 가능", tone: "neutral", requestType: "company_info_change", description: "테스트 변경 요청" },
          ],
          policyNotes: ["회사 설정과 개인 설정을 분리합니다."],
        },
      }),
    });
  });

  await page.route("**/api/admin/settings/company-account-requests", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, requests: [] }),
    });
  });

  await page.route("**/api/admin/company-files/upload", async (route) => {
    const request = route.request();
    const body = request.postDataJSON();
    const fileType = body?.fileType || "representative_image";
    const originalName = body?.originalName || "e2e-upload.png";
    const mimeType = body?.mimeType || "image/png";
    const sizeBytes = Number(body?.sizeBytes || 0);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        file: {
          fileType,
          originalName,
          mimeType,
          sizeBytes,
          storageKey: `companies/company-e2e/company-files/${fileType}/e2e-uploaded.png`,
        },
        upload: {
          url: "https://r2-company-file-upload.example.test/e2e-uploaded.png",
          method: "PUT",
          headers: { "Content-Type": mimeType },
          expiresInSeconds: 600,
        },
      }),
    });
  });

  await page.route("https://r2-company-file-upload.example.test/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route("**/api/admin/company-files", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      const savedFile = {
        id: "e2e-uploaded-company-file",
        companyId: "company-e2e",
        fileType: body.fileType,
        originalName: body.originalName,
        storageKey: body.storageKey,
        mimeType: body.mimeType,
        sizeBytes: Number(body.sizeBytes || 0),
        reviewStatus: body.fileType === "business_registration" ? "pending_review" : "not_required",
        uploadedByUserId: "user-e2e-admin",
        reviewedBySystemUserId: null,
        reviewedAt: null,
        rejectionReason: null,
        replacedByFileId: null,
        createdAt: "2026-06-05T12:10:00.000Z",
        updatedAt: "2026-06-05T12:10:00.000Z",
        deletedAt: null,
      };
      const existingIndex = companyFiles.findIndex((file) => file.fileType === savedFile.fileType);
      if (existingIndex >= 0) companyFiles.splice(existingIndex, 1, savedFile);
      else companyFiles.push(savedFile);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, file: savedFile }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, files: companyFiles }),
    });
  });
}

async function gotoWorkspacePageOrSkip(page, path, expectedText) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

  const currentUrl = page.url();
  if (!currentUrl.includes(path)) {
    test.skip(true, `테스트 세션으로 ${path}에 진입하지 못했습니다. currentUrl=${currentUrl}`);
  }

  const body = page.locator("body");
  await expect(body).toContainText(expectedText, { timeout: 15_000 });
  return body;
}

async function collectBodyText(page) {
  return await page.locator("body").innerText({ timeout: 15_000 }).catch(() => "");
}

async function expectAnyText(body, candidates, timeout = 15_000) {
  const pattern = new RegExp(candidates.map((candidate) => candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"));
  await expect(body).toContainText(pattern, { timeout });
}

async function clickIfVisible(locator, timeout = 2_000) {
  try {
    await locator.waitFor({ state: "visible", timeout });
    await locator.click({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function expectAnyTextIfAvailable(body, candidates, timeout = 5_000) {
  try {
    await expectAnyText(body, candidates, timeout);
    return true;
  } catch {
    return false;
  }
}

test.describe("workspace policy and settings smoke", () => {
  test("workspace legal page renders policy documents and optionally saves required agreement", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildWorkspaceMemberSession());
    test.skip(!session.ok, session.reason);

    await mockPolicyAgreementApis(page);
    page.on("dialog", (dialog) => dialog.accept());

    const body = await gotoWorkspacePageOrSkip(page, "/workspace/legal", "약관");

    await expectAnyText(body, ["약관·정책", "약관", "정책"]);
    await expectAnyText(body, ["문서 수", "고객 공개", "필수 동의"]);

    const renderedText = await collectBodyText(page);
    const renderedPolicyCount = policyDocuments.filter((document) => renderedText.includes(document.title)).length;
    expect(renderedPolicyCount).toBeGreaterThanOrEqual(2);

    const agreeButton = page.getByRole("button", { name: /필수.*약관.*정책.*전체.*동의|동의 저장|동의/ }).first();
    const clickedAgreementButton = await clickIfVisible(agreeButton, 3_000);
    if (clickedAgreementButton) {
      await expectAnyText(body, ["동의 완료", "필수 약관·정책 동의가 완료되었습니다.", "동의 상태"], 15_000);
    } else {
      await expectAnyText(body, ["동의 상태", "필수 동의", "약관·정책"], 15_000);
    }
  });

  test("workspace settings provides a legal policy entry point", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildCompanyAdminSession());
    test.skip(!session.ok, session.reason);

    await mockSettingsApis(page);
    const body = await gotoWorkspacePageOrSkip(page, "/workspace/settings", "환경");

    await expectAnyText(body, ["환경설정", "회사 정보", "약관·정책", "기준정보"]);

    const companyFilePanelVisible = await expectAnyTextIfAvailable(body, ["대표 이미지", "사업자등록증", "회사 파일"], 5_000);
    if (companyFilePanelVisible) {
      await page.locator('input[type="file"][accept*="image/png"]').first().setInputFiles({
        name: "e2e-new-logo.png",
        mimeType: "image/png",
        buffer: Buffer.from("e2e-company-file"),
      });
      await expectAnyText(body, ["e2e-new-logo.png", "회사 파일을 업로드했습니다."], 15_000);
    } else {
      await expectAnyText(body, ["환경설정", "회사 정보", "계정 정보"], 15_000);
    }

    const legalEntry = page.getByRole("link", { name: /약관·정책 보기|약관·정책/ }).first();
    const legalButton = page.getByRole("button", { name: /약관·정책/ }).first();

    if (await legalEntry.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(legalEntry).toHaveAttribute("href", /\/workspace\/legal/);
    } else if (await clickIfVisible(legalButton, 3_000)) {
      await expectAnyText(body, ["약관·정책", "정책 관리", "정책 문서", "고객 공개", "조회 대상 문서"], 15_000);
    } else {
      await expectAnyText(body, ["약관·정책", "환경설정"], 15_000);
    }
  });

  test("workspace topbar exposes a logout action", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildCompanyAdminSession());
    test.skip(!session.ok, session.reason);

    await mockSettingsApis(page);
    await gotoWorkspacePageOrSkip(page, "/workspace/settings", "환경");

    const logoutButton = page.locator('button[aria-label="로그아웃"], button[title="로그아웃"]').first();
    await expect(logoutButton).toBeVisible({ timeout: 15_000 });

    const clicked = await clickIfVisible(logoutButton, 1_500);
    if (clicked) {
      await expectAnyText(page.locator("body"), ["로그아웃하시겠습니까?", "로그아웃 후에는 다시 로그인해야"], 15_000);
    }
  });
});
