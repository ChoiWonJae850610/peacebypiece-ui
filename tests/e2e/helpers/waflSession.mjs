import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const WAFL_AUTH_SESSION_COOKIE = "wafl_auth_session";

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function parseDotEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) return acc;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      acc[key] = value;
      return acc;
    }, {});
}

function readProjectEnvValue(key) {
  if (process.env[key]?.trim()) return process.env[key].trim();

  const envFiles = [
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env",
  ];

  for (const envFile of envFiles) {
    const parsed = parseDotEnvFile(resolve(process.cwd(), envFile));
    if (parsed[key]?.trim()) return parsed[key].trim();
  }

  return null;
}

export function getWaflSessionSecret() {
  return readProjectEnvValue("WAFL_SESSION_SECRET") || readProjectEnvValue("GOOGLE_OAUTH_CLIENT_SECRET");
}

export function createWaflSessionCookieValue(payload, secret) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export async function addWaflSessionCookie(context, payload) {
  const secret = getWaflSessionSecret();
  if (!secret) {
    return { ok: false, reason: "WAFL_SESSION_SECRET 또는 GOOGLE_OAUTH_CLIENT_SECRET이 필요합니다." };
  }

  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
  await context.addCookies([
    {
      name: WAFL_AUTH_SESSION_COOKIE,
      value: createWaflSessionCookieValue(
        {
          companyInvitationToken: null,
          googleSub: "playwright-e2e",
          googlePictureUrl: null,
          ...payload,
          issuedAt: payload.issuedAt || new Date().toISOString(),
        },
        secret,
      ),
      url: baseURL,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  return { ok: true };
}

export function buildWorkspaceMemberSession(overrides = {}) {
  return {
    userId: "e2e-member-user",
    companyId: null,
    companyMemberId: null,
    companyName: null,
    role: "member",
    email: "e2e.member@example.test",
    name: "E2E 일반 멤버",
    ...overrides,
  };
}

export function buildCompanyAdminSession(overrides = {}) {
  return {
    userId: "e2e-company-admin-user",
    companyId: "e2e-company",
    companyMemberId: "e2e-company-admin-member",
    companyName: "E2E 테스트 회사",
    role: "company_admin",
    email: "e2e.admin@example.test",
    name: "E2E 고객사 관리자",
    ...overrides,
  };
}
