import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  MOBILE_CONNECT_CODE_LENGTH,
  MOBILE_CONNECT_CODE_TTL_MS,
  MOBILE_CONNECT_MAX_ACTIVE_CODES,
  MobileDevSessionRegistry,
  isMobileConnectCode,
  normalizeMobileConnectCode,
} from "../lib/mobile-dev-session/registryCore.mjs";
import { isExternalQaPathAllowed, readExternalQaServerConfig } from "../lib/external-qa/configCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const runToken = "a".repeat(64);
const otherRunToken = "b".repeat(64);
const qaHost = `alpha44-unit.${"trycloudflare.com"}`;
const now = Date.UTC(2026, 6, 18, 0, 0, 0);

assert.equal(MOBILE_CONNECT_CODE_LENGTH, 8);
assert.ok(MOBILE_CONNECT_CODE_TTL_MS <= 5 * 60 * 1000);
assert.equal(normalizeMobileConnectCode(" ab-cd 2345 "), "ABCD2345");

const registry = new MobileDevSessionRegistry();
const payload = { userId: "opaque-user", companyId: "opaque-company" };
const issued = registry.issue({ payload, runToken, now });
assert.equal(isMobileConnectCode(issued.code), true);
assert.equal(issued.code.length, 8);
assert.equal(registry.size, 1);
assert.equal(registry.entries.has(issued.code), false, "raw code must never be a registry key");
assert.deepEqual(registry.exchange({ code: issued.code, runToken: otherRunToken, now: now + 1 }), { ok: false, reason: "unavailable" });
assert.equal(registry.size, 1, "another QA run must not consume the code");
const exchanged = registry.exchange({ code: issued.code, runToken, now: now + 2 });
assert.equal(exchanged.ok, true);
assert.deepEqual(exchanged.payload, payload);
assert.equal(registry.size, 0, "successful exchange consumes the code exactly once");
assert.deepEqual(registry.exchange({ code: issued.code, runToken, now: now + 3 }), { ok: false, reason: "unavailable" });

const expiring = registry.issue({ payload, runToken, now });
assert.deepEqual(registry.exchange({ code: expiring.code, runToken, now: now + MOBILE_CONNECT_CODE_TTL_MS + 1 }), { ok: false, reason: "unavailable" });
assert.equal(registry.size, 0);

const bounded = new MobileDevSessionRegistry();
for (let index = 0; index < MOBILE_CONNECT_MAX_ACTIVE_CODES; index += 1) bounded.issue({ payload: { index }, runToken, now });
assert.throws(() => bounded.issue({ payload: {}, runToken, now }), /MOBILE_CONNECT_REGISTRY_FULL/);

const qaConfig = readExternalQaServerConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ENABLED: "true",
  WAFL_EXTERNAL_QA_ORIGIN: `https://${qaHost}`,
  WAFL_EXTERNAL_QA_HOST_ALLOWLIST: qaHost,
  WAFL_EXTERNAL_QA_RUN_TOKEN: runToken,
});
assert.equal(qaConfig.enabled, true);
assert.equal(qaConfig.runToken, runToken);

for (const [method, pathname] of [
  ["POST", "/api/dev/mobile-connect/exchange"],
  ["POST", "/api/dev/mobile-connect/disconnect"],
  ["GET", "/api/auth/me"],
  ["GET", "/api/v2/work-orders"],
  ["GET", "/api/v2/work-orders/9c2325ba-3b70-4d71-8eb5-c68db954829a"],
  ["GET", "/api/v2/work-orders/9c2325ba-3b70-fd71-0eb5-c68db954829a"],
]) assert.equal(isExternalQaPathAllowed(pathname, method), true, `${method} ${pathname}`);

for (const [method, pathname] of [
  ["GET", "/dev/mobile-connect"],
  ["POST", "/api/dev/mobile-connect/code"],
  ["GET", "/api/dev/mobile-connect/exchange"],
  ["OPTIONS", "/api/dev/mobile-connect/exchange"],
  ["POST", "/api/v2/work-orders"],
  ["PATCH", "/api/v2/work-orders/a"],
  ["GET", "/api/v2/work-orders/9c2325ba3b70fd710eb5c68db954829a"],
  ["GET", "/api/v2/work-orders/9c2325ba-3b70-fd71-0eb5-c68db954829a/extra"],
  ["GET", "/api/v2/work-orders/a/materials"],
  ["GET", "/api/v2/work-orders/a/processes"],
  ["GET", "/ui"], ["GET", "/roadmap"], ["GET", "/functions"], ["GET", "/system"],
]) assert.equal(isExternalQaPathAllowed(pathname, method), false, `${method} ${pathname}`);

const config = read("lib/mobile-dev-session/config.ts");
const service = read("lib/mobile-dev-session/service.ts");
const exchangeRoute = read("app/api/dev/mobile-connect/exchange/route.ts");
const disconnectRoute = read("app/api/dev/mobile-connect/disconnect/route.ts");
const issueRoute = read("app/api/dev/mobile-connect/code/route.ts");
const externalQaStart = read("tools/dev/start-wafl-external-qa.ps1");
const externalQaStatus = read("tools/dev/status-wafl-external-qa.ps1");
const newSessionSources = [config, service, exchangeRoute, disconnectRoute, issueRoute, read("lib/mobile-dev-session/registryCore.mjs")].join("\n");

assert.match(config, /isProductionEnvironment/);
assert.match(config, /request\.headers\.get\("host"\)/);
assert.doesNotMatch(config, /x-forwarded-host/);
assert.match(issueRoute, /isLocalMobileConnectRequest/);
assert.match(service, /getCurrentWaflAuthSession/);
assert.match(service, /isActiveSystemAdminSession/);
assert.match(service, /buildDevTestContextOptions/);
assert.match(service, /targetType !== "company"/);
assert.match(service, /permissionCode: "workorder\.read"/);
assert.match(service, /getWorkOrderV2ReadRuntimeGuard/);
assert.match(exchangeRoute, /createWaflSessionCookieValue/);
assert.match(exchangeRoute, /WAFL_AUTH_SESSION_COOKIE/);
assert.match(exchangeRoute, /httpOnly: true/);
assert.match(exchangeRoute, /secure: true/);
assert.match(exchangeRoute, /sameSite: "lax"/);
assert.match(exchangeRoute, /path: "\/"/);
assert.match(exchangeRoute, /2 \* 60 \* 60/);
assert.doesNotMatch(exchangeRoute, /session(Token|Cookie|Value).*json/i);
assert.match(disconnectRoute, /maxAge: 0/);
assert.match(disconnectRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);
assert.doesNotMatch(newSessionSources, /queryDb|INSERT\s|UPDATE\s|DELETE\s|R2|generated-document|access-token/i);
assert.doesNotMatch(newSessionSources, /console\.(log|info|warn|error)/);

assert.match(externalQaStart, /Test-WaflQaReadApiTarget/);
assert.match(externalQaStart, /GetSha256HexPrefix/);
assert.match(externalQaStart, /PipelineConfig\.Simulator\.ApprovedDbFingerprint/);
assert.match(externalQaStart, /PipelineConfig\.Simulator\.AllowedRuntimes/);
assert.match(externalQaStart, /PipelineConfig\.Simulator\.TestPrefix/);
assert.match(externalQaStart, /readApiGuard = "blocked"/);
assert.match(externalQaStart, /fingerprintVerified = \$false/);
assert.match(externalQaStart, /readApiGuard = "ready"/);
assert.match(externalQaStart, /fingerprintVerified = \$true/);
for (const name of [
  "WAFL_V2_READ_API_ENABLED",
  "WAFL_V2_READ_APPROVED",
  "WAFL_V2_RUNTIME",
  "WAFL_V2_TEST_PREFIX",
  "WAFL_V2_APPROVED_DB_FINGERPRINT",
]) {
  assert.equal((externalQaStart.match(new RegExp(name, "g")) ?? []).length, 1, `${name} must be injected exactly once into the Next environment`);
}
const mobileEnvironmentBlock = externalQaStart.slice(externalQaStart.indexOf("$mobileEnvironment = @{"));
assert.doesNotMatch(mobileEnvironmentBlock, /WAFL_V2_(?:READ|RUNTIME|TEST_PREFIX|APPROVED_DB_FINGERPRINT)/);
assert.doesNotMatch(externalQaStart, /ApprovedDbFingerprint\s*=\s*"[0-9a-f]{12}"/i);
assert.doesNotMatch(externalQaStart, /SetEnvironmentVariable\([^\n]+(?:User|Machine)/);
assert.match(externalQaStatus, /Read API guard:/);
assert.match(externalQaStatus, /DB fingerprint verified:/);

console.log("workorder v2 alpha.44 mobile dev session security contract: PASS");
