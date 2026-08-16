export const MAKER_QA_CAPABILITY: Readonly<Record<
  | "WORK_ORDER_CREATE" | "BASIC_INFO" | "ASSET_AUTHORING"
  | "SIZE_COLOR_STRUCTURE" | "SIZE_COLOR_BATCH" | "SIZE_COLOR_HARD_DELETE" | "CUSTOM_OPTIONS"
  | "MEASUREMENT" | "COMPANY_TEMPLATE"
  | "MATERIAL_DRAFT" | "MATERIAL_HARD_DELETE" | "MATERIAL_ORDER" | "LEGACY_MATERIAL_ARCHIVE"
  | "DOCUMENT_R0" | "ADDRESS_SEARCH",
  string
>>;
export const MAKER_QA_APPROVAL: Readonly<Record<string, string>>;
export const MAKER_QA_PROFILE: Readonly<Record<string, string>>;
export type MakerQaProfile = {
  readonly id: string;
  readonly approval: string;
  readonly flag: string;
  readonly capabilities: ReadonlySet<string>;
};
export function resolveMakerQaProfile(env?: NodeJS.ProcessEnv): MakerQaProfile | null;
export function isMakerQaCapabilityEnabled(env: NodeJS.ProcessEnv, capability: string): boolean;
export function isCurrentMakerQaProfile(env?: NodeJS.ProcessEnv): boolean;
export function listMakerQaCapabilities(env?: NodeJS.ProcessEnv): readonly string[];
