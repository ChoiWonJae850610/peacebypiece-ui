import type {
  CompanyId,
  CompanyRepository,
  CompanySummary,
  CompanyUserSummary,
  CreateCompanyInput,
  ListCompaniesQuery,
} from "./companyTypes";

const notConnectedMessage =
  "Company repository is a skeleton. Connect Neon repository implementation before enabling writes.";

export class CompanyRepositoryNotConnectedError extends Error {
  constructor() {
    super(notConnectedMessage);
    this.name = "CompanyRepositoryNotConnectedError";
  }
}

const sampleCompanies: CompanySummary[] = [
  {
    id: "sample-company",
    name: "샘플 고객사",
    memo: "시스템관리자 고객사 관리 skeleton 표시용 데이터",
    status: "active",
    memberCount: 3,
    storageLimitBytes: null,
    storageUsedBytes: 0,
    createdAt: null,
    updatedAt: null,
  },
];

const sampleCompanyUsers: CompanyUserSummary[] = [
  {
    id: "sample-company-user-admin",
    companyId: "sample-company",
    userId: "sample-admin",
    email: "admin@example.com",
    name: "샘플 관리자",
    role: "admin",
    permissions: [
      "workorder.create",
      "workorder.edit",
      "workorder.skip_review",
      "workorder.request_order",
      "partner.manage",
      "member.invite",
      "storage.manage",
      "stats.view",
    ],
    isActive: true,
    joinedAt: null,
  },
];

export function createCompanyRepositorySkeleton(): CompanyRepository {
  return {
    async listCompanies(query?: ListCompaniesQuery) {
      const keyword = query?.keyword?.trim().toLowerCase();

      return sampleCompanies.filter((company) => {
        if (!query?.includeInactive && company.status !== "active") {
          return false;
        }

        if (!keyword) {
          return true;
        }

        return company.name.toLowerCase().includes(keyword);
      });
    },

    async getCompany(companyId: CompanyId) {
      return sampleCompanies.find((company) => company.id === companyId) ?? null;
    },

    async createCompany(_input: CreateCompanyInput) {
      throw new CompanyRepositoryNotConnectedError();
    },

    async listCompanyUsers(companyId: CompanyId) {
      return sampleCompanyUsers.filter((user) => user.companyId === companyId);
    },
  };
}

export const companyRepository = createCompanyRepositorySkeleton();
