export interface CompanySummary {
  id: string;
  name: string;
  memo?: string | null;
  isActive: boolean;
  billingStatus?: string | null;
  storageLimitBytes?: number | null;
  memberLimit?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompanyUserSummary {
  id: string;
  companyId: string;
  userId: string;
  email?: string | null;
  name: string;
  role: string;
  displayName?: string | null;
  isActive: boolean;
  joinedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompanyPermissionSummary {
  role: string;
  permissions: string[];
}

export interface CompanyDetail {
  company: CompanySummary;
  users: CompanyUserSummary[];
  rolePermissions: CompanyPermissionSummary[];
}

export interface CompanyRepository {
  listCompanies(): Promise<CompanySummary[]>;
  getCompanyDetail(companyId: string): Promise<CompanyDetail | null>;
  listCompanyUsers(companyId: string): Promise<CompanyUserSummary[]>;
  listRolePermissions(): Promise<CompanyPermissionSummary[]>;
}
