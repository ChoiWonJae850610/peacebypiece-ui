"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_DANGER_BOX_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_PAGE_CLASS,
  SYSTEM_PAGE_WIDE_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_SUCCESS_BOX_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { APP_VERSION } from "@/lib/constants/app";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";

type JoinRequestListResponse = {
  ok?: boolean;
  joinRequests?: JoinRequestRecord[];
  error?: string;
};

type CompanyJoinRequestReviewResponse = {
  ok?: boolean;
  error?: string;
};

type CreatedSystemInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: {
    id: string;
    expiresAt: string;
  };
};

type CompanyJoinRequestRow = {
  id: string;
  companyName: string;
  companyEnglishName: string;
  businessName: string;
  logoUrl: string | null;
  applicantEmail: string;
  applicantName: string;
  applicantPhone: string;
  requestedAtLabel: string;
};

function getAbsoluteInviteUrl(inviteUrl: string): string {
  if (typeof window === "undefined") return inviteUrl;
  return new URL(inviteUrl, window.location.origin).toString();
}

function getDefaultInvitationExpiresAt(days: number): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function toCompactDateTimeLabel(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseCompanyMemoValue(memo: string | null | undefined, key: string): string {
  if (!memo) return "";
  const lines = memo.split("\n");
  const prefix = `${key}:`;
  const matched = lines.find((line) => line.trim().startsWith(prefix));
  return matched?.slice(prefix.length).trim() ?? "";
}

function toCompanyJoinRequestRow(joinRequest: JoinRequestRecord): CompanyJoinRequestRow {
  const companyEnglishName = parseCompanyMemoValue(joinRequest.requestMemo, "companyEnglishName");
  const logoUrl = parseCompanyMemoValue(joinRequest.requestMemo, "logoUrl") || joinRequest.googlePictureUrl || null;

  return {
    id: joinRequest.id,
    companyName: joinRequest.requestedCompanyName?.trim() || "-",
    companyEnglishName: companyEnglishName || "-",
    businessName: joinRequest.businessName?.trim() || "-",
    logoUrl,
    applicantEmail: joinRequest.applicantEmail,
    applicantName: joinRequest.applicantName?.trim() || joinRequest.applicantEmail,
    applicantPhone: joinRequest.applicantPhone?.trim() || "-",
    requestedAtLabel: toCompactDateTimeLabel(joinRequest.createdAt),
  };
}

function getLoadStatusTone(status: "idle" | "loading" | "loaded" | "failed") {
  if (status === "loaded") return "success";
  if (status === "loading") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function getLoadStatusLabel(status: "idle" | "loading" | "loaded" | "failed") {
  if (status === "loaded") return "조회 완료";
  if (status === "loading") return "불러오는 중";
  if (status === "failed") return "조회 실패";
  return "대기";
}

export default function SystemCompanyApprovalConsole() {
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [systemInviteRecipientEmail, setSystemInviteRecipientEmail] = useState("");
  const [systemInviteExpiresInDays, setSystemInviteExpiresInDays] = useState(7);
  const [createdSystemInvite, setCreatedSystemInvite] = useState<CreatedSystemInvitationResult | null>(null);
  const [systemInviteError, setSystemInviteError] = useState<string | null>(null);
  const [isCreatingSystemInvite, setIsCreatingSystemInvite] = useState(false);

  const joinRequests = useMemo(
    () => joinRequestRecords.map(toCompanyJoinRequestRow),
    [joinRequestRecords],
  );
  const canCreateSystemInvite = systemInviteRecipientEmail.trim().length > 0 && !isCreatingSystemInvite;

  const joinRequestTableColumns = useMemo<AdminTableColumn<CompanyJoinRequestRow>[]>(
    () => [
      {
        key: "company",
        label: "회사명",
        render: (request) => (
          <div>
            <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{request.companyName}</p>
            <p className="mt-1 text-xs text-[var(--pbp-text-muted)]">{request.businessName}</p>
          </div>
        ),
      },
      {
        key: "englishName",
        label: "영문명",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => request.companyEnglishName,
      },
      {
        key: "logo",
        label: "사진",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => request.logoUrl ? (
          <img
            src={request.logoUrl}
            alt="회사 또는 신청자 이미지"
            className="mx-auto h-10 w-10 rounded-2xl border border-[var(--pbp-border)] object-cover"
          />
        ) : (
          <span className="text-xs text-[var(--pbp-text-faint)]">-</span>
        ),
      },
      {
        key: "email",
        label: "이메일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => request.applicantEmail,
      },
      {
        key: "name",
        label: "이름",
        className: "text-sm font-medium text-[var(--pbp-text-primary)]",
        render: (request) => request.applicantName,
      },
      {
        key: "phone",
        label: "연락처",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => request.applicantPhone,
      },
      {
        key: "requestedAt",
        label: "신청일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => request.requestedAtLabel,
      },
      {
        key: "actions",
        label: "처리",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => (
          <div className="grid gap-2 sm:flex sm:justify-center">
            <AdminButton
              onClick={() => void approveCompanyJoinRequest(request.id)}
              disabled={approvingRequestId !== null || rejectingRequestId !== null}
              variant="primary"
            >
              {approvingRequestId === request.id ? "승인 중" : "승인"}
            </AdminButton>
            <AdminButton
              onClick={() => void rejectCompanyJoinRequest(request.id)}
              disabled={approvingRequestId !== null || rejectingRequestId !== null}
              variant="danger"
            >
              {rejectingRequestId === request.id ? "거절 중" : "거절"}
            </AdminButton>
          </div>
        ),
      },
    ],
    [approvingRequestId, rejectingRequestId],
  );

  async function createSystemCompanyAdminInvite() {
    if (!canCreateSystemInvite) return;

    setIsCreatingSystemInvite(true);
    setSystemInviteError(null);
    setCreatedSystemInvite(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "system_to_company_admin",
          recipientEmail: systemInviteRecipientEmail.trim(),
          recipientRole: "admin",
          permissionPreset: "company_admin",
          expiresAt: getDefaultInvitationExpiresAt(systemInviteExpiresInDays),
        }),
      });
      const payload = (await response.json()) as CreatedSystemInvitationResult & {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "SYSTEM_COMPANY_ADMIN_INVITATION_CREATE_FAILED");
      }

      setCreatedSystemInvite({
        inviteUrl: payload.inviteUrl,
        rawToken: payload.rawToken,
        invitation: payload.invitation,
      });
    } catch (error) {
      setSystemInviteError(
        error instanceof Error ? error.message : "SYSTEM_COMPANY_ADMIN_INVITATION_CREATE_FAILED",
      );
    } finally {
      setIsCreatingSystemInvite(false);
    }
  }

  async function copyCreatedSystemInviteLink() {
    if (!createdSystemInvite?.inviteUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(getAbsoluteInviteUrl(createdSystemInvite.inviteUrl));
  }

  async function loadCompanyJoinRequests() {
    setJoinRequestLoadStatus("loading");
    setJoinRequestLoadError(null);

    try {
      const response = await fetch(
        "/api/invitations/join-requests?requestType=company&status=pending&invitationScope=system_to_company_admin&limit=50",
        { cache: "no-store" },
      );
      const payload = (await response.json()) as JoinRequestListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUESTS_LOAD_FAILED");
      }

      setJoinRequestRecords(payload.joinRequests ?? []);
      setJoinRequestLoadStatus("loaded");
    } catch (error) {
      setJoinRequestRecords([]);
      setJoinRequestLoadStatus("failed");
      setJoinRequestLoadError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUESTS_LOAD_FAILED");
    }
  }

  async function approveCompanyJoinRequest(requestId: string) {
    setApprovingRequestId(requestId);
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      const response = await fetch(`/api/system/companies/join-requests/${encodeURIComponent(requestId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as CompanyJoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUEST_APPROVE_FAILED");
      }

      setReviewActionMessage("고객사 가입 신청을 승인했습니다.");
      await loadCompanyJoinRequests();
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUEST_APPROVE_FAILED");
    } finally {
      setApprovingRequestId(null);
    }
  }

  async function rejectCompanyJoinRequest(requestId: string) {
    setRejectingRequestId(requestId);
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      const response = await fetch(`/api/system/companies/join-requests/${encodeURIComponent(requestId)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCode: "system_admin_rejected" }),
      });
      const payload = (await response.json()) as CompanyJoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUEST_REJECT_FAILED");
      }

      setReviewActionMessage("고객사 가입 신청을 거절했습니다.");
      await loadCompanyJoinRequests();
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUEST_REJECT_FAILED");
    } finally {
      setRejectingRequestId(null);
    }
  }

  useEffect(() => {
    void loadCompanyJoinRequests();
  }, []);

  return (
    <main className={SYSTEM_PAGE_CLASS}>
      <div className={SYSTEM_PAGE_WIDE_CLASS}>
        <header className={SYSTEM_HEADER_PANEL_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM COMPANY MANAGEMENT</p>
              <div className="space-y-2">
                <h1 className={SYSTEM_TITLE_CLASS}>고객사 관리</h1>
                <p className={SYSTEM_SUBTITLE_CLASS}>
                  고객사 관리자 초대 링크를 만들고, 초대 링크로 들어온 고객사 가입 신청을 검토합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs font-medium sm:flex-row sm:flex-wrap">
              <AdminStatusBadge tone="neutral">v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
            </div>
          </div>
        </header>

        <section className={SYSTEM_CARD_CLASS}>
          <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
            <div>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>고객사 관리자 초대</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
                초대 대상과 만료일만 정합니다. 회사명, 주소, 로고, 신청 요금제는 고객사 관리자가 첫 로그인 후 직접 입력합니다.
              </p>
            </div>
            <AdminStatusBadge tone="success">고객사관리 통합</AdminStatusBadge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <article className={SYSTEM_MUTED_CARD_CLASS}>
              <div className="grid gap-4 md:grid-cols-[0.8fr_1.3fr_0.7fr]">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">초대 방식</span>
                  <select
                    className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)]"
                    defaultValue="email"
                    disabled
                  >
                    <option value="email">이메일</option>
                    <option value="phone">휴대폰 문자 준비 중</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">초대 이메일</span>
                  <input
                    value={systemInviteRecipientEmail}
                    onChange={(event) => setSystemInviteRecipientEmail(event.target.value)}
                    placeholder="customer-admin@example.com"
                    type="email"
                    className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)] outline-none focus:border-[var(--pbp-accent)]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">초대 만료</span>
                  <select
                    value={systemInviteExpiresInDays}
                    onChange={(event) => setSystemInviteExpiresInDays(Number(event.target.value))}
                    className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)]"
                  >
                    <option value={3}>3일</option>
                    <option value={7}>7일</option>
                    <option value={14}>14일</option>
                  </select>
                </label>
              </div>

              {systemInviteError ? (
                <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{systemInviteError}</div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className={SYSTEM_SMALL_TEXT_CLASS}>
                  생성된 링크는 고객사 관리자 후보에게 직접 전달합니다. 자동 이메일/SMS 발송은 후속 연결입니다.
                </p>
                <AdminButton
                  onClick={() => void createSystemCompanyAdminInvite()}
                  disabled={!canCreateSystemInvite}
                  variant="primary"
                >
                  {isCreatingSystemInvite ? "초대 생성 중" : "초대 링크 생성"}
                </AdminButton>
              </div>
            </article>

            <article className={SYSTEM_MUTED_CARD_CLASS}>
              <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>초대 결과</h3>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>초대 링크는 생성 직후 한 번 확인하고 복사합니다.</p>
              {createdSystemInvite ? (
                <div className="mt-4 space-y-3">
                  <div className="break-all rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-xs font-medium text-[var(--pbp-text-primary)]">
                    {getAbsoluteInviteUrl(createdSystemInvite.inviteUrl)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton onClick={() => void copyCreatedSystemInviteLink()}>링크 복사</AdminButton>
                    <AdminLinkButton href={createdSystemInvite.inviteUrl}>가입 화면 열기</AdminLinkButton>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-[var(--pbp-border)] px-4 py-6 text-sm text-[var(--pbp-text-muted)]">
                  초대 링크를 생성하면 이 영역에 실제 가입 링크가 표시됩니다.
                </p>
              )}
            </article>
          </div>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
            <div>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>가입 신청 검토</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
                고객사 관리자가 초대 링크로 로그인한 뒤 회사 정보를 입력하면 이 목록에 승인 대기로 표시됩니다.
              </p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <AdminStatusBadge tone={getLoadStatusTone(joinRequestLoadStatus)}>
                {getLoadStatusLabel(joinRequestLoadStatus)}
              </AdminStatusBadge>
              <AdminButton onClick={() => void loadCompanyJoinRequests()}>새로고침</AdminButton>
            </div>
          </div>

          {joinRequestLoadError ? <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{joinRequestLoadError}</div> : null}
          {reviewActionError ? <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{reviewActionError}</div> : null}
          {reviewActionMessage ? <div className={`mt-4 ${SYSTEM_SUCCESS_BOX_CLASS}`}>{reviewActionMessage}</div> : null}

          <div className="mt-5">
            <AdminTable
              items={[...joinRequests]}
              columns={joinRequestTableColumns}
              getRowKey={(request) => request.id}
              emptyLabel="승인 대기 고객사 가입 신청이 없습니다."
              isLoading={joinRequestLoadStatus === "loading"}
              loadingLabel="고객사 가입 신청을 불러오는 중입니다."
              gridTemplateColumns="1.2fr 0.8fr 0.5fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr"
              rowBaseClassName="grid min-w-[980px] w-full gap-3 px-4 py-4 text-left text-sm md:items-center"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
