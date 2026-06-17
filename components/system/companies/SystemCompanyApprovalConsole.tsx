"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  WaflButton,
  WaflInput,
  WaflModalCloseButton,
  WaflModalSection,
  WaflSelect,
  getWaflModalBodyClassName,
  getWaflModalFooterClassName,
  getWaflModalHeaderClassName,
  getWaflModalMaxWidthClassName,
  getWaflModalPanelClassName,
  useWaflMutation,
} from "@/components/common/ui";
import SystemCompanyFileReviewPanel from "@/components/system/companies/SystemCompanyFileReviewPanel";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_DANGER_BOX_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
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
import type { CompanyOnboardingFileMetadata } from "@/lib/admin/settings/companyTypes";
import { waflLegacyApiRequest } from "@/lib/api/waflApiClient";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import type { CompanyJoinRequestRow, CompanyManagementFilter, DeliveryMethod, SystemInvitationRow } from "@/lib/system/systemCompanyApprovalPresentation";
import {
  buildSystemCompanyReviewErrorMessage,
  countCompanyManagementFilterItems,
  formatFileSize,
  getAbsoluteInviteUrl,
  getCompanyManagementFilterDescription,
  getCompanyManagementFilterLabel,
  getCompanyOnboardingFile,
  getCompanyOnboardingFileDownloadUrl,
  getCompanyOnboardingFileKindLabel,
  getCompanyOnboardingFileStatusLabel,
  getCompanyOnboardingFileStatusTone,
  getCompanyOnboardingFileViewUrl,
  getDefaultInvitationExpiresAt,
  getLoadStatusLabel,
  getLoadStatusTone,
  isPdfOnboardingFile,
  isPreviewableImageFile,
  matchesCompanyManagementFilter,
  normalizePhoneInput,
  resolveSystemCompanyErrorMessage,
  toCompanyJoinRequestRow,
  toSystemInvitationRow,
} from "@/lib/system/systemCompanyApprovalPresentation";

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
  stage?: string | null;
  detail?: string | null;
};

type CreatedSystemInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: InvitationRecord;
};

function TruncatedText({
  value,
  fallback = "-",
  className = "",
}: {
  value: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const text = value?.trim() || fallback;
  return (
    <span className={["block min-w-0 max-w-full truncate", className].filter(Boolean).join(" ")} title={text}>
      {text}
    </span>
  );
}


function ReviewField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 rounded-2xl bg-[var(--pbp-surface)] px-3 py-2 sm:grid-cols-[7rem_1fr]">
      <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{label}</dt>
      <dd className="break-words text-sm font-medium text-[var(--pbp-text-primary)]">{value?.trim() || "-"}</dd>
    </div>
  );
}

function ReviewFileCard({ label, file }: { label: string; file: CompanyOnboardingFileMetadata | null }) {
  const viewUrl = file ? getCompanyOnboardingFileViewUrl(file) : "";
  const downloadUrl = file ? getCompanyOnboardingFileDownloadUrl(file) : "";
  const canPreviewImage = file ? isPreviewableImageFile(file) : false;
  const canOpenPdf = file ? isPdfOnboardingFile(file) : false;

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{label}</p>
            <AdminStatusBadge tone={getCompanyOnboardingFileStatusTone(file)}>
              {getCompanyOnboardingFileStatusLabel(file)}
            </AdminStatusBadge>
            {file ? (
              <AdminStatusBadge tone="neutral">{getCompanyOnboardingFileKindLabel(file)}</AdminStatusBadge>
            ) : null}
          </div>
          <p className="mt-1 break-words text-xs text-[var(--pbp-text-muted)]">
            {file ? `${file.originalName} · ${formatFileSize(file.sizeBytes)}` : "제출된 파일이 없습니다."}
          </p>
          {file ? (
            <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-faint)]">
              {canPreviewImage
                ? "이미지는 아래에서 미리보고, 필요하면 원본을 다운로드할 수 있습니다."
                : canOpenPdf
                  ? "PDF는 새 탭에서 열거나 원본을 다운로드할 수 있습니다."
                  : "미리보기를 지원하지 않는 파일입니다. 원본 다운로드로 확인해 주세요."}
            </p>
          ) : null}
        </div>
        {file ? (
          <div className="grid gap-2 sm:min-w-[8rem]">
            <AdminLinkButton href={viewUrl} target="_blank" rel="noreferrer" variant="secondary">
              {canOpenPdf ? "PDF 열기" : "열기"}
            </AdminLinkButton>
            <AdminLinkButton href={downloadUrl} target="_blank" rel="noreferrer" variant="secondary">
              다운로드
            </AdminLinkButton>
          </div>
        ) : null}
      </div>

      {file && canPreviewImage ? (
        <a href={viewUrl} target="_blank" rel="noreferrer" className="mt-3 block">
          <img
            src={viewUrl}
            alt={`${label} preview`}
            className="max-h-56 w-full rounded-2xl border border-[var(--pbp-border)] object-contain"
          />
        </a>
      ) : null}
    </div>
  );
}


export default function SystemCompanyApprovalConsole() {
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null);
  const [systemInviteExpiresInDays, setSystemInviteExpiresInDays] = useState(7);
  const [systemInvitations, setSystemInvitations] = useState<InvitationRecord[]>([]);
  const [systemInvitationLoadStatus, setSystemInvitationLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [systemInviteError, setSystemInviteError] = useState<string | null>(null);
  const [systemInviteMessage, setSystemInviteMessage] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [deliveryTarget, setDeliveryTarget] = useState("");
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<CompanyManagementFilter>("all");
  const [selectedJoinRequestId, setSelectedJoinRequestId] = useState<string | null>(null);
  const invitationMutation = useWaflMutation("system-company-invitation");
  const companyReviewMutation = useWaflMutation("system-company-review");
  const isCreatingSystemInvite = invitationMutation.isLockActive("system-company-invitation:create");
  const isReviewMutationActive = companyReviewMutation.isLocked;

  const joinRequests = useMemo(
    () => joinRequestRecords.map(toCompanyJoinRequestRow),
    [joinRequestRecords],
  );
  const systemInvitationRows = useMemo(
    () => systemInvitations.map(toSystemInvitationRow),
    [systemInvitations],
  );
  const latestCopyableInvitation = systemInvitationRows.find((invitation) => invitation.canCopy);
  const filteredJoinRequests = useMemo(
    () => joinRequests.filter((request) => matchesCompanyManagementFilter(request, activeCompanyFilter)),
    [activeCompanyFilter, joinRequests],
  );
  const selectedJoinRequest = joinRequests.find((request) => request.id === selectedJoinRequestId) ?? null;
  const canCreateSystemInvite = !isCreatingSystemInvite;
  const deliveryPlaceholder = deliveryMethod === "email" ? "예: customer@example.com" : "예: 010-1234-5678";
  const companyManagementFilters: readonly CompanyManagementFilter[] = [
    "all",
    "approval_pending",
    "approved",
    "rejected",
    "reinput_required",
    "access_limited",
  ];

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
              disabled={!invitation.canRevoke || invitationMutation.isLocked}
              variant="danger"
            >
              {invitationMutation.isLockActive(`system-company-invitation:${invitation.id}`) ? "취소 중" : "취소"}
            </AdminButton>
          </div>
        ),
      },
    ],
    [invitationMutation],
  );

  const joinRequestTableColumns = useMemo<AdminTableColumn<CompanyJoinRequestRow>[]>(
    () => [
      {
        key: "company",
        label: "회사",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={request.companyName} className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`} />
            <TruncatedText value={request.businessName} className="mt-1 text-xs text-[var(--pbp-text-muted)]" />
            <TruncatedText value={request.companyEnglishName} className="mt-1 text-xs text-[var(--pbp-text-faint)]" />
          </div>
        ),
      },
      {
        key: "status",
        label: "상태",
        render: (request) => <AdminStatusBadge tone={request.statusTone}>{request.statusLabel}</AdminStatusBadge>,
      },
      {
        key: "admin",
        label: "관리자",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={request.applicantName} className="font-semibold text-[var(--pbp-text-primary)]" />
            <TruncatedText value={request.applicantEmail} className="mt-1" />
            <TruncatedText value={request.applicantPhone} className="mt-1" />
          </div>
        ),
      },
      {
        key: "files",
        label: "첨부",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => {
          const logoFile = getCompanyOnboardingFile(request.onboardingFiles, "logo");
          const businessLicenseFile = getCompanyOnboardingFile(request.onboardingFiles, "business_license");

          return (
            <div className="grid min-w-0 gap-1">
              <TruncatedText value={`로고 ${getCompanyOnboardingFileStatusLabel(logoFile)}`} />
              <TruncatedText value={`사업자등록증 ${getCompanyOnboardingFileStatusLabel(businessLicenseFile)}`} />
            </div>
          );
        },
      },
      {
        key: "plan",
        label: "요금제",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={`신청 ${request.requestedPlanCode}`} />
            <TruncatedText value={`현재 ${request.currentPlanLabel}`} className="mt-1" />
          </div>
        ),
      },
      {
        key: "requestedAt",
        label: "신청일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => <TruncatedText value={request.requestedAtLabel} />,
      },
      {
        key: "actions",
        label: "처리",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => (
          <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:justify-center" onClick={(event) => event.stopPropagation()}>
            <AdminButton
              onClick={() => setSelectedJoinRequestId(request.id)}
              disabled={isReviewMutationActive}
              variant="secondary"
            >
              상세
            </AdminButton>
            {request.canReview ? (
              <>
                <AdminButton
                  onClick={() => void approveCompanyJoinRequest(request.id)}
                  disabled={isReviewMutationActive}
                  variant="primary"
                >
                  {companyReviewMutation.isLockActive(`system-company-review:${request.id}`) ? "승인 중" : "승인"}
                </AdminButton>
                <AdminButton
                  onClick={() => void rejectCompanyJoinRequest(request.id)}
                  disabled={isReviewMutationActive}
                  variant="danger"
                >
                  {companyReviewMutation.isLockActive(`system-company-review:${request.id}`) ? "거절 중" : "거절"}
                </AdminButton>
              </>
            ) : null}
            {request.canRequestReinput ? (
              <AdminButton
                onClick={() => void requestCompanyReinput(request.id)}
                disabled={isReviewMutationActive}
                variant="secondary"
              >
                {companyReviewMutation.isLockActive(`system-company-review:${request.id}`) ? "요청 중" : "재입력 요청"}
              </AdminButton>
            ) : null}
          </div>
        ),
      },
    ],
    [companyReviewMutation, isReviewMutationActive],
  );

  async function loadSystemInvitations() {
    setSystemInvitationLoadStatus("loading");
    setSystemInviteError(null);

    try {
      const payload = await waflLegacyApiRequest<InvitationListResponse>(
        "/api/invitations?scope=system_to_company_admin",
        { cache: "no-store" },
        "초대 링크 목록을 불러오지 못했습니다.",
      );

      if (!payload.ok) {
        throw new Error(payload.error ?? "SYSTEM_COMPANY_ADMIN_INVITATIONS_LOAD_FAILED");
      }

      setSystemInvitations(payload.invitations ?? []);
      setSystemInvitationLoadStatus("loaded");
    } catch (error) {
      setSystemInvitations([]);
      setSystemInvitationLoadStatus("failed");
      setSystemInviteError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "초대 링크 목록을 불러오지 못했습니다.",
        ),
      );
    }
  }

  async function createSystemCompanyAdminInvite() {
    if (!canCreateSystemInvite) return;

    setSystemInviteError(null);
    setSystemInviteMessage(null);

    try {
      await invitationMutation.runMutation({
        lockKey: "system-company-invitation:create",
        sequenceKey: "system-company-invitations",
        operationId: "system-company-invitation-create",
        messages: {
          loading: "초대 링크를 생성하는 중입니다.",
          success: "초대 링크를 생성했습니다.",
          error: "초대 링크 생성에 실패했습니다.",
        },
        mutation: async () => {
          const payload = await waflLegacyApiRequest<CreatedSystemInvitationResult & {
            ok?: boolean;
            error?: string;
            message?: string;
          }>(
            "/api/invitations",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                scope: "system_to_company_admin",
                recipientRole: "admin",
                permissionPreset: "company_admin",
                expiresAt: getDefaultInvitationExpiresAt(systemInviteExpiresInDays),
              }),
            },
            "초대 링크 생성에 실패했습니다.",
          );
          if (!payload.ok) {
            throw new Error(payload.message ?? payload.error ?? "SYSTEM_COMPANY_ADMIN_INVITATION_CREATE_FAILED");
          }
          return payload;
        },
        onSuccess: async () => {
          setSystemInviteMessage("초대 링크를 생성했습니다. 우측 목록에서 복사할 수 있습니다.");
          await loadSystemInvitations();
        },
        onError: (error) => setSystemInviteError(error.message),
      });
    } catch {
      // The shared mutation lifecycle already exposes the normalized error.
    }
  }

  async function copySystemInvitationLink(invitation: SystemInvitationRow) {
    if (!invitation.inviteUrlPath || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(getAbsoluteInviteUrl(invitation.inviteUrlPath));
    setSystemInviteMessage("초대 링크를 복사했습니다.");
    setSystemInviteError(null);
  }

  async function revokeSystemInvitation(invitationId: string) {
    setSystemInviteError(null);
    setSystemInviteMessage(null);

    try {
      await invitationMutation.runMutation({
        lockKey: `system-company-invitation:${invitationId}`,
        sequenceKey: "system-company-invitations",
        operationId: `system-company-invitation-revoke:${invitationId}`,
        messages: {
          loading: "초대 링크를 취소하는 중입니다.",
          success: "초대 링크를 취소했습니다.",
          error: "초대 링크 취소에 실패했습니다.",
        },
        mutation: async () => {
          const payload = await waflLegacyApiRequest<{ ok?: boolean; error?: string; message?: string }>(
            `/api/invitations/${encodeURIComponent(invitationId)}/revoke`,
            { method: "POST" },
            "초대 링크 취소에 실패했습니다.",
          );
          if (!payload.ok) {
            throw new Error(payload.message ?? payload.error ?? "SYSTEM_COMPANY_ADMIN_INVITATION_REVOKE_FAILED");
          }
          return payload;
        },
        onSuccess: async () => {
          setSystemInviteMessage("초대 링크를 취소했습니다.");
          await loadSystemInvitations();
        },
        onError: (error) => setSystemInviteError(error.message),
      });
    } catch {
      // The shared mutation lifecycle already exposes the normalized error.
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
        ? "이메일 전송 기능은 준비 중입니다. 현재는 초대 링크를 복사했습니다."
        : "문자/카카오톡 전송 기능은 준비 중입니다. 현재는 초대 링크를 복사했습니다.",
    );
  }

  async function loadCompanyJoinRequests() {
    setJoinRequestLoadStatus("loading");
    setJoinRequestLoadError(null);

    try {
      const payload = await waflLegacyApiRequest<JoinRequestListResponse>(
        "/api/invitations/join-requests?requestType=company&invitationScope=system_to_company_admin&limit=50",
        { cache: "no-store" },
        "고객사 가입 신청 목록을 불러오지 못했습니다.",
      );

      if (!payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUESTS_LOAD_FAILED");
      }

      setJoinRequestRecords(payload.joinRequests ?? []);
      setJoinRequestLoadStatus("loaded");
    } catch (error) {
      setJoinRequestRecords([]);
      setJoinRequestLoadStatus("failed");
      setJoinRequestLoadError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "고객사 가입 신청 목록을 불러오지 못했습니다.",
        ),
      );
    }
  }

  async function runCompanyReviewMutation({
    requestId,
    action,
    requestBody,
    successMessage,
    errorMessage,
  }: {
    requestId: string;
    action: "approve" | "reject" | "reopen";
    requestBody: Record<string, unknown>;
    successMessage: string;
    errorMessage: string;
  }) {
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      await companyReviewMutation.runMutation({
        lockKey: `system-company-review:${requestId}`,
        sequenceKey: `system-company-review:${requestId}`,
        operationId: `system-company-review:${action}:${requestId}`,
        messages: {
          loading: "고객사 요청을 처리하는 중입니다.",
          success: successMessage,
          error: errorMessage,
        },
        mutation: async () => {
          const payload = await waflLegacyApiRequest<CompanyJoinRequestReviewResponse>(
            `/api/system/companies/join-requests/${encodeURIComponent(requestId)}/${action}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            },
            errorMessage,
          );
          if (!payload.ok) {
            throw new Error(buildSystemCompanyReviewErrorMessage(payload, errorMessage));
          }
          return payload;
        },
        onSuccess: async () => {
          setReviewActionMessage(successMessage);
          setSelectedJoinRequestId(null);
          await Promise.all([loadCompanyJoinRequests(), loadSystemInvitations()]);
        },
        onError: (error) => setReviewActionError(error.message),
      });
    } catch {
      // The shared mutation lifecycle already exposes the normalized error.
    }
  }

  async function approveCompanyJoinRequest(requestId: string) {
    await runCompanyReviewMutation({
      requestId,
      action: "approve",
      requestBody: {},
      successMessage: "고객사 가입 신청을 승인했습니다.",
      errorMessage: "고객사 가입 신청 승인에 실패했습니다.",
    });
  }

  async function rejectCompanyJoinRequest(requestId: string) {
    await runCompanyReviewMutation({
      requestId,
      action: "reject",
      requestBody: { reasonCode: "system_admin_rejected" },
      successMessage: "고객사 가입 신청을 거절했습니다.",
      errorMessage: "고객사 가입 신청 거절에 실패했습니다.",
    });
  }

  async function requestCompanyReinput(requestId: string) {
    await runCompanyReviewMutation({
      requestId,
      action: "reopen",
      requestBody: { reasonCode: "system_admin_reinput_requested" },
      successMessage: "거절된 고객사를 재입력 요청 상태로 전환했습니다.",
      errorMessage: "고객사 재입력 요청 처리에 실패했습니다.",
    });
  }

  useEffect(() => {
    void loadCompanyJoinRequests();
    void loadSystemInvitations();
  }, []);

  return (
    <SystemShell>
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
                    <WaflSelect
                      value={deliveryMethod}
                      onValueChange={(value) => {
                        const nextMethod = value === "phone" ? "phone" : "email";
                        setDeliveryMethod(nextMethod);
                        setDeliveryTarget("");
                      }}
                      options={[
                        { value: "email", label: "이메일" },
                        { value: "phone", label: "휴대폰" },
                      ]}
                      ariaLabel="전달 방식"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">전달 대상</span>
                    <WaflInput
                      value={deliveryTarget}
                      onChange={(event) => setDeliveryTarget(
                        deliveryMethod === "phone"
                          ? normalizePhoneInput(event.target.value)
                          : event.target.value,
                      )}
                      placeholder={deliveryPlaceholder}
                      inputMode={deliveryMethod === "phone" ? "tel" : "email"}
                      fieldSize="md"
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
                    <WaflSelect
                      value={String(systemInviteExpiresInDays)}
                      onValueChange={(value) => setSystemInviteExpiresInDays(Number(value))}
                      options={[
                        { value: "1", label: "1일" },
                        { value: "3", label: "3일" },
                        { value: "7", label: "7일" },
                        { value: "14", label: "14일" },
                        { value: "30", label: "30일" },
                      ]}
                      ariaLabel="초대 만료"
                    />
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
                전송 기능이 활성화되기 전까지는 생성된 초대 링크를 복사해 전달합니다.
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


        <SystemCompanyFileReviewPanel />

        <section className={SYSTEM_CARD_CLASS}>
          <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
            <div>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>고객사 관리 목록</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
                전체 고객사의 가입 신청, 승인, 거절, 요금제 상태를 한 목록에서 확인하고 필요한 액션을 처리합니다.
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

          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                    {getCompanyManagementFilterLabel(activeCompanyFilter)}
                  </p>
                  <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">
                    {getCompanyManagementFilterDescription(activeCompanyFilter)}
                  </p>
                </div>
                <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                  표시 {filteredJoinRequests.length}건 / 전체 {joinRequests.length}건
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {companyManagementFilters.map((filter) => {
                  const isActive = activeCompanyFilter === filter;
                  const count = countCompanyManagementFilterItems(joinRequests, filter);

                  return (
                    <WaflButton
                      key={filter}
                      size="sm"
                      variant={isActive ? "primary" : "secondary"}
                      onClick={() => setActiveCompanyFilter(filter)}
                    >
                      {getCompanyManagementFilterLabel(filter)} {count}
                    </WaflButton>
                  );
                })}
              </div>
            </div>

            <AdminTable
              items={filteredJoinRequests}
              columns={joinRequestTableColumns}
              getRowKey={(request) => request.id}
              emptyLabel="현재 필터에 표시할 고객사 이력이 없습니다."
              isLoading={joinRequestLoadStatus === "loading"}
              loadingLabel="고객사 가입 신청을 불러오는 중입니다."
              gridTemplateColumns="minmax(0,1.25fr) 0.65fr minmax(0,1.2fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,0.85fr) minmax(0,1fr)"
              rowBaseClassName="grid w-full min-w-0 gap-3 px-4 py-4 text-left text-sm md:items-center"
              onRowClick={(request) => setSelectedJoinRequestId(request.id)}
            />
          </div>
        </section>

      {selectedJoinRequest ? (
        <div className="pbp-modal-overlay fixed inset-0 z-50 grid place-items-center px-4 py-6">
          <section className={[
            getWaflModalPanelClassName({ className: "flex max-h-[90vh] w-full flex-col" }),
            getWaflModalMaxWidthClassName("xl"),
          ].join(" ")}>
            <div className={getWaflModalHeaderClassName("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between")}>
              <div>
                <p className={SYSTEM_EYEBROW_CLASS}>COMPANY REVIEW</p>
                <h3 className={`mt-2 text-xl font-bold ${SYSTEM_VALUE_TEXT_CLASS}`}>{selectedJoinRequest.companyName}</h3>
                <p className="mt-1 text-sm text-[var(--pbp-text-muted)]">회사 상태, 요금제, 제출 첨부와 처리 이력을 확인합니다.</p>
              </div>
              <WaflModalCloseButton label="닫기" onClose={() => setSelectedJoinRequestId(null)} />
            </div>

            <div className={getWaflModalBodyClassName("grid gap-4 lg:grid-cols-2")}>
              <WaflModalSection title="회사 정보">
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="회사명" value={selectedJoinRequest.companyName} />
                  <ReviewField label="회사 영문명" value={selectedJoinRequest.companyEnglishName} />
                  <ReviewField label="사업자명" value={selectedJoinRequest.businessName} />
                  <ReviewField label="사업자등록번호" value={selectedJoinRequest.businessRegistrationNumber} />
                  <ReviewField label="상태" value={selectedJoinRequest.statusLabel} />
                  <ReviewField label="신청 요금제" value={selectedJoinRequest.requestedPlanCode} />
                  <ReviewField label="현재 요금제" value={selectedJoinRequest.currentPlanLabel} />
                </dl>
              </WaflModalSection>

              <WaflModalSection title="관리자 정보">
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="관리자 이름" value={selectedJoinRequest.applicantName} />
                  <ReviewField label="관리자 연락처" value={selectedJoinRequest.applicantPhone} />
                  <ReviewField label="Google 로그인 이메일" value={selectedJoinRequest.applicantEmail} />
                  <ReviewField label="신청일" value={selectedJoinRequest.requestedAtLabel} />
                  <ReviewField label="처리일" value={selectedJoinRequest.reviewedAtLabel} />
                </dl>
              </WaflModalSection>

              <WaflModalSection title="주소">
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="우편번호" value={selectedJoinRequest.postalCode} />
                  <ReviewField label="도로명주소" value={selectedJoinRequest.roadAddress} />
                  <ReviewField label="지번주소" value={selectedJoinRequest.jibunAddress} />
                  <ReviewField label="상세주소" value={selectedJoinRequest.addressDetail} />
                  <ReviewField label="참고항목" value={selectedJoinRequest.addressExtra} />
                </dl>
              </WaflModalSection>

              <WaflModalSection title="첨부 파일">
                <div className="mt-3 grid gap-3">
                  <ReviewFileCard
                    label="회사 로고"
                    file={getCompanyOnboardingFile(selectedJoinRequest.onboardingFiles, "logo")}
                  />
                  <ReviewFileCard
                    label="사업자등록증"
                    file={getCompanyOnboardingFile(selectedJoinRequest.onboardingFiles, "business_license")}
                  />
                </div>
              </WaflModalSection>
            </div>

            <div className={getWaflModalFooterClassName("flex flex-col gap-2 sm:flex-row sm:justify-end")}>
              {selectedJoinRequest.canReview ? (
                <>
                  <AdminButton
                    onClick={() => void approveCompanyJoinRequest(selectedJoinRequest.id)}
                    disabled={isReviewMutationActive}
                    variant="primary"
                  >
                    {companyReviewMutation.isLockActive(`system-company-review:${selectedJoinRequest.id}`) ? "승인 중" : "승인"}
                  </AdminButton>
                  <AdminButton
                    onClick={() => void rejectCompanyJoinRequest(selectedJoinRequest.id)}
                    disabled={isReviewMutationActive}
                    variant="danger"
                  >
                    {companyReviewMutation.isLockActive(`system-company-review:${selectedJoinRequest.id}`) ? "거절 중" : "거절"}
                  </AdminButton>
                </>
              ) : null}
              {selectedJoinRequest.canRequestReinput ? (
                <AdminButton
                  onClick={() => void requestCompanyReinput(selectedJoinRequest.id)}
                  disabled={isReviewMutationActive}
                  variant="secondary"
                >
                  {companyReviewMutation.isLockActive(`system-company-review:${selectedJoinRequest.id}`) ? "요청 중" : "재입력 요청"}
                </AdminButton>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

    </SystemShell>
  );
}
