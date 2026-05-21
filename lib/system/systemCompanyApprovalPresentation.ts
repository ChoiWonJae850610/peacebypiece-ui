import type {
  CompanyOnboardingFileMetadata,
  CompanyOnboardingFileType,
  CompanyOnboardingStatus,
  CompanySubscriptionStatus,
} from "@/lib/admin/settings/companyTypes";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import { formatPbpBinaryBytes } from "@/lib/utils/formatters";
import {
  COMPANY_ONBOARDING_STATUS,
  COMPANY_SUBSCRIPTION_STATUS,
  JOIN_REQUEST_STATUS,
  INVITATION_STATUS,
  isCompanyAccessLimitedStatus,
  normalizeCompanyOnboardingStatus,
  normalizeCompanySubscriptionStatusOrNull,
} from "@/lib/domain/companyStatus";

export type CompanyJoinRequestRow = {
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

export type SystemInvitationRow = {
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

export type DeliveryMethod = "email" | "phone";


export type CompanyJoinRequestReviewPayload = {
  ok?: boolean;
  error?: string;
  stage?: string | null;
  detail?: string | null;
};

export type CompanyManagementFilter =
  | "all"
  | "approval_pending"
  | "approved"
  | "rejected"
  | "reinput_required"
  | "access_limited";

export function getAbsoluteInviteUrl(inviteUrl: string): string {
  if (typeof window === "undefined") return inviteUrl;
  return new URL(inviteUrl, window.location.origin).toString();
}

export function getDefaultInvitationExpiresAt(days: number): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export function toCompactDateTimeLabel(value: string | null | undefined): string {
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



export function getCompanyManagementFilterLabel(filter: CompanyManagementFilter): string {
  if (filter === COMPANY_ONBOARDING_STATUS.approvalPending) return "승인 대기";
  if (filter === "approved") return "승인됨";
  if (filter === COMPANY_ONBOARDING_STATUS.rejected) return "거절됨";
  if (filter === "reinput_required") return "재입력 필요";
  if (filter === "access_limited") return "이용제한";
  return "전체";
}

export function getCompanyManagementFilterDescription(filter: CompanyManagementFilter): string {
  if (filter === COMPANY_ONBOARDING_STATUS.approvalPending) return "시스템관리자 검토가 필요한 고객사입니다.";
  if (filter === "approved") return "승인되어 업무 화면 접근이 가능한 고객사입니다.";
  if (filter === COMPANY_ONBOARDING_STATUS.rejected) return "거절 상태이며 재입력 요청으로 되돌릴 수 있는 고객사입니다.";
  if (filter === "reinput_required") return "회사 정보 재입력이 필요한 고객사입니다.";
  if (filter === "access_limited") return "체험 만료, 연체, 구독 중지 상태의 고객사입니다.";
  return "전체 고객사 가입 이력과 운영 상태입니다.";
}

export function matchesCompanyManagementFilter(request: CompanyJoinRequestRow, filter: CompanyManagementFilter): boolean {
  if (filter === "all") return true;
  if (filter === COMPANY_ONBOARDING_STATUS.approvalPending) return request.onboardingStatus === COMPANY_ONBOARDING_STATUS.approvalPending && request.joinRequestStatus === JOIN_REQUEST_STATUS.pending;
  if (filter === "approved") return request.onboardingStatus === COMPANY_ONBOARDING_STATUS.active || request.joinRequestStatus === JOIN_REQUEST_STATUS.approved;
  if (filter === COMPANY_ONBOARDING_STATUS.rejected) return request.onboardingStatus === COMPANY_ONBOARDING_STATUS.rejected || request.joinRequestStatus === JOIN_REQUEST_STATUS.rejected;
  if (filter === "reinput_required") return request.onboardingStatus === COMPANY_ONBOARDING_STATUS.profileRequired && request.joinRequestStatus !== JOIN_REQUEST_STATUS.approved;
  if (filter === "access_limited") return isCompanyAccessLimitedStatus(request.subscriptionStatus);
  return true;
}

export function countCompanyManagementFilterItems(
  requests: readonly CompanyJoinRequestRow[],
  filter: CompanyManagementFilter,
): number {
  return requests.filter((request) => matchesCompanyManagementFilter(request, filter)).length;
}


export function parseCompanyMemoValue(memo: string | null | undefined, key: string): string {
  if (!memo) return "";
  const lines = memo.split("\n");
  const prefix = `${key}:`;
  const matched = lines.find((line) => line.trim().startsWith(prefix));
  return matched?.slice(prefix.length).trim() ?? "";
}

export function getCompanyOnboardingFile(
  files: readonly CompanyOnboardingFileMetadata[],
  fileType: CompanyOnboardingFileType,
): CompanyOnboardingFileMetadata | null {
  return files.find((file) => file.fileType === fileType && !file.deletedAt) ?? null;
}

export function getCompanyOnboardingFileViewUrl(file: CompanyOnboardingFileMetadata): string {
  const params = new URLSearchParams({ companyId: file.companyId });
  return `/api/system/companies/onboarding/files/${encodeURIComponent(file.id)}/view?${params.toString()}`;
}

export function getCompanyOnboardingFileDownloadUrl(file: CompanyOnboardingFileMetadata): string {
  const params = new URLSearchParams({ companyId: file.companyId, download: "1" });
  return `/api/system/companies/onboarding/files/${encodeURIComponent(file.id)}/view?${params.toString()}`;
}

export function getCompanyOnboardingFileStatusLabel(file: CompanyOnboardingFileMetadata | null): string {
  return file ? "있음" : "없음";
}

export function getCompanyOnboardingFileStatusTone(file: CompanyOnboardingFileMetadata | null): "success" | "neutral" {
  return file ? "success" : "neutral";
}

export function isPreviewableImageFile(file: CompanyOnboardingFileMetadata): boolean {
  return file.mimeType.startsWith("image/");
}

export function isPdfOnboardingFile(file: CompanyOnboardingFileMetadata): boolean {
  return file.mimeType === "application/pdf";
}

export function getCompanyOnboardingFileKindLabel(file: CompanyOnboardingFileMetadata): string {
  if (isPreviewableImageFile(file)) return "이미지";
  if (isPdfOnboardingFile(file)) return "PDF";
  return "파일";
}

export function formatFileSize(sizeBytes: number): string {
  return formatPbpBinaryBytes(sizeBytes, {
    zeroLabel: "0 KB",
    mbFractionDigits: sizeBytes >= 10 * 1024 * 1024 ? 0 : 1,
    kbFractionDigits: 0,
  }).replace(/(GB|MB|KB|B)$/, " $1");
}


export function getCompanyJoinRequestStatus(joinRequest: JoinRequestRecord): {
  label: string;
  tone: CompanyJoinRequestRow["statusTone"];
  canReview: boolean;
  canRequestReinput: boolean;
} {
  if (joinRequest.status === JOIN_REQUEST_STATUS.approved) {
    return { label: "승인됨", tone: "success", canReview: false, canRequestReinput: false };
  }

  if (joinRequest.status === JOIN_REQUEST_STATUS.rejected || joinRequest.companyOnboardingStatus === COMPANY_ONBOARDING_STATUS.rejected) {
    return { label: "거절됨", tone: "danger", canReview: false, canRequestReinput: true };
  }

  if (joinRequest.companyOnboardingStatus === COMPANY_ONBOARDING_STATUS.approvalPending) {
    return { label: "승인 대기", tone: "warning", canReview: true, canRequestReinput: false };
  }

  return { label: "정보 입력 중", tone: "neutral", canReview: false, canRequestReinput: false };
}

export function getCompanyJoinRequestCurrentPlanLabel(joinRequest: JoinRequestRecord, requestedPlanCode: string): string {
  if (joinRequest.companySubscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.trialing) return "Trial";
  if (joinRequest.companySubscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.active) return requestedPlanCode || "이용중";
  if (joinRequest.companySubscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.canceled) return "중지";
  if (joinRequest.companySubscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.pastDue) return "연체";
  if (joinRequest.companySubscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.trialExpired) return "체험 만료";
  return "-";
}

export function toCompanyJoinRequestRow(joinRequest: JoinRequestRecord): CompanyJoinRequestRow {
  const onboardingFiles = joinRequest.companyOnboardingFiles ?? [];
  const logoFile = getCompanyOnboardingFile(onboardingFiles, "logo");
  const companyEnglishName = parseCompanyMemoValue(joinRequest.requestMemo, "companyEnglishName");
  const logoUrl = logoFile ? getCompanyOnboardingFileViewUrl(logoFile) : parseCompanyMemoValue(joinRequest.requestMemo, "logoUrl") || joinRequest.googlePictureUrl || null;

  const requestedPlanCode =
    joinRequest.companyRequestedPlanCode?.trim() ||
    parseCompanyMemoValue(joinRequest.requestMemo, "requestedPlanCode") ||
    "-";
  const onboardingStatus = normalizeCompanyOnboardingStatus(joinRequest.companyOnboardingStatus);
  const subscriptionStatus = normalizeCompanySubscriptionStatusOrNull(joinRequest.companySubscriptionStatus);
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

export function getLoadStatusTone(status: "idle" | "loading" | "loaded" | "failed") {
  if (status === "loaded") return "success";
  if (status === "loading") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

export function getLoadStatusLabel(status: "idle" | "loading" | "loaded" | "failed") {
  if (status === "loaded") return "조회 완료";
  if (status === "loading") return "불러오는 중";
  if (status === "failed") return "조회 실패";
  return "대기";
}


export const SYSTEM_COMPANY_ERROR_MESSAGES: Record<string, string> = {
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
  POSTGRES_PARAMETER_TYPE_ERROR: "승인 처리 중 오류가 발생했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.",
  "could not determine data type of parameter $2": "승인 처리 중 오류가 발생했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.",
};

export function resolveSystemCompanyErrorMessage(errorCode: string | null | undefined, fallback: string): string {
  const normalized = errorCode?.trim();
  if (!normalized) return fallback;
  return SYSTEM_COMPANY_ERROR_MESSAGES[normalized] ?? fallback;
}

export function buildSystemCompanyReviewErrorMessage(payload: CompanyJoinRequestReviewPayload, fallback: string): string {
  const baseMessage = resolveSystemCompanyErrorMessage(payload.error, fallback);
  const stage = payload.stage?.trim();
  const detail = payload.detail?.trim();
  const extra = [stage ? `단계: ${stage}` : null, detail ? `상세: ${detail}` : null].filter(Boolean).join(" / ");
  return extra ? `${baseMessage} (${extra})` : baseMessage;
}

export function normalizePhoneInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 13);
}

export function getInvitationState(invitation: InvitationRecord): {
  label: string;
  tone: SystemInvitationRow["statusTone"];
  canCopy: boolean;
  canRevoke: boolean;
} {
  const expiresAtTime = new Date(invitation.expiresAt).getTime();
  const isExpired = Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();

  if (invitation.status === INVITATION_STATUS.revoked) {
    return { label: "취소됨", tone: "neutral", canCopy: false, canRevoke: false };
  }

  if (isExpired) {
    return { label: "만료됨", tone: "danger", canCopy: false, canRevoke: false };
  }

  if (invitation.status === INVITATION_STATUS.accepted) {
    return { label: "사용됨", tone: "warning", canCopy: true, canRevoke: false };
  }

  if (invitation.status === INVITATION_STATUS.active) {
    return { label: "사용 가능", tone: "success", canCopy: true, canRevoke: true };
  }

  return { label: "사용 가능", tone: "success", canCopy: true, canRevoke: true };
}

export function toSystemInvitationRow(invitation: InvitationRecord): SystemInvitationRow {
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


