#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/functions/company-scenarios.json"), "utf8"));
const allowedRuntime = new Set(fixture.runtime);
const runtime = String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "").trim().toLowerCase();
const databaseKeys = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL"];
const databaseEntry = databaseKeys.map((key) => [key, process.env[key]]).find(([, value]) => typeof value === "string" && value.trim());
const sessionConfigured = Boolean(String(process.env.WAFL_SESSION_SECRET ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "").trim());
const testPrefix = String(process.env.WAFL_FUNCTIONS_TEST_PREFIX ?? fixture.idPrefix).trim();
const r2Prefix = String(process.env.WAFL_FUNCTIONS_TEST_R2_PREFIX ?? "").trim();
const playwrightBaseUrl = String(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").trim();
const reportPath = path.join(root, "reports/functions-environment-audit-latest.json");

function safeUrlIdentity(rawValue) {
  if (!rawValue) return null;
  try {
    const parsed = new URL(rawValue);
    return {
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || null,
      database: parsed.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return { protocol: "invalid", host: null, port: null, database: null };
  }
}

function looksLocalOrTest(value) {
  const normalized = String(value ?? "").toLowerCase();
  return /(localhost|127\.0\.0\.1|\.test(?:$|[/:])|\btest\b|\bdev\b|demo|staging|sandbox|wafl[-_]?fn)/i.test(normalized);
}

function addCheck(checks, id, label, status, detail) {
  checks.push({ id, label, status, detail });
}

const checks = [];
addCheck(checks, "runtime", "실행 환경", allowedRuntime.has(runtime) && runtime !== "production" ? "pass" : "blocked", runtime ? `runtime=${runtime}` : "runtime이 설정되지 않았습니다.");
addCheck(checks, "fixture-prefix", "테스트 데이터 prefix", testPrefix === fixture.idPrefix ? "pass" : "blocked", `expected=${fixture.idPrefix} actual=${testPrefix || "unset"}`);

const databaseIdentity = safeUrlIdentity(databaseEntry?.[1]);
if (!databaseEntry) {
  addCheck(checks, "database", "DB 설정", "missing", "지원되는 DB 환경변수가 없습니다.");
} else if (!databaseIdentity || !["postgres:", "postgresql:"].includes(databaseIdentity.protocol)) {
  addCheck(checks, "database", "DB 설정", "blocked", `${databaseEntry[0]} 형식이 PostgreSQL URL이 아닙니다.`);
} else {
  const identityText = `${databaseIdentity.host ?? ""}/${databaseIdentity.database ?? ""}`;
  addCheck(
    checks,
    "database",
    "DB 설정",
    looksLocalOrTest(identityText) ? "pass" : "review",
    `${databaseEntry[0]} host=${databaseIdentity.host ?? "unknown"} database=${databaseIdentity.database ?? "unknown"}; 비밀번호와 query는 출력하지 않습니다.`,
  );
}

const r2S3Configured = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"].every((key) => String(process.env[key] ?? "").trim());
const r2WorkerConfigured = ["R2_WORKER_UPLOAD_URL", "R2_WORKER_UPLOAD_SECRET"].every((key) => String(process.env[key] ?? "").trim());
if (!r2S3Configured && !r2WorkerConfigured) {
  addCheck(checks, "r2-config", "R2 설정", "missing", "R2 S3 설정 또는 Worker 설정이 없습니다.");
} else {
  addCheck(checks, "r2-config", "R2 설정", "pass", r2S3Configured ? `S3 bucket=${process.env.R2_BUCKET_NAME}` : "Worker upload 설정 존재; secret은 출력하지 않습니다.");
}
addCheck(
  checks,
  "r2-prefix",
  "R2 테스트 prefix",
  r2Prefix.startsWith("wafl-functions/") || r2Prefix.startsWith(`${fixture.idPrefix}/`) ? "pass" : "blocked",
  r2Prefix ? `prefix=${r2Prefix}` : "WAFL_FUNCTIONS_TEST_R2_PREFIX가 설정되지 않았습니다.",
);

addCheck(checks, "session", "E2E 로그인 secret", sessionConfigured ? "pass" : "missing", sessionConfigured ? "세션 서명값이 설정되어 있습니다." : "WAFL_SESSION_SECRET 또는 GOOGLE_OAUTH_CLIENT_SECRET이 필요합니다.");
addCheck(
  checks,
  "playwright-base-url",
  "Playwright 대상 URL",
  looksLocalOrTest(playwrightBaseUrl) ? "pass" : "review",
  `baseURL=${playwrightBaseUrl}`,
);
addCheck(checks, "seed-adapter", "실제 seed adapter", "blocked", "현재 functions-test-data.mjs는 안전 검증 후에도 DB mutation 직전에 의도적으로 중단됩니다.");
addCheck(checks, "cleanup-adapter", "실제 cleanup adapter", "blocked", "현재 cleanup도 실제 DB/R2 삭제 adapter가 연결되지 않았습니다.");

const summary = {
  pass: checks.filter((check) => check.status === "pass").length,
  review: checks.filter((check) => check.status === "review").length,
  missing: checks.filter((check) => check.status === "missing").length,
  blocked: checks.filter((check) => check.status === "blocked").length,
};
const executionReady = summary.review === 0 && summary.missing === 0 && checks.find((check) => check.id === "runtime")?.status === "pass" && checks.find((check) => check.id === "database")?.status === "pass" && checks.find((check) => check.id === "r2-config")?.status === "pass" && checks.find((check) => check.id === "r2-prefix")?.status === "pass" && checks.find((check) => check.id === "session")?.status === "pass";
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "1.0",
  runtime: runtime || "unset",
  fixturePrefix: fixture.idPrefix,
  executionReady,
  summary,
  checks,
  note: "이 감사 명령은 DB/R2에 접속하거나 데이터를 생성·수정·삭제하지 않습니다.",
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const check of checks) {
  console.log(`[${check.status.toUpperCase()}] ${check.label}: ${check.detail}`);
}
console.log(`summary pass=${summary.pass} review=${summary.review} missing=${summary.missing} blocked=${summary.blocked}`);
console.log(`executionReady=${executionReady}`);
console.log(`report=${path.relative(root, reportPath).replaceAll(path.sep, "/")}`);
console.log(report.note);

// 설정 미완료는 현재 단계에서 예상 가능한 결과이므로 명령 자체는 성공 처리한다.
// 실제 execute adapter를 연결하는 후속 단계에서는 executionReady=true를 필수 조건으로 사용한다.
