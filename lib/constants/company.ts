export type { SystemCategoryRuleSummary, SystemCompanySummary } from "@/lib/data/domain/system";
export {
  SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES as SYSTEM_CATEGORY_RULE_SUMMARIES,
  SAMPLE_SYSTEM_COMPANY_SUMMARIES as SYSTEM_COMPANY_SUMMARIES,
} from "@/lib/data/sample/system";

export const WORKSPACE_COMPANY_NAME = "샘플 고객사"
export const WORKSPACE_COMPANY_NAME_EN = "CUSTOMER NAME";

export function getWorkspaceCompanyName(): string {
  return WORKSPACE_COMPANY_NAME;
}

export function getWorkspaceCompanyNameEn(): string {
  return WORKSPACE_COMPANY_NAME_EN;
}

export function getAdminWorkspaceTitle(companyName: string): string {
  return `${companyName} 관리자 운영 화면`;
}
