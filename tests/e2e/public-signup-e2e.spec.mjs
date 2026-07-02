import { expect, test } from "@playwright/test";

test.describe("public signup QA smoke", () => {
  test("login CTA opens the public Trial signup page", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/WAFL/);
    const signupLink = page.getByRole("link", { name: "7일 무료로 시작하기" });
    await expect(signupLink).toHaveAttribute("href", "/signup");
    await signupLink.click();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: /7일 무료로/ })).toBeVisible();
    await expect(page.getByText("100MB", { exact: true })).toBeVisible();
    await expect(page.getByText("멤버 3명", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Google로 가입 요청 시작" })).toHaveAttribute(
      "href",
      "/api/auth/google/start?intent=signup",
    );
  });

  test("public signup and invitation entry points stay separated", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByText("공개 가입은 신규 회사 Trial 요청 전용입니다.")).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    await expect(page.getByText(/production 결제수단 준비는 안전하게 blocked\/deferred/)).toBeVisible();
  });
});
