import assert from "node:assert/strict";
import fs from "node:fs";

const access = fs.readFileSync("lib/auth/systemAdminAccess.ts", "utf8");
const idControlPage = fs.readFileSync("app/id-control/page.tsx", "utf8");
const consoleRedirectPage = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const functionsPage = fs.readFileSync("app/functions/page.tsx", "utf8");
const uiPage = fs.readFileSync("app/ui/page.tsx", "utf8");
const service = fs.readFileSync("lib/dev/testContext/service.ts", "utf8");
const repository = fs.readFileSync("lib/dev/testContext/repository.ts", "utf8");
const session = fs.readFileSync("lib/dev/testContext/session.ts", "utf8");
const optionsRoute = fs.readFileSync("app/api/dev/test-context/options/route.ts", "utf8");
const switchRoute = fs.readFileSync("app/api/dev/test-context/switch/route.ts", "utf8");
const clearRoute = fs.readFileSync("app/api/dev/test-context/clear/route.ts", "utf8");
const config = fs.readFileSync("lib/dev/testContext/config.ts", "utf8");
const serverRuntime = fs.readFileSync("lib/runtime/serverRuntime.ts", "utf8");
const runtimeMode = fs.readFileSync("lib/runtime/runtimeMode.ts", "utf8");
const runtimePolicy = fs.readFileSync("lib/runtime/runtimePolicy.ts", "utf8");
const functionsRuntime = fs.readFileSync("lib/functions/runtimeAccess.ts", "utf8");
const uiRuntime = fs.readFileSync("lib/uiCatalog/runtimeAccess.ts", "utf8");

assert.match(access, /FROM system_users/);
assert.match(access, /role = 'system_admin'/);
assert.match(access, /is_active = true/);
assert.match(access, /lower\(email\) = lower\(\$1\)/);

for (const page of [idControlPage, consoleRedirectPage, functionsPage, uiPage]) {
  assert.match(page, /getCurrentWaflAuthSession/);
  assert.match(page, /isActiveSystemAdminSession/);
  assert.match(page, /notFound\(\)/);
}
assert.match(idControlPage, /isDevTestContextEnabled/);
assert.match(idControlPage, /DevTestConsoleClient/);
assert.doesNotMatch(consoleRedirectPage, /isDevTestContextEnabled/);
assert.match(consoleRedirectPage, /redirect\("\/id-control"\)/);
assert.doesNotMatch(consoleRedirectPage, /<DevTestConsoleClient/);
assert.match(functionsPage, /isWaflFunctionsRuntimeAllowed/);
assert.match(uiPage, /isWaflUiCatalogRuntimeAllowed/);
assert.doesNotMatch(uiPage, /WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED = false/);

for (const [name, source] of [
  ["runtime mode", runtimeMode],
  ["functions runtime", functionsRuntime],
  ["ui runtime", uiRuntime],
  ["id-control page", idControlPage],
  ["dev console redirect", consoleRedirectPage],
  ["options route", optionsRoute],
  ["switch route", switchRoute],
  ["clear route", clearRoute],
]) {
  assert.doesNotMatch(source, /NODE_ENV|VERCEL_ENV|NEXT_PUBLIC_APP_RUNTIME_MODE|WAFL_ENABLE_DEV_TEST_CONSOLE/, `${name} must not feature-gate by environment`);
}
assert.match(config, /isServerDevTestRuntime/);
assert.match(config, /WAFL_ENABLE_DEV_TEST_CONTEXT === "1"/);
assert.doesNotMatch(config, /NEXT_PUBLIC_APP_RUNTIME_MODE|WAFL_ENABLE_DEV_TEST_CONSOLE/);
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

assert.match(repository, /FROM system_users/);
assert.match(repository, /role = 'system_admin'/);
assert.match(session, /targetCompanyId: string \| null/);
assert.match(session, /value === "system_admin"/);
assert.match(service, /isActiveSystemAdminSession\(actualSession\)/);
assert.match(service, /target\.role === "system_admin"/);
assert.match(service, /target\.email\.trim\(\)\.toLowerCase\(\) !== actualSession\.email/);

for (const route of [optionsRoute, switchRoute, clearRoute]) {
  assert.match(route, /SYSTEM_ADMIN_REQUIRED/);
  assert.match(route, /isActiveSystemAdminSession/);
}
assert.doesNotMatch(switchRoute, /status:\s*404/);
assert.doesNotMatch(clearRoute, /status:\s*404/);
assert.match(switchRoute, /dev_test\.context_switched/);
assert.match(clearRoute, /dev_test\.context_cleared/);
assert.match(switchRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);
assert.match(optionsRoute, /buildDevTestContextOptions\(actualSession, effectiveSession\)/);
assert.match(optionsRoute, /devTestContextEnabled\s*=\s*canSwitchTestAccount/);
assert.doesNotMatch(optionsRoute, /targets:\s*\[\]/);

console.log("dev test console system-admin access contract passed");
