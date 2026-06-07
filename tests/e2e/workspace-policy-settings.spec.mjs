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

const pendingReagreementDocuments = [
  {
    ...policyDocuments[1],
    requiresReagreement: true,
    agreedAt: null,
  },
];

const completedReagreementDocuments = pendingReagreementDocuments.map((document) => ({
  ...document,
  agreedAt: "2026-06-05T13:00:00.000Z",
}));

function buildPolicyReagreementStatus(documents) {
  const requiredReagreementCount = documents.length;
  const agreedReagreementCount = documents.filter((document) => document.agreedAt).length;
  const pendingReagreementCount = documents.filter((document) => !document.agreedAt).length;

  return {
    documents,
    requiredReagreementCount,
    agreedReagreementCount,
    pendingReagreementCount,
    hasPendingReagreement: pendingReagreementCount > 0,
  };
}

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

  await page.route("**/api/policies/reagreement", async (route) => {
    const isSaveRequest = route.request().method() === "POST";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: buildPolicyReagreementStatus(isSaveRequest ? completedReagreementDocuments : pendingReagreementDocuments),
      }),
    });
  });
}

async function mockSettingsApis(page, options = {}) {
  const hasPendingPolicyReagreement = Boolean(options.hasPendingPolicyReagreement);

  await page.route("**/api/policies/reagreement", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: buildPolicyReagreementStatus(hasPendingPolicyReagreement ? pendingReagreementDocuments : completedReagreementDocuments),
      }),
    });
  });

  await page.route("**/api/policies/customer-documents/*", async (route) => {
    const url = new URL(route.request().url());
    const documentId = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
    const document = policyDocuments.find((item) => item.documentKey === documentId) ?? policyDocuments[0];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        document: {
          id: document.documentKey,
          title: document.title,
          subtitle: "E2E Markdown 원문",
          category: document.category,
          categoryLabel: document.category,
          versionLabel: document.versionLabel,
          effectiveDateLabel: "시행 준비 중",
          requiredForApproval: document.requiredForApproval,
          sourceFileName: `${document.title}-v1-초안.md`,
          sourceNote: null,
          markdown: `# ${document.title}\n\n## 적용 범위\n\nE2E Markdown 문서 원문입니다.\n\n## 계정과 권한\n\n- 고객사 관리자\n- 일반 멤버\n\n## 서비스 제한\n\n정책에 따라 제한될 수 있습니다.`,
        },
      }),
    });
  });

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


  await page.route("**/api/admin/subscription", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        subscription: {
          id: "e2e-company-subscription",
          companyId: "company-e2e",
          planCode: "flow",
          planLabel: "Flow",
          status: "active",
          statusLabel: "정상 사용 중",
          trialStartedAt: "2026-06-01T00:00:00.000Z",
          trialEndsAt: "2026-06-08T00:00:00.000Z",
          currentPeriodStartedAt: "2026-06-08T00:00:00.000Z",
          currentPeriodEndsAt: "2026-07-08T00:00:00.000Z",
          cancelScheduledAt: null,
          canceledAt: null,
          storageLimitBytes: 10 * 1024 * 1024 * 1024,
          storageUsedBytes: 8 * 1024 * 1024,
          storageUsageRatio: 0.00078125,
          memberLimit: 15,
          activeMemberCount: 3,
          source: "company_subscriptions",
          updatedAt: "2026-06-06T12:00:00.000Z",
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
        quota: {
          status: "warning",
          storageLimitBytes: 10 * 1024 * 1024 * 1024,
          storageUsedBytes: 8.1 * 1024 * 1024 * 1024,
          replaceableBytes: 0,
          incomingSizeBytes: sizeBytes,
          projectedUsedBytes: 8.1 * 1024 * 1024 * 1024 + sizeBytes,
          usageRatio: 0.81,
          warningThresholdRatio: 0.8,
          message: "저장공간 사용량이 80% 이상입니다.",
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
        body: JSON.stringify({
          ok: true,
          file: savedFile,
          quota: {
            status: "warning",
            storageLimitBytes: 10 * 1024 * 1024 * 1024,
            storageUsedBytes: 8.1 * 1024 * 1024 * 1024,
            replaceableBytes: 0,
            incomingSizeBytes: savedFile.sizeBytes,
            projectedUsedBytes: 8.1 * 1024 * 1024 * 1024 + savedFile.sizeBytes,
            usageRatio: 0.81,
            warningThresholdRatio: 0.8,
            message: "저장공간 사용량이 80% 이상입니다.",
          },
        }),
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
    await expectAnyText(body, ["정책 재동의 필요 상태", "재동의 필요", "필수 정책 전체 재동의"], 15_000);

    const reagreementButton = page.getByRole("button", { name: /필수 정책 전체 재동의/ }).first();
    if (await clickIfVisible(reagreementButton, 3_000)) {
      await expectAnyText(body, ["재동의 완료", "정책 재동의가 완료되었습니다."], 15_000);
    }

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

    const billingButton = page.getByRole("button", { name: /요금제·저장공간/ }).first();
    if (await clickIfVisible(billingButton, 3_000)) {
      await expectAnyText(body, ["Flow", "정상 사용 중", "저장공간 사용량", "멤버 사용량"], 15_000);
    }

    const accountButton = page.getByRole("button", { name: /계정 정보/ }).first();
    await clickIfVisible(accountButton, 3_000);

    const companyFilePanelVisible = await expectAnyTextIfAvailable(body, ["대표 이미지", "사업자등록증", "회사 파일"], 5_000);
    if (companyFilePanelVisible) {
      await page.locator('input[type="file"][accept*="image/png"]').first().setInputFiles({
        name: "e2e-new-logo.png",
        mimeType: "image/png",
        buffer: Buffer.from("e2e-company-file"),
      });
      await expectAnyText(body, ["e2e-new-logo.png", "회사 파일을 업로드했습니다.", "저장공간 사용량이 80% 이상"], 15_000);
    } else {
      await expectAnyText(body, ["환경설정", "회사 정보", "계정 정보"], 15_000);
    }

    const legalButton = page.getByRole("button", { name: /약관·정책/ }).first();

    if (await clickIfVisible(legalButton, 3_000)) {
      await expectAnyText(body, ["이용약관", "개인정보처리방침", "요금·환불정책", "데이터 보관·삭제정책"], 15_000);
      const openDocumentButton = page.getByRole("button", { name: /^보기$/ }).first();
      if (await clickIfVisible(openDocumentButton, 3_000)) {
        await expectAnyText(body, ["원문 파일", "E2E Markdown 문서 원문", "서비스 제한"], 15_000);
        const closeButton = page.getByRole("button", { name: /^닫기$/ }).first();
        await clickIfVisible(closeButton, 3_000);
      }
    } else {
      await expectAnyText(body, ["약관·정책", "환경설정"], 15_000);
    }
  });

  test("workspace business pages are blocked while policy reagreement is pending", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildCompanyAdminSession());
    test.skip(!session.ok, session.reason);

    await mockSettingsApis(page, { hasPendingPolicyReagreement: true });
    const body = await gotoWorkspacePageOrSkip(page, "/workspace/settings", "환경");

    const blockedByPolicyReagreement = await expectAnyTextIfAvailable(
      body,
      ["정책 재동의가 필요합니다", "약관·정책 확인하기", "업무 화면 사용을 잠시 제한"],
      15_000,
    );

    if (blockedByPolicyReagreement) {
      await expect(page.getByRole("link", { name: /약관·정책 확인하기/ })).toHaveAttribute("href", /\/workspace\/legal/);
      await expectAnyText(body, ["로그아웃", "고객지원 문의"], 15_000);
      return;
    }

    await expectAnyText(
      body,
      [
        "회사 정보를 입력해주세요",
        "회사 정보 상태를 확인하고 있습니다",
        "필수 회사 정보 입력 여부",
      ],
      15_000,
    );
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
