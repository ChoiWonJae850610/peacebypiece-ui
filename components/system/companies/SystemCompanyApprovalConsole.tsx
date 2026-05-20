"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
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
import type { CompanyOnboardingFileMetadata, CompanyOnboardingFileType, CompanyOnboardingStatus, CompanySubscriptionStatus } from "@/lib/admin/settings/companyTypes";
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
  stage?: string | null;
  detail?: string | null;
};

type CreatedSystemInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: InvitationRecord;
};

type CompanyJoinRequestRow = {
  id: string;
  companyId: string | null;
  companyName: string;
  companyEnglishName: string;
  businessName: string;
  businessRegistrationNumber: string;
  postalCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  addressExtra: string;
  requestedPlanCode: string;
  currentPlanLabel: string;
  joinRequestStatus: JoinRequestRecord["status"];
  onboardingStatus: CompanyOnboardingStatus | null;
  subscriptionStatus: CompanySubscriptionStatus | null;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  canReview: boolean;
  canRequestReinput: boolean;
  reviewedAtLabel: string;
  logoUrl: string | null;
  applicantEmail: string;
  applicantName: string;
  applicantPhone: string;
  requestedAtLabel: string;
  onboardingFiles: CompanyOnboardingFileMetadata[];
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

type CompanyManagementFilter =
  | "all"
  | "approval_pending"
  | "approved"
  | "rejected"
  | "reinput_required"
  | "access_limited";

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


function isCompanyOnboardingStatus(value: string | null | undefined): value is CompanyOnboardingStatus {
  return value === "profile_required" || value === "approval_pending" || value === "active" || value === "rejected";
}

function normalizeCompanyOnboardingStatus(value: string | null | undefined): CompanyOnboardingStatus | null {
  return isCompanyOnboardingStatus(value) ? value : null;
}

function isCompanySubscriptionStatus(value: string | null | undefined): value is CompanySubscriptionStatus {
  return value === "trialing" || value === "trial_expired" || value === "active" || value === "past_due" || value === "canceled";
}

function normalizeCompanySubscriptionStatus(value: string | null | undefined): CompanySubscriptionStatus | null {
  return isCompanySubscriptionStatus(value) ? value : null;
}

function isCompanyAccessLimitedStatus(status: CompanySubscriptionStatus | null): boolean {
  return status === "trial_expired" || status === "past_due" || status === "canceled";
}

function getCompanyManagementFilterLabel(filter: CompanyManagementFilter): string {
  if (filter === "approval_pending") return "승인 대기";
  if (filter === "approved") return "승인됨";
  if (filter === "rejected") return "거절됨";
  if (filter === "reinput_required") return "재입력 필요";
  if (filter === "access_limited") return "이용제한";
  return "전체";
}

function getCompanyManagementFilterDescription(filter: CompanyManagementFilter): string {
  if (filter === "approval_pending") return "시스템관리자 검토가 필요한 고객사입니다.";
  if (filter === "approved") return "승인되어 업무 화면 접근이 가능한 고객사입니다.";
  if (filter === "rejected") return "거절 상태이며 재입력 요청으로 되돌릴 수 있는 고객사입니다.";
  if (filter === "reinput_required") return "회사 정보 재입력이 필요한 고객사입니다.";
  if (filter === "access_limited") return "체험 만료, 연체, 구독 중지 상태의 고객사입니다.";
  return "전체 고객사 가입 이력과 운영 상태입니다.";
}

function matchesCompanyManagementFilter(request: CompanyJoinRequestRow, filter: CompanyManagementFilter): boolean {
  if (filter === "all") return true;
  if (filter === "approval_pending") return request.onboardingStatus === "approval_pending" && request.joinRequestStatus === "pending";
  if (filter === "approved") return request.onboardingStatus === "active" || request.joinRequestStatus === "approved";
  if (filter === "rejected") return request.onboardingStatus === "rejected" || request.joinRequestStatus === "rejected";
  if (filter === "reinput_required") return request.onboardingStatus === "profile_required" && request.joinRequestStatus !== "approved";
  if (filter === "access_limited") return isCompanyAccessLimitedStatus(request.subscriptionStatus);
  return true;
}

function countCompanyManagementFilterItems(
  requests: readonly CompanyJoinRequestRow[],
  filter: CompanyManagementFilter,
): number {
  return requests.filter((request) => matchesCompanyManagementFilter(request, filter)).length;
}


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

function parseCompanyMemoValue(memo: string | null | undefined, key: string): string {
  if (!memo) return "";
  const lines = memo.split("\n");
  const prefix = `${key}:`;
  const matched = lines.find((line) => line.trim().startsWith(prefix));
  return matched?.slice(prefix.length).trim() ?? "";
}

function getCompanyOnboardingFile(
  files: readonly CompanyOnboardingFileMetadata[],
  fileType: CompanyOnboardingFileType,
): CompanyOnboardingFileMetadata | null {
  return files.find((file) => file.fileType === fileType && !file.deletedAt) ?? null;
}

function getCompanyOnboardingFileViewUrl(file: CompanyOnboardingFileMetadata): string {
  const params = new URLSearchParams({ companyId: file.companyId });
  return `/api/system/companies/onboarding/files/${encodeURIComponent(file.id)}/view?${params.toString()}`;
}

function getCompanyOnboardingFileDownloadUrl(file: CompanyOnboardingFileMetadata): string {
  const params = new URLSearchParams({ companyId: file.companyId, download: "1" });
  return `/api/system/companies/onboarding/files/${encodeURIComponent(file.id)}/view?${params.toString()}`;
}

function getCompanyOnboardingFileStatusLabel(file: CompanyOnboardingFileMetadata | null): string {
  return file ? "있음" : "없음";
}

function getCompanyOnboardingFileStatusTone(file: CompanyOnboardingFileMetadata | null): "success" | "neutral" {
  return file ? "success" : "neutral";
}

function isPreviewableImageFile(file: CompanyOnboardingFileMetadata): boolean {
  return file.mimeType.startsWith("image/");
}

function isPdfOnboardingFile(file: CompanyOnboardingFileMetadata): boolean {
  return file.mimeType === "application/pdf";
}

function getCompanyOnboardingFileKindLabel(file: CompanyOnboardingFileMetadata): string {
  if (isPreviewableImageFile(file)) return "이미지";
  if (isPdfOnboardingFile(file)) return "PDF";
  return "파일";
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 KB";
  const mb = sizeBytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}


function getCompanyJoinRequestStatus(joinRequest: JoinRequestRecord): {
  label: string;
  tone: CompanyJoinRequestRow["statusTone"];
  canReview: boolean;
  canRequestReinput: boolean;
} {
  if (joinRequest.status === "approved") {
    return { label: "승인됨", tone: "success", canReview: false, canRequestReinput: false };
  }

  if (joinRequest.status === "rejected" || joinRequest.companyOnboardingStatus === "rejected") {
    return { label: "거절됨", tone: "danger", canReview: false, canRequestReinput: true };
  }

  if (joinRequest.companyOnboardingStatus === "approval_pending") {
    return { label: "승인 대기", tone: "warning", canReview: true, canRequestReinput: false };
  }

  return { label: "정보 입력 중", tone: "neutral", canReview: false, canRequestReinput: false };
}

function getCompanyJoinRequestCurrentPlanLabel(joinRequest: JoinRequestRecord, requestedPlanCode: string): string {
  if (joinRequest.companySubscriptionStatus === "trialing") return "Trial";
  if (joinRequest.companySubscriptionStatus === "active") return requestedPlanCode || "이용중";
  if (joinRequest.companySubscriptionStatus === "canceled") return "중지";
  if (joinRequest.companySubscriptionStatus === "past_due") return "연체";
  if (joinRequest.companySubscriptionStatus === "trial_expired") return "체험 만료";
  return "-";
}

function toCompanyJoinRequestRow(joinRequest: JoinRequestRecord): CompanyJoinRequestRow {
  const onboardingFiles = joinRequest.companyOnboardingFiles ?? [];
  const logoFile = getCompanyOnboardingFile(onboardingFiles, "logo");
  const companyEnglishName = parseCompanyMemoValue(joinRequest.requestMemo, "companyEnglishName");
  const logoUrl = logoFile ? getCompanyOnboardingFileViewUrl(logoFile) : parseCompanyMemoValue(joinRequest.requestMemo, "logoUrl") || joinRequest.googlePictureUrl || null;

  const requestedPlanCode =
    joinRequest.companyRequestedPlanCode?.trim() ||
    parseCompanyMemoValue(joinRequest.requestMemo, "requestedPlanCode") ||
    "-";
  const onboardingStatus = normalizeCompanyOnboardingStatus(joinRequest.companyOnboardingStatus);
  const subscriptionStatus = normalizeCompanySubscriptionStatus(joinRequest.companySubscriptionStatus);
  const status = getCompanyJoinRequestStatus(joinRequest);

  return {
    id: joinRequest.id,
    companyId: joinRequest.createdCompanyId,
    companyName: joinRequest.requestedCompanyName?.trim() || "-",
    companyEnglishName: companyEnglishName || "-",
    businessName: joinRequest.businessName?.trim() || "-",
    businessRegistrationNumber: parseCompanyMemoValue(joinRequest.requestMemo, "businessRegistrationNumber") || "-",
    postalCode: parseCompanyMemoValue(joinRequest.requestMemo, "postalCode") || "-",
    roadAddress: parseCompanyMemoValue(joinRequest.requestMemo, "roadAddress") || "-",
    jibunAddress: parseCompanyMemoValue(joinRequest.requestMemo, "jibunAddress") || "-",
    addressDetail: parseCompanyMemoValue(joinRequest.requestMemo, "addressDetail") || "-",
    addressExtra: parseCompanyMemoValue(joinRequest.requestMemo, "addressExtra") || "-",
    requestedPlanCode,
    currentPlanLabel: getCompanyJoinRequestCurrentPlanLabel(joinRequest, requestedPlanCode),
    joinRequestStatus: joinRequest.status,
    onboardingStatus,
    subscriptionStatus,
    statusLabel: status.label,
    statusTone: status.tone,
    canReview: status.canReview,
    canRequestReinput: status.canRequestReinput,
    reviewedAtLabel: toCompactDateTimeLabel(joinRequest.reviewedAt),
    logoUrl,
    applicantEmail: joinRequest.applicantEmail,
    applicantName: joinRequest.applicantName?.trim() || joinRequest.applicantEmail,
    applicantPhone: joinRequest.applicantPhone?.trim() || "-",
    requestedAtLabel: toCompactDateTimeLabel(joinRequest.createdAt),
    onboardingFiles,
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


const SYSTEM_COMPANY_ERROR_MESSAGES: Record<string, string> = {
  COMPANY_JOIN_REQUESTS_LOAD_FAILED: "고객사 가입 신청 목록을 불러오지 못했습니다.",
  COMPANY_JOIN_REQUEST_APPROVE_FAILED: "고객사 가입 신청 승인에 실패했습니다.",
  COMPANY_JOIN_REQUEST_REJECT_FAILED: "고객사 가입 신청 거절에 실패했습니다.",
  COMPANY_JOIN_REQUEST_REOPEN_FAILED: "고객사 재입력 요청 처리에 실패했습니다.",
  COMPANY_JOIN_REQUEST_REOPEN_TARGET_REQUIRED: "거절된 고객사만 재입력 요청으로 전환할 수 있습니다.",
  INVITATION_SCOPE_MISMATCH: "초대 링크의 사용 범위가 고객사 관리자 가입 신청과 맞지 않습니다.",
  INVITATION_NOT_FOUND: "초대 링크 정보를 찾을 수 없습니다.",
  INVITATION_EXPIRED: "만료된 초대 링크입니다.",
  INVITATION_NOT_ACTIVE: "사용할 수 없는 초대 링크입니다.",
  INVITATION_ALREADY_CLAIMED: "이미 사용된 초대 링크입니다.",
  JOIN_REQUEST_NOT_FOUND: "가입 신청 정보를 찾을 수 없습니다.",
  JOIN_REQUEST_ALREADY_REVIEWED: "이미 처리된 가입 신청입니다. 목록을 새로고침해 주세요.",
  JOIN_REQUEST_COMPANY_ONLY: "고객사 가입 신청만 처리할 수 있습니다.",
  JOIN_REQUEST_MEMBER_ONLY: "멤버 가입 신청은 이 화면에서 처리할 수 없습니다.",
  REQUESTED_COMPANY_NAME_REQUIRED: "회사명이 입력되지 않았습니다.",
  COMPANY_ALREADY_EXISTS: "이미 같은 이름의 고객사가 있습니다.",
  COMPANY_APPROVAL_TARGET_NOT_FOUND: "승인 대상 고객사 정보를 찾을 수 없습니다.",
  COMPANY_ONBOARDING_FILE_VIEW_NOT_CONFIGURED: "온보딩 첨부 확인용 R2 Worker 설정이 필요합니다.",
  COMPANY_ONBOARDING_FILE_NOT_FOUND: "온보딩 첨부 파일을 찾을 수 없습니다.",
  COMPANY_ONBOARDING_FILE_COMPANY_MISMATCH: "다른 고객사의 온보딩 첨부 파일은 확인할 수 없습니다.",
  COMPANY_ONBOARDING_FILE_INVALID_STORAGE_KEY: "온보딩 첨부 파일의 저장 경로가 올바르지 않습니다.",
  COMPANY_ONBOARDING_FILE_VIEW_FAILED: "온보딩 첨부 파일 열기에 실패했습니다.",
  MEMBER_USER_CREATE_FAILED: "고객사 관리자 사용자 계정 생성에 실패했습니다.",
  COMPANY_MEMBER_CREATE_FAILED: "고객사 관리자 멤버십 생성에 실패했습니다.",
  MEMBER_PERMISSION_REQUIRED: "고객사 관리자에게 부여할 권한이 없습니다.",
  SYSTEM_ADMIN_SESSION_REQUIRED: "시스템관리자 로그인이 필요합니다.",
  POSTGRES_PARAMETER_TYPE_ERROR: "승인 처리 중 DB 파라미터 타입 오류가 발생했습니다. 아래 단계 정보를 확인해 주세요.",
  "could not determine data type of parameter $2": "승인 처리 중 DB 파라미터 타입 오류가 발생했습니다. 아래 단계 정보를 확인해 주세요.",
};

function resolveSystemCompanyErrorMessage(errorCode: string | null | undefined, fallback: string): string {
  const normalized = errorCode?.trim();
  if (!normalized) return fallback;
  return SYSTEM_COMPANY_ERROR_MESSAGES[normalized] ?? fallback;
}

function buildSystemCompanyReviewErrorMessage(payload: CompanyJoinRequestReviewResponse, fallback: string): string {
  const baseMessage = resolveSystemCompanyErrorMessage(payload.error, fallback);
  const stage = payload.stage?.trim();
  const detail = payload.detail?.trim();
  const extra = [stage ? `단계: ${stage}` : null, detail ? `상세: ${detail}` : null].filter(Boolean).join(" / ");
  return extra ? `${baseMessage} (${extra})` : baseMessage;
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

  if (invitation.status === "active") {
    return { label: "사용 가능", tone: "success", canCopy: true, canRevoke: true };
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
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [reopeningRequestId, setReopeningRequestId] = useState<string | null>(null);
  const [systemInviteExpiresInDays, setSystemInviteExpiresInDays] = useState(7);
  const [systemInvitations, setSystemInvitations] = useState<InvitationRecord[]>([]);
  const [systemInvitationLoadStatus, setSystemInvitationLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [systemInviteError, setSystemInviteError] = useState<string | null>(null);
  const [systemInviteMessage, setSystemInviteMessage] = useState<string | null>(null);
  const [isCreatingSystemInvite, setIsCreatingSystemInvite] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [deliveryTarget, setDeliveryTarget] = useState("");
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<CompanyManagementFilter>("all");
  const [selectedJoinRequestId, setSelectedJoinRequestId] = useState<string | null>(null);

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
              disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
              variant="secondary"
            >
              상세
            </AdminButton>
            {request.canReview ? (
              <>
                <AdminButton
                  onClick={() => void approveCompanyJoinRequest(request.id)}
                  disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                  variant="primary"
                >
                  {approvingRequestId === request.id ? "승인 중" : "승인"}
                </AdminButton>
                <AdminButton
                  onClick={() => void rejectCompanyJoinRequest(request.id)}
                  disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                  variant="danger"
                >
                  {rejectingRequestId === request.id ? "거절 중" : "거절"}
                </AdminButton>
              </>
            ) : null}
            {request.canRequestReinput ? (
              <AdminButton
                onClick={() => void requestCompanyReinput(request.id)}
                disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                variant="secondary"
              >
                {reopeningRequestId === request.id ? "요청 중" : "재입력 요청"}
              </AdminButton>
            ) : null}
          </div>
        ),
      },
    ],
    [approvingRequestId, rejectingRequestId, reopeningRequestId],
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
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "초대 링크 생성에 실패했습니다.",
        ),
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
      setSystemInviteError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "초대 링크 취소에 실패했습니다.",
        ),
      );
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
        "/api/invitations/join-requests?requestType=company&invitationScope=system_to_company_admin&limit=50",
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
      setJoinRequestLoadError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "고객사 가입 신청 목록을 불러오지 못했습니다.",
        ),
      );
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
        throw new Error(buildSystemCompanyReviewErrorMessage(payload, "고객사 가입 신청 승인에 실패했습니다."));
      }

      setReviewActionMessage("고객사 가입 신청을 승인했습니다.");
      setSelectedJoinRequestId(null);
      await loadCompanyJoinRequests();
      await loadSystemInvitations();
    } catch (error) {
      setReviewActionError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "고객사 가입 신청 승인에 실패했습니다.",
        ),
      );
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
        throw new Error(buildSystemCompanyReviewErrorMessage(payload, "고객사 가입 신청 거절에 실패했습니다."));
      }

      setReviewActionMessage("고객사 가입 신청을 거절했습니다.");
      setSelectedJoinRequestId(null);
      await loadCompanyJoinRequests();
      await loadSystemInvitations();
    } catch (error) {
      setReviewActionError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "고객사 가입 신청 거절에 실패했습니다.",
        ),
      );
    } finally {
      setRejectingRequestId(null);
    }
  }


  async function requestCompanyReinput(requestId: string) {
    setReopeningRequestId(requestId);
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      const response = await fetch(`/api/system/companies/join-requests/${encodeURIComponent(requestId)}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCode: "system_admin_reinput_requested" }),
      });
      const payload = (await response.json()) as CompanyJoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(buildSystemCompanyReviewErrorMessage(payload, "고객사 재입력 요청 처리에 실패했습니다."));
      }

      setReviewActionMessage("거절된 고객사를 재입력 요청 상태로 전환했습니다.");
      setSelectedJoinRequestId(null);
      await loadCompanyJoinRequests();
      await loadSystemInvitations();
    } catch (error) {
      setReviewActionError(
        resolveSystemCompanyErrorMessage(
          error instanceof Error ? error.message : null,
          "고객사 재입력 요청 처리에 실패했습니다.",
        ),
      );
    } finally {
      setReopeningRequestId(null);
    }
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
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveCompanyFilter(filter)}
                      className={[
                        "rounded-full border px-3 py-2 text-xs font-semibold transition",
                        isActive
                          ? "border-[var(--pbp-accent)] bg-[var(--pbp-accent-soft)] text-[var(--pbp-accent)]"
                          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] hover:border-[var(--pbp-accent)]",
                      ].join(" ")}
                    >
                      {getCompanyManagementFilterLabel(filter)} {count}
                    </button>
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
      </div>

      {selectedJoinRequest ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6">
          <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={SYSTEM_EYEBROW_CLASS}>COMPANY REVIEW</p>
                <h3 className={`mt-2 text-xl font-bold ${SYSTEM_VALUE_TEXT_CLASS}`}>{selectedJoinRequest.companyName}</h3>
                <p className="mt-1 text-sm text-[var(--pbp-text-muted)]">회사 상태, 요금제, 제출 첨부와 처리 이력을 확인합니다.</p>
              </div>
              <AdminButton onClick={() => setSelectedJoinRequestId(null)} variant="secondary">닫기</AdminButton>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <article className={SYSTEM_MUTED_CARD_CLASS}>
                <h4 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>회사 정보</h4>
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="회사명" value={selectedJoinRequest.companyName} />
                  <ReviewField label="회사 영문명" value={selectedJoinRequest.companyEnglishName} />
                  <ReviewField label="사업자명" value={selectedJoinRequest.businessName} />
                  <ReviewField label="사업자등록번호" value={selectedJoinRequest.businessRegistrationNumber} />
                  <ReviewField label="상태" value={selectedJoinRequest.statusLabel} />
                  <ReviewField label="신청 요금제" value={selectedJoinRequest.requestedPlanCode} />
                  <ReviewField label="현재 요금제" value={selectedJoinRequest.currentPlanLabel} />
                </dl>
              </article>

              <article className={SYSTEM_MUTED_CARD_CLASS}>
                <h4 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>관리자 정보</h4>
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="관리자 이름" value={selectedJoinRequest.applicantName} />
                  <ReviewField label="관리자 연락처" value={selectedJoinRequest.applicantPhone} />
                  <ReviewField label="Google 로그인 이메일" value={selectedJoinRequest.applicantEmail} />
                  <ReviewField label="신청일" value={selectedJoinRequest.requestedAtLabel} />
                  <ReviewField label="처리일" value={selectedJoinRequest.reviewedAtLabel} />
                </dl>
              </article>

              <article className={SYSTEM_MUTED_CARD_CLASS}>
                <h4 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>주소</h4>
                <dl className="mt-3 grid gap-2 text-sm">
                  <ReviewField label="우편번호" value={selectedJoinRequest.postalCode} />
                  <ReviewField label="도로명주소" value={selectedJoinRequest.roadAddress} />
                  <ReviewField label="지번주소" value={selectedJoinRequest.jibunAddress} />
                  <ReviewField label="상세주소" value={selectedJoinRequest.addressDetail} />
                  <ReviewField label="참고항목" value={selectedJoinRequest.addressExtra} />
                </dl>
              </article>

              <article className={SYSTEM_MUTED_CARD_CLASS}>
                <h4 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>첨부 파일</h4>
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
              </article>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-[var(--pbp-border)] pt-4 sm:flex-row sm:justify-end">
              {selectedJoinRequest.canReview ? (
                <>
                  <AdminButton
                    onClick={() => void approveCompanyJoinRequest(selectedJoinRequest.id)}
                    disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                    variant="primary"
                  >
                    {approvingRequestId === selectedJoinRequest.id ? "승인 중" : "승인"}
                  </AdminButton>
                  <AdminButton
                    onClick={() => void rejectCompanyJoinRequest(selectedJoinRequest.id)}
                    disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                    variant="danger"
                  >
                    {rejectingRequestId === selectedJoinRequest.id ? "거절 중" : "거절"}
                  </AdminButton>
                </>
              ) : null}
              {selectedJoinRequest.canRequestReinput ? (
                <AdminButton
                  onClick={() => void requestCompanyReinput(selectedJoinRequest.id)}
                  disabled={approvingRequestId !== null || rejectingRequestId !== null || reopeningRequestId !== null}
                  variant="secondary"
                >
                  {reopeningRequestId === selectedJoinRequest.id ? "요청 중" : "재입력 요청"}
                </AdminButton>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

    </SystemShell>
  );
}
