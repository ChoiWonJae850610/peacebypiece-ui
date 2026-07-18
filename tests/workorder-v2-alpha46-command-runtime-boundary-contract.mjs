#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isExternalQaPathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const runtime = read("lib/domain/work-orders/command/runtimeGuard.ts");
const service = read("lib/domain/work-orders/command/commandService.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const route = read("lib/domain/work-orders/command/commandRoute.ts");
const proxy = read("proxy.ts");
const start = read("tools/dev/start-wafl-external-qa.ps1");
const status = read("tools/dev/status-wafl-external-qa.ps1");
const preflight = read("scripts/run-wafl-v2-alpha46-basic-info-preflight.mjs");
const staleAudit = read("scripts/run-wafl-v2-alpha46-basic-info-stale-audit.mjs");
const createQaDraft = read("scripts/run-wafl-v2-alpha46-create-qa-draft.mjs");
const uuidPath = "/api/v2/work-orders/9c2325ba-3b70-fd71-0eb5-c68db954829a";

assert.match(runtime, /WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL/);
assert.match(runtime, /2\.0\.0-alpha\.46-dev-test-mobile-basic-info-runtime/);
const genericApprovals = runtime.match(/const SUPPORTED_MUTATION_APPROVALS = new Set\(\[[\s\S]*?\]\);/)?.[0] ?? "";
assert.ok(genericApprovals);
assert.doesNotMatch(genericApprovals, /ALPHA46|alpha\.46/, "alpha.46 must not enter the generic mutation approval set");
assert.match(runtime, /getWorkOrderV2BasicInfoMutationRuntimeGuard/);
assert.match(runtime, /WAFL_V2_ALPHA25_MUTATION_APPROVAL[\s\S]*WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL/);
assert.match(service, /createWorkOrderDraft[\s\S]*requireCommandMutationApproval\(WAFL_V2_ALPHA25_MUTATION_APPROVAL\)/);
assert.match(service, /patchWorkOrderBasicInfo[\s\S]*requireBasicInfoMutationApproval\(\)/);
assert.match(validation, /mobileBasicInfoOnly/);
assert.match(validation, /new Set\(\["productName", "dueDate", "totalQuantity"\]\)/);
assert.match(route, /mobileBasicInfoOnly: isAlpha46BasicInfoMutationRuntime\(\)/);

assert.equal(isExternalQaPathAllowed(uuidPath, "GET", {}), true);
assert.equal(isExternalQaPathAllowed(uuidPath, "PATCH", {}), false);
assert.equal(isExternalQaPathAllowed(uuidPath, "PATCH", {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime",
}), true);
assert.equal(isExternalQaPathAllowed(uuidPath, "PATCH", {
  WAFL_SERVER_RUNTIME_MODE: "production",
  WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime",
}), false);
assert.equal(isExternalQaPathAllowed(uuidPath, "PATCH", {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
}), false);
for (const [method, pathname] of [
  ["POST", "/api/v2/work-orders"],
  ["PATCH", "/api/v2/work-orders"],
  ["PATCH", `${uuidPath}/materials`],
  ["PATCH", `${uuidPath}/processes/abc`],
  ["POST", `${uuidPath}/revisions/issue`],
  ["OPTIONS", uuidPath],
]) assert.equal(isExternalQaPathAllowed(pathname, method, {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime",
}), false);

assert.match(proxy, /isExternalQaPathAllowed\(request\.nextUrl\.pathname, request\.method, process\.env\)/);
assert.match(start, /\[switch\]\$EnableAlpha46BasicInfoMutation/);
assert.match(start, /mutationMode = "read-only"/);
assert.match(start, /if \(\$EnableAlpha46BasicInfoMutation\)/);
for (const name of ["WAFL_V2_COMMAND_API_ENABLED", "WAFL_V2_COMMAND_MUTATION_APPROVED", "WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED"]) {
  assert.match(start, new RegExp(`\\$serverEnvironment\\.${name}`));
}
const mobileEnvironment = start.slice(start.indexOf("$mobileEnvironment = @{"));
assert.doesNotMatch(mobileEnvironment, /WAFL_V2_COMMAND|WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED/);
assert.doesNotMatch(start, /SetEnvironmentVariable\([^\n]+(?:User|Machine)/);
assert.match(status, /Command API:/);
assert.match(status, /Mutation mode:/);

assert.match(preflight, /BEGIN READ ONLY/);
assert.match(preflight, /QA_DRAFT_A/);
assert.match(preflight, /VERIFY WAFL V2 ALPHA46 BASIC INFO PREFLIGHT/);
assert.match(preflight, /mutation-approval-must-be-absent/);
assert.match(preflight, /generated_documents/);
assert.match(preflight, /document_access_tokens/);
assert.match(preflight, /work_order_images/);
assert.match(preflight, /work_order_attachments/);
assert.doesNotMatch(preflight, /client\.query\([`"'][\s\S]{0,80}\b(?:INSERT|UPDATE|DELETE|UPSERT|MERGE|TRUNCATE|DROP)\b/i);

assert.match(staleAudit, /EXECUTE WAFL V2 ALPHA46 STALE VERSION AUDIT/);
assert.match(staleAudit, /2\.0\.0-alpha\.46-dev-test-mobile-basic-info-runtime/);
assert.match(staleAudit, /expectedVersion: state\.target\.workOrderVersion/);
assert.match(staleAudit, /patch: state\.proposed/);
assert.match(staleAudit, /response\.status, 409/);
assert.match(staleAudit, /body\?\.error\?\.code, "CONFLICT"/);
assert.match(staleAudit, /assert\.deepEqual\(afterStale, saved/);
assert.doesNotMatch(staleAudit, /Idempotency-Key/);

assert.match(createQaDraft, /EXECUTE WAFL V2 ALPHA46 QA DRAFT CREATE/);
assert.match(createQaDraft, /2\.0\.0-alpha\.25-dev-test-command-runtime/);
assert.match(createQaDraft, /QA 기본정보 저장 검증 A - 저장 전/);
assert.match(createQaDraft, /dueDate: "2026-09-29"/);
assert.match(createQaDraft, /totalQuantity: 136/);
assert.match(createQaDraft, /method: "POST"/);
assert.match(createQaDraft, /"Idempotency-Key": IDEMPOTENCY_KEY/);
assert.match(createQaDraft, /before\.targets\.length, 0/);
assert.match(createQaDraft, /after\.targets\.length, 1/);
assert.match(createQaDraft, /after\.totals\.work_orders, before\.totals\.work_orders \+ 1/);
assert.match(createQaDraft, /after\.totals\.revisions, before\.totals\.revisions \+ 1/);
assert.match(createQaDraft, /after\.totals\.receipts, before\.totals\.receipts \+ 1/);
assert.match(createQaDraft, /after\.totals\.events, before\.totals\.events \+ 1/);
assert.doesNotMatch(createQaDraft, /method: "PATCH"/);
assert.doesNotMatch(createQaDraft, /client\.query\([`"'][\s\S]{0,80}\b(?:INSERT|UPDATE|DELETE|TRUNCATE|DROP)\b/i);

console.log("workorder v2 alpha.46 command runtime boundary contract: PASS");
