#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "tests/fixtures/functions/company-scenarios.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const command = process.argv[2] ?? "summary";
const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--execute");
const runtime = String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "").toLowerCase();
const allowedRuntime = new Set(fixture.runtime);

function fail(message) {
  console.error(`[functions-test-data] ${message}`);
  process.exitCode = 1;
}

function totals() {
  return fixture.companies.reduce((sum, company) => {
    for (const key of ["members", "workorders", "materialOrders", "partners", "files", "notifications"]) sum[key] += company[key];
    return sum;
  }, { members: 0, workorders: 0, materialOrders: 0, partners: 0, files: 0, notifications: 0 });
}

if (!["summary", "seed", "reset", "cleanup"].includes(command)) {
  fail(`지원하지 않는 명령: ${command}`);
} else if (command !== "summary" && !dryRun) {
  if (!allowedRuntime.has(runtime) || runtime === "production") {
    fail(`실행 차단: runtime=${runtime || "unset"}. dev/test 계열에서만 허용됩니다.`);
  } else {
    fail("0.23.64에서는 실제 DB 실행을 의도적으로 제공하지 않습니다. --dry-run으로 계획만 확인하세요.");
  }
} else {
  const summary = totals();
  console.log(`WAFL functions test data v${fixture.schemaVersion}`);
  console.log(`command=${command} mode=${dryRun ? "dry-run" : "execute"} runtime=${runtime || "unset"}`);
  console.log(`companies=${fixture.companies.length} roles=${fixture.roles.length}`);
  console.log(Object.entries(summary).map(([key, value]) => `${key}=${value}`).join(" "));
  if (command !== "summary") {
    console.log(`plan=${command}`);
    for (const company of fixture.companies) {
      console.log(`- ${company.code} ${company.id} status=${company.status} plan=${company.plan} scale=${company.scale} members=${company.members} workorders=${company.workorders}`);
    }
    console.log("No database changes were executed.");
  }
}
