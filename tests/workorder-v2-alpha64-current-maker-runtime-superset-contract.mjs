import assert from "node:assert/strict";
import fs from "node:fs";

import {
  isMakerQaCapabilityEnabled,
  listMakerQaCapabilities,
  MAKER_QA_APPROVAL,
  MAKER_QA_CAPABILITY,
  MAKER_QA_PROFILE,
  resolveMakerQaProfile,
} from "../lib/external-qa/makerQaCapabilities.mjs";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const current = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA64_DOCUMENT_R0_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
};
const uuid = "10000000-0000-4000-8000-000000000001";
const capabilities = Object.values(MAKER_QA_CAPABILITY).filter((item) => ![MAKER_QA_CAPABILITY.LEGACY_MATERIAL_ARCHIVE, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING].includes(item));

assert.equal(resolveMakerQaProfile(current)?.id, MAKER_QA_PROFILE.ALPHA64_CURRENT);
assert.deepEqual(new Set(listMakerQaCapabilities(current)), new Set(capabilities));
for (const capability of capabilities) assert.equal(isMakerQaCapabilityEnabled(current, capability), true, capability);
assert.equal(isMakerQaCapabilityEnabled(current, MAKER_QA_CAPABILITY.LEGACY_MATERIAL_ARCHIVE), false);

const boundedLegacy = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA46,
};
assert.equal(isMakerQaCapabilityEnabled(boundedLegacy, MAKER_QA_CAPABILITY.BASIC_INFO), true);
assert.equal(isMakerQaCapabilityEnabled(boundedLegacy, MAKER_QA_CAPABILITY.DOCUMENT_R0), false);
assert.equal(resolveMakerQaProfile({ ...current, WAFL_V2_COMMAND_MUTATION_APPROVED: "unknown" }), null);
assert.equal(resolveMakerQaProfile({ ...current, WAFL_SERVER_RUNTIME_MODE: "production" }), null);

const allowed = [
  ["/api/v2/address-search", "GET", "in-app-juso-address-search"],
  ["/api/v2/work-orders", "POST", "create"],
  [`/api/v2/work-orders/${uuid}`, "PATCH", "overview-season-due-total-memo"],
  [`/api/v2/work-orders/${uuid}/images/upload`, "POST", "image-prepare"],
  [`/api/v2/work-orders/${uuid}/attachments/upload`, "POST", "attachment-prepare"],
  ["/api/v2/work-orders/files/upload", "PUT", "asset-upload"],
  [`/api/v2/work-orders/${uuid}/size-color/sizes`, "POST", "size-add"],
  [`/api/v2/work-orders/${uuid}/size-color/colors/${uuid}`, "DELETE", "color-delete"],
  [`/api/v2/work-orders/${uuid}/size-color/quantities/${uuid}/${uuid}`, "PATCH", "quantity"],
  [`/api/v2/work-orders/${uuid}/size-color/selection-batch`, "POST", "selection-batch"],
  [`/api/v2/work-orders/${uuid}/size-color/options`, "POST", "custom-option"],
  [`/api/v2/work-orders/${uuid}/size-color/options/${uuid}`, "PATCH", "custom-option-rename"],
  [`/api/v2/work-orders/${uuid}/size-color/options/${uuid}`, "DELETE", "custom-option-remove"],
  [`/api/v2/work-orders/${uuid}/size-spec/commands`, "POST", "finished-spec"],
  [`/api/v2/size-spec-templates/${uuid}`, "PATCH", "saved-spec"],
  [`/api/v2/work-orders/${uuid}/materials`, "POST", "material-create"],
  [`/api/v2/work-orders/${uuid}/materials/${uuid}`, "PATCH", "material-update"],
  [`/api/v2/work-orders/${uuid}/materials/${uuid}`, "DELETE", "material-delete"],
  [`/api/v2/work-orders/${uuid}/materials/${uuid}/order-request`, "POST", "order-request"],
  [`/api/v2/work-orders/${uuid}/materials/${uuid}/order-cancel`, "POST", "order-cancel"],
  [`/api/v2/work-orders/${uuid}/attachments/${uuid}/output-include`, "PATCH", "document-attachment"],
  [`/api/v2/work-orders/${uuid}/revisions/issue`, "POST", "issue-r0"],
  [`/api/v2/work-orders/${uuid}/documents/generate`, "POST", "generate-r0"],
  [`/api/v2/work-orders/documents/${uuid}/access-tokens`, "POST", "share"],
  [`/api/v2/work-orders/documents/${uuid}/access-tokens/${uuid}/revoke`, "POST", "revoke"],
];
for (const [pathname, method, label] of allowed) {
  assert.equal(isTailscaleServePathAllowed(pathname, method, current), true, label);
}

for (const [pathname, method] of [
  ["/api/v2/address-search", "POST"],
  [`/api/v2/work-orders/${uuid}/materials/${uuid}/archive`, "POST"],
  [`/api/v2/work-orders/${uuid}/documents/generate`, "DELETE"],
  ["/api/v2/work-orders/reset", "POST"],
  ["/api/v2/system/seed", "POST"],
]) assert.equal(isTailscaleServePathAllowed(pathname, method, current), false, `${method} ${pathname}`);

const commandGuard = fs.readFileSync("lib/domain/work-orders/command/runtimeGuard.ts", "utf8");
const ingress = fs.readFileSync("lib/external-qa/configCore.mjs", "utf8");
assert.match(commandGuard, /makerQaCapabilities\.mjs/);
assert.match(commandGuard, /isMakerQaCapabilityEnabled/);
assert.match(ingress, /makerQaCapabilities\.mjs/);
assert.doesNotMatch(ingress, /2\.0\.0-alpha\.(?:46|50|51|52|55|56|57|59|60|61|62|64)-dev-test/);
assert.doesNotMatch(commandGuard, /configuredApproval\s*!==\s*WAFL_V2_ALPHA64_DOCUMENT_R0_MUTATION_APPROVAL/);

console.log("workorder-v2-alpha64-current-maker-runtime-superset-contract: PASS");
