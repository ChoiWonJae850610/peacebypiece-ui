import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { invitationRepository } from "./invitationRepository";
import type { InvitationRecord } from "./invitationTypes";
import type {
  JoinRequestCreateResult,
  JoinRequestDraft,
  JoinRequestRecord,
  JoinRequestRepository,
  JoinRequestType,
} from "./joinRequestTypes";

const inMemoryJoinRequests: JoinRequestRecord[] = [];

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readExpectedScope(requestType: JoinRequestType): InvitationRecord["scope"] {
  return requestType === "company" ? "system_to_company_admin" : "company_to_member";
}

function assertJoinRequestInput(draft: JoinRequestDraft): void {
  if (!draft.rawToken.trim()) {
    throw new Error("INVITATION_TOKEN_REQUIRED");
  }

  if (!draft.applicantName.trim()) {
    throw new Error("APPLICANT_NAME_REQUIRED");
  }

  if (!draft.applicantEmail.trim()) {
    throw new Error("APPLICANT_EMAIL_REQUIRED");
  }

  if (draft.requestType === "company" && !draft.requestedCompanyName?.trim()) {
    throw new Error("REQUESTED_COMPANY_NAME_REQUIRED");
  }
}

function assertInvitationMatchesRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): void {
  const expectedScope = readExpectedScope(draft.requestType);

  if (invitation.scope !== expectedScope) {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }

  if (invitation.status !== "pending" && invitation.status !== "active") {
    throw new Error("INVITATION_NOT_ACTIVE");
  }

  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    throw new Error("INVITATION_EXPIRED");
  }
}

type JoinRequestDbRow = {
  id: string;
  invitation_id: string | null;
  user_id: string | null;
  applicant_email: string;
  request_type: JoinRequestType;
  requested_company_name: string | null;
  business_name: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  request_memo: string | null;
  status: JoinRequestRecord["status"];
  reviewed_by_user_id: string | null;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  created_company_id: string | null;
  rejection_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toJoinRequestRecord(row: JoinRequestDbRow): JoinRequestRecord {
  return {
    id: row.id,
    invitationId: row.invitation_id,
    userId: row.user_id,
    applicantEmail: row.applicant_email,
    requestType: row.request_type,
    requestedCompanyName: row.requested_company_name,
    businessName: row.business_name,
    applicantName: row.applicant_name,
    applicantPhone: row.applicant_phone,
    requestMemo: row.request_memo,
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: toIsoString(row.reviewed_at),
    createdCompanyId: row.created_company_id,
    rejectionReason: row.rejection_reason,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function createInMemoryJoinRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): JoinRequestRecord {
  const now = new Date().toISOString();

  const existing = inMemoryJoinRequests.find(
    (item) =>
      item.invitationId === invitation.id &&
      item.status === "pending" &&
      item.applicantEmail === normalizeEmail(draft.applicantEmail),
  );

  if (existing) {
    throw new Error("JOIN_REQUEST_ALREADY_PENDING");
  }

  return {
    id: randomUUID(),
    invitationId: invitation.id,
    userId: draft.userId ?? null,
    applicantEmail: normalizeEmail(draft.applicantEmail),
    requestType: draft.requestType,
    requestedCompanyName: normalizeText(draft.requestedCompanyName),
    businessName: normalizeText(draft.businessName),
    applicantName: normalizeText(draft.applicantName),
    applicantPhone: normalizeText(draft.applicantPhone),
    requestMemo: normalizeText(draft.requestMemo),
    status: "pending",
    reviewedByUserId: null,
    reviewedBySystemUserId: null,
    reviewedAt: null,
    createdCompanyId: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function createDbJoinRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): Promise<JoinRequestRecord> {
  const existing = await queryDb<JoinRequestDbRow>(
    `
      SELECT
        id,
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        request_memo,
        status,
        reviewed_by_user_id,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        rejection_reason,
        created_at,
        updated_at
      FROM join_requests
      WHERE invitation_id = $1
        AND lower(applicant_email) = lower($2)
        AND status = 'pending'
      LIMIT 1
    `,
    [invitation.id, normalizeEmail(draft.applicantEmail)],
  );

  if (existing.rows[0]) {
    throw new Error("JOIN_REQUEST_ALREADY_PENDING");
  }

  const result = await queryDb<JoinRequestDbRow>(
    `
      INSERT INTO join_requests (
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        request_memo,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING
        id,
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        request_memo,
        status,
        reviewed_by_user_id,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        rejection_reason,
        created_at,
        updated_at
    `,
    [
      invitation.id,
      draft.userId ?? null,
      normalizeEmail(draft.applicantEmail),
      draft.requestType,
      normalizeText(draft.requestedCompanyName),
      normalizeText(draft.businessName),
      normalizeText(draft.applicantName),
      normalizeText(draft.applicantPhone),
      normalizeText(draft.requestMemo),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("JOIN_REQUEST_CREATE_FAILED");
  }

  return toJoinRequestRecord(row);
}

function readRedirectPath(requestType: JoinRequestType): string {
  return requestType === "company" ? "/pending?type=company" : "/pending?type=member";
}

export function createJoinRequestRepository(): JoinRequestRepository {
  return {
    async createJoinRequest(draft: JoinRequestDraft): Promise<JoinRequestCreateResult> {
      assertJoinRequestInput(draft);

      const invitation = await invitationRepository.findInvitationByRawToken(draft.rawToken);
      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
      }

      assertInvitationMatchesRequest(invitation, draft);

      const joinRequest = isDatabaseConfigured()
        ? await createDbJoinRequest(invitation, draft)
        : createInMemoryJoinRequest(invitation, draft);

      if (!isDatabaseConfigured()) {
        inMemoryJoinRequests.unshift(joinRequest);
      }

      return {
        invitation,
        joinRequest,
        redirectPath: readRedirectPath(draft.requestType),
      };
    },
  };
}

export const joinRequestRepository = createJoinRequestRepository();
