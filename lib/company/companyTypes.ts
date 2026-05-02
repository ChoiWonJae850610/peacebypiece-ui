export type CompanyId = string;
export type UserId = string;
export type CompanyUserId = string;

export type CompanyStatus = "active" | "inactive";

export type CompanyRole =
  | "admin"
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer";

export type CompanyPermissionKey =
  | "workorder.create"
  | "workorder.edit"
  | "workorder.request_review"
  | "workorder.skip_review"
  | "workorder.request_order"
  | "workorder.inspect"
  | "workorder.complete"
  | "inventory.manage"
  | "partner.manage"
  | "member.invite"
  | "billing.manage"
  | "storage.manage"
  | "stats.view"
  | "system.audit.view";

export interface CompanySummary {
  id: CompanyId;
  name: string;
  memo?: string | null;
  status: CompanyStatus;
  memberCount: number;
  storageLimitBytes?: number | null;
  storageUsedBytes?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompanyUserSummary {
  id: CompanyUserId;
  companyId: CompanyId;
  userId: UserId;
  email: string;
  name: string;
  role: CompanyRole;
  permissions: CompanyPermissionKey[];
  isActive: boolean;
  joinedAt?: string | null;
}

export interface ListCompaniesQuery {
  keyword?: string;
  includeInactive?: boolean;
}

export interface CreateCompanyInput {
  name: string;
  memo?: string | null;
}

export interface CompanyRepository {
  listCompanies(query?: ListCompaniesQuery): Promise<CompanySummary[]>;
  getCompany(companyId: CompanyId): Promise<CompanySummary | null>;
  createCompany(input: CreateCompanyInput): Promise<CompanySummary>;
  listCompanyUsers(companyId: CompanyId): Promise<CompanyUserSummary[]>;
}
