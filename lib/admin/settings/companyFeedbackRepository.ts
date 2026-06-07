import "server-only";

import { randomUUID } from "crypto";

import { queryDb } from "@/lib/db/client";

export type CompanyFeedbackType = "feature" | "bug" | "improvement";
export type CompanyFeedbackStatus = "received" | "reviewing" | "answered" | "closed";

export type CompanyFeedbackRequestRecord = {
  id: string;
  companyId: string;
  requestedByUserId: string | null;
  feedbackType: CompanyFeedbackType;
  feedbackStatus: CompanyFeedbackStatus;
  title: string;
  message: string;
  source: string;
  reviewerName: string | null;
  reviewedAt: string | null;
  responseMessage: string | null;
  createdAt: string;
};

export type CreateCompanyFeedbackRequestInput = {
  companyId: string;
  requestedByUserId: string;
  feedbackType: CompanyFeedbackType;
  title: unknown;
  message: unknown;
  source?: unknown;
};

type CompanyFeedbackRequestRow = {
  id: string;
  company_id: string;
  requested_by_user_id: string | null;
  feedback_type: CompanyFeedbackType;
  feedback_status: CompanyFeedbackStatus;
  title: string;
  message: string;
  source: string;
  reviewer_name: string | null;
  reviewed_at: Date | string | null;
  response_message: string | null;
  created_at: Date | string;
};

export const COMPANY_FEEDBACK_TYPES = ["feature", "bug", "improvement"] as const;

export function isCompanyFeedbackType(value: unknown): value is CompanyFeedbackType {
  return typeof value === "string" && COMPANY_FEEDBACK_TYPES.includes(value as CompanyFeedbackType);
}

function normalizeSingleLine(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeMultiLine(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";
}

export function validateCompanyFeedbackTitle(value: unknown): string {
  const title = normalizeSingleLine(value);
  if (title.length < 2) throw new Error("COMPANY_FEEDBACK_TITLE_TOO_SHORT");
  if (title.length > 160) throw new Error("COMPANY_FEEDBACK_TITLE_TOO_LONG");
  return title;
}

export function validateCompanyFeedbackMessage(value: unknown): string {
  const message = normalizeMultiLine(value);
  if (message.length < 10) throw new Error("COMPANY_FEEDBACK_MESSAGE_TOO_SHORT");
  if (message.length > 2000) throw new Error("COMPANY_FEEDBACK_MESSAGE_TOO_LONG");
  return message;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toRecord(row: CompanyFeedbackRequestRow): CompanyFeedbackRequestRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    requestedByUserId: row.requested_by_user_id,
    feedbackType: row.feedback_type,
    feedbackStatus: row.feedback_status,
    title: row.title,
    message: row.message,
    source: row.source,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at ? toIsoString(row.reviewed_at) : null,
    responseMessage: row.response_message,
    createdAt: toIsoString(row.created_at),
  };
}

export async function createCompanyFeedbackRequest(input: CreateCompanyFeedbackRequestInput): Promise<CompanyFeedbackRequestRecord> {
  const title = validateCompanyFeedbackTitle(input.title);
  const message = validateCompanyFeedbackMessage(input.message);
  const source = normalizeSingleLine(input.source) || "admin_settings";

  const result = await queryDb<CompanyFeedbackRequestRow>(
    `INSERT INTO company_feedback_requests (
       id,
       company_id,
       requested_by_user_id,
       feedback_type,
       feedback_status,
       title,
       message,
       source,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, 'received', $5, $6, $7, now(), now())
     RETURNING
       id,
       company_id,
       requested_by_user_id,
       feedback_type,
       feedback_status,
       title,
       message,
       source,
       NULL::text AS reviewer_name,
       NULL::timestamptz AS reviewed_at,
       NULL::text AS response_message,
       created_at`,
    [randomUUID(), input.companyId, input.requestedByUserId, input.feedbackType, title, message, source],
  );

  const row = result.rows[0];
  if (!row) throw new Error("COMPANY_FEEDBACK_CREATE_FAILED");
  return toRecord(row);
}

export async function listCompanyFeedbackRequests(companyId: string, limit = 5): Promise<CompanyFeedbackRequestRecord[]> {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.trunc(limit) : 5, 1), 20);
  const result = await queryDb<CompanyFeedbackRequestRow>(
    `SELECT
       request.id,
       request.company_id,
       request.requested_by_user_id,
       request.feedback_type,
       request.feedback_status,
       request.title,
       request.message,
       request.source,
       system_reviewer.name AS reviewer_name,
       request.reviewed_at,
       request.response_message,
       request.created_at
     FROM company_feedback_requests request
     LEFT JOIN system_users system_reviewer
       ON system_reviewer.id = request.reviewed_by_system_user_id
     WHERE request.company_id = $1
     ORDER BY request.created_at DESC
     LIMIT $2`,
    [companyId, safeLimit],
  );

  return result.rows.map(toRecord);
}
