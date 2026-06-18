import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const service = fs.readFileSync("lib/dev/testContext/service.ts", "utf8");
const repository = fs.readFileSync("lib/dev/testContext/repository.ts", "utf8");
const session = fs.readFileSync("lib/dev/testContext/session.ts", "utf8");
const switchRoute = fs.readFileSync("app/api/dev/test-context/switch/route.ts", "utf8");
const clearRoute = fs.readFileSync("app/api/dev/test-context/clear/route.ts", "utf8");

assert.doesNotMatch(page, /session\.role === "system_admin"[\s\S]*notFound/);
assert.match(repository, /FROM system_users/);
assert.match(repository, /role = 'system_admin'/);
assert.match(session, /targetCompanyId: string \| null/);
assert.match(session, /value === "system_admin"/);
assert.match(service, /actualSession\.email\.trim\(\)\.toLowerCase\(\) !== target\.email/);
assert.match(switchRoute, /dev_test\.context_switched/);
assert.match(clearRoute, /dev_test\.context_cleared/);
assert.match(switchRoute, /WAFL_DEV_TEST_CONTEXT_COOKIE/);
console.log("dev test context system-admin contract passed");
