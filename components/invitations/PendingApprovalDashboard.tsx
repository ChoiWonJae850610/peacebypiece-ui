"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import {
  PENDING_APPROVAL_ACCESS_ITEMS,
  PENDING_APPROVAL_DASHBOARD_DESCRIPTION,
  PENDING_APPROVAL_DASHBOARD_TITLE,
  PENDING_APPROVAL_LOOKUP_DESCRIPTION,
  PENDING_APPROVAL_LOOKUP_EMPTY_MESSAGE,
  PENDING_APPROVAL_LOOKUP_FALLBACK_MESSAGE,
  PENDING_APPROVAL_LOOKUP_IDLE_MESSAGE,
  PENDING_APPROVAL_LOOKUP_TITLE,
  PENDING_APPROVAL_POLICY_NOTES,
  PENDING_APPROVAL_STEPS,
  buildPendingApprovalLookupFoundMessage,
  buildPendingApprovalSummaryItems,
  getPendingApprovalAccessTone,
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

function HomeIcon() {
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
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

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
  const [requestId, setRequestId] = useState(initialRequestId ?? "");
  const [applicantEmail, setApplicantEmail] = useState(initialApplicantEmail ?? "");
  const [requestType, setRequestType] = useState<"member" | "company" | "">(initialRequestType ?? "");
  const [lookupState, setLookupState] = useState<LookupState>(initialRequestId || initialApplicantEmail ? "loading" : "idle");
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [joinRequest, setJoinRequest] = useState<PendingApprovalJoinRequestView | null>(null);

  const summaryItems = useMemo(() => buildPendingApprovalSummaryItems(joinRequest), [joinRequest]);
  const statusGuidance = useMemo(
    () => joinRequest ? getPendingApprovalStatusGuidance(joinRequest.status, joinRequest.requestType) : null,
    [joinRequest],
  );

  async function lookupJoinRequest(nextRequestId = requestId, nextApplicantEmail = applicantEmail, nextRequestType = requestType) {
    const params = new URLSearchParams();
    if (nextRequestId.trim()) params.set("requestId", nextRequestId.trim());
    if (nextApplicantEmail.trim()) params.set("applicantEmail", nextApplicantEmail.trim());
    if (nextRequestType) params.set("type", nextRequestType);
    params.set("limit", "1");

    if (!params.has("requestId") && !params.has("applicantEmail")) {
      setLookupState("idle");
      setLookupMessage(PENDING_APPROVAL_LOOKUP_IDLE_MESSAGE);
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
        setLookupMessage(PENDING_APPROVAL_LOOKUP_EMPTY_MESSAGE);
        return;
      }

      setLookupState("found");
      setJoinRequest(nextJoinRequest);
      setLookupMessage(buildPendingApprovalLookupFoundMessage(nextJoinRequest.status));
    } catch (error) {
      setLookupState("error");
      setJoinRequest(null);
      setLookupMessage(error instanceof Error ? error.message : "가입 신청 상태 조회 중 오류가 발생했습니다.");
    }
  }

  useEffect(() => {
    if (!initialRequestId && !initialApplicantEmail) return;
    lookupJoinRequest(initialRequestId ?? "", initialApplicantEmail ?? "", initialRequestType ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRequestId, initialApplicantEmail, initialRequestType]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--pbp-bg-app)] px-4 py-5 text-[var(--pbp-text-primary)] md:px-6 md:py-8">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_94%,transparent)] px-5 py-5 shadow-[var(--pbp-shadow-modal-a-type)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--pbp-brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-inverse)]">
                  WAFL
                </span>
                <span className="rounded-full border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
                  v{APP_VERSION}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">
                {PENDING_APPROVAL_DASHBOARD_TITLE}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                {PENDING_APPROVAL_DASHBOARD_DESCRIPTION}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/workspace"
                aria-label="승인 후 메인화면"
                title="승인 후 메인화면"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] text-[var(--pbp-text-primary)] shadow-sm transition hover:bg-[var(--pbp-surface-soft)]"
              >
                <HomeIcon />
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  title="로그아웃"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] text-[var(--pbp-text-primary)] shadow-sm transition hover:bg-[var(--pbp-surface-soft)]"
                >
                  <span className="sr-only">로그아웃</span>
                  <LogoutIcon />
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_92%,transparent)] p-5 shadow-[var(--pbp-shadow-card-a-type)] backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-[var(--pbp-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--pbp-text-primary)]">{PENDING_APPROVAL_LOOKUP_TITLE}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                {PENDING_APPROVAL_LOOKUP_DESCRIPTION}
              </p>
            </div>
            {joinRequest ? (
              <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getPendingApprovalStatusTone(joinRequest.status)}`}>
                {getPendingApprovalStatusLabel(joinRequest.status)}
              </span>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
            <label className="block">
              <span className="text-xs font-bold text-[var(--pbp-text-muted)]">requestId</span>
              <input
                value={requestId}
                onChange={(event) => setRequestId(event.target.value)}
                placeholder="join_requests.id"
                className="mt-2 w-full rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-3 py-2 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-soft)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--pbp-brand-muted)_55%,transparent)]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[var(--pbp-text-muted)]">신청 이메일</span>
              <input
                type="email"
                value={applicantEmail}
                onChange={(event) => setApplicantEmail(event.target.value)}
                placeholder="applicant@example.com"
                className="mt-2 w-full rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-3 py-2 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-soft)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--pbp-brand-muted)_55%,transparent)]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[var(--pbp-text-muted)]">신청 유형</span>
              <select
                value={requestType}
                onChange={(event) => setRequestType(normalizeType(event.target.value) ?? "")}
                className="mt-2 w-full rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-3 py-2 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-soft)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--pbp-brand-muted)_55%,transparent)]"
              >
                <option value="">전체</option>
                <option value="member">멤버</option>
                <option value="company">고객사</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => lookupJoinRequest()}
              disabled={lookupState === "loading"}
              className="self-end rounded-full border border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] px-4 py-2 text-xs font-bold text-[var(--pbp-text-inverse)] transition hover:bg-[var(--pbp-brand-soft)] disabled:border-[var(--pbp-border-soft)] disabled:bg-[var(--pbp-surface-soft)] disabled:text-[var(--pbp-text-disabled)]"
            >
              {lookupState === "loading" ? "조회 중" : "상태 조회"}
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
            {lookupMessage ?? PENDING_APPROVAL_LOOKUP_FALLBACK_MESSAGE}
          </p>
          {joinRequest ? (
            <div className="mt-4 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">
              <strong className="text-[var(--pbp-text-primary)]">{joinRequest.applicantName || joinRequest.applicantEmail}</strong>
              <span className="mx-2 text-[var(--pbp-border-strong)]">·</span>
              {getPendingApprovalRequestTypeLabel(joinRequest.requestType)}
              <span className="mx-2 text-[var(--pbp-border-strong)]">·</span>
              접수 {formatCreatedAt(joinRequest.createdAt)}
              {joinRequest.reviewedAt ? (
                <>
                  <span className="mx-2 text-[var(--pbp-border-strong)]">·</span>
                  검토 {formatCreatedAt(joinRequest.reviewedAt)}
                </>
              ) : null}
              {joinRequest.requestMemo ? <p className="mt-2 text-[var(--pbp-text-muted)]">메모: {joinRequest.requestMemo}</p> : null}
              {joinRequest.rejectionReason ? <p className="mt-1 text-[var(--pbp-text-muted)]">거절 코드: {joinRequest.rejectionReason}</p> : null}
            </div>
          ) : null}
        </section>

        {joinRequest && statusGuidance ? (
          <section className={`rounded-[28px] border p-5 shadow-sm ${getPendingApprovalStatusPanelClassName(joinRequest.status)}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getPendingApprovalStatusTone(joinRequest.status)}`}>
                  {getPendingApprovalStatusLabel(joinRequest.status)}
                </span>
                <h2 className="mt-4 text-lg font-black tracking-[-0.02em] text-[var(--pbp-text-primary)]">{statusGuidance.title}</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">{statusGuidance.description}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{statusGuidance.nextAction}</p>
              </div>
              {statusGuidance.primaryAction ? (
                <Link
                  href={statusGuidance.primaryAction.href}
                  title={statusGuidance.primaryAction.description}
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] px-4 py-2 text-xs font-bold text-[var(--pbp-text-inverse)] transition hover:bg-[var(--pbp-brand-soft)]"
                >
                  {statusGuidance.primaryAction.label}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_92%,transparent)] p-5 shadow-[var(--pbp-shadow-card-a-type)] backdrop-blur"
            >
              <p className="text-xs font-bold text-[var(--pbp-text-muted)]">{item.label}</p>
              <p className="mt-2 truncate text-xl font-semibold text-[var(--pbp-text-primary)]">{item.value}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_92%,transparent)] p-5 shadow-[var(--pbp-shadow-card-a-type)] backdrop-blur">
          <div className="border-b border-[var(--pbp-border-soft)] pb-4">
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--pbp-text-primary)]">승인 전 접근 범위</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
              승인 전 사용자는 신청 상태 확인과 개인 설정 정도만 접근할 수 있고, 고객사 업무 데이터는 차단합니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PENDING_APPROVAL_ACCESS_ITEMS.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">{item.title}</h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPendingApprovalAccessTone(item.status)}`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_92%,transparent)] p-5 shadow-[var(--pbp-shadow-card-a-type)] backdrop-blur">
          <div className="border-b border-[var(--pbp-border-soft)] pb-4">
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--pbp-text-primary)]">승인 처리 흐름</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
              가입 신청 접수 후 고객관리자가 승인하고 권한을 확정하기까지의 기준입니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {PENDING_APPROVAL_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pbp-brand-primary)] text-xs font-bold text-[var(--pbp-text-inverse)]">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-[var(--pbp-text-primary)]">{step.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          {PENDING_APPROVAL_POLICY_NOTES.map((note) => (
            <article
              key={note.id}
              className="rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[color-mix(in_srgb,var(--pbp-surface-base)_92%,transparent)] p-5 shadow-[var(--pbp-shadow-card-a-type)] backdrop-blur"
            >
              <h2 className="text-sm font-semibold text-[var(--pbp-text-primary)]">{note.title}</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">{note.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
