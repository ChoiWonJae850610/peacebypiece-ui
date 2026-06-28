import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const config = read("lib/dev/testContext/config.ts");
const service = read("lib/dev/testContext/service.ts");
const repository = read("lib/dev/testContext/repository.ts");
const optionsRoute = read("app/api/dev/test-context/options/route.ts");
const switchRoute = read("app/api/dev/test-context/switch/route.ts");
const clearRoute = read("app/api/dev/test-context/clear/route.ts");
const client = read("app/dev/test-console/DevTestConsoleClient.tsx");

assert.match(config, /import \{ canSwitchTestAccount \} from "@\/lib\/runtime\/runtimePolicy"/);
assert.match(config, /isDevTestContextEnabledForSystemAdmin\(isSystemAdmin: boolean\)/);
assert.match(config, /return canSwitchTestAccount\(\{\s*isSystemAdmin\s*\}\)/);
assert.match(config, /isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin: boolean\)/);
assert.match(config, /system_admin_required/);
assert.doesNotMatch(
  config,
  /WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT|isServerDevTestRuntime|isServerProductionRuntime|VERCEL_ENV|NODE_ENV|NEXT_PUBLIC/,
  "id-control impersonation must not depend on runtime or action environment flags",
);

assert.match(optionsRoute, /isActiveSystemAdminSession\(actualSession\)/);
assert.match(optionsRoute, /SYSTEM_ADMIN_REQUIRED/);
assert.match(optionsRoute, /buildDevTestContextOptions\(actualSession, effectiveSession\)/);
assert.match(optionsRoute, /devTestContextEnabled\s*=\s*isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
assert.match(optionsRoute, /disabledReason:\s*devTestContextEnabled\s*\?\s*null\s*:\s*getDevTestContextDisabledReasonForSystemAdmin\(isSystemAdmin\)/);
assert.doesNotMatch(optionsRoute, /WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT|targets:\s*\[\]/);

for (const [name, route] of [
  ["switch", switchRoute],
  ["clear", clearRoute],
]) {
  assert.match(route, /getCurrentWaflAuthSession/);
  assert.match(route, /isActiveSystemAdminSession/);
  assert.match(route, /SYSTEM_ADMIN_REQUIRED/);
  assert.match(route, /isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
  assert.doesNotMatch(route, /WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT|NEXT_PUBLIC/, `${name} route must not use env action gates`);
}

assert.match(switchRoute, /targetKey/);
assert.match(switchRoute, /createDevTestContextOverlayPayload\(actualSession, targetKey\)/);
assert.match(switchRoute, /INVALID_TEST_CONTEXT_TARGET/);
assert.match(switchRoute, /dev_test\.context_switched/);
assert.match(switchRoute, /targetRole: result\.target\.role/);
assert.match(switchRoute, /targetCompanyId: result\.target\.companyId/);
assert.match(switchRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);
assert.doesNotMatch(switchRoute, /cookie payload|raw token|signed URL/i);

assert.match(clearRoute, /dev_test\.context_cleared/);
assert.match(clearRoute, /restoredRole: actualSession\.role/);
assert.match(clearRoute, /restoredCompanyId: actualSession\.companyId/);
assert.match(clearRoute, /maxAge: 0/);
assert.doesNotMatch(clearRoute, /cookie payload|raw token|signed URL/i);

assert.match(service, /isActiveSystemAdminSession\(baseSession\)/);
assert.match(service, /isActiveSystemAdminSession\(actualSession\)/);
assert.match(service, /isDevTestContextActionAllowedForSystemAdmin\(isSystemAdmin\)/);
assert.match(service, /verifyDevTestContextCookieValue\(value\)/);
assert.match(service, /getDevTestContextTargetByKey\(overlay\.targetKey\)/);
assert.match(service, /getDevTestContextTargetByKey\(targetKey\)/);
assert.match(service, /target\.role === "system_admin"/);
assert.match(service, /target\.email\.trim\(\)\.toLowerCase\(\) !== actualSession\.email/);
assert.doesNotMatch(service, /WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT|NEXT_PUBLIC/);

assert.match(repository, /TEST_TARGET_WHERE/);
assert.match(repository, /c\.id IN \('test-company-a', 'test-company-b'\) OR c\.id LIKE 'wafl-fn-company-%'/);
assert.match(repository, /cm\.status = 'approved'/);
assert.match(repository, /COALESCE\(cm\.role_template_code, ''\) <> 'system_admin'/);
assert.match(repository, /WHERE \$\{TEST_TARGET_WHERE\} AND cm\.id = \$1 LIMIT 1/);

assert.match(client, /devTestContextEnabled\?: boolean/);
assert.match(client, /disabledReason\?: "system_admin_required" \| null/);
assert.match(client, /const isActionEnabled = options\?\.devTestContextEnabled === true/);
assert.match(client, /disabled=\{isBusy \|\| !selectedTargetKey \|\| !isActionEnabled\}/);
assert.match(client, /disabled=\{isBusy \|\| !isActionEnabled \|\| !isOverlayActive\}/);
assert.match(client, /runtime과 관계없이 \/id-control/);
assert.doesNotMatch(client, /production_impersonation_flag_disabled|flag_disabled|개발\/테스트 환경에서만 실행|WAFL_ENABLE_DEV_TEST_CONTEXT|WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT/);

console.log("dev-test-context runtime-independent impersonation contract passed");
