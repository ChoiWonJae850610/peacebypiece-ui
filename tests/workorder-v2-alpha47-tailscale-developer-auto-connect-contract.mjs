#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isExternalQaPathAllowed,
  isTailscaleServePathAllowed,
  readExternalQaServerConfig,
  readMobileQaConfig,
} from "../lib/external-qa/configCore.mjs";
import {
  matchesApprovedLoginHash,
  normalizeTailscaleUserLogin,
  sha256Hex,
} from "../lib/mobile-dev-session/tailscaleIdentityCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));
const quickHost = "alpha47-unit.trycloudflare.com";
const serveHost = "alpha47-unit.example-tailnet.ts.net";
const login = "developer@example.invalid";
const admin = "administrator@example.invalid";
const loginHash = sha256Hex(login);
const adminHash = sha256Hex(admin);

assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.51/);
assert.match(read("apps/mobile/constants/version.ts"), /2\.0\.0-alpha\.51/);
assert.equal(json("apps/mobile/package.json").version, "2.0.0-alpha.51");
assert.equal(json("apps/mobile/package-lock.json").version, "2.0.0-alpha.51");
assert.equal(json("apps/mobile/package-lock.json").packages[""].version, "2.0.0-alpha.51");
const appJson = json("apps/mobile/app.json");
assert.equal(appJson.expo.version, "2.0.0");
assert.equal(appJson.expo.extra.appVersion, "2.0.0-alpha.51");
assert.equal(appJson.expo.extra.dataMode, "dev-test-tailscale-auto-connect");
assert.equal(appJson.expo.extra.mockOnly, false);
assert.equal(appJson.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(appJson.expo.android.package, "com.wafl.app");
assert.deepEqual(json("apps/mobile/eas.json"), {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: { development: { developmentClient: true, distribution: "internal", env: { APP_VARIANT: "development" } } },
});
assert.match(read("apps/mobile/app.config.js"), /100\.64\.0\.0\/10/);
assert.doesNotMatch(read("apps/mobile/app.config.js"), /NSAllowsArbitraryLoads/);

const serverEnv = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ENABLED: "true",
  WAFL_EXTERNAL_QA_ORIGIN: `https://${quickHost}`,
  WAFL_EXTERNAL_QA_HOST_ALLOWLIST: quickHost,
  WAFL_EXTERNAL_QA_RUN_TOKEN: "r".repeat(64),
  WAFL_TAILSCALE_DEVELOPER_AUTO_CONNECT_ENABLED: "true",
  WAFL_TAILSCALE_SERVE_ORIGIN: `https://${serveHost}`,
  WAFL_TAILSCALE_SERVE_HOST_ALLOWLIST: serveHost,
  WAFL_TAILSCALE_DEVELOPER_LOGIN_SHA256: loginHash,
  WAFL_DEVELOPER_SYSTEM_ADMIN_EMAIL_SHA256: adminHash,
};
const server = readExternalQaServerConfig(serverEnv);
assert.equal(server.enabled, true);
assert.equal(server.tailscaleServe.hostname, serveHost);
assert.equal(server.tailscaleServe.hostAllowlist.size, 1);
assert.equal(server.tailscaleServe.developerLoginSha256, loginHash);
assert.equal(server.tailscaleServe.developerSystemAdminEmailSha256, adminHash);
assert.throws(() => readExternalQaServerConfig({ ...serverEnv, WAFL_SERVER_RUNTIME_MODE: "production" }));
assert.throws(() => readExternalQaServerConfig({ ...serverEnv, WAFL_TAILSCALE_SERVE_HOST_ALLOWLIST: `${serveHost},other.ts.net` }));

const mobile = readMobileQaConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  EXPO_PUBLIC_WAFL_EXTERNAL_QA: "true",
  EXPO_PUBLIC_WAFL_DEVELOPER_AUTO_CONNECT: "true",
  EXPO_PUBLIC_WAFL_API_BASE_URL: `https://${serveHost}`,
  EXPO_PUBLIC_WAFL_WEB_BASE_URL: `https://${quickHost}`,
}, { requireExternalQa: true });
assert.equal(mobile.apiOrigin, `https://${serveHost}`);
assert.equal(mobile.webOrigin, `https://${quickHost}`);
assert.equal(mobile.developerAutoConnect, true);
assert.throws(() => readMobileQaConfig({
  WAFL_SERVER_RUNTIME_MODE: "production",
  EXPO_PUBLIC_WAFL_EXTERNAL_QA: "true",
  EXPO_PUBLIC_WAFL_DEVELOPER_AUTO_CONNECT: "true",
  EXPO_PUBLIC_WAFL_API_BASE_URL: `https://${serveHost}`,
  EXPO_PUBLIC_WAFL_WEB_BASE_URL: `https://${quickHost}`,
}, { requireExternalQa: true }));

assert.equal(isExternalQaPathAllowed("/api/dev/mobile-connect/auto", "POST"), false);
for (const [method, pathname] of [
  ["POST", "/api/dev/mobile-connect/auto"], ["POST", "/api/dev/mobile-connect/exchange"],
  ["POST", "/api/dev/mobile-connect/disconnect"], ["GET", "/api/auth/me"],
  ["GET", "/api/v2/work-orders"], ["GET", "/api/v2/work-orders/00000000-0000-0000-0000-000000000001"],
]) assert.equal(isTailscaleServePathAllowed(pathname, method, serverEnv), true, `${method} ${pathname}`);
for (const [method, pathname] of [
  ["POST", "/api/dev/mobile-connect/code"], ["POST", "/api/v2/work-orders"],
  ["GET", "/api/v2/work-orders/x/materials"], ["GET", "/dev/mobile-connect"],
  ["GET", "/ui"], ["GET", "/roadmap"], ["GET", "/functions"], ["GET", "/system"],
]) assert.equal(isTailscaleServePathAllowed(pathname, method, serverEnv), false, `${method} ${pathname}`);
assert.equal(isTailscaleServePathAllowed("/api/v2/work-orders/00000000-0000-0000-0000-000000000001", "PATCH", serverEnv), false);

assert.equal(normalizeTailscaleUserLogin(" Developer@Example.Invalid "), login);
assert.equal(normalizeTailscaleUserLogin("=?utf-8?q?developer=40example.invalid?="), login);
assert.equal(normalizeTailscaleUserLogin(`${login},attacker@example.invalid`), null);
assert.equal(normalizeTailscaleUserLogin(`${login}\u0000`), null);
assert.equal(matchesApprovedLoginHash(login, loginHash), true);
assert.equal(matchesApprovedLoginHash(login, adminHash), false);

const proxy = read("proxy.ts");
const autoRoute = read("app/api/dev/mobile-connect/auto/route.ts");
const autoService = read("lib/mobile-dev-session/tailscaleAutoConnect.ts");
const mobileApp = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const connectScreen = read("apps/mobile/components/MobileConnectScreen.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const start = read("tools/dev/start-wafl-external-qa.ps1");
const stop = read("tools/dev/stop-wafl-external-qa.ps1");
const common = read("tools/dev/wafl-external-qa-common.ps1");
const status = read("tools/dev/status-wafl-external-qa.ps1");
const mapping = read("scripts/resolve-wafl-alpha47-developer-mapping.mjs");

assert.match(proxy, /request\.headers\.get\("host"\)/);
assert.doesNotMatch(proxy, /headers\.get\("x-forwarded-host"\)/);
assert.match(proxy, /isTailscaleServePathAllowed/);
assert.match(autoRoute, /request\.headers\.get\("tailscale-user-login"\)/);
assert.doesNotMatch(`${autoRoute}\n${autoService}`, /tailscale-user-name|tailscale-user-profile-pic|x-forwarded-host/i);
assert.match(autoRoute, /httpOnly: true/);
assert.match(autoRoute, /secure: true/);
assert.match(autoRoute, /sameSite: "lax"/);
assert.match(autoRoute, /path: "\/"/);
assert.match(autoRoute, /MAX_SESSION_AGE_SECONDS = 2 \* 60 \* 60/);
assert.match(autoRoute, /Cache-Control.*private, no-store/);
const successBody = autoRoute.match(/\{ ok: true, connected: true, mode: "tailscale-developer" \}/)?.[0] ?? "";
assert.doesNotMatch(successBody, /email|companyId|userId|targetKey|autoConnectSecret/);
assert.match(autoService, /CANONICAL_COMPANY_A_ID = "wafl-fn-company-a"/);
assert.doesNotMatch(autoService, /test-company-a/);
assert.match(autoService, /administrators\.length !== 1/);
assert.match(autoService, /targets\.length !== 1/);
assert.match(autoService, /company_admin/);
assert.match(autoService, /workorder\.read/);
assert.match(mapping, /BEGIN READ ONLY/);
assert.match(mapping, /ACTIVE_SYSTEM_ADMIN_COUNT_MUST_BE_ONE/);
assert.doesNotMatch(mapping, /\b(?:INSERT\s+INTO|UPDATE\s+[A-Za-z_]|DELETE\s+FROM|UPSERT)\b/i);

assert.match(apiClient, /EXPO_PUBLIC_WAFL_API_BASE_URL/);
assert.match(read("apps/mobile/utils/previewLink.ts"), /EXPO_PUBLIC_WAFL_WEB_BASE_URL/);
assert.match(apiClient, /\/api\/dev\/mobile-connect\/auto/);
assert.match(apiClient, /credentials: "include"/);
for (const phase of ["session-checking", "developer-auto-connecting", "disconnected-auto-failed", "manual-code-entry", "connecting-manual"]) assert.match(mobileApp, new RegExp(phase));
assert.match(mobileApp, /bootStarted\.current/);
assert.match(mobileApp, /autoConnectInFlight\.current/);
assert.match(mobileApp, /manualDisconnectSuppressed\.current = true/);
assert.match(connectScreen, /자동 연결 다시 시도/);
assert.match(connectScreen, /연결 코드 사용/);
assert.match(connectScreen, /8자리 개발용 연결 코드/);
assert.doesNotMatch(mobileApp, /setInterval|polling/i);

assert.match(start, /DeveloperAutoConnect/);
assert.match(start, /"-H", "127\.0\.0\.1"/);
assert.match(start, /WAFL_TAILSCALE_DEVELOPER_LOGIN_SHA256/);
assert.match(start, /WAFL_DEVELOPER_SYSTEM_ADMIN_EMAIL_SHA256/);
assert.match(start, /EXPO_PUBLIC_WAFL_API_BASE_URL/);
assert.match(start, /EXPO_PUBLIC_WAFL_WEB_BASE_URL/);
assert.match(start, /serve", "--https=443", "http:\/\/127\.0\.0\.1:\$NextPort"/);
assert.match(start, /TAILSCALE_EXISTING_SERVE_CONFIG_CONFLICT/);
assert.match(start, /TAILSCALE_SERVE_HTTPS_CONSENT_REQUIRED/);
assert.match(stop, /"tailscale-serve" \{ 1 \}/);
assert.match(stop, /Test-WaflQaStopProcessOwnership/);
assert.match(stop, /Test-WaflQaAlternativeServeProcessMetadata/);
assert.match(stop, /Get-WaflQaRunnerProcessDisposition/);
assert.match(stop, /pid-reused-runner-already-stopped/);
assert.match(stop, /protectedPidReuses/);
assert.equal((stop.match(/Get-WmiObject -Class Win32_Process -Filter/g) ?? []).length, 1);
assert.match(stop, /Get-WaflQaFunnelSemanticState/);
assert.match(common, /serve-bounded-fallback/);
assert.match(common, /StartTime\.ToUniversalTime/);
assert.match(common, /serve-command-line-mismatch/);
assert.match(common, /AllowFunnelTrueCount/);
assert.match(status, /Developer auto-connect ready/);
assert.doesNotMatch(`${start}\n${stop}`, /tailscale\s+serve\s+reset|tailscale\s+funnel\s+reset|tailscale\s+down/i);
assert.doesNotMatch(start.slice(start.indexOf("$mobileEnvironment = @{")), /WAFL_TAILSCALE_DEVELOPER_LOGIN_SHA256|WAFL_DEVELOPER_SYSTEM_ADMIN_EMAIL_SHA256|WAFL_V2_APPROVED_DB_FINGERPRINT/);

const packageDependencies = json("apps/mobile/package.json").dependencies;
assert.equal(Object.hasOwn(packageDependencies, "@react-native-cookies/cookies"), false);
assert.equal(Object.hasOwn(packageDependencies, "expo-secure-store"), false);
assert.match(read("app/api/dev/mobile-connect/exchange/route.ts"), /exchangeMobileConnectCode/);
assert.match(read("lib/mobile-dev-session/registryCore.mjs"), /MOBILE_CONNECT_CODE_LENGTH = 8/);
assert.doesNotMatch(`${autoRoute}\n${autoService}\n${apiClient}`, /https:\/\/[a-z0-9-]+\.trycloudflare\.com|https:\/\/[a-z0-9.-]+\.ts\.net/i);

console.log("workorder v2 alpha.47 Tailscale Serve developer auto-connect contract: PASS");
