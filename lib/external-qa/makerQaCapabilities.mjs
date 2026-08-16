const normalized = (value) => String(value ?? "").trim().toLowerCase();

export const MAKER_QA_CAPABILITY = Object.freeze({
  WORK_ORDER_CREATE: "work-order-create",
  BASIC_INFO: "basic-info",
  ASSET_AUTHORING: "asset-authoring",
  SIZE_COLOR_STRUCTURE: "size-color-structure",
  SIZE_COLOR_BATCH: "size-color-batch",
  SIZE_COLOR_HARD_DELETE: "size-color-hard-delete",
  CUSTOM_OPTIONS: "custom-options",
  MEASUREMENT: "measurement",
  COMPANY_TEMPLATE: "company-template",
  MATERIAL_DRAFT: "material-draft",
  MATERIAL_HARD_DELETE: "material-hard-delete",
  MATERIAL_ORDER: "material-order",
  LEGACY_MATERIAL_ARCHIVE: "legacy-material-archive",
  DOCUMENT_R0: "document-r0",
  ADDRESS_SEARCH: "address-search",
});

export const MAKER_QA_APPROVAL = Object.freeze({
  ALPHA46: "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime",
  ALPHA50: "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime",
  ALPHA51: "2.0.0-alpha.51-dev-test-mobile-material-lifecycle-runtime",
  ALPHA52: "2.0.0-alpha.52-dev-test-mobile-core-inline-runtime",
  ALPHA55: "2.0.0-alpha.55-dev-test-mobile-material-order-lifecycle-runtime",
  ALPHA56: "2.0.0-alpha.56-dev-test-accessory-lifecycle-parity-runtime",
  ALPHA57: "2.0.0-alpha.57-dev-test-work-order-image-runtime",
  ALPHA59: "2.0.0-alpha.59-dev-test-size-color-structure-runtime",
  ALPHA60: "2.0.0-alpha.60-dev-test-draft-child-hard-delete-runtime",
  ALPHA61: "2.0.0-alpha.61-dev-test-mobile-work-order-create-runtime",
  ALPHA62: "2.0.0-alpha.62-dev-test-size-measurement-runtime",
  ALPHA64_CURRENT: "2.0.0-alpha.64-dev-test-maker-document-r0-runtime",
});

export const MAKER_QA_PROFILE = Object.freeze({
  ALPHA46: "alpha46-basic-info",
  ALPHA50: "alpha50-material-draft",
  ALPHA51: "alpha51-material-lifecycle",
  ALPHA52: "alpha52-core-inline",
  ALPHA55: "alpha55-material-order",
  ALPHA56: "alpha56-accessory-parity",
  ALPHA57: "alpha57-maker-assets",
  ALPHA59: "alpha59-size-color",
  ALPHA60: "alpha60-draft-hard-delete",
  ALPHA61: "alpha61-work-order-create",
  ALPHA62: "alpha62-maker-authoring",
  ALPHA64_CURRENT: "alpha64-current-maker",
});

const C = MAKER_QA_CAPABILITY;
const A = MAKER_QA_APPROVAL;
const P = MAKER_QA_PROFILE;
const PROFILE_DEFINITIONS = Object.freeze([
  [P.ALPHA46, A.ALPHA46, "WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED", [C.BASIC_INFO]],
  [P.ALPHA50, A.ALPHA50, "WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED", [C.MATERIAL_DRAFT]],
  [P.ALPHA51, A.ALPHA51, "WAFL_EXTERNAL_QA_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_ENABLED", [C.MATERIAL_DRAFT, C.LEGACY_MATERIAL_ARCHIVE]],
  [P.ALPHA52, A.ALPHA52, "WAFL_EXTERNAL_QA_ALPHA52_CORE_INLINE_MUTATION_ENABLED", [C.BASIC_INFO, C.MATERIAL_DRAFT]],
  [P.ALPHA55, A.ALPHA55, "WAFL_EXTERNAL_QA_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_ENABLED", [C.MATERIAL_DRAFT, C.MATERIAL_ORDER]],
  [P.ALPHA56, A.ALPHA56, "WAFL_EXTERNAL_QA_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_ENABLED", [C.MATERIAL_DRAFT, C.MATERIAL_ORDER, C.LEGACY_MATERIAL_ARCHIVE]],
  [P.ALPHA57, A.ALPHA57, "WAFL_EXTERNAL_QA_ALPHA57_WORK_ORDER_IMAGE_MUTATION_ENABLED", [C.BASIC_INFO, C.ASSET_AUTHORING, C.MATERIAL_DRAFT, C.MATERIAL_ORDER, C.LEGACY_MATERIAL_ARCHIVE]],
  [P.ALPHA59, A.ALPHA59, "WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED", [C.BASIC_INFO, C.SIZE_COLOR_STRUCTURE, C.MATERIAL_DRAFT, C.MATERIAL_ORDER]],
  [P.ALPHA60, A.ALPHA60, "WAFL_EXTERNAL_QA_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_ENABLED", [C.BASIC_INFO, C.SIZE_COLOR_STRUCTURE, C.SIZE_COLOR_HARD_DELETE, C.MATERIAL_DRAFT, C.MATERIAL_HARD_DELETE, C.MATERIAL_ORDER, C.LEGACY_MATERIAL_ARCHIVE]],
  [P.ALPHA61, A.ALPHA61, "WAFL_EXTERNAL_QA_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_ENABLED", [C.WORK_ORDER_CREATE, C.SIZE_COLOR_STRUCTURE]],
  [P.ALPHA62, A.ALPHA62, "WAFL_EXTERNAL_QA_ALPHA62_SIZE_MEASUREMENT_MUTATION_ENABLED", [C.WORK_ORDER_CREATE, C.BASIC_INFO, C.ASSET_AUTHORING, C.SIZE_COLOR_STRUCTURE, C.SIZE_COLOR_BATCH, C.SIZE_COLOR_HARD_DELETE, C.CUSTOM_OPTIONS, C.MEASUREMENT, C.COMPANY_TEMPLATE, C.MATERIAL_DRAFT, C.MATERIAL_HARD_DELETE, C.MATERIAL_ORDER]],
  [P.ALPHA64_CURRENT, A.ALPHA64_CURRENT, "WAFL_EXTERNAL_QA_ALPHA64_DOCUMENT_R0_MUTATION_ENABLED", [C.WORK_ORDER_CREATE, C.BASIC_INFO, C.ASSET_AUTHORING, C.SIZE_COLOR_STRUCTURE, C.SIZE_COLOR_BATCH, C.SIZE_COLOR_HARD_DELETE, C.CUSTOM_OPTIONS, C.MEASUREMENT, C.COMPANY_TEMPLATE, C.MATERIAL_DRAFT, C.MATERIAL_HARD_DELETE, C.MATERIAL_ORDER, C.DOCUMENT_R0, C.ADDRESS_SEARCH]],
].map(([id, approval, flag, capabilities]) => Object.freeze({ id, approval, flag, capabilities: new Set(capabilities) })));

function isProduction(env) {
  const explicit = normalized(env.WAFL_SERVER_RUNTIME_MODE);
  if (explicit) return explicit === "production";
  const vercel = normalized(env.VERCEL_ENV);
  if (vercel) return vercel === "production";
  return normalized(env.NODE_ENV) === "production";
}

export function resolveMakerQaProfile(env = process.env) {
  if (isProduction(env) || normalized(env.WAFL_V2_COMMAND_API_ENABLED) !== "1") return null;
  const approval = String(env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "").trim();
  const definition = PROFILE_DEFINITIONS.find((candidate) => candidate.approval === approval);
  if (!definition || normalized(env[definition.flag]) !== "true") return null;
  if (definition.id === P.ALPHA64_CURRENT && (
    normalized(env.WAFL_V2_DOCUMENT_VIEWER_ENABLED) !== "1"
    || String(env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED ?? "").trim() !== A.ALPHA64_CURRENT
  )) return null;
  return definition;
}

export function isMakerQaCapabilityEnabled(env, capability) {
  return resolveMakerQaProfile(env)?.capabilities.has(capability) ?? false;
}

export function isCurrentMakerQaProfile(env = process.env) {
  return resolveMakerQaProfile(env)?.id === P.ALPHA64_CURRENT;
}

export function listMakerQaCapabilities(env = process.env) {
  return Object.freeze([...(resolveMakerQaProfile(env)?.capabilities ?? [])]);
}
