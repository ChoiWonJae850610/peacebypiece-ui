import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

const idControlPage = read("app/id-control/page.tsx");
const roadmapPage = read("app/roadmap/page.tsx");
const uiPage = read("app/ui/page.tsx");
const functionsPage = read("app/functions/page.tsx");
const devRedirectPage = read("app/dev/test-console/page.tsx");
const devClient = read("app/dev/test-console/DevTestConsoleClient.tsx");
const optionsRoute = read("app/api/dev/test-context/options/route.ts");
const switchRoute = read("app/api/dev/test-context/switch/route.ts");
const clearRoute = read("app/api/dev/test-context/clear/route.ts");
const systemShell = read("components/system/SystemConsoleShell.tsx");
const internalNavigation = read("lib/system/systemInternalToolsNavigation.ts");
const uiCatalog = read("app/ui/WaflUiCatalogPage.tsx");
const functionsClient = read("app/functions/FunctionsCatalogClient.tsx");
const permanentRules = read("docs/project/app-v2/09-codex-working-rules.md");
const productizationRoadmap = read("docs/productization-roadmap.md");
const runtimePolicy = read("lib/runtime/runtimePolicy.ts");
const devConfig = read("lib/dev/testContext/config.ts");
const serverRuntime = read("lib/runtime/serverRuntime.ts");
const functionsRuntime = read("lib/functions/runtimeAccess.ts");
const uiRuntime = read("lib/uiCatalog/runtimeAccess.ts");
const runtimeMode = read("lib/runtime/runtimeMode.ts");

for (const [name, source] of [
  ["/id-control", idControlPage],
  ["/roadmap", roadmapPage],
  ["/ui", uiPage],
  ["/functions", functionsPage],
]) {
  assert.match(source, /getCurrentWaflAuthSession/, `${name} must require authentication`);
  assert.match(source, /isActiveSystemAdminSession/, `${name} must use canonical system-admin guard`);
  assert.match(source, /notFound\(\)/, `${name} must block non-system-admin access`);
}

assert.doesNotMatch(
  idControlPage,
  /if\s*\(\s*!isDevTestContextEnabled\(\)\s*\)\s*\{\s*notFound\(\)/,
  "/id-control must not use dev/test runtime as page access guard",
);
assert.doesNotMatch(
  uiPage,
  /if\s*\(\s*!isWaflUiCatalogRuntimeAllowed\(\)\s*\)\s*\{\s*notFound\(\)/,
  "/ui must not use runtime mode as page access guard",
);
assert.doesNotMatch(
  functionsPage,
  /if\s*\(\s*!isWaflFunctionsRuntimeAllowed\(\)\s*\)\s*\{\s*notFound\(\)/,
  "/functions must not use runtime mode as page access guard",
);

assert.match(uiPage, /isRuntimeAllowed=\{isWaflUiCatalogRuntimeAllowed\(\)\}/);
assert.match(functionsPage, /isExecutionRuntimeAllowed=\{isWaflFunctionsRuntimeAllowed\(\)\}/);
assert.match(idControlPage, /<DevTestConsoleClient \/>/);
assert.doesNotMatch(idControlPage, /devTestContextEnabled=\{|devTestContextDisabledReason=|isDevTestContextEnabled|getDevTestContextDisabledReason/);

assert.doesNotMatch(devRedirectPage, /isDevTestContextEnabled/);
assert.match(devRedirectPage, /redirect\("\/id-control"\)/);
assert.match(switchRoute, /DEV_TEST_CONTEXT_DISABLED/);
assert.match(switchRoute, /isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
assert.match(clearRoute, /isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
assert.match(clearRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);

assert.match(optionsRoute, /isActiveSystemAdminSession/);
assert.match(optionsRoute, /devTestContextEnabled,/);
assert.match(optionsRoute, /disabledReason:\s*devTestContextEnabled\s*\?\s*null\s*:\s*getDevTestContextDisabledReasonForSystemAdmin\(isSystemAdmin\)/);
assert.match(optionsRoute, /buildDevTestContextOptions\(actualSession, effectiveSession\)/);
assert.match(optionsRoute, /devTestContextEnabled\s*=\s*isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
assert.doesNotMatch(optionsRoute, /targets:\s*\[\]/);
assert.doesNotMatch(optionsRoute, /DEV_TEST_CONTEXT_DISABLED/);

assert.doesNotMatch(systemShell, /internalToolsVisible/);
assert.doesNotMatch(systemShell, /NODE_ENV\s*!==\s*"production"/);
assert.match(systemShell, /SYSTEM_CONSOLE_INTERNAL_TOOLS_NAVIGATION\.map/);

for (const [name, source] of [
  ["runtime policy", runtimePolicy],
  ["functions runtime", functionsRuntime],
  ["ui runtime", uiRuntime],
  ["runtime mode", runtimeMode],
  ["id-control page", idControlPage],
  ["dev redirect page", devRedirectPage],
  ["options route", optionsRoute],
  ["switch route", switchRoute],
  ["clear route", clearRoute],
  ["system shell", systemShell],
]) {
  assert.doesNotMatch(source, /NODE_ENV|VERCEL_ENV|NEXT_PUBLIC_APP_RUNTIME_MODE|WAFL_ENABLE_DEV_TEST_CONSOLE/, `${name} must not gate internal tools by environment strings`);
}
assert.match(devConfig, /isDevTestContextActionAllowedForSystemAdmin/);
assert.match(devConfig, /canSwitchTestAccount\(\{\s*isSystemAdmin\s*\}\)/);
assert.match(devConfig, /system_admin_required/);
assert.doesNotMatch(devConfig, /isServerDevTestRuntime|isServerProductionRuntime|WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT|production_impersonation_flag_disabled|NEXT_PUBLIC_APP_RUNTIME_MODE|WAFL_ENABLE_DEV_TEST_CONSOLE/);
assert.match(serverRuntime, /WAFL_SERVER_RUNTIME_MODE/);
assert.match(serverRuntime, /VERCEL_ENV/);
assert.match(serverRuntime, /NODE_ENV/);
assert.doesNotMatch(serverRuntime, /NEXT_PUBLIC/);

for (const fnName of [
  "canAccessIdControl",
  "canSwitchTestAccount",
  "canViewFunctionsCatalog",
  "canViewUICatalog",
  "canViewDiagnostics",
]) {
  assert.match(runtimePolicy, new RegExp(`export function ${fnName}`), `runtime policy missing ${fnName}`);
}

assert.doesNotMatch(switchRoute, /status:\s*404/);
assert.doesNotMatch(clearRoute, /status:\s*404/);

for (const token of [
  "개발 제어센터",
  "제품화 로드맵",
  "WAFL UI 카탈로그",
  "기능 및 자동화 현황",
  "조회 가능",
  "조회 전용",
  "/id-control",
  "/roadmap",
  "/ui",
  "/functions",
  "Seed, Reset, Cleanup, DB/R2",
]) {
  assert.ok(internalNavigation.includes(token), `internal navigation missing ${token}`);
}

for (const token of [
  "runtime과 관계없이 /id-control",
  "Seed, Reset, Cleanup, DB/R2 변경 기능은 별도 차단 정책을 유지합니다.",
  "현재 로그인 계정",
  "system-admin 상태",
  "현재 runtime",
  "현재 impersonation 상태",
  "원래 세션 복원",
  "계정 전환을 실행할 수 없습니다.",
  "제품화 로드맵",
  "WAFL UI 카탈로그",
  "기능 및 자동화 현황",
]) {
  assert.ok(devClient.includes(token), `id-control client missing ${token}`);
}

assert.ok(uiCatalog.includes("배포 환경과 관계없이 UI 카탈로그 조회"));
assert.ok(uiCatalog.includes("실행형 데모"));
assert.ok(functionsClient.includes("조회만 가능"));
assert.ok(functionsClient.includes("Seed, Reset, Cleanup, DB/R2 변경 실행"));

for (const [name, source] of [
  ["id-control client", devClient],
  ["ui catalog", uiCatalog],
  ["functions client", functionsClient],
  ["internal navigation", internalNavigation],
]) {
  assert.doesNotMatch(source, /\.env\.local/, `${name} must not mention .env.local`);
  assert.doesNotMatch(source, /DATABASE_URL|SECRET|TOKEN|ACCESS_KEY|PRIVATE_KEY/, `${name} must not expose secret names`);
}

for (const token of [
  "Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`",
  "`/id-control` test account switching is allowed",
  "Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged",
  "system-admin-internal-access",
]) {
  assert.ok(permanentRules.includes(token), `Permanent Rules missing ${token}`);
  assert.ok(productizationRoadmap.includes(token), `productization roadmap missing ${token}`);
}

console.log("system-admin internal access contract OK");
