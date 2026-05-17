import type { MemberPermissionCode, MemberPermissionRoleTemplateCode } from "@/lib/permissions";

export type AdminCompanyMemberStatus = "approved" | "pending" | "rejected" | "suspended";

export interface AdminCompanyMemberRecord {
  id: string;
  companyId: string;
  userId: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  name: string;
  displayName: string | null;
  roleTemplateCode: MemberPermissionRoleTemplateCode;
  status: AdminCompanyMemberStatus;
  permissionCodes: readonly MemberPermissionCode[];
  permissionCount: number;
  approvedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListAdminCompanyMembersInput {
  companyId: string;
  status?: AdminCompanyMemberStatus | "all" | null;
  limit?: number | null;
}

export interface ListAdminCompanyMembersResult {
  members: AdminCompanyMemberRecord[];
}

export interface UpdateAdminCompanyMemberPermissionsInput {
  companyId: string;
  companyMemberId: string;
  permissionCodes: readonly MemberPermissionCode[];
  updatedByUserId?: string | null;
}

export interface UpdateAdminCompanyMemberPermissionsResult {
  member: AdminCompanyMemberRecord;
  previousPermissionCodes: readonly MemberPermissionCode[];
  nextPermissionCodes: readonly MemberPermissionCode[];
}

export interface AdminMemberRepository {
  listCompanyMembers(input: ListAdminCompanyMembersInput): Promise<ListAdminCompanyMembersResult>;
  updateCompanyMemberPermissions(input: UpdateAdminCompanyMemberPermissionsInput): Promise<UpdateAdminCompanyMemberPermissionsResult>;
}
