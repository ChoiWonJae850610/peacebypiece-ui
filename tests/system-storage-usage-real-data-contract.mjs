import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/billing/storageUsageRepository.ts", "utf8");
const routeHandlers = fs.readFileSync("lib/billing/api/storageUsageRouteHandlers.ts", "utf8");
const route = fs.readFileSync("app/api/system/storage-usage/route.ts", "utf8");
const dashboard = fs.readFileSync("lib/system/systemDashboardStats.ts", "utf8");

assert.match(route, /requireSystemAdminScope/);
assert.match(routeHandlers, /getStorageUsageSummary/);
assert.match(routeHandlers, /createStorageUsageSnapshot/);

assert.match(repository, /queryDb/);
assert.match(repository, /FROM attachments/);
assert.match(repository, /FROM attachment_trash_items/);
assert.match(repository, /FROM company_files/);
assert.match(repository, /FROM company_onboarding_files/);
assert.match(repository, /FROM signup_application_files file/);
assert.match(repository, /approved signup certificates not already linked to company_files/);
assert.match(repository, /INSERT INTO storage_usage_snapshots/);
assert.match(repository, /DB metadata aggregation/);
assert.doesNotMatch(repository, /storageUsageSnapshots:\s*StorageUsageSnapshot\[\]/);
assert.doesNotMatch(repository, /skeleton default summary/);

assert.match(dashboard, /storage_usage_snapshots/);
assert.match(dashboard, /ORDER BY company_id, measured_at DESC, created_at DESC/);

console.log("system storage usage real-data contract: OK");
