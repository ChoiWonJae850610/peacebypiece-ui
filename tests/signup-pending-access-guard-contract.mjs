import assert from "node:assert/strict";
import fs from "node:fs";

const apiGuards = fs.readFileSync("lib/auth/apiRouteGuards.ts", "utf8");
const routeGuard = fs.readFileSync("lib/auth/routeGuard.ts", "utf8");
const systemScope = fs.readFileSync("lib/system/sessionScope.ts", "utf8");

for (const token of [
  "getCurrentSignupApplicantSession",
  "createSignupApplicantWorkspaceBlockedResponse",
  "SIGNUP_APPLICANT_WORKSPACE_BLOCKED",
  "requireWorkspaceApiGuard",
  "if (applicantSession)",
  'redirect("/pending?type=signup")',
  'area === "workspace" || area === "worker"',
]) {
  assert.ok(`${apiGuards}\n${routeGuard}`.includes(token), `pending applicant guard missing ${token}`);
}

const workspaceGuard = apiGuards.slice(apiGuards.indexOf("export async function requireWorkspaceApiGuard"));
const pageGuard = routeGuard.slice(routeGuard.indexOf("export async function requireWaflSessionForArea"));
assert.ok(workspaceGuard.indexOf("getCurrentSignupApplicantSession") < workspaceGuard.indexOf("getCurrentWaflSession"));
assert.ok(pageGuard.indexOf("getCurrentSignupApplicantSession") < pageGuard.indexOf("getCurrentWaflSession"));
assert.ok(systemScope.includes("requireSystemAdminScope"), "system scope must retain system-admin boundary");
assert.ok(systemScope.includes("getCurrentWaflAuthSession"), "system scope must use the actual signed auth session");
assert.ok(systemScope.includes("isActiveSystemAdminSession"), "system scope must keep active/allowlisted system-admin validation");
assert.doesNotMatch(systemScope, /getCurrentWaflSession\(/, "system scope must not use effective impersonated session");
assert.doesNotMatch(`${apiGuards}\n${routeGuard}`, /prefix.*only|TODO.*guard only/i);

console.log("signup pending access guard contract: OK");
