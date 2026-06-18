#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "tests/fixtures/functions/company-scenarios.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const command = process.argv[2] ?? "summary";
const execute = process.argv.includes("--execute");
const dryRun = !execute;
const runtime = String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "").toLowerCase();
const allowedRuntime = new Set(fixture.runtime);
const expectedPrefix = String(process.env.WAFL_FUNCTIONS_TEST_PREFIX ?? fixture.idPrefix);
const confirm = String(process.env.WAFL_FUNCTIONS_DATA_CONFIRM ?? "");

function fail(message) {
  console.error(`[functions-test-data] ${message}`);
  process.exitCode = 1;
}
function totals() {
  return fixture.companies.reduce((sum, company) => {
    for (const key of ["members", "workorders", "materialOrders", "partners", "files", "notifications"]) sum[key] += company[key];
    sum.storageUsedBytes += company.storage.usedBytes;
    sum.storageQuotaBytes += company.storage.quotaBytes;
    return sum;
  }, { members: 0, workorders: 0, materialOrders: 0, partners: 0, files: 0, notifications: 0, storageUsedBytes: 0, storageQuotaBytes: 0 });
}
function assertExecutionSafety() {
  if (!allowedRuntime.has(runtime) || runtime === "production") throw new Error(`실행 차단: runtime=${runtime || "unset"}`);
  if (expectedPrefix !== fixture.idPrefix) throw new Error(`prefix 불일치: expected=${fixture.idPrefix} actual=${expectedPrefix}`);
  if (confirm !== `${command}:${fixture.idPrefix}`) throw new Error(`확인값 필요: WAFL_FUNCTIONS_DATA_CONFIRM=${command}:${fixture.idPrefix}`);
}
function buildPlan() {
  return fixture.companies.map((company) => ({
    companyId: company.id,
    prefix: fixture.idPrefix,
    mode: command,
    counts: { members: company.members, workorders: company.workorders, materialOrders: company.materialOrders, partners: company.partners, files: company.files, notifications: company.notifications },
    storage: company.storage,
  }));
}

if (!["summary", "seed", "reset", "cleanup"].includes(command)) {
  fail(`지원하지 않는 명령: ${command}`);
} else {
  const summary = totals();
  console.log(`WAFL functions test data v${fixture.schemaVersion}`);
  console.log(`command=${command} mode=${dryRun ? "dry-run" : "execute"} runtime=${runtime || "unset"}`);
  console.log(`companies=${fixture.companies.length} roles=${fixture.roles.length} prefix=${fixture.idPrefix}`);
  console.log(Object.entries(summary).map(([key, value]) => `${key}=${value}`).join(" "));
  if (command !== "summary") {
    const plan = buildPlan();
    for (const row of plan) console.log(JSON.stringify(row));
    if (execute) {
      try {
        assertExecutionSafety();
        fail("실제 DB adapter가 아직 연결되지 않아 실행을 중단했습니다. 안전 검증은 통과했지만 schema mapping 확정 전 mutation은 허용하지 않습니다.");
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log("No database or R2 changes were executed.");
    }
  }
}
