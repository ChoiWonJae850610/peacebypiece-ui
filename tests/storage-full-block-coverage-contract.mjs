#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const quotaRepository = fs.readFileSync("lib/billing/companyStorageQuotaRepository.ts", "utf8");
const routeHandlers = fs.readFileSync("lib/workorder/api/workOrderRouteHandlers.ts", "utf8");
const uploadGuardContract = fs.readFileSync("tests/storage-quota-upload-guard-contract.mjs", "utf8");
const audit = fs.readFileSync("docs/audits/0.24.31-canonical-policy-conformance-audit.md", "utf8");

assert.match(quotaRepository, /checkCompanyStorageGrowthActionQuota/);
assert.match(quotaRepository, /incomingSizeBytes:\s*1/);
assert.match(routeHandlers, /requireCompanyStorageGrowthAllowed/);
assert.match(routeHandlers, /handlePostWorkOrders[\s\S]*requireCompanyStorageGrowthAllowed/);
assert.match(routeHandlers, /isWorkflowGrowthTransition/);
assert.match(routeHandlers, /WORKFLOW_STATE\.reviewRequested/);
assert.match(routeHandlers, /WORKFLOW_STATE\.reviewCompleted/);
assert.match(routeHandlers, /WORKFLOW_STATE\.materialOrderPending/);
assert.match(routeHandlers, /WORKFLOW_STATE\.inspection/);
assert.match(routeHandlers, /WORKFLOW_STATE\.completed/);
assert.match(routeHandlers, /status:\s*409/);
assert.match(uploadGuardContract, /workorder attachment upload request/);
assert.match(uploadGuardContract, /generated PDF storage/);
assert.match(audit, /Storage quota full-block/);

console.log("storage full-block coverage contract passed");
