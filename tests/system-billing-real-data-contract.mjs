import fs from "node:fs";

const page = fs.readFileSync("app/(system)/system/billing/page.tsx", "utf8");
const component = fs.readFileSync("components/system/billing/SystemBillingOverview.tsx", "utf8");
if (!page.includes("SystemBillingOverview")) throw new Error("billing page must use real overview");
if (!component.includes("getSystemDashboardStats")) throw new Error("billing overview must use DB dashboard stats");
for (const forbidden of ["sample-company", "A 고객사", "B 고객사", "SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW"]) {
  if (component.includes(forbidden)) throw new Error(`sample billing token remains: ${forbidden}`);
}
for (const required of ["요금제 변경 미완성", "용량 초과", "등록된 고객사가 없습니다."]) {
  if (!component.includes(required)) throw new Error(`billing state missing: ${required}`);
}
console.log("system billing real-data contract: OK");
