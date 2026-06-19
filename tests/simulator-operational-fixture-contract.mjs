import assert from "node:assert/strict";
import fs from "node:fs";

const seed = fs.readFileSync("tools/simulator/commands/db-data.mjs", "utf8");
const stats = fs.readFileSync("lib/admin/adminStats.repository.ts", "utf8");
const core = fs.readFileSync("lib/hooks/workorder/useWorkOrderCoreState.ts", "utf8");

for (const token of ["partner_items", "item_categories", "outsourcing_processes", "INSERT INTO orders", "원단 업체", "부자재 업체", "나염 업체", "자수 업체"]) {
  assert.ok(seed.includes(token), `simulator operational fixture missing: ${token}`);
}
for (const token of ["category1_id", "category2_id", "category3_id", "vendor", "created_at", "updated_at"]) {
  assert.ok(seed.includes(token), `stats workorder fixture missing: ${token}`);
}
assert.ok(stats.includes("storage_usage_snapshots"), "stats must use latest simulator storage snapshot when R2 objects are not present");
assert.ok(core.includes('params.set("status", listStatusFilter)'), "status filter must update URL/API query");
assert.ok(core.includes('params.set("sort", listSort)'), "sort selection must update URL/API query");
assert.ok(core.includes("Failed to reload filtered workorders."), "filter changes must reload DB summaries");
console.log("Simulator operational fixture contract passed.");
