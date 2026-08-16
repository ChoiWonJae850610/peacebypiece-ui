import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const runner = readFileSync("tools/dev/start-wafl-external-qa.ps1", "utf8");
const external = readFileSync("lib/external-qa/configCore.mjs", "utf8");
const guard = readFileSync("lib/domain/work-orders/command/runtimeGuard.ts", "utf8");
for (const token of ["size-measurement-standards", "EnableAlpha62SizeMeasurementMutation", "2.0.0-alpha.62-dev-test-size-measurement-runtime", "SIZE_MEASUREMENT_STANDARDS_REQUIRES_DEVELOPER_AUTO_CONNECT", "SIZE_MEASUREMENT_STANDARDS_REQUIRES_CANONICAL_PORTS"]) assert.ok(runner.includes(token), token);
assert.match(external, /MAKER_QA_CAPABILITY\.MEASUREMENT/);
assert.match(external, /size-spec\\\/commands/);
assert.match(external, /size-spec-templates/);
assert.match(guard, /WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL/);

const workOrderId = "00000000-0000-4000-8000-000000000062";
const childId = "00000000-0000-4000-8000-000000000063";
const alpha62Environment = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA62_SIZE_MEASUREMENT_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.62-dev-test-size-measurement-runtime",
};
for (const [path, method] of [
  [`/api/v2/work-orders/${workOrderId}/size-spec/commands`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/size-color/sizes`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/size-color/colors`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/size-color/sizes/${childId}`, "DELETE"],
  [`/api/v2/work-orders/${workOrderId}/size-color/colors/${childId}`, "DELETE"],
  [`/api/v2/work-orders/${workOrderId}/size-color/quantities/${childId}/${childId}`, "PATCH"],
  [`/api/v2/work-orders/${workOrderId}/size-color/sizes/reorder`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/size-color/sizes/${childId}`, "PATCH"],
  [`/api/v2/work-orders/${workOrderId}/materials/${childId}`, "DELETE"],
  [`/api/v2/work-orders/${workOrderId}/materials`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/materials/${childId}`, "PATCH"],
  [`/api/v2/work-orders/${workOrderId}/materials/${childId}/order-request`, "POST"],
]) assert.equal(isTailscaleServePathAllowed(path, method, alpha62Environment), true, `${method} ${path}`);
for (const [path, method] of [
  [`/api/v2/work-orders/${workOrderId}/materials/${childId}/archive`, "POST"],
  [`/api/v2/work-orders/${workOrderId}/materials/${childId}/restore`, "POST"],
]) assert.equal(isTailscaleServePathAllowed(path, method, alpha62Environment), false, `${method} ${path}`);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/size-color/sizes`, "POST", { ...alpha62Environment, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
console.log("workorder v2 alpha.62 runtime boundary contract: PASS");
