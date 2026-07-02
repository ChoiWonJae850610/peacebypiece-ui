import { expect } from "@playwright/test";

export async function createPublicSignupApplicantSession(page, options = {}) {
  return createFixtureSession(page, { role: "applicant", ...options });
}

export async function createPublicSignupSystemAdminSession(page) {
  return createFixtureSession(page, { role: "system-admin" });
}

export async function createApprovedPublicSignupCompanyAdminSession(page, options = {}) {
  return createFixtureSession(page, { role: "approved-company-admin", ...options });
}

export async function clearPublicSignupFixtureSession(page) {
  return createFixtureSession(page, { role: "clear" });
}

async function createFixtureSession(page, payload) {
  const response = await page.request.post("/api/dev/public-signup-e2e/session", {
    data: payload,
    headers: {
      "content-type": "application/json",
      "x-public-signup-e2e": "1",
    },
  });
  expect([200, 404]).toContain(response.status());
  const body = await response.json().catch(() => ({}));
  if (response.status() === 404) {
    expect(body.code).toBe("PUBLIC_SIGNUP_E2E_FIXTURE_BLOCKED");
    return { ok: false, blocked: true };
  }
  expect(body.ok).toBe(true);
  expect(body.fixture.cookieReturned).toBe(false);
  return { ok: true, blocked: false, fixture: body.fixture };
}

export async function expectNoRawPublicSignupSecrets(page) {
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("wafl_auth_session");
  expect(body).not.toContain("wafl_signup_applicant_session");
  expect(body).not.toContain("BEGIN PRIVATE KEY");
  expect(body).not.toContain("postgres://");
  expect(body).not.toContain("r2.dev");
}
