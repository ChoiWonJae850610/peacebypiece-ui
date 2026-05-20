"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  PENDING_APPROVAL_DEFAULT_DESCRIPTION,
  PENDING_APPROVAL_DEFAULT_TITLE,
  PENDING_APPROVAL_EMPTY_MESSAGE,
  PENDING_APPROVAL_ERROR_MESSAGE,
  PENDING_APPROVAL_REFRESH_LABEL,
  buildPendingApprovalLookupFoundMessage,
  getPendingApprovalRequestTypeLabel,
  getPendingApprovalStatusGuidance,
  getPendingApprovalStatusLabel,
  getPendingApprovalStatusPanelClassName,
  getPendingApprovalStatusTone,
  type PendingApprovalJoinRequestView,
} from "@/lib/invitations/pendingApprovalDashboardPresentation";

interface PendingApprovalDashboardProps {
  initialRequestId?: string | null;
  initialApplicantEmail?: string | null;
  initialRequestType?: "member" | "company" | null;
}

type LookupState = "idle" | "loading" | "found" | "empty" | "error";

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function normalizeType(value: string | null | undefined): "member" | "company" | null {
  return value === "member" || value === "company" ? value : null;
}

function toJoinRequestView(value: unknown): PendingApprovalJoinRequestView | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PendingApprovalJoinRequestView>;
  const requestType = normalizeType(item.requestType);
  const status = item.status;
  if (!item.id || !item.applicantEmail || !requestType) return null;
  if (status !== "pending" && status !== "approved" && status !== "rejected" && status !== "cancelled") return null;

  return {
    id: item.id,
    applicantEmail: item.applicantEmail,
    applicantName: item.applicantName ?? null,
    requestType,
    requestedCompanyName: item.requestedCompanyName ?? null,
    status,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? null,
    reviewedAt: item.reviewedAt ?? null,
    rejectionReason: item.rejectionReason ?? null,
    requestMemo: item.requestMemo ?? null,
  };
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PendingApprovalDashboard({
  initialRequestId = null,
  initialApplicantEmail = null,
  initialRequestType = null,
}: PendingApprovalDashboardProps) {
  const [lookupState, setLookupState] = useState<LookupState>(
    initialRequestId || initialApplicantEmail ? "loading" : "idle",
  );
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [joinRequest, setJoinRequest] = useState<PendingApprovalJoinRequestView | null>(null);

  const statusGuidance = useMemo(
    () => (joinRequest ? getPendingApprovalStatusGuidance(joinRequest.status, joinRequest.requestType) : null),
    [joinRequest],
  );

  async function lookupJoinRequest() {
    const params = new URLSearchParams();
    const nextRequestId = initialRequestId?.trim() ?? "";
    const nextApplicantEmail = initialApplicantEmail?.trim() ?? "";
    const nextRequestType = initialRequestType ?? "";

    if (nextRequestId) params.set("requestId", nextRequestId);
    if (nextApplicantEmail) params.set("applicantEmail", nextApplicantEmail);
    if (nextRequestType) params.set("type", nextRequestType);
    params.set("limit", "1");

    if (!params.has("requestId") && !params.has("applicantEmail")) {
      setLookupState("idle");
      setLookupMessage(PENDING_APPROVAL_EMPTY_MESSAGE);
      setJoinRequest(null);
      return;
    }

    setLookupState("loading");
    setLookupMessage(null);

    try {
      const response = await fetch(`/api/invitations/join-requests?${params.toString()}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        primaryJoinRequest?: unknown;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "JOIN_REQUEST_LOOKUP_FAILED");
      }

      const nextJoinRequest = toJoinRequestView(payload.primaryJoinRequest);
      if (!nextJoinRequest) {
        setLookupState("empty");
        setJoinRequest(null);
        setLookupMessage(PENDING_APPROVAL_EMPTY_MESSAGE);
        return;
      }

      setLookupState("found");
      setJoinRequest(nextJoinRequest);
      setLookupMessage(buildPendingApprovalLookupFoundMessage(nextJoinRequest.status));
    } catch {
      setLookupState("error");
      setJoinRequest(null);
      setLookupMessage(PENDING_APPROVAL_ERROR_MESSAGE);
    }
  }

  useEffect(() => {
    if (!initialRequestId && !initialApplicantEmail) return;
    lookupJoinRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRequestId, initialApplicantEmail, initialRequestType]);

  const statusLabel = joinRequest ? getPendingApprovalStatusLabel(joinRequest.status) : getPendingApprovalStatusLabel("pending");
  const requestTypeLabel = joinRequest ? getPendingApprovalRequestTypeLabel(joinRequest.requestType) : null;
  const panelClassName = joinRequest
    ? getPendingApprovalStatusPanelClassName(joinRequest.status)
    : "border-[var(--pbp-status-info-border)] bg-[var(--pbp-status-info-bg)]";
  const statusTone = joinRequest ? getPendingApprovalStatusTone(joinRequest.status) : getPendingApprovalStatusTone("pending");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--pbp-bg-app)] px-4 py-6 text-[var(--pbp-text-primary)] md:px-6 md:py-10">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_94%,transparent)] px-5 py-5 shadow-[var(--pbp-shadow-modal-a-type)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="rounded-full bg-[var(--pbp-brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-inverse)]">
                WAFL
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">
                {statusGuidance?.title ?? PENDING_APPROVAL_DEFAULT_TITLE}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                {statusGuidance?.description ?? PENDING_APPROVAL_DEFAULT_DESCRIPTION}
              </p>
            </div>
            <form action="/api/auth/logout" method="post" className="shrink-0">
              <button
                type="submit"
                title="로그아웃"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 text-xs font-bold text-[var(--pbp-text-primary)] shadow-sm transition hover:bg-[var(--pbp-surface-soft)]"
              >
                <LogoutIcon />
                로그아웃
              </button>
            </form>
          </div>
        </header>

        <section className={`rounded-[var(--pbp-radius-modal)] border p-5 shadow-[var(--pbp-shadow-card-a-type)] ${panelClassName}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone}`}>
                {statusLabel}
              </span>
              <h2 className="mt-4 text-xl font-black tracking-[-0.03em] text-[var(--pbp-text-primary)]">
                {joinRequest ? "신청 내용을 확인했습니다" : "관리자 확인을 기다리고 있습니다"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                {statusGuidance?.nextAction ?? "승인이 완료되면 사용할 수 있는 화면으로 이동할 수 있습니다. 승인이 지연되면 회사 관리자에게 문의하세요."}
              </p>
            </div>
            <button
              type="button"
              onClick={lookupJoinRequest}
              disabled={lookupState === "loading"}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] px-4 py-2 text-xs font-bold text-[var(--pbp-text-inverse)] transition hover:bg-[var(--pbp-brand-soft)] disabled:border-[var(--pbp-border-soft)] disabled:bg-[var(--pbp-surface-soft)] disabled:text-[var(--pbp-text-disabled)]"
            >
              {lookupState === "loading" ? "확인 중" : PENDING_APPROVAL_REFRESH_LABEL}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_70%,transparent)] p-4">
              <p className="text-xs font-bold text-[var(--pbp-text-muted)]">신청 유형</p>
              <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-primary)]">{requestTypeLabel ?? "확인 중"}</p>
            </div>
            <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_70%,transparent)] p-4">
              <p className="text-xs font-bold text-[var(--pbp-text-muted)]">신청자</p>
              <p className="mt-2 truncate text-sm font-semibold text-[var(--pbp-text-primary)]">
                {joinRequest?.applicantName || joinRequest?.applicantEmail || initialApplicantEmail || "확인 중"}
              </p>
            </div>
          </div>

          {joinRequest ? (
            <div className="mt-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_70%,transparent)] p-4 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">
              <span>접수일: {formatCreatedAt(joinRequest.createdAt)}</span>
              {joinRequest.requestedCompanyName ? (
                <>
                  <span className="mx-2 text-[var(--pbp-border-strong)]">·</span>
                  <span>{joinRequest.requestedCompanyName}</span>
                </>
              ) : null}
              {joinRequest.reviewedAt ? (
                <>
                  <span className="mx-2 text-[var(--pbp-border-strong)]">·</span>
                  <span>검토일: {formatCreatedAt(joinRequest.reviewedAt)}</span>
                </>
              ) : null}
            </div>
          ) : null}

          {lookupMessage ? (
            <p className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">{lookupMessage}</p>
          ) : null}
        </section>

        {statusGuidance?.primaryAction ? (
          <Link
            href={statusGuidance.primaryAction.href}
            title={statusGuidance.primaryAction.description}
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] px-5 py-3 text-sm font-bold text-[var(--pbp-text-inverse)] transition hover:bg-[var(--pbp-brand-soft)]"
          >
            {statusGuidance.primaryAction.label}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
