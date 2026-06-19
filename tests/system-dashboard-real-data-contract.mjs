import assert from "node:assert/strict";
import fs from "node:fs";

const overview = fs.readFileSync("components/system/SystemStatsOverview.tsx", "utf8");
const repository = fs.readFileSync("lib/system/systemDashboardStats.ts", "utf8");
const handler = fs.readFileSync("lib/stats/api/statsRouteHandlers.ts", "utf8");
const shell = fs.readFileSync("components/system/SystemConsoleShell.tsx", "utf8");

assert(!overview.includes("SYSTEM_COMPANY_USAGE_ROWS"), "system dashboard must not use fixed company rows");
assert(!overview.includes("APM 스튜디오"), "example company must not remain in dashboard");
assert(overview.includes('fetch("/api/system/stats"'), "dashboard must load system stats API");
for (const table of ["companies", "company_members", "spec_sheets", "storage_usage_snapshots", "company_subscriptions", "invitations"]) {
  assert(repository.includes(table), `real dashboard query must reference ${table}`);
}
assert(handler.includes("getSystemDashboardStats"), "system stats route must include dashboard aggregate");
assert(!shell.includes("SYSTEM_CONSOLE_HERO_OPERATION_CARDS"), "mock-like hero operation cards must be removed");
console.log("OK system dashboard real data contract");
