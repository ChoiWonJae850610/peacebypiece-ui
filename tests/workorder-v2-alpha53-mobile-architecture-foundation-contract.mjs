#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const shell = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const session = read("apps/mobile/application/sessionController.ts");
const navigation = read("apps/mobile/application/useWorkOrderNavigation.ts");
const queries = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const mutations = read("apps/mobile/features/work-orders/workOrderMutationController.ts");
const validation = read("apps/mobile/domain/workOrderValidation.ts");
const policy = read("apps/mobile/domain/workOrderPolicy.ts");
const contract = read("apps/mobile/domain/mobileContract.ts");
const apiInfrastructure = read("apps/mobile/lib/apiClient.ts");
const theme = read("apps/mobile/constants/theme.ts");
const serverErrors = read("lib/domain/work-orders/contracts/errors.ts");
const workingRules = read("docs/project/app-v2/09-codex-working-rules.md");

assert.ok(shell.split(/\r?\n/).length <= 10, "MobileWorkOrderApp must remain a composition shell");
assert.match(shell, /<MobileWorkOrderExperience/);
assert.doesNotMatch(shell, /apiClient|fetch\(|PATCH|validation|status ===/);
assert.doesNotMatch(experience, /from "@\/lib\/apiClient"/);
for (const boundary of ["mobileSessionController", "useWorkOrderNavigation", "workOrderQueryController", "workOrderMutationController", "createExplicitMutationController"]) {
  assert.match(experience, new RegExp(boundary), `missing application boundary: ${boundary}`);
}

assert.match(session, /current\(\)|autoConnect\(\)|connectWithCode\(code: string\)|disconnect\(\)/);
assert.match(navigation, /AppState\.addEventListener/);
assert.match(queries, /list\(|detail\(|materials\(/);
assert.match(mutations, /updateOverview|createMaterial|updateMaterial|archiveMaterial|restoreMaterial/);
assert.match(validation, /validateBasicInfoDraft|validateMaterialDraft|materialPatch|normalizeMaterialDraft/);
assert.match(policy, /canEditWorkOrder|canEditOverviewField|canEditMaterial|isMaterialFieldReadOnly/);

assert.doesNotMatch(contract, /\| string;/);
assert.match(contract, /kind: "unknown"/);
assert.match(contract, /rawCode: string/);
assert.match(apiInfrastructure, /classifyMobileApiErrorCode/);
assert.match(apiInfrastructure, /identity\.rawCode/);
const serverErrorCodes = [...serverErrors.matchAll(/^\s+"([A-Z0-9_]+)",?$/gm)].map((match) => match[1]);
const mobileKnownCodes = new Set([...contract.matchAll(/^\s+"([A-Z0-9_]+)",?$/gm)].map((match) => match[1]));
for (const code of serverErrorCodes) assert.equal(mobileKnownCodes.has(code), true, `mobile known error union missing server code ${code}`);

for (const source of [contract, validation, policy]) {
  assert.doesNotMatch(source, /react-native|next\/|pg|node:fs|process\.env|R2|PDF/);
}
for (const source of [queries, mutations, apiInfrastructure]) {
  assert.doesNotMatch(source, /components\/|features\/.*Screen|react-native/);
}
assert.match(theme, /paper|deepNavy|brickOrange|fabricBeige|olive|disabled|readOnly|editActive|error|focus/);

assert.match(workingRules, /Mandatory PC Resource and Remote-Operation Audit/);
assert.match(workingRules, /start-of-work preflight/);
assert.match(workingRules, /after automated Runtime QA/);
assert.match(workingRules, /immediately before requesting physical-device QA/);
assert.match(workingRules, /after runner stop and before final verification/);
assert.match(workingRules, /Temperature: unavailable with approved read-only tooling/);
assert.match(workingRules, /PC_RESOURCE_OR_REMOTE_OPERATION_RISK_HANDOFF_REQUIRED/);

for (const path of [
  "apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx",
  "apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx",
  "apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx",
  "apps/mobile/features/materials/WorkOrderMaterialEditor.tsx",
]) assert.equal(fs.existsSync(path), true, `missing feature boundary: ${path}`);

const mobileSources = fs.readdirSync("apps/mobile/domain").map((name) => read(`apps/mobile/domain/${name}`)).join("\n");
assert.doesNotMatch(mobileSources, /@\/lib\/db|@\/lib\/r2|@\/lib\/pdf|node:|\bpg\b/);

console.log("workorder v2 alpha.53 mobile architecture foundation contract: PASS");
