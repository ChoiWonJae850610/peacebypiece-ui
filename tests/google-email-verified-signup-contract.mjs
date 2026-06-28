import assert from "node:assert/strict";
import fs from "node:fs";

const oauth = fs.readFileSync("lib/auth/googleOAuth.ts", "utf8");
const start = fs.readFileSync("app/api/auth/google/start/route.ts", "utf8");
const callback = fs.readFileSync("app/api/auth/google/callback/route.ts", "utf8");
const login = fs.readFileSync("lib/auth/loginRepository.ts", "utf8");
const invitation = fs.readFileSync("lib/auth/companyInvitationLoginRepository.ts", "utf8");

for (const token of [
  'GoogleOAuthRequestType = "member" | "company" | "login" | "signup"',
  "emailVerified: boolean",
  "email_verified?: boolean",
  "emailVerified: payload.email_verified === true",
  'intent === "signup"',
  'requestType === "signup"',
  "createSignupApplicantSessionResponse",
  "GOOGLE_EMAIL_NOT_VERIFIED",
  "state.requestType === \"signup\"",
]) {
  assert.ok(`${oauth}\n${start}\n${callback}`.includes(token), `Google signup email_verified contract missing ${token}`);
}

const afterProfileFetch = callback.slice(callback.indexOf("const profile = await fetchGoogleUserProfile(accessToken);"));
assert.ok(afterProfileFetch.indexOf('state.requestType === "signup"') < afterProfileFetch.indexOf('state.requestType === "login"'));
assert.ok(callback.includes("completeGoogleLogin(profile)"), "existing member login must remain routed to completeGoogleLogin");
assert.ok(callback.includes("completeCompanyAdminInvitationLogin(profile, token)"), "company invitation login must remain routed");
assert.ok(callback.includes("joinRequestRepository.createJoinRequest"), "member invitation login must remain routed");
assert.doesNotMatch(`${oauth}\n${callback}`, /console\.log|console\.error/);
const signupSessionFunction = callback.slice(
  callback.indexOf("function createSignupApplicantSessionResponse"),
  callback.indexOf("export async function GET"),
);
assert.doesNotMatch(signupSessionFunction, /accessToken|refreshToken|id_token|rawToken/);
assert.ok(login.includes("GoogleUserProfile"), "login repository still accepts Google profile");
assert.ok(invitation.includes("emailVerified: true"), "company-admin invitation synthesized profile preserves verified evidence");

console.log("google email_verified signup contract: OK");
