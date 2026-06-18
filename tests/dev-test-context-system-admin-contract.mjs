import assert from "node:assert/strict";
import fs from "node:fs";

const access = fs.readFileSync("lib/auth/systemAdminAccess.ts", "utf8");
const consolePage = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const functionsPage = fs.readFileSync("app/functions/page.tsx", "utf8");
const uiPage = fs.readFileSync("app/ui/page.tsx", "utf8");
const service = fs.readFileSync("lib/dev/testContext/service.ts", "utf8");
const repository = fs.readFileSync("lib/dev/testContext/repository.ts", "utf8");
const session = fs.readFileSync("lib/dev/testContext/session.ts", "utf8");
const optionsRoute = fs.readFileSync("app/api/dev/test-context/options/route.ts", "utf8");
const switchRoute = fs.readFileSync("app/api/dev/test-context/switch/route.ts", "utf8");
const clearRoute = fs.readFileSync("app/api/dev/test-context/clear/route.ts", "utf8");

assert.match(access, /FROM system_users/);
assert.match(access, /role = 'system_admin'/);
assert.match(access, /is_active = true/);
assert.match(access, /lower\(email\) = lower\(\$1\)/);

for (const page of [consolePage, functionsPage, uiPage]) {
  assert.match(page, /getCurrentWaflAuthSession/);
  assert.match(page, /isActiveSystemAdminSession/);
  assert.match(page, /notFound\(\)/);
}
assert.match(functionsPage, /isWaflFunctionsRuntimeAllowed/);
assert.match(uiPage, /isWaflUiCatalogRuntimeAllowed/);
assert.doesNotMatch(uiPage, /WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED = false/);

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
assert.match(switchRoute, /dev_test\.context_switched/);
assert.match(clearRoute, /dev_test\.context_cleared/);
assert.match(switchRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);

console.log("dev test console system-admin access contract passed");
