import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const returnPath = read("lib/auth/returnPath.ts");
const oauth = read("lib/auth/googleOAuth.ts");
const start = read("app/api/auth/google/start/route.ts");
const callback = read("app/api/auth/google/callback/route.ts");
const guard = read("lib/auth/routeGuard.ts");

assert.match(returnPath, /startsWith\("\/\/"\)/, "protocol-relative open redirects must be blocked");
for (const prefix of ["/workspace", "/worker", "/system", "/me"]) assert.ok(returnPath.includes(prefix));
assert.match(oauth, /returnTo: string \| null/, "OAuth state must preserve returnTo");
assert.match(start, /normalizeSafeReturnPath/, "OAuth start must sanitize returnTo");
assert.match(callback, /normalizeSafeReturnPath\(state\.returnTo\)/, "OAuth callback must sanitize returnTo again");
assert.match(guard, /buildLoginPath\(options\.returnTo, "SESSION_REQUIRED"\)/, "protected routes must use the login path helper");
assert.ok(fs.existsSync("app/not-found.tsx"));
assert.ok(fs.existsSync("app/error.tsx"));
console.log("auth route resilience contract passed");
