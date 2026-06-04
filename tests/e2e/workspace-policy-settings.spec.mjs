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
}

test.describe("workspace policy and settings smoke", () => {
  test("workspace legal page renders policy documents and saves required agreement", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildWorkspaceMemberSession());
    test.skip(!session.ok, session.reason);

    await mockPolicyAgreementApis(page);
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workspace/legal");

    await expect(page.getByRole("heading", { name: "고객 공개 약관·정책" })).toBeVisible();
    await expect(page.getByText("문서 수")).toBeVisible();
    await expect(page.getByText("필수 동의 문서")).toBeVisible();

    for (const title of policyDocuments.map((document) => document.title)) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: "필수 약관·정책 전체 동의" })).toBeVisible();
    await page.getByRole("button", { name: "필수 약관·정책 전체 동의" }).click();
    await expect(page.getByRole("button", { name: "동의 완료" })).toBeVisible();
  });

  test("workspace settings provides a legal policy entry point", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildCompanyAdminSession());
    test.skip(!session.ok, session.reason);

    await mockSettingsApis(page);
    await page.goto("/workspace/settings");

    await expect(page.getByRole("heading", { name: "환경설정" })).toBeVisible();
    await page.getByRole("button", { name: /약관·정책/ }).click();

    await expect(page.getByRole("heading", { name: "약관·정책은 고객 공개 화면에서 조회합니다." })).toBeVisible();
    await expect(page.getByRole("link", { name: "약관·정책 보기" }).first()).toHaveAttribute("href", "/workspace/legal");
  });
});
