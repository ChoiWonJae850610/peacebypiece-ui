import type { AdminCompanyMemberStatus } from "@/lib/admin/members/memberTypes";

export const ADMIN_COMPANY_MEMBER_STATUS = {
  approved: "approved",
  pending: "pending",
  rejected: "rejected",
  suspended: "suspended",
} as const satisfies Record<string, AdminCompanyMemberStatus>;

export const ADMIN_COMPANY_MEMBER_STATUSES = [
  ADMIN_COMPANY_MEMBER_STATUS.approved,
  ADMIN_COMPANY_MEMBER_STATUS.pending,
  ADMIN_COMPANY_MEMBER_STATUS.rejected,
  ADMIN_COMPANY_MEMBER_STATUS.suspended,
] as const satisfies readonly AdminCompanyMemberStatus[];

export const ADMIN_COMPANY_MEMBER_STATUS_FILTER = {
  all: "all",
  approved: ADMIN_COMPANY_MEMBER_STATUS.approved,
  suspended: ADMIN_COMPANY_MEMBER_STATUS.suspended,
} as const;

export type AdminCompanyMemberStatusFilter =
  | typeof ADMIN_COMPANY_MEMBER_STATUS_FILTER.all
  | AdminCompanyMemberStatus;

export function isAdminCompanyMemberStatus(
  value: string | null | undefined,
): value is AdminCompanyMemberStatus {
  return ADMIN_COMPANY_MEMBER_STATUSES.includes(value as AdminCompanyMemberStatus);
}

export function normalizeAdminCompanyMemberStatusOrNull(
  value: string | null | undefined,
): AdminCompanyMemberStatus | null {
  return isAdminCompanyMemberStatus(value) ? value : null;
}

export function normalizeAdminCompanyMemberStatusFilter(
  value: string | null | undefined,
  fallback: AdminCompanyMemberStatusFilter = ADMIN_COMPANY_MEMBER_STATUS_FILTER.approved,
): AdminCompanyMemberStatusFilter {
  if (value === ADMIN_COMPANY_MEMBER_STATUS_FILTER.all) return ADMIN_COMPANY_MEMBER_STATUS_FILTER.all;
  return isAdminCompanyMemberStatus(value) ? value : fallback;
}

export function isApprovedAdminCompanyMemberStatus(
  status: AdminCompanyMemberStatus | null | undefined,
): boolean {
  return status === ADMIN_COMPANY_MEMBER_STATUS.approved;
}
