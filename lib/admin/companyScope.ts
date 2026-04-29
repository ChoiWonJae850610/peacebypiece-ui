import { getWorkspaceCompanyContext } from "@/lib/constants/company";

export type AdminCompanyScope = {
  companyId: string;
  companyName: string;
};

export function getAdminCompanyScope(): AdminCompanyScope {
  return getWorkspaceCompanyContext();
}

export function getAdminCompanyId(): string {
  return getAdminCompanyScope().companyId;
}
