export type { SystemCategoryRuleSummary, SystemCompanySummary } from "@/lib/data/domain/system";
export {
  SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES as SYSTEM_CATEGORY_RULE_SUMMARIES,
  SAMPLE_SYSTEM_COMPANY_SUMMARIES as SYSTEM_COMPANY_SUMMARIES,
} from "@/lib/data/sample/system";

export const WORKSPACE_COMPANY_ID = "company-seolo-seoul";
export const WORKSPACE_COMPANY_NAME = "Seolo Seoul";
export const WORKSPACE_COMPANY_NAME_EN = "Seolo Seoul";
export const WORKSPACE_ADMIN_USER_ID = "user-seolo-seoul-admin";

export type WorkspaceCompanyContext = {
  companyId: string;
  companyName: string;
};

export function getWorkspaceCompanyContext(): WorkspaceCompanyContext {
  return {
    companyId: WORKSPACE_COMPANY_ID,
    companyName: WORKSPACE_COMPANY_NAME,
  };
}

export function getWorkspaceCompanyName(): string {
  return WORKSPACE_COMPANY_NAME;
}

export function getWorkspaceCompanyNameEn(): string {
  return WORKSPACE_COMPANY_NAME_EN;
}

export function getAdminWorkspaceTitle(companyName: string): string {
  return `${companyName} 관리자 운영 화면`;
}
