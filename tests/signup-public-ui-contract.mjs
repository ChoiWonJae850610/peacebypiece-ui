import assert from "node:assert/strict";
import fs from "node:fs";

const login = fs.readFileSync("components/auth/WaflLoginPage.tsx", "utf8");
const pendingPage = fs.readFileSync("app/(public)/pending/page.tsx", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");
const apiRoute = fs.readFileSync("app/api/signup/application/route.ts", "utf8");
const submitRoute = fs.readFileSync("app/api/signup/application/submit/route.ts", "utf8");
const cancelRoute = fs.readFileSync("app/api/signup/application/cancel/route.ts", "utf8");
const consentsRoute = fs.readFileSync("app/api/signup/application/consents/route.ts", "utf8");
const guards = fs.readFileSync("lib/signup/signupRequestGuards.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationApiService.ts", "utf8");
const consentService = fs.readFileSync("lib/signup/signupConsentApiService.ts", "utf8");
const apiError = fs.readFileSync("lib/signup/signupApplicationApiError.ts", "utf8");

for (const token of [
  "/api/auth/google/start?intent=signup",
  "7일 무료로 시작하기",
  "SignupApplicationDashboard",
  "verified_identity",
  "draft",
  "submitted",
  "reviewing",
  "changes_requested",
  "rejected",
  "canceled",
  "provisioning_failed",
  "approved",
  "임시 저장",
  "제출",
  "수정 후 다시 제출",
  "신청 취소",
  "사업자등록증 업로드는 다음 단계",
  "WAFL 이용약관",
  "개인정보 처리방침",
]) {
  assert.ok(`${login}\n${pendingPage}\n${dashboard}`.includes(token), `signup public UI missing ${token}`);
}

for (const token of [
  "applicant: summarizeApplicant(session)",
  "findApplicantOwnedApplication",
  "isSameOriginSignupMutation",
  "assertSignupRateLimitExtensionPoint",
  "Cache-Control",
  "no-store",
  "SIGNUP_ORIGIN_FORBIDDEN",
  "SIGNUP_CONSENT_REQUIRED",
]) {
  assert.ok(`${apiRoute}\n${submitRoute}\n${cancelRoute}\n${consentsRoute}\n${guards}\n${service}\n${consentService}\n${apiError}`.includes(token), `signup API/UI security token missing ${token}`);
}

assert.doesNotMatch(`${dashboard}\n${apiRoute}\n${submitRoute}\n${cancelRoute}`, /payment|payment_reference|card_registration|raw_card|PutObjectCommand|createSignedUploadUrl|approveApplication|rejectApplication/i);
assert.doesNotMatch(dashboard, /companyId|memberId|role|emailVerified.*input|googleSub.*input/);
assert.match(dashboard, /fetch\("\/api\/signup\/application"/);
assert.ok(dashboard.includes('fetch("/api/signup/application/consents"'));
assert.ok(dashboard.includes('fetch("/api/signup/application/submit"'));
assert.ok(dashboard.includes('fetch("/api/signup/application/cancel"'));
assert.match(dashboard, /await saveApplicationDraft\(\);\s+await ensureSelectedConsents\(\);\s+const response = await fetch\("\/api\/signup\/application\/submit"/s);

console.log("signup public UI contract: OK");
