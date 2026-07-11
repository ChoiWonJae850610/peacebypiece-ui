#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractRoot = path.join(root, "lib/domain/work-orders/contracts");

const requiredContractFiles = [
  "authorization.ts",
  "commands.ts",
  "enums.ts",
  "errors.ts",
  "index.ts",
  "pagination.ts",
  "primitives.ts",
  "read-models.ts",
  "readiness.ts",
  "state-transitions.ts",
];

for (const file of requiredContractFiles) {
  assert.ok(fs.existsSync(path.join(contractRoot, file)), `missing contract file: ${file}`);
}

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const contracts = requiredContractFiles
  .map((file) => read(`lib/domain/work-orders/contracts/${file}`))
  .join("\n");
const commands = read("lib/domain/work-orders/contracts/commands.ts");
const pagination = read("lib/domain/work-orders/contracts/pagination.ts");
const readModels = read("lib/domain/work-orders/contracts/read-models.ts");
const errors = read("lib/domain/work-orders/contracts/errors.ts");
const transitions = read("lib/domain/work-orders/contracts/state-transitions.ts");
const authorization = read("lib/domain/work-orders/contracts/authorization.ts");

assert.doesNotMatch(contracts, /\bany\b/, "contracts must not use any");
assert.doesNotMatch(contracts, /Record<string,\s*unknown>/, "contracts must not use unbounded unknown records");
assert.doesNotMatch(commands, /\bcompanyId\b/, "client command bodies must derive company scope from auth context");
assert.doesNotMatch(readModels, /storage(Object)?Key|OpaqueDocumentAccessToken/, "public read models must not expose storage keys or raw access tokens");

for (const token of [
  "WORK_ORDER_LIST_DEFAULT_LIMIT = 30",
  "WORK_ORDER_LIST_MAX_LIMIT = 50",
  "OpaqueCursor",
  "updated_desc",
]) {
  assert.ok(pagination.includes(token), `pagination contract missing ${token}`);
}

for (const token of [
  "WorkOrderListItem",
  "WorkOrderDetailHeader",
  "WorkOrderImagesReadModel",
  "WorkOrderSizeColorReadModel",
  "WorkOrderMaterialsReadModel",
  "WorkOrderProcessesReadModel",
  "WorkOrderDocumentsReadModel",
]) {
  assert.ok(readModels.includes(token), `read model contract missing ${token}`);
}

for (const token of [
  "CreateWorkOrderDraftCommand",
  "PatchWorkOrderBasicInfoCommand",
  "SetRepresentativeImageCommand",
  "RequestMaterialOrderCommand",
  "UpsertColorSizeQuantityCellsCommand",
  "CompleteProcessCommand",
  "CreateRevisionDraftCommand",
  "IssueWorkOrderCommand",
  "expectedVersion",
  "COLOR_SIZE_CELL_BATCH_MAX = 250",
]) {
  assert.ok(commands.includes(token), `command contract missing ${token}`);
}

for (const token of [
  "TENANT_SCOPE_VIOLATION",
  "CONFLICT",
  "REVISION_MISMATCH",
  "CURSOR_INVALID",
  "correlationId",
  "retryable",
]) {
  assert.ok(errors.includes(token), `error contract missing ${token}`);
}

assert.ok(transitions.includes('from: "completed", allowedTo: ["revised"]'), "completed workorder correction must create a new revision path");
assert.ok(transitions.includes('from: "completed", allowedTo: []'), "completed material/process rows must remain locked");
assert.ok(authorization.includes('mode: "tenant_member"'), "tenant scope contract missing");
assert.ok(authorization.includes('mode: "privileged_system"'), "separate privileged system scope contract missing");
assert.ok(authorization.includes("auditRequired: true"), "privileged access must require audit");

const apiFiles = [];
function collectApiFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectApiFiles(fullPath);
    else if (/\.(ts|tsx)$/.test(entry.name)) apiFiles.push(fullPath);
  }
}
collectApiFiles(path.join(root, "app/api"));
for (const file of apiFiles) {
  const source = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(source, /domain\/work-orders\/contracts/, `runtime API must not import alpha.20 contracts: ${path.relative(root, file)}`);
}

const dbV2Root = path.join(root, "db/v2");
assert.ok(fs.existsSync(dbV2Root), "db/v2 workspace must exist");
const dbV2Entries = [];
function collectDbV2Files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectDbV2Files(fullPath);
    else dbV2Entries.push(fullPath);
  }
}
collectDbV2Files(dbV2Root);
const appVersionSource = read("lib/constants/version.ts");
const isAlpha20 = appVersionSource.includes('APP_VERSION = "2.0.0-alpha.20"');
const dbV2SqlEntries = dbV2Entries.filter((file) => file.endsWith(".sql"));
const dbV2ReadmeEntries = dbV2Entries.filter((file) => path.basename(file) === "README.md");

if (isAlpha20) {
  assert.equal(dbV2SqlEntries.length, 0, "alpha.20 db/v2 must not contain SQL");
  assert.equal(dbV2Entries.length, dbV2ReadmeEntries.length, "alpha.20 db/v2 must remain README-only");
} else {
  assert.ok(dbV2SqlEntries.length > 0, "alpha.21+ must expose reviewed migration drafts");
  assert.equal(
    dbV2SqlEntries.every((file) => path.dirname(file) === path.join(dbV2Root, "migrations")),
    true,
    "v2 SQL must stay inside db/v2/migrations",
  );
  assert.equal(
    dbV2Entries.every((file) => file.endsWith(".sql") || path.basename(file) === "README.md"),
    true,
    "db/v2 may contain only migration SQL and boundary README files at this stage",
  );
}

for (const file of dbV2ReadmeEntries) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  for (const token of ["Responsibility", "Allowed files", "Forbidden", "Current stage", "production", "Legacy", "alpha.21"]) {
    assert.ok(source.toLowerCase().includes(token.toLowerCase()), `${relative} missing boundary token: ${token}`);
  }
}

console.log("workorder v2 API contract: PASS");
