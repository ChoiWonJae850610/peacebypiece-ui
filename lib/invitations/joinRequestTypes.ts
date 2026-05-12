import type { InvitationRecord, InvitationScope } from "./invitationTypes";
import type { MemberPermissionCode, MemberPermissionRoleTemplateCode } from "@/lib/permissions";

export type JoinRequestType = "member" | "company";

export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface JoinRequestDraft {
  rawToken: string;
  requestType: JoinRequestType;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  requestedCompanyName?: string | null;
  businessName?: string | null;
  requestMemo?: string | null;
  userId?: string | null;
}

export interface JoinRequestInvitationSummary {
  id: string;
  companyId: string | null;
  recipientEmail: string;
  recipientRole: InvitationRecord["recipientRole"];
  permissionPreset: InvitationRecord["permissionPreset"];
  scope: InvitationScope;
  status: InvitationRecord["status"];
  expiresAt: string;
}

export interface JoinRequestRecord {
  id: string;
  invitationId: string | null;
  userId: string | null;
  applicantEmail: string;
  requestType: JoinRequestType;
  requestedCompanyName: string | null;
  businessName: string | null;
  applicantName: string | null;
  applicantPhone: string | null;
  requestMemo: string | null;
  status: JoinRequestStatus;
  reviewedByUserId: string | null;
  reviewedBySystemUserId: string | null;
  reviewedAt: string | null;
  createdCompanyId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  invitation?: JoinRequestInvitationSummary | null;
}

export interface JoinRequestCreateResult {
  invitation: InvitationRecord;
  joinRequest: JoinRequestRecord;
  redirectPath: string;
}

export interface JoinRequestLookupInput {
  id?: string | null;
  applicantEmail?: string | null;
  requestType?: JoinRequestType | null;
  status?: JoinRequestStatus | null;
  invitationScope?: InvitationScope | null;
  limit?: number | null;
}

export interface JoinRequestListResult {
  joinRequests: JoinRequestRecord[];
  primaryJoinRequest: JoinRequestRecord | null;
}

export interface MemberJoinRequestApproveInput {
  requestId: string;
  approvedByUserId?: string | null;
  roleTemplateCode?: MemberPermissionRoleTemplateCode | null;
  permissionCodes?: readonly MemberPermissionCode[] | null;
}

export interface MemberJoinRequestRejectInput {
  requestId: string;
  rejectedByUserId?: string | null;
  reasonCode?: string | null;
}

export interface MemberJoinRequestApprovalResult {
  joinRequest: JoinRequestRecord;
  companyMemberId: string;
  userId: string;
  companyId: string;
  permissionCodes: readonly MemberPermissionCode[];
  roleTemplateCode: MemberPermissionRoleTemplateCode;
}

export interface MemberJoinRequestRejectionResult {
  joinRequest: JoinRequestRecord;
  companyId: string | null;
}

export interface JoinRequestRepository {
  createJoinRequest(draft: JoinRequestDraft): Promise<JoinRequestCreateResult>;
  listJoinRequests(input: JoinRequestLookupInput): Promise<JoinRequestListResult>;
  findJoinRequestById(id: string): Promise<JoinRequestRecord | null>;
  approveMemberJoinRequest(input: MemberJoinRequestApproveInput): Promise<MemberJoinRequestApprovalResult>;
  rejectMemberJoinRequest(input: MemberJoinRequestRejectInput): Promise<MemberJoinRequestRejectionResult>;
}
