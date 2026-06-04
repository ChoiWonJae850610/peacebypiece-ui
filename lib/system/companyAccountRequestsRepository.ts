import "server-only";

import { queryDb } from "@/lib/db/client";

export type SystemCompanyAccountRequestStatus = "pending" | "reviewing" | "approved" | "rejected" | "cancelled";
export type SystemCompanyAccountRequestReviewAction = "reviewing" | "approved" | "rejected";
export type SystemCompanyAccountRequestType = "company_info_change" | "account_deactivation";

export type SystemCompanyAccountRequestRecord = {
  id: string;
  companyId: string;
  companyName: string;
  businessName: string | null;
  requestedByUserId: string;
  requesterName: string;
  requesterEmail: string | null;
  requestType: SystemCompanyAccountRequestType;
  requestStatus: SystemCompanyAccountRequestStatus;
  requestTitle: string;
  requestMessage: string;
  reviewedByUserId: string | null;
  reviewedBySystemUserId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type SystemCompanyAccountRequestRow = {
  id: string;
  company_id: string;
  company_name: string;
  business_name: string | null;
  requested_by_user_id: string;
  requester_name: string | null;
  requester_email: string | null;
  request_type: SystemCompanyAccountRequestType;
  request_status: SystemCompanyAccountRequestStatus;
  request_title: string;
  request_message: string;
  reviewed_by_user_id: string | null;
  reviewed_by_system_user_id: string | null;
  reviewer_name: string | null;
  reviewed_at: Date | string | null;
  review_message: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeReviewMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const message = value.trim().replace(/\s+/g, " ");
  if (!message) return null;
  if (message.length > 1200) {
    throw new Error("SYSTEM_COMPANY_ACCOUNT_REQUEST_REVIEW_MESSAGE_TOO_LONG");
  }
  return message;
}

export function isSystemCompanyAccountRequestReviewAction(value: unknown): value is SystemCompanyAccountRequestReviewAction {
  return value === "reviewing" || value === "approved" || value === "rejected";
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(Math.trunc(value || 50), 1), 200);
}

function toSystemCompanyAccountRequestRecord(row: SystemCompanyAccountRequestRow): SystemCompanyAccountRequestRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    businessName: row.business_name,
    requestedByUserId: row.requested_by_user_id,
    requesterName: row.requester_name?.trim() || "-",
    requesterEmail: row.requester_email,
    requestType: row.request_type,
    requestStatus: row.request_status,
    requestTitle: row.request_title,
    requestMessage: row.request_message,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewerName: row.reviewer_name,
    reviewedAt: toIsoString(row.reviewed_at),
    reviewMessage: row.review_message,
    createdAt: toIsoString(row.created_at) || "",
    updatedAt: toIsoString(row.updated_at) || "",
  };
}

export async function listSystemCompanyAccountRequests(limit?: number): Promise<SystemCompanyAccountRequestRecord[]> {
  const result = await queryDb<SystemCompanyAccountRequestRow>(
    `SELECT
       request.id,
       request.company_id,
       company.name AS company_name,
       company.business_name,
       request.requested_by_user_id,
       requester.name AS requester_name,
       requester.email AS requester_email,
       request.request_type,
       request.request_status,
       request.request_title,
       request.request_message,
       request.reviewed_by_user_id,
       request.reviewed_by_system_user_id,
       reviewer.name AS reviewer_name,
       request.reviewed_at,
       request.review_message,
       request.created_at,
       request.updated_at
     FROM company_account_requests request
     INNER JOIN companies company
        ON company.id = request.company_id
     INNER JOIN users requester
        ON requester.id = request.requested_by_user_id
     LEFT JOIN system_users reviewer
        ON reviewer.id = request.reviewed_by_system_user_id
     ORDER BY request.created_at DESC
     LIMIT $1`,
    [normalizeLimit(limit)],
  );

  return result.rows.map(toSystemCompanyAccountRequestRecord);
}


export async function updateSystemCompanyAccountRequestStatus({
  requestId,
  reviewerUserId,
  action,
  reviewMessage,
}: {
  requestId: string;
  reviewerUserId: string;
  action: SystemCompanyAccountRequestReviewAction;
  reviewMessage?: unknown;
}): Promise<SystemCompanyAccountRequestRecord> {
  const normalizedMessage = normalizeReviewMessage(reviewMessage);

  const result = await queryDb<SystemCompanyAccountRequestRow>(
    `UPDATE company_account_requests request
        SET request_status = $2,
            reviewed_by_user_id = NULL,
            reviewed_by_system_user_id = $3,
            reviewed_at = now(),
            review_message = $4,
            updated_at = now()
      FROM companies company,
           users requester
      LEFT JOIN system_users reviewer
         ON reviewer.id = $3
      WHERE request.id = $1
        AND request.request_status IN ('pending', 'reviewing')
        AND company.id = request.company_id
        AND requester.id = request.requested_by_user_id
      RETURNING
        request.id,
        request.company_id,
        company.name AS company_name,
        company.business_name,
        request.requested_by_user_id,
        requester.name AS requester_name,
        requester.email AS requester_email,
        request.request_type,
        request.request_status,
        request.request_title,
        request.request_message,
        request.reviewed_by_user_id,
        request.reviewed_by_system_user_id,
        reviewer.name AS reviewer_name,
        request.reviewed_at,
        request.review_message,
        request.created_at,
        request.updated_at`,
    [requestId, action, reviewerUserId, normalizedMessage],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("SYSTEM_COMPANY_ACCOUNT_REQUEST_NOT_FOUND");
  }

  return toSystemCompanyAccountRequestRecord(row);
}
