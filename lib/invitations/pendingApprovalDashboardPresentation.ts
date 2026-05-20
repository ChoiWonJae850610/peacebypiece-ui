export type PendingApprovalRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type PendingApprovalRequestType = "member" | "company";

export interface PendingApprovalJoinRequestView {
  id: string;
  applicantEmail: string;
  applicantName: string | null;
  requestType: PendingApprovalRequestType;
  requestedCompanyName: string | null;
  status: PendingApprovalRequestStatus;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  requestMemo: string | null;
}

export interface PendingApprovalStatusAction {
  href: string;
  label: string;
  description: string;
}

export interface PendingApprovalStatusGuidance {
  title: string;
  description: string;
  nextAction: string;
  primaryAction: PendingApprovalStatusAction | null;
}

export const PENDING_APPROVAL_DEFAULT_TITLE = "가입 신청이 접수되었습니다";

export const PENDING_APPROVAL_DEFAULT_DESCRIPTION =
  "관리자가 신청 내용을 확인하고 있습니다. 승인이 완료되면 업무 화면을 사용할 수 있습니다.";

export const PENDING_APPROVAL_REFRESH_LABEL = "상태 새로고침";

export const PENDING_APPROVAL_EMPTY_MESSAGE =
  "가입 신청 상태를 아직 확인하지 못했습니다. 초대 링크로 다시 접속했거나 승인이 지연되는 경우 회사 관리자에게 문의하세요.";

export const PENDING_APPROVAL_ERROR_MESSAGE =
  "가입 신청 상태를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도하거나 회사 관리자에게 문의하세요.";

export function buildPendingApprovalLookupFoundMessage(status: PendingApprovalRequestStatus): string {
  return `${getPendingApprovalStatusLabel(status)} 상태입니다.`;
}

export function getPendingApprovalRequestTypeLabel(type: PendingApprovalRequestType): string {
  return type === "company" ? "고객사 관리자 신청" : "멤버 신청";
}

export function getPendingApprovalStatusLabel(status: PendingApprovalRequestStatus): string {
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "승인 보류";
  if (status === "cancelled") return "신청 취소";
  return "승인 대기";
}

export function getPendingApprovalStatusTone(status: PendingApprovalRequestStatus): string {
  if (status === "approved") {
    return "border-[var(--pbp-status-success-border)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-text)]";
  }
  if (status === "rejected" || status === "cancelled") {
    return "border-[var(--pbp-status-danger-border)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-text)]";
  }
  return "border-[var(--pbp-status-info-border)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-text)]";
}

export function getPendingApprovalStatusPanelClassName(status: PendingApprovalRequestStatus): string {
  if (status === "approved") return "border-[var(--pbp-status-success-border)] bg-[var(--pbp-status-success-bg)]";
  if (status === "rejected" || status === "cancelled") {
    return "border-[var(--pbp-status-danger-border)] bg-[var(--pbp-status-danger-bg)]";
  }
  return "border-[var(--pbp-status-info-border)] bg-[var(--pbp-status-info-bg)]";
}

export function getPendingApprovalStatusGuidance(
  status: PendingApprovalRequestStatus,
  type: PendingApprovalRequestType,
): PendingApprovalStatusGuidance {
  if (status === "approved") {
    return {
      title: "가입이 승인되었습니다",
      description: "이제 WAFL 업무 화면을 사용할 수 있습니다.",
      nextAction: "아래 버튼을 눌러 업무 화면으로 이동하세요.",
      primaryAction: {
        href: type === "company" ? "/admin" : "/workspace",
        label: "업무 화면으로 이동",
        description: "승인된 계정의 업무 화면으로 이동합니다.",
      },
    };
  }

  if (status === "rejected") {
    return {
      title: "가입 신청이 승인되지 않았습니다",
      description: "관리자가 신청 내용을 확인한 뒤 승인을 보류했습니다.",
      nextAction: "필요한 경우 회사 관리자에게 다시 문의하세요.",
      primaryAction: null,
    };
  }

  if (status === "cancelled") {
    return {
      title: "가입 신청이 취소되었습니다",
      description: "이 초대 신청은 더 이상 진행되지 않습니다.",
      nextAction: "서비스 이용이 필요하면 회사 관리자에게 새 초대 링크를 요청하세요.",
      primaryAction: null,
    };
  }

  return {
    title: "가입 신청이 접수되었습니다",
    description: "관리자가 신청 내용을 확인하고 있습니다.",
    nextAction: "승인이 완료되면 업무 화면을 사용할 수 있습니다. 승인이 지연되면 회사 관리자에게 문의하세요.",
    primaryAction: null,
  };
}
