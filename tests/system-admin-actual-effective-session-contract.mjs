import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const systemScope = read("lib/system/sessionScope.ts");
const currentSession = read("lib/auth/currentSession.ts");
const apiGuards = read("lib/auth/apiRouteGuards.ts");
const routeGuard = read("lib/auth/routeGuard.ts");
const idControlPage = read("app/id-control/page.tsx");
const systemCompaniesRoute = read("app/api/system/companies/route.ts");

assert.match(systemScope, /getCurrentWaflAuthSession/, "system-admin scope must use the actual auth session");
assert.doesNotMatch(systemScope, /getCurrentWaflSession/, "system-admin scope must not use the effective impersonated session");
assert.match(systemScope, /isActiveSystemAdminSession\(session\)/, "system-admin scope must verify active allowlisted system-admin status");
assert.match(systemScope, /SYSTEM_ADMIN_SESSION_REQUIRED/);
assert.match(systemScope, /SYSTEM_ADMIN_ROLE_REQUIRED/);

assert.match(currentSession, /getCurrentWaflAuthSession/);
assert.match(currentSession, /getCurrentWaflSession/);
assert.match(currentSession, /applyDevTestContextOverlay/, "effective sessions must still apply impersonation overlays");

assert.match(apiGuards, /getCurrentWaflSession/, "workspace APIs must keep using the effective session");
assert.match(apiGuards, /requireWorkspaceApiGuard/);
assert.match(routeGuard, /getCurrentWaflSession/, "workspace page guards must keep using the effective session");

assert.match(idControlPage, /getCurrentWaflAuthSession/);
assert.match(systemCompaniesRoute, /requireSystemAdminScope/);

console.log("system-admin actual/effective session contract: OK");
