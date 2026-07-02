import { NextResponse } from "next/server";

import {
  createWaflSessionCookieValue,
  WAFL_AUTH_SESSION_COOKIE,
  type WaflSessionPayload,
} from "@/lib/auth/session";
import {
  createSignupApplicantSessionCookieValue,
  createSignupApplicantSessionPayload,
  WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
} from "@/lib/signup/signupApplicantSession";
import { listDevTestContextTargets } from "@/lib/dev/testContext/repository";
import { isServerDevTestRuntime } from "@/lib/runtime/serverRuntime";

export const dynamic = "force-dynamic";

type FixtureRole = "applicant" | "system-admin" | "approved-company-admin" | "clear";

type FixtureRequest = {
  role?: unknown;
  applicationId?: unknown;
  companyId?: unknown;
  companyMemberId?: unknown;
};

const SYNTHETIC_PREFIX = "public-signup-e2e";

function noStoreJson(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function parseRole(value: unknown): FixtureRole | null {
  if (
    value === "applicant"
    || value === "system-admin"
    || value === "approved-company-admin"
    || value === "clear"
  ) {
    return value;
  }
  return null;
}

function cookieSecure(request: Request) {
  return new URL(request.url).protocol === "https:";
}

function syntheticEmail(role: FixtureRole) {
  return `${SYNTHETIC_PREFIX}-${role}@example.test`;
}

async function getFixtureSystemAdmin() {
  const targets = await listDevTestContextTargets();
  return targets.find((target) => target.role === "system_admin") ?? null;
}

async function getFixtureCompanyAdmin() {
  const targets = await listDevTestContextTargets();
  return targets.find((target) => target.role === "company_admin") ?? null;
}

function setAppSessionCookie(response: NextResponse, request: Request, payload: WaflSessionPayload) {
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, createWaflSessionCookieValue(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(request),
    path: "/",
    maxAge: 60 * 60,
  });
}

function clearFixtureCookies(response: NextResponse, request: Request) {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(request),
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, "", base);
  response.cookies.set(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE, "", base);
}

export async function POST(request: Request) {
  if (!isServerDevTestRuntime()) {
    return noStoreJson({ ok: false, code: "PUBLIC_SIGNUP_E2E_FIXTURE_BLOCKED" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as FixtureRequest | null;
  const role = parseRole(body?.role);
  if (!role) {
    return noStoreJson({ ok: false, code: "FIXTURE_ROLE_REQUIRED" }, { status: 400 });
  }

  const response = noStoreJson({
    ok: true,
    fixture: {
      role,
      synthetic: true,
      cookieReturned: false,
      productionBlocked: true,
    },
  });

  clearFixtureCookies(response, request);

  if (role === "clear") {
    return response;
  }

  const now = new Date();
  if (role === "applicant") {
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId.trim() : null;
    response.cookies.set(
      WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
      createSignupApplicantSessionCookieValue(createSignupApplicantSessionPayload({
        googleSub: `${SYNTHETIC_PREFIX}-google-sub-applicant`,
        email: syntheticEmail(role),
        emailNormalized: syntheticEmail(role),
        applicantName: "Public Signup E2E Applicant",
        googlePictureUrl: null,
        applicationId,
        onboardingState: applicationId ? "draft" : "verified_identity",
        now,
      })),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: cookieSecure(request),
        path: "/",
        maxAge: 60 * 60,
      },
    );
    return response;
  }

  const isCompanyAdmin = role === "approved-company-admin";
  const fixtureTarget = isCompanyAdmin
    ? await getFixtureCompanyAdmin()
    : await getFixtureSystemAdmin();
  if (!fixtureTarget) {
    return noStoreJson({ ok: false, code: "PUBLIC_SIGNUP_E2E_FIXTURE_TARGET_UNAVAILABLE" }, { status: 503 });
  }

  setAppSessionCookie(response, request, {
    userId: fixtureTarget.userId,
    companyId: isCompanyAdmin ? (typeof body?.companyId === "string" ? body.companyId.trim() : fixtureTarget.companyId) : null,
    companyMemberId: isCompanyAdmin ? (typeof body?.companyMemberId === "string" ? body.companyMemberId.trim() : fixtureTarget.companyMemberId) : null,
    companyName: isCompanyAdmin ? fixtureTarget.companyName : null,
    role: isCompanyAdmin ? "company_admin" : "system_admin",
    email: fixtureTarget.email,
    name: fixtureTarget.name,
    issuedAt: now.toISOString(),
    googleSub: `${SYNTHETIC_PREFIX}-google-sub-${role}`,
    googlePictureUrl: null,
  });

  return response;
}
