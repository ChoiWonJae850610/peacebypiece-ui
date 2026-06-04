import "server-only";

import { randomUUID } from "crypto";

import { queryDb } from "@/lib/db/client";

export type CompanyAccountRequestType = "company_info_change" | "account_deactivation";

export type CompanyAccountRequestStatus = "pending" | "reviewing" | "approved" | "rejected" | "cancelled";

export type CompanyAccountRequestRecord = {
  id: string;
  companyId: string;
  requestedByUserId: string;
  requestType: CompanyAccountRequestType;
  requestStatus: CompanyAccountRequestStatus;
  requestTitle: string;
  requestMessage: string;
  requestPayload: Record<string, unknown>;
  reviewedByUserId: string | null;
  reviewedBySystemUserId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewMessage: string | null;
  createdAt: string;
};

export type CreateCompanyAccountRequestInput = {
  companyId: string;
  requestedByUserId: string;
  requestType: CompanyAccountRequestType;
  requestMessage: string;
  requestPayload?: Record<string, unknown> | null;
};

type CompanyAccountRequestRow = {
  id: string;
  company_id: string;
  requested_by_user_id: string;
  request_type: CompanyAccountRequestType;
  request_status: CompanyAccountRequestStatus;
  request_title: string;
  request_message: string;
  request_payload: Record<string, unknown> | null;
  reviewed_by_user_id: string | null;
  reviewed_by_system_user_id: string | null;
  reviewer_name: string | null;
  reviewed_at: Date | string | null;
  review_message: string | null;
  created_at: Date | string;
};

export const COMPANY_ACCOUNT_REQUEST_TYPES = ["company_info_change", "account_deactivation"] as const;

export function isCompanyAccountRequestType(value: unknown): value is CompanyAccountRequestType {
  return typeof value === "string" && COMPANY_ACCOUNT_REQUEST_TYPES.includes(value as CompanyAccountRequestType);
}

function normalizeRequestMessage(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCompanyAccountRequestMessage(value: unknown): string {
  const message = typeof value === "string" ? normalizeRequestMessage(value) : "";

  if (message.length < 10) {
    throw new Error("COMPANY_ACCOUNT_REQUEST_MESSAGE_TOO_SHORT");
  }

  if (message.length > 1200) {
    throw new Error("COMPANY_ACCOUNT_REQUEST_MESSAGE_TOO_LONG");
  }

  return message;
}

function resolveRequestTitle(requestType: CompanyAccountRequestType): string {
  if (requestType === "account_deactivation") return "계정 비활성화 요청";
  return "회사 정보 변경 요청";
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toCompanyAccountRequestRecord(row: CompanyAccountRequestRow): CompanyAccountRequestRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    requestedByUserId: row.requested_by_user_id,
    requestType: row.request_type,
    requestStatus: row.request_status,
    requestTitle: row.request_title,
    requestMessage: row.request_message,
    requestPayload: row.request_payload && typeof row.request_payload === "object" && !Array.isArray(row.request_payload) ? row.request_payload : {},
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at ? toIsoString(row.reviewed_at) : null,
    reviewMessage: row.review_message,
    createdAt: toIsoString(row.created_at),
  };
}

export async function createCompanyAccountRequest(input: CreateCompanyAccountRequestInput): Promise<CompanyAccountRequestRecord> {
  const message = validateCompanyAccountRequestMessage(input.requestMessage);
  const requestTitle = resolveRequestTitle(input.requestType);
  const payload = input.requestPayload && typeof input.requestPayload === "object" && !Array.isArray(input.requestPayload)
    ? input.requestPayload
    : {};

  const result = await queryDb<CompanyAccountRequestRow>(
    `INSERT INTO company_account_requests (
       id,
       company_id,
       requested_by_user_id,
       request_type,
       request_status,
       request_title,
       request_message,
       request_payload,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7::jsonb, now(), now())
     RETURNING
       id,
       company_id,
       requested_by_user_id,
       request_type,
       request_status,
       request_title,
       request_message,
       request_payload,
       NULL::text AS reviewed_by_user_id,
       NULL::text AS reviewed_by_system_user_id,
       NULL::text AS reviewer_name,
       NULL::timestamptz AS reviewed_at,
       NULL::text AS review_message,
       created_at`,
    [
      randomUUID(),
      input.companyId,
      input.requestedByUserId,
      input.requestType,
      requestTitle,
      message,
      JSON.stringify(payload),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("COMPANY_ACCOUNT_REQUEST_CREATE_FAILED");
  }

  return toCompanyAccountRequestRecord(row);
}

export async function listCompanyAccountRequests(companyId: string, limit = 5): Promise<CompanyAccountRequestRecord[]> {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.trunc(limit) : 5, 1), 20);

  const result = await queryDb<CompanyAccountRequestRow>(
    `SELECT
       request.id,
       request.company_id,
       request.requested_by_user_id,
       request.request_type,
       request.request_status,
       request.request_title,
       request.request_message,
       request.request_payload,
       request.reviewed_by_user_id,
       request.reviewed_by_system_user_id,
       COALESCE(system_reviewer.name, user_reviewer.name) AS reviewer_name,
       request.reviewed_at,
       request.review_message,
       request.created_at
     FROM company_account_requests request
     LEFT JOIN system_users system_reviewer
       ON system_reviewer.id = request.reviewed_by_system_user_id
     LEFT JOIN users user_reviewer
       ON user_reviewer.id = request.reviewed_by_user_id
     WHERE request.company_id = $1
     ORDER BY request.created_at DESC
     LIMIT $2`,
    [companyId, safeLimit],
  );

  return result.rows.map(toCompanyAccountRequestRecord);
}
