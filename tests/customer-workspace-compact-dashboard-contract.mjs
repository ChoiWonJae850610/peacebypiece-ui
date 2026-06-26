import fs from "node:fs";

const dashboard = fs.readFileSync("components/admin/dashboard/AdminOperationsDashboard.tsx", "utf8");
const cards = fs.readFileSync("components/admin/dashboard/AdminConsoleSections.tsx", "utf8");
const workorderCard = fs.readFileSync("components/workorder/list/WorkOrderListCard.tsx", "utf8");

const requiredDashboardTokens = [
  'href="/workspace/workorders"',
  'href="/workspace/material-orders"',
  "ADMIN_DASHBOARD_QUEUE_ORDER",
  "selectedTasks.slice(0, 8)",
  "AdminEmptyState",
  "WaflStorageUsageMeter",
];
for (const token of requiredDashboardTokens) {
  if (!dashboard.includes(token)) throw new Error(`dashboard token missing: ${token}`);
}
if (dashboard.includes('min-h-[152px]')) throw new Error("legacy oversized queue cards remain");
if (!cards.includes('item.status === "planned"')) throw new Error("planned-only badge policy missing");
if (cards.includes('tone="success"')) throw new Error("available success badge remains");
if (!workorderCard.includes("flex min-w-0 flex-wrap")) throw new Error("compact workorder metadata row missing");

console.log("customer workspace compact dashboard contract: OK");
