#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SIMULATOR_DB_MANIFEST } from "../adapters/db/manifest.mjs";
import { SIMULATOR_R2_MANIFEST } from "../adapters/r2/manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const schemaPath = path.join(root, SIMULATOR_DB_MANIFEST.sourceSchema);
const fixturePath = path.join(root, SIMULATOR_DB_MANIFEST.fixtureSource);
const reportPath = path.join(root, "artifacts/test-reports/functions/simulator-adapter-plan-latest.json");
const schema = fs.readFileSync(schemaPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

function tableBody(tableName) {
  const pattern = new RegExp(`CREATE\\s+TABLE\\s+${tableName}\\s*\\(([\\s\\S]*?)\\n\\);`, "i");
  return schema.match(pattern)?.[1] ?? null;
}

const tableChecks = SIMULATOR_DB_MANIFEST.tables.map((table) => {
  const body = tableBody(table.name);
  const missingColumns = body ? table.requiredColumns.filter((column) => !new RegExp(`(^|\\n)\\s*${column}\\s+`, "i").test(body)) : [...table.requiredColumns];
  return { table: table.name, exists: Boolean(body), key: table.key, missingColumns, ready: Boolean(body) && missingColumns.length === 0, cleanupOrder: table.cleanupOrder };
});

const companies = fixture.companies.map((company) => ({
  companyId: company.id,
  name: company.name,
  counts: { members: company.members, workorders: company.workorders, materialOrders: company.materialOrders, partners: company.partners, files: company.files },
  storage: { quotaBytes: company.storage.quotaBytes, usedBytes: company.storage.usedBytes, objectPrefix: company.storage.objectPrefix }
}));
const r2Prefixes = companies.map((company) => company.storage.objectPrefix);
const r2PrefixSafe = r2Prefixes.every((prefix) => SIMULATOR_R2_MANIFEST.allowedPrefixes.some((allowed) => prefix.startsWith(allowed)));
const uniquePrefixes = new Set(r2Prefixes).size === r2Prefixes.length;
const schemaReady = tableChecks.every((check) => check.ready);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "1.0",
  mode: "plan-only",
  database: {
    schemaReady,
    executeEnabled: SIMULATOR_DB_MANIFEST.mutationPolicy.executeEnabled,
    tables: tableChecks,
    cleanupOrder: [...tableChecks].sort((a,b) => b.cleanupOrder-a.cleanupOrder).map((row) => row.table),
    transactionRequired: true,
    prefix: fixture.idPrefix
  },
  r2: {
    prefixSafe: r2PrefixSafe,
    uniquePrefixes,
    uploadEnabled: SIMULATOR_R2_MANIFEST.mutationPolicy.uploadEnabled,
    deleteEnabled: SIMULATOR_R2_MANIFEST.mutationPolicy.deleteEnabled,
    prefixes: r2Prefixes
  },
  fixture: { companies: companies.length, companies },
  executionReady: false,
  blockers: [
    "실제 DB seed adapter 미구현",
    "실제 DB cleanup adapter 미구현",
    "실제 R2 upload/delete adapter 미구현",
    "운영 환경 차단 검증 후에만 execute 활성화 가능"
  ],
  note: "이 명령은 schema와 fixture 파일만 읽으며 DB/R2에 접속하거나 변경하지 않습니다."
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const check of tableChecks) console.log(`[${check.ready ? "PASS" : "BLOCKED"}] ${check.table}: ${check.ready ? "schema columns verified" : `missing=${check.missingColumns.join(",")}`}`);
console.log(`[${r2PrefixSafe && uniquePrefixes ? "PASS" : "BLOCKED"}] R2 prefixes: safe=${r2PrefixSafe} unique=${uniquePrefixes}`);
console.log(`companies=${companies.length} schemaReady=${schemaReady} executionReady=false`);
console.log(`report=${path.relative(root, reportPath).replaceAll(path.sep, "/")}`);
console.log(report.note);
if (!schemaReady || !r2PrefixSafe || !uniquePrefixes) process.exitCode = 1;
