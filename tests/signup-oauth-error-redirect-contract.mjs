import assert from "node:assert/strict";
import fs from "node:fs";

const callback = fs.readFileSync("app/api/auth/google/callback/route.ts", "utf8");

for (const token of [
  "redirectToSignupPending",
  "isRawSignupState",
  "mapSignupOAuthErrorCode",
  "GOOGLE_AUTH_STATE_INVALID",
  "GOOGLE_AUTH_CODE_MISSING",
  "GOOGLE_PROFILE_FAILED",
  "SIGNUP_SESSION_FAILED",
  "state.requestType === \"signup\"",
]) {
  assert.ok(callback.includes(token), `signup OAuth callback missing ${token}`);
}

assert.match(callback, /if \(!state\) \{[\s\S]*rawStateLooksSignup[\s\S]*redirectToSignupPending\(request, "GOOGLE_AUTH_STATE_INVALID"\)/);
assert.match(callback, /if \(!code\) \{[\s\S]*state\.requestType === "signup"[\s\S]*"GOOGLE_AUTH_CODE_MISSING"/);
assert.match(callback, /if \(!storedNonce \|\| storedNonce !== state\.nonce\) \{[\s\S]*state\.requestType === "signup"[\s\S]*"GOOGLE_AUTH_STATE_INVALID"/);
assert.match(callback, /if \(state\.requestType === "signup"\) return redirectToSignupPending\(request, mapSignupOAuthErrorCode\(error\)\)/);
assert.doesNotMatch(callback, /if \(state\.requestType === "signup"\) return redirectToSignupPending\(request, message\)/);

console.log("signup OAuth error redirect contract passed");
