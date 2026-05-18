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
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";

type JoinRequestListResponse = {
  ok?: boolean;
  joinRequests?: JoinRequestRecord[];
  error?: string;
};

type InvitationListResponse = {
  ok?: boolean;
  invitations?: InvitationRecord[];
  error?: string;
};

type CompanyJoinRequestReviewResponse = {
  ok?: boolean;
  error?: string;
};

type CreatedSystemInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: InvitationRecord;
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

type SystemInvitationRow = {
  id: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  inviteUrlLabel: string;
  inviteUrlPath: string | null;
  expiresAtLabel: string;
  createdAtLabel: string;
  canCopy: boolean;
  canRevoke: boolean;
};

type DeliveryMethod = "email" | "phone";

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

function normalizePhoneInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 13);
}

function getInvitationState(invitation: InvitationRecord): {
  label: string;
  tone: SystemInvitationRow["statusTone"];
  canCopy: boolean;
  canRevoke: boolean;
} {
  const expiresAtTime = new Date(invitation.expiresAt).getTime();
  const isExpired = Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();

  if (invitation.status === "revoked") {
    return { label: "취소됨", tone: "neutral", canCopy: false, canRevoke: false };
  }

  if (isExpired) {
    return { label: "만료됨", tone: "danger", canCopy: false, canRevoke: false };
  }

  if (invitation.status === "accepted") {
    return { label: "사용됨", tone: "warning", canCopy: true, canRevoke: false };
  }

  return { label: "사용 가능", tone: "success", canCopy: true, canRevoke: true };
}

function toSystemInvitationRow(invitation: InvitationRecord): SystemInvitationRow {
  const state = getInvitationState(invitation);
  const inviteUrlPath = invitation.inviteUrlPath?.trim() || null;

  return {
    id: invitation.id,
    statusLabel: state.label,
    statusTone: state.tone,
    inviteUrlLabel: inviteUrlPath ? getAbsoluteInviteUrl(inviteUrlPath) : "이전 초대 링크",
    inviteUrlPath,
    expiresAtLabel: toCompactDateTimeLabel(invitation.expiresAt),
    createdAtLabel: toCompactDateTimeLabel(invitation.createdAt),
    canCopy: state.canCopy && Boolean(inviteUrlPath),
    canRevoke: state.canRevoke,
  };
}

export default function SystemCompanyApprovalConsole() {
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [systemInviteExpiresInDays, setSystemInviteExpiresInDays] = useState(7);
  const [systemInvitations, setSystemInvitations] = useState<InvitationRecord[]>([]);
  const [systemInvitationLoadStatus, setSystemInvitationLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [systemInviteError, setSystemInviteError] = useState<string | null>(null);
  const [systemInviteMessage, setSystemInviteMessage] = useState<string | null>(null);
  const [isCreatingSystemInvite, setIsCreatingSystemInvite] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [deliveryTarget, setDeliveryTarget] = useState("");

  const joinRequests = useMemo(
    () => joinRequestRecords.map(toCompanyJoinRequestRow),
    [joinRequestRecords],
  );
  const systemInvitationRows = useMemo(
    () => systemInvitations.map(toSystemInvitationRow),
    [systemInvitations],
  );
  const latestCopyableInvitation = systemInvitationRows.find((invitation) => invitation.canCopy);
  const canCreateSystemInvite = !isCreatingSystemInvite;
  const deliveryPlaceholder = deliveryMethod === "email" ? "예: customer@example.com" : "예: 010-1234-5678";

  const systemInvitationTableColumns = useMemo<AdminTableColumn<SystemInvitationRow>[]>(
    () => [
      {
        key: "status",
        label: "상태",
        render: (invitation) => <AdminStatusBadge tone={invitation.statusTone}>{invitation.statusLabel}</AdminStatusBadge>,
      },
      {
        key: "link",
        label: "초대 링크",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (invitation) => (
          <span className="block max-w-[18rem] truncate" title={invitation.inviteUrlLabel}>
            {invitation.inviteUrlLabel}
          </span>
        ),
      },
      {
        key: "expiresAt",
        label: "만료일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (invitation) => invitation.expiresAtLabel,
      },
      {
        key: "createdAt",
        label: "생성일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (invitation) => invitation.createdAtLabel,
      },
      {
        key: "actions",
        label: "작업",
        headerClassName: "text-center",
        className: "text-center",
        render: (invitation) => (
          <div className="grid gap-2 sm:flex sm:justify-center">
            <AdminButton
              onClick={() => void copySystemInvitationLink(invitation)}
              disabled={!invitation.canCopy}
              variant="secondary"
            >
              복사
            </AdminButton>
            <AdminButton
              onClick={() => void revokeSystemInvitation(invitation.id)}
              disabled={!invitation.canRevoke || revokingInvitationId !== null}
              variant="danger"
            >
              {revokingInvitationId === invitation.id ? "취소 중" : "취소"}
            </AdminButton>
          </div>
        ),
      },
    ],
    [revokingInvitationId],
  );

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

  async function loadSystemInvitations() {
    setSystemInvitationLoadStatus("loading");

    try {
      const response = await fetch("/api/invitations?scope=system_to_company_admin", { cache: "no-store" });
      const payload = (await response.json()) as InvitationListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "SYSTEM_COMPANY_ADMIN_INVITATIONS_LOAD_FAILED");
      }

      setSystemInvitations(payload.invitations ?? []);
      setSystemInvitationLoadStatus("loaded");
    } catch (error) {
      setSystemInvitations([]);
      setSystemInvitationLoadStatus("failed");
      setSystemInviteError(error instanceof Error ? error.message : "SYSTEM_COMPANY_ADMIN_INVITATIONS_LOAD_FAILED");
    }
  }

  async function createSystemCompanyAdminInvite() {
    if (!canCreateSystemInvite) return;

    setIsCreatingSystemInvite(true);
    setSystemInviteError(null);
    setSystemInviteMessage(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "system_to_company_admin",
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

      setSystemInviteMessage("초대 링크를 생성했습니다. 우측 목록에서 복사할 수 있습니다.");
      await loadSystemInvitations();
    } catch (error) {
      setSystemInviteError(
        error instanceof Error ? error.message : "SYSTEM_COMPANY_ADMIN_INVITATION_CREATE_FAILED",
      );
    } finally {
      setIsCreatingSystemInvite(false);
    }
  }

  async function copySystemInvitationLink(invitation: SystemInvitationRow) {
    if (!invitation.inviteUrlPath || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(getAbsoluteInviteUrl(invitation.inviteUrlPath));
    setSystemInviteMessage("초대 링크를 복사했습니다.");
    setSystemInviteError(null);
  }

  async function revokeSystemInvitation(invitationId: string) {
    setRevokingInvitationId(invitationId);
    setSystemInviteError(null);
    setSystemInviteMessage(null);

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/revoke`, {
        method: "POST",
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? payload.error ?? "SYSTEM_COMPANY_ADMIN_INVITATION_REVOKE_FAILED");
      }

      setSystemInviteMessage("초대 링크를 취소했습니다.");
      await loadSystemInvitations();
    } catch (error) {
      setSystemInviteError(error instanceof Error ? error.message : "SYSTEM_COMPANY_ADMIN_INVITATION_REVOKE_FAILED");
    } finally {
      setRevokingInvitationId(null);
    }
  }

  async function handleDeliveryButton() {
    setSystemInviteError(null);
    setSystemInviteMessage(null);

    if (!deliveryTarget.trim()) {
      setSystemInviteError(deliveryMethod === "email" ? "이메일을 입력해 주세요." : "휴대폰 번호를 입력해 주세요.");
      return;
    }

    if (!latestCopyableInvitation) {
      setSystemInviteError("먼저 초대 링크를 생성해 주세요.");
      return;
    }

    await copySystemInvitationLink(latestCopyableInvitation);
    setSystemInviteMessage(
      deliveryMethod === "email"
        ? "실제 이메일 발송은 다음 단계에서 연결합니다. 현재는 최신 초대 링크를 복사했습니다."
        : "실제 문자/카톡 발송은 다음 단계에서 연결합니다. 현재는 최신 초대 링크를 복사했습니다.",
    );
  }

  async function loadCompanyJoinRequests() {
    setJoinRequestLoadStatus("loading");
    setJoinRequestLoadError(null);

    try {
      const response = await fetch(
        "/api/invitations/join-requests?requestType=company&status=pending&invitationScope=system_to_company_admin&companyOnboardingStatus=approval_pending&limit=50",
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
      await loadSystemInvitations();
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
      await loadSystemInvitations();
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUEST_REJECT_FAILED");
    } finally {
      setRejectingRequestId(null);
    }
  }

  useEffect(() => {
    void loadCompanyJoinRequests();
    void loadSystemInvitations();
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
                초대 링크는 독립적으로 생성하고, 이메일과 휴대폰은 링크 전달 수단으로만 사용합니다.
              </p>
            </div>
            <AdminStatusBadge tone={getLoadStatusTone(systemInvitationLoadStatus)}>
              {getLoadStatusLabel(systemInvitationLoadStatus)}
            </AdminStatusBadge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <article className={SYSTEM_MUTED_CARD_CLASS}>
              <div className="grid gap-3">
                <div className="grid gap-3 xl:grid-cols-[0.36fr_1fr_auto]">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">전달 방식</span>
                    <select
                      value={deliveryMethod}
                      onChange={(event) => {
                        const nextMethod = event.target.value === "phone" ? "phone" : "email";
                        setDeliveryMethod(nextMethod);
                        setDeliveryTarget("");
                      }}
                      className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)]"
                    >
                      <option value="email">이메일</option>
                      <option value="phone">휴대폰</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">전달 대상</span>
                    <input
                      value={deliveryTarget}
                      onChange={(event) => setDeliveryTarget(
                        deliveryMethod === "phone"
                          ? normalizePhoneInput(event.target.value)
                          : event.target.value,
                      )}
                      placeholder={deliveryPlaceholder}
                      inputMode={deliveryMethod === "phone" ? "tel" : "email"}
                      className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)] placeholder:text-[var(--pbp-text-faint)]"
                    />
                  </label>
                  <div className="flex items-end">
                    <AdminButton
                      onClick={() => void handleDeliveryButton()}
                      className="w-full"
                      variant="secondary"
                    >
                      발송
                    </AdminButton>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[var(--pbp-border)] pt-3 xl:grid-cols-[1fr_auto]">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">초대 만료</span>
                    <select
                      value={systemInviteExpiresInDays}
                      onChange={(event) => setSystemInviteExpiresInDays(Number(event.target.value))}
                      className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm text-[var(--pbp-text-primary)]"
                    >
                      <option value={1}>1일</option>
                      <option value={3}>3일</option>
                      <option value={7}>7일</option>
                      <option value={14}>14일</option>
                      <option value={30}>30일</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <AdminButton
                      onClick={() => void createSystemCompanyAdminInvite()}
                      disabled={!canCreateSystemInvite}
                      variant="primary"
                      className="w-full"
                    >
                      {isCreatingSystemInvite ? "생성 중" : "링크 생성"}
                    </AdminButton>
                  </div>
                </div>
              </div>

              {systemInviteError ? (
                <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{systemInviteError}</div>
              ) : null}
              {systemInviteMessage ? (
                <div className={`mt-4 ${SYSTEM_SUCCESS_BOX_CLASS}`}>{systemInviteMessage}</div>
              ) : null}

              <p className={`mt-4 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                발송 버튼은 현재 최신 사용 가능 링크를 복사하는 준비 단계입니다. 실제 이메일/SMS 발송은 후속 기능에서 연결합니다.
              </p>
            </article>

            <article className={SYSTEM_MUTED_CARD_CLASS}>
              <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>초대 링크 목록</h3>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>사용 가능, 사용됨, 만료됨, 취소됨 상태를 확인하고 링크를 복사하거나 취소합니다.</p>
              <div className="mt-4">
                <AdminTable
                  items={systemInvitationRows}
                  columns={systemInvitationTableColumns}
                  getRowKey={(invitation) => invitation.id}
                  emptyLabel="생성된 고객사 관리자 초대 링크가 없습니다."
                  isLoading={systemInvitationLoadStatus === "loading"}
                  loadingLabel="초대 링크 목록을 불러오는 중입니다."
                  gridTemplateColumns="0.7fr 1.2fr 0.8fr 0.8fr 1fr"
                  rowBaseClassName="grid min-w-[760px] w-full gap-3 px-4 py-4 text-left text-sm md:items-center"
                />
              </div>
            </article>
          </div>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
            <div>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>가입 신청 검토</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
                고객사 관리자가 초대 링크로 로그인한 뒤 회사 정보를 입력하고 승인 요청을 눌러야 이 목록에 표시됩니다.
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
