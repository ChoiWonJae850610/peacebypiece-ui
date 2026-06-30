import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const systemRoute = readFileSync("app/api/system/catalog/route.ts", "utf8");
const adminRoute = readFileSync("app/api/admin/catalog/route.ts", "utf8");
const workspacePage = readFileSync("app/(workspace)/workspace/settings/catalog/page.tsx", "utf8");

assert.match(systemRoute, /requireSystemAdminScope/, "system catalog API must use actual system-admin guard");
assert.doesNotMatch(systemRoute, /companyId\s*=\s*.*request/i, "system API must not trust client companyId");

assert.match(adminRoute, /requireAdminSettingsCompanyPermission\("standards\.read"\)/);
assert.match(adminRoute, /requireAdminSettingsCompanyPermission\("standards\.manage"\)/);
assert.doesNotMatch(adminRoute, /payload\.companyId|companyId\?:/, "admin API must use session company scope only");
assert.match(adminRoute, /COMPANY_CATALOG_PATCH_INVALID/);

assert.match(workspacePage, /requireWaflSessionForArea\("workspace"\)/);
assert.match(workspacePage, /session\.role !== "company_admin"/, "settings page must block non-admin direct access");
assert.match(workspacePage, /redirect\("\/workspace\?error=ADMIN_SETTINGS_REQUIRED"\)/);

console.log("system-catalog-api-permission-contract: PASS");
