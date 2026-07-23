import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

import {
  ExternalQaConfigError,
  isExternalQaPathAllowed,
  normalizeRequestHost,
  readExternalQaServerConfig,
  readMobileQaConfig,
  validateQaOrigin,
} from "../lib/external-qa/configCore.mjs";
import {
  assertPdfViewerOriginPolicy,
  TEMPORARY_EXTERNAL_QA_ONLY,
} from "../lib/generated-documents/work-order-pdf/viewerOriginPolicyCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const quickHost = `alpha43-unit.${"trycloudflare.com"}`;
const quickOrigin = `https://${quickHost}`;

assert.equal(validateQaOrigin("https://qa.wafl.test", { externalQa: true }), "https://qa.wafl.test");
assert.throws(() => validateQaOrigin("http://qa.wafl.test", { externalQa: true }), (error) => error instanceof ExternalQaConfigError && error.code === "EXTERNAL_QA_HTTPS_REQUIRED");
assert.throws(() => validateQaOrigin("https://localhost:3000", { externalQa: true }), (error) => error.code === "EXTERNAL_QA_LOCALHOST_FORBIDDEN");
assert.throws(() => validateQaOrigin(quickOrigin, { externalQa: true, production: true }), (error) => error.code === "PRODUCTION_TEMPORARY_ORIGIN_FORBIDDEN");
assert.throws(() => validateQaOrigin("https://qa.wafl.test/path", { externalQa: true }), (error) => error.code === "EXTERNAL_QA_ORIGIN_MUST_BE_ORIGIN_ONLY");

const serverConfig = readExternalQaServerConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ENABLED: "true",
  WAFL_EXTERNAL_QA_ORIGIN: quickOrigin,
  WAFL_EXTERNAL_QA_HOST_ALLOWLIST: quickHost,
  WAFL_EXTERNAL_QA_RUN_TOKEN: "a".repeat(64),
});
assert.equal(serverConfig.enabled, true);
assert.equal(serverConfig.hostname, quickHost);
assert.equal(normalizeRequestHost(`${quickHost}:443`), quickHost);
assert.equal(normalizeRequestHost(`${quickHost},attacker.invalid`), null);
assert.deepEqual(readExternalQaServerConfig({ WAFL_EXTERNAL_QA_ENABLED: "false" }), { enabled: false });

assert.deepEqual(readMobileQaConfig({ WAFL_SERVER_RUNTIME_MODE: "dev" }), { externalQa: false, origin: null, apiOrigin: null, webOrigin: null, developerAutoConnect: false });
assert.equal(readMobileQaConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  EXPO_PUBLIC_WAFL_EXTERNAL_QA: "true",
  EXPO_PUBLIC_WAFL_WEB_BASE_URL: quickOrigin,
}, { requireExternalQa: true }).origin, quickOrigin);
assert.throws(() => readMobileQaConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  EXPO_PUBLIC_WAFL_EXTERNAL_QA: "true",
  EXPO_PUBLIC_WAFL_WEB_BASE_URL: "http://localhost:3000",
}, { requireExternalQa: true }), (error) => error.code === "EXTERNAL_QA_HTTPS_REQUIRED" || error.code === "EXTERNAL_QA_LOCALHOST_FORBIDDEN");

for (const [method, pathname] of [
  ["GET", "/v"],
  ["POST", "/api/public/document-viewer/session"],
  ["GET", "/api/public/document-viewer/file"],
  ["GET", "/api/public/document-viewer/download"],
  ["GET", "/workspace/documents/WAFN-001/preview"],
  ["GET", "/workspace/workorders/a/revisions/b/preview"],
  ["GET", "/api/v2/work-orders/documents/WAFN-001/preview-target"],
  ["GET", "/api/v2/work-orders/a/revisions/b/preview"],
  ["GET", "/api/v2/work-orders/a/documents"],
  ["GET", "/api/v2/work-orders/documents/a/file"],
  ["GET", "/api/v2/work-orders"],
  ["GET", "/_next/static/chunks/app.js"],
]) assert.equal(isExternalQaPathAllowed(pathname, method), true, `${method} ${pathname}`);

for (const [method, pathname] of [
  ["GET", "/ui"], ["GET", "/roadmap"], ["GET", "/functions"], ["GET", "/system"],
  ["GET", "/dev/workorder-preview-sample"],
  ["POST", "/api/v2/work-orders/a/documents"], ["GET", "/api/admin/companies"],
  ["GET", "/dev/test-console"], ["POST", "/api/public/document-viewer/file"],
]) assert.equal(isExternalQaPathAllowed(pathname, method), false, `${method} ${pathname}`);

const proxy = read("proxy.ts");
assert.match(proxy, /request\.headers\.get\("host"\)/);
assert.doesNotMatch(proxy, /headers\.get\("x-forwarded-host"\)/);
assert.match(proxy, /isExternalQaPathAllowed/);
assert.match(proxy, /private, no-store/);
assert.match(proxy, /noindex, nofollow, noarchive/);

const nextConfig = read("next.config.ts");
for (const header of ["Cache-Control", "Referrer-Policy", "X-Robots-Tag", "X-Content-Type-Options", "Content-Security-Policy"]) assert.match(nextConfig, new RegExp(header));

const mobilePreview = read("apps/mobile/utils/previewLink.ts");
assert.match(mobilePreview, /EXPO_PUBLIC_WAFL_EXTERNAL_QA/);
assert.match(mobilePreview, /url\.pathname !== "\/"/);
assert.match(mobilePreview, /\/workspace\/documents\//);

const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
for (const script of ["start", "start:tunnel", "start:lan", "start:tailscale-lan", "expo:config", "qa:config:audit"]) assert.equal(typeof mobilePackage.scripts[script], "string");
assert.match(mobilePackage.scripts["start:tunnel"], /reject-wafl-expo-tunnel/);
assert.doesNotMatch(mobilePackage.scripts["start:tunnel"], /expo start --tunnel/);
assert.match(mobilePackage.scripts["start:tailscale-lan"], /--external-qa.*expo start --lan/);
for (const [dependency, version] of Object.entries({
  expo: "~55.0.28",
  "expo-constants": "~55.0.17",
  "expo-dev-client": "~55.0.37",
  "expo-font": "~55.0.8",
  "expo-linking": "~55.0.16",
  "expo-router": "~55.0.17",
  react: "19.2.0",
  "react-native": "0.83.6",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0",
})) assert.equal(mobilePackage.dependencies[dependency], version, `${dependency} must match the Expo SDK 55 online compatibility baseline`);
assert.equal(Object.hasOwn(mobilePackage.dependencies, "expo-updates"), false);

const mobileConfig = JSON.parse(read("apps/mobile/app.json"));
assert.equal(mobileConfig.expo.owner, "lostab");
assert.equal(mobileConfig.expo.slug, "wafl-mobile");
assert.equal(mobileConfig.expo.version, "2.0.0");
assert.equal(mobileConfig.expo.extra.appVersion, "2.0.0-alpha.54");
assert.equal(mobileConfig.expo.extra.eas.projectId, "6cc3b260-a2cc-4c97-9c15-764bda530836");
assert.equal(mobileConfig.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(mobileConfig.expo.ios.config.usesNonExemptEncryption, false);
assert.equal(mobileConfig.expo.android.package, "com.wafl.app");
assert.deepEqual(mobileConfig.expo.plugins, ["expo-router"]);
assert.equal(Object.hasOwn(mobileConfig.expo, "newArchEnabled"), false);
assert.equal(Object.hasOwn(mobileConfig.expo, "runtimeVersion"), false);

const require = createRequire(import.meta.url);
const mobileConfigFactory = require("../apps/mobile/app.config.js");
const resolveMobileConfig = (variant) => {
  const previous = process.env.APP_VARIANT;
  try {
    if (variant === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = variant;
    return mobileConfigFactory({ config: structuredClone(mobileConfig.expo) });
  } finally {
    if (previous === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = previous;
  }
};
const defaultMobileConfig = resolveMobileConfig(undefined);
const productionMobileConfig = resolveMobileConfig("production");
const developmentMobileConfig = resolveMobileConfig("development");
const developmentAts = developmentMobileConfig.ios.infoPlist?.NSAppTransportSecurity;

assert.deepEqual(developmentAts, {
  NSExceptionDomains: {
    "100.64.0.0/10": {
      NSExceptionAllowsInsecureHTTPLoads: true,
    },
  },
});
for (const config of [defaultMobileConfig, productionMobileConfig]) {
  assert.equal(config.ios.infoPlist?.NSAppTransportSecurity, undefined);
  assert.equal(JSON.stringify(config).includes("NSAllowsArbitraryLoads"), false);
}
assert.equal(JSON.stringify(developmentMobileConfig).includes("NSAllowsArbitraryLoads"), false);
assert.equal(JSON.stringify(developmentMobileConfig).includes("0.0.0.0/0"), false);
for (const config of [defaultMobileConfig, productionMobileConfig, developmentMobileConfig]) {
  assert.equal(config.owner, "lostab");
  assert.equal(config.slug, "wafl-mobile");
  assert.equal(config.version, "2.0.0");
  assert.equal(config.extra.appVersion, "2.0.0-alpha.54");
  assert.equal(config.extra.eas.projectId, "6cc3b260-a2cc-4c97-9c15-764bda530836");
  assert.equal(config.ios.bundleIdentifier, "com.wafl.app");
  assert.equal(config.ios.config.usesNonExemptEncryption, false);
  assert.equal(config.android.package, "com.wafl.app");
}

const easConfig = JSON.parse(read("apps/mobile/eas.json"));
assert.deepEqual(easConfig, {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: {
    development: {
      developmentClient: true,
      distribution: "internal",
      env: { APP_VARIANT: "development" },
    },
  },
});

const startScript = read("tools/dev/start-wafl-external-qa.ps1");
const stopScript = read("tools/dev/stop-wafl-external-qa.ps1");
const commonScript = read("tools/dev/wafl-external-qa-common.ps1");
assert.match(startScript, /quick-tunnel-origin-validated/);
assert.match(startScript, /EXPO_PUBLIC_WAFL_WEB_BASE_URL/);
assert.match(startScript, /ValidateSet\("ExpoTunnelLegacyDisabled", "Lan", "TailscaleLan", "DeveloperAutoConnect"\)/);
assert.match(startScript, /EXPO_PACKAGER_PROXY_URL/);
assert.equal((startScript.match(/APP_VARIANT/g) ?? []).length, 1);
assert.match(startScript, /if \(\$MobileTransport -in @\("TailscaleLan", "DeveloperAutoConnect"\)\) \{\s*\$mobileEnvironment\.APP_VARIANT = "development"\s*\$mobileEnvironment\.EXPO_PACKAGER_PROXY_URL/);
assert.match(startScript, /expo-tailscale-lan-ready/);
assert.match(startScript, /"--lan"/);
assert.doesNotMatch(startScript, /"--tunnel"/);
assert.match(startScript, /Existing owned processes were preserved/);
assert.doesNotMatch(startScript, /Stop-Process|taskkill|Get-Process\s+.*node/);
for (const marker of ["ownerMarker", "executablePath", "startedAtUtc", "markerPath"]) assert.match(`${commonScript}\n${stopScript}`, new RegExp(marker));
assert.match(stopScript, /Stop-Process -Id \$record\.pid/);
assert.doesNotMatch(stopScript, /Stop-Process\s+-(Name|ProcessName)|taskkill|killall/);
assert.doesNotMatch(`${startScript}\n${commonScript}`, /Write-(Host|Output|Warning|Error).*runToken/i);

const externalQaAudit = read("scripts/audit-wafl-external-qa-config.mjs");
assert.match(externalQaAudit, /DEVELOPMENT_BUILD_DEPENDENCY_REQUIRED/);
assert.match(externalQaAudit, /developmentBuildStaticCompatibility/);
assert.match(externalQaAudit, /expoGoOfficialQa:\s*"EXCLUDED"/);

assert.throws(() => assertPdfViewerOriginPolicy({ origin: quickOrigin, runtime: "development", persistence: "generated-document" }), /PERMANENT_PDF_TEMPORARY_ORIGIN_FORBIDDEN/);
assert.throws(() => assertPdfViewerOriginPolicy({ origin: "http://localhost:3000", runtime: "production", persistence: "generated-document" }), /PERMANENT_PDF_LOCALHOST_FORBIDDEN/);
assert.equal(assertPdfViewerOriginPolicy({ origin: "http://localhost:3000", runtime: "development", persistence: "generated-document", developmentOnly: true }), "http://localhost:3000");
assert.equal(assertPdfViewerOriginPolicy({ origin: quickOrigin, runtime: "development", persistence: "temporary-qa", marker: TEMPORARY_EXTERNAL_QA_ONLY }), quickOrigin);
assert.throws(() => assertPdfViewerOriginPolicy({ origin: quickOrigin, runtime: "development", persistence: "temporary-qa" }), /TEMPORARY_QA_MARKER_REQUIRED/);

const finalStatus = "ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE";
for (const documentPath of [
  "docs/project/app-v2/40-external-mobile-qa-foundation-evidence.md",
  "docs/project/app-v2/42-ios-development-build-evidence.md",
]) {
  assert.match(read(documentPath), new RegExp(finalStatus), `${documentPath} must retain the final alpha.43 status`);
}
const finalBuildEvidence = read("docs/project/app-v2/42-ios-development-build-evidence.md");
assert.match(finalBuildEvidence, /without the former ATS secure-connection error/);
assert.match(finalBuildEvidence, /exactly one Development Client Reload/);
assert.match(finalBuildEvidence, /build number `1`/);
assert.match(finalBuildEvidence, /monotonic iOS auto-increment policy/);
assert.match(finalBuildEvidence, /DB\/R2\/token\/PDF\/Worker\/production mutation stayed zero/);

const candidateFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const committedTemporaryOriginPattern = /https:\/\/[a-z0-9-]{12,}\.trycloudflare\.com/gi;
const violations = [];
for (const file of candidateFiles) {
  if (!/\.(?:env|json|mjs|mts|ts|tsx|md|ps1)$/i.test(file) || !fs.existsSync(file)) continue;
  const contents = read(file);
  if (committedTemporaryOriginPattern.test(contents)) violations.push(file);
  committedTemporaryOriginPattern.lastIndex = 0;
}
assert.deepEqual(violations, []);

console.log("workorder v2 alpha.43 external mobile QA contract: PASS");
