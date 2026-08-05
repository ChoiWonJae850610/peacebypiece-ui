#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isTailscaleServePathAllowed,
} from "../lib/external-qa/configCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const commandRoute = read("lib/domain/work-orders/command/commandRoute.ts");
const commandService = read("lib/domain/work-orders/command/commandService.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const workOrderRoute = read("app/api/v2/work-orders/[workOrderId]/route.ts");

const exactAlpha59Approval = "2.0.0-alpha.59-dev-test-size-color-structure-runtime";
const workOrderId = "11111111-1111-4111-8111-111111111111";
const materialLineId = "22222222-2222-4222-8222-222222222222";
const workOrderPath = `/api/v2/work-orders/${workOrderId}`;
const exactAlpha59Environment = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  NODE_ENV: "development",
  WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: exactAlpha59Approval,
};

function constantValue(name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`export const ${escapedName}\\s*=\\s*\\n?\\s*"([^"]+)"`).exec(runtimeGuard);
  assert.ok(match, `missing runtime approval constant: ${name}`);
  return match[1];
}

const basicGuardStart = runtimeGuard.indexOf("export function getWorkOrderV2BasicInfoMutationRuntimeGuard");
const basicGuardEnd = runtimeGuard.indexOf("export function getWorkOrderV2MaterialDraftMutationRuntimeGuard");
assert.ok(basicGuardStart >= 0 && basicGuardEnd > basicGuardStart);
const basicGuardSource = runtimeGuard.slice(basicGuardStart, basicGuardEnd);
const acceptedConstantNames = [...basicGuardSource.matchAll(/configuredApproval !== (WAFL_V2_[A-Z0-9_]+_APPROVAL)/g)]
  .map((match) => match[1]);
const acceptedTokens = new Set(acceptedConstantNames.map(constantValue));

function basicInfoGuardAllows(token, canonicalReadGuardPass = true) {
  return acceptedTokens.has(token) && canonicalReadGuardPass;
}

function composedRouteResult({
  environment,
  authenticated = true,
  sameWorkspace = true,
  validUuid = true,
  expectedVersionValid = true,
}) {
  const ingress = isTailscaleServePathAllowed(workOrderPath, "PATCH", environment);
  const basicInfoGuard = basicInfoGuardAllows(
    String(environment.WAFL_V2_COMMAND_MUTATION_APPROVED ?? ""),
    environment.WAFL_SERVER_RUNTIME_MODE === "dev",
  );
  if (!ingress || !basicInfoGuard) return { ingress, basicInfoGuard, status: 403 };
  if (!authenticated) return { ingress, basicInfoGuard, status: 401 };
  if (!sameWorkspace || !validUuid) return { ingress, basicInfoGuard, status: 404 };
  if (!expectedVersionValid) return { ingress, basicInfoGuard, status: 400 };
  return { ingress, basicInfoGuard, status: 200 };
}

assert.equal(isTailscaleServePathAllowed(workOrderPath, "PATCH", exactAlpha59Environment), true);

if (process.env.A59_REPRODUCE_BASIC_INFO_GUARD_DENIAL === "1") {
  const reproduced = composedRouteResult({ environment: exactAlpha59Environment });
  assert.deepEqual(reproduced, { ingress: true, basicInfoGuard: false, status: 403 });
  console.log(JSON.stringify({
    contract: "workorder-v2-alpha59-basic-info-guard-composition",
    phase: "pre-fix-reproduction",
    approval: exactAlpha59Approval,
    ingress: "PASS",
    basicInfoGuard: "DENIED",
    routeStatus: 403,
  }));
  process.exit(0);
}

assert.equal(basicInfoGuardAllows(exactAlpha59Approval), true);
for (const name of [
  "WAFL_V2_ALPHA25_MUTATION_APPROVAL",
  "WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL",
  "WAFL_V2_ALPHA52_CORE_INLINE_MUTATION_APPROVAL",
  "WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL",
]) assert.equal(basicInfoGuardAllows(constantValue(name)), true, `${name} behavior must be preserved`);

for (const token of [
  "",
  `${exactAlpha59Approval}-typo`,
  "2.0.0-alpha.59-dev-test-other-runtime",
  "2.0.0-alpha.59",
  "2.0.0-alpha.59-dev-test-size-color-structure",
]) assert.equal(basicInfoGuardAllows(token), false, `unexpected basic-info approval: ${token}`);

assert.deepEqual(composedRouteResult({ environment: exactAlpha59Environment }), {
  ingress: true,
  basicInfoGuard: true,
  status: 200,
});
assert.equal(composedRouteResult({ environment: { ...exactAlpha59Environment, WAFL_SERVER_RUNTIME_MODE: "production" } }).status, 403);
assert.equal(composedRouteResult({ environment: exactAlpha59Environment, authenticated: false }).status, 401);
assert.equal(composedRouteResult({ environment: exactAlpha59Environment, sameWorkspace: false }).status, 404);
assert.equal(composedRouteResult({ environment: exactAlpha59Environment, validUuid: false }).status, 404);
assert.equal(composedRouteResult({ environment: exactAlpha59Environment, expectedVersionValid: false }).status, 400);

for (const [method, pathname] of [
  ["POST", workOrderPath],
  ["DELETE", workOrderPath],
  ["PATCH", "/api/v2/work-orders/not-a-uuid"],
  ["PATCH", `${workOrderPath}/processes/${materialLineId}`],
  ["POST", `${workOrderPath}/revisions/issue`],
  ["PATCH", `${workOrderPath}/documents`],
  ["PATCH", `${workOrderPath}/broader-path`],
]) {
  assert.equal(isTailscaleServePathAllowed(pathname, method, exactAlpha59Environment), false, `${method} ${pathname}`);
}

assert.match(basicGuardSource, /return getWorkOrderV2CommandRuntimeGuard\(\{[\s\S]*requireMutationApproval: true[\s\S]*requiredMutationApproval: configuredApproval/);
assert.match(commandRoute, /requireWorkspaceApiGuard\(\{ permissionCode \}\)/);
assert.match(commandRoute, /permissionCode = input\.kind === "create" \? "workorder\.create" : "workorder\.update"/);
assert.match(commandService, /patchWorkOrderBasicInfo[\s\S]*if \(!isUuid\(input\.workOrderId\)\)[\s\S]*createCommandTenantScope[\s\S]*permissionCode: "workorder\.update"[\s\S]*requireBasicInfoMutationApproval\(\)/);
assert.match(validation, /Number\.isSafeInteger\(body\.expectedVersion\)/);
assert.match(workOrderRoute, /export async function PATCH[\s\S]*handlePatchWorkOrderBasicInfoV2\(request, workOrderId\)/);
assert.doesNotMatch(basicGuardSource, /startsWith|includes\(|match\(|alpha\.59\.\*|ALPHA59.*ALPHA59/s);

console.log("workorder v2 alpha.59 basic-info guard + ingress composition contract: PASS");
