import type { InvitationRecord } from "./invitationTypes";

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
  limit?: number | null;
}

export interface JoinRequestListResult {
  joinRequests: JoinRequestRecord[];
  primaryJoinRequest: JoinRequestRecord | null;
}

export interface JoinRequestRepository {
  createJoinRequest(draft: JoinRequestDraft): Promise<JoinRequestCreateResult>;
  listJoinRequests(input: JoinRequestLookupInput): Promise<JoinRequestListResult>;
  findJoinRequestById(id: string): Promise<JoinRequestRecord | null>;
}
