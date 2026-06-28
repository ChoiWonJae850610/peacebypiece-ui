import assert from "node:assert/strict";
import fs from "node:fs";

const session = fs.readFileSync("lib/signup/signupApplicantSession.ts", "utf8");
const current = fs.readFileSync("lib/signup/currentSignupApplicantSession.ts", "utf8");
const logout = fs.readFileSync("app/api/auth/logout/route.ts", "utf8");
const signupRoute = fs.readFileSync("app/api/signup/application/route.ts", "utf8");
const googleCallback = fs.readFileSync("app/api/auth/google/callback/route.ts", "utf8");

for (const token of [
  "WAFL_SIGNUP_APPLICANT_SESSION_COOKIE",
  "wafl_signup_applicant_session",
  "googleSub",
  "emailNormalized",
  "emailVerified: true",
  "applicationId: string | null",
  "onboardingState",
  "issuedAt",
  "expiresAt",
  "createHmac",
  "timingSafeEqual",
  "httpOnly",
]) {
  assert.ok(`${session}\n${logout}\n${signupRoute}\n${googleCallback}`.includes(token), `signup applicant session missing ${token}`);
}

for (const forbidden of ["companyId", "companyMemberId", "memberId", "role", "accessToken", "refreshToken", "id_token", "rawToken"]) {
  assert.ok(!session.includes(forbidden), `signup applicant session must not store ${forbidden}`);
}

assert.ok(current.includes("cookies()"));
assert.ok(current.includes("verifySignupApplicantSessionCookieValue"));
assert.ok(current.includes("createSignupApplicantOwner"));
assert.ok(current.includes("googleSub: session.googleSub"));
assert.ok(current.includes("emailNormalized: session.emailNormalized"));
assert.ok(logout.includes("WAFL_SIGNUP_APPLICANT_SESSION_COOKIE"));
assert.ok(logout.includes("response.cookies.set(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE"));
assert.ok(logout.includes("maxAge: 0"));

console.log("signup applicant session contract: OK");
