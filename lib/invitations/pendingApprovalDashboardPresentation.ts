export type PendingApprovalAccessStatus = "available" | "blocked" | "planned";

export interface PendingApprovalSummaryItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface PendingApprovalAccessItem {
  id: string;
  title: string;
  description: string;
  status: PendingApprovalAccessStatus;
  statusLabel: string;
}

export interface PendingApprovalStep {
  id: string;
  title: string;
  description: string;
}

export interface PendingApprovalPolicyNote {
  id: string;
  title: string;
  description: string;
}

export type PendingApprovalRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type PendingApprovalRequestType = "member" | "company";

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

export const PENDING_APPROVAL_DASHBOARD_TITLE = "가입 신청 상태";

export const PENDING_APPROVAL_DASHBOARD_DESCRIPTION =
  "초대 링크로 제출한 가입 신청의 승인, 거절, 취소 상태를 확인하는 제한된 대시보드입니다.";

export const PENDING_APPROVAL_LOOKUP_TITLE = "가입 신청 상태 조회";

export const PENDING_APPROVAL_LOOKUP_DESCRIPTION =
  "가입 신청 제출 후 redirect된 requestId를 우선 사용합니다. OAuth 연결 전 테스트에서는 신청 이메일로 가장 최근 신청 상태를 조회할 수 있습니다.";

export const PENDING_APPROVAL_LOOKUP_IDLE_MESSAGE =
  "가입 신청 제출 후 발급된 requestId 또는 신청 이메일로 상태를 조회합니다.";

export const PENDING_APPROVAL_LOOKUP_FALLBACK_MESSAGE =
  "가입 신청 상태를 조회하면 아래 요약 카드가 실제 join_requests 기준으로 바뀝니다.";

export const PENDING_APPROVAL_LOOKUP_EMPTY_MESSAGE =
  "조회 조건과 일치하는 가입 신청이 없습니다. requestId 또는 신청 이메일을 다시 확인하세요.";

export function buildPendingApprovalLookupFoundMessage(status: PendingApprovalRequestStatus): string {
  return `${getPendingApprovalStatusLabel(status)} 상태를 조회했습니다.`;
}

export const PENDING_APPROVAL_SUMMARY_ITEMS: PendingApprovalSummaryItem[] = [
  {
    id: "request-status",
    label: "신청 상태",
    value: "조회 전",
    description: "requestId 또는 신청 이메일로 현재 상태를 조회합니다.",
  },
  {
    id: "target-company",
    label: "신청 회사",
    value: "조회 후 표시",
    description: "가입 신청이 확인되면 신청 회사 또는 초대받은 고객사를 표시합니다.",
  },
  {
    id: "permission-mode",
    label: "권한 부여 방식",
    value: "permission_code",
    description: "승인 시 역할명이 아니라 실제 권한 코드 목록을 저장합니다.",
  },
  {
    id: "access-mode",
    label: "접근 범위",
    value: "상태별 분기",
    description: "승인 전과 거절/취소 후 접근 안내를 분리합니다.",
  },
];

export const PENDING_APPROVAL_ACCESS_ITEMS: PendingApprovalAccessItem[] = [
  {
    id: "status-check",
    title: "신청 상태 확인",
    description: "승인 대기, 승인 완료, 거절, 취소 상태를 확인할 수 있습니다.",
    status: "available",
    statusLabel: "허용",
  },
  {
    id: "personal-settings",
    title: "개인 설정",
    description: "언어, 테마, 기본 진입 화면 같은 개인 설정은 접근 가능합니다.",
    status: "available",
    statusLabel: "허용",
  },
  {
    id: "support-request",
    title: "문의 또는 재신청",
    description: "거절 또는 취소 상태에서는 관리자 문의나 새 초대 링크 요청이 필요합니다.",
    status: "planned",
    statusLabel: "후속",
  },
  {
    id: "workorders",
    title: "작업지시서",
    description: "승인 전 사용자는 작업지시서 조회, 생성, 수정, 상태 변경을 할 수 없습니다.",
    status: "blocked",
    statusLabel: "차단",
  },
  {
    id: "storage",
    title: "저장소",
    description: "첨부파일, 디자인, 메모, 휴지통 데이터에 접근할 수 없습니다.",
    status: "blocked",
    statusLabel: "차단",
  },
  {
    id: "stats",
    title: "통계정보",
    description: "고객사 생산/납기/검수/저장소 통계는 승인 후 권한에 따라 노출합니다.",
    status: "blocked",
    statusLabel: "차단",
  },
  {
    id: "partners",
    title: "협력업체 관리",
    description: "협력업체 목록과 외주공정 정보는 승인 전에는 접근할 수 없습니다.",
    status: "blocked",
    statusLabel: "차단",
  },
  {
    id: "members",
    title: "멤버관리",
    description: "초대, 승인, 권한 부여 화면은 member.manage 계열 권한이 있는 사용자에게만 노출합니다.",
    status: "blocked",
    statusLabel: "차단",
  },
];

export const PENDING_APPROVAL_STEPS: PendingApprovalStep[] = [
  {
    id: "join-request-created",
    title: "가입 신청 접수",
    description: "초대 링크 접속 후 신청 폼 제출이 완료되면 join_requests.pending으로 저장합니다.",
  },
  {
    id: "admin-review",
    title: "관리자 검토",
    description: "멤버 신청은 고객관리자가, 고객사 신청은 시스템관리자가 신청 정보를 확인합니다.",
  },
  {
    id: "permission-assignment",
    title: "권한 직접 부여",
    description: "role template은 기본 체크값으로만 사용하고, 최종 저장은 member_permissions.permission_code 기준으로 처리합니다.",
  },
  {
    id: "workspace-redirect",
    title: "승인 후 이동",
    description: "승인 후에는 신청 유형에 따라 고객관리자 화면 또는 작업공간으로 이동합니다.",
  },
];

export const PENDING_APPROVAL_POLICY_NOTES: PendingApprovalPolicyNote[] = [
  {
    id: "server-guard",
    title: "프론트 제한은 UX 보조",
    description: "승인 전 접근 차단은 화면 숨김만으로 끝내지 않고 API 권한 검증으로 반드시 보완해야 합니다.",
  },
  {
    id: "pending-member-state",
    title: "상태별 접근 분리",
    description: "pending은 대기, approved는 진입 안내, rejected/cancelled는 문의 또는 재신청 안내로 분리합니다.",
  },
  {
    id: "redirect-policy",
    title: "승인 전 redirect 기준",
    description: "업무 route 접근 시 session의 승인 상태가 pending이면 /pending으로 보내는 정책을 후속 연결합니다.",
  },
];

export function getPendingApprovalAccessTone(status: PendingApprovalAccessStatus): string {
  if (status === "available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

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

export function getPendingApprovalStatusLabel(status: PendingApprovalRequestStatus): string {
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "거절됨";
  if (status === "cancelled") return "신청 취소";
  return "승인 대기";
}

export function getPendingApprovalRequestTypeLabel(type: PendingApprovalRequestType): string {
  return type === "company" ? "고객사 가입 신청" : "멤버 가입 신청";
}

export function getPendingApprovalStatusTone(status: PendingApprovalRequestStatus): string {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "cancelled") return "border-stone-200 bg-stone-100 text-stone-500";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getPendingApprovalStatusPanelClassName(status: PendingApprovalRequestStatus): string {
  if (status === "approved") return "border-emerald-200 bg-emerald-50";
  if (status === "rejected") return "border-rose-200 bg-rose-50";
  if (status === "cancelled") return "border-stone-200 bg-stone-50";
  return "border-amber-200 bg-amber-50";
}

export function getPendingApprovalStatusGuidance(
  status: PendingApprovalRequestStatus,
  requestType: PendingApprovalRequestType,
): PendingApprovalStatusGuidance {
  if (status === "approved") {
    const isCompanyRequest = requestType === "company";
    return {
      title: "승인이 완료되었습니다.",
      description: isCompanyRequest
        ? "고객사 가입 신청이 승인되어 고객관리자 화면으로 이동할 수 있습니다."
        : "멤버 가입 신청이 승인되어 부여된 권한 기준으로 작업공간에 접근할 수 있습니다.",
      nextAction: "승인 후에도 접근이 막히면 로그인 계정과 신청 이메일이 같은지 확인하세요.",
      primaryAction: {
        href: isCompanyRequest ? "/admin" : "/workspace",
        label: isCompanyRequest ? "고객관리자 화면으로 이동" : "작업공간으로 이동",
        description: isCompanyRequest ? "승인된 고객사의 관리 화면으로 이동합니다." : "승인된 멤버 작업공간으로 이동합니다.",
      },
    };
  }

  if (status === "rejected") {
    return {
      title: "가입 신청이 거절되었습니다.",
      description: "관리자가 신청 정보를 검토한 뒤 거절 처리했습니다.",
      nextAction: "다시 신청하려면 관리자에게 새 초대 링크를 요청하거나 거절 사유를 확인하세요.",
      primaryAction: null,
    };
  }

  if (status === "cancelled") {
    return {
      title: "가입 신청 또는 초대가 취소되었습니다.",
      description: "초대 링크가 취소되었거나 기존 신청이 더 이상 유효하지 않은 상태입니다.",
      nextAction: "계속 가입해야 한다면 관리자에게 새 초대 링크를 요청하세요.",
      primaryAction: null,
    };
  }

  return {
    title: "관리자 승인을 기다리고 있습니다.",
    description: requestType === "company"
      ? "시스템관리자가 고객사 가입 신청을 검토하면 상태가 승인 완료 또는 거절로 바뀝니다."
      : "고객관리자가 멤버 가입 신청을 검토하면 상태가 승인 완료 또는 거절로 바뀝니다.",
    nextAction: "승인 전에는 업무 데이터에 접근할 수 없습니다.",
    primaryAction: null,
  };
}

export function buildPendingApprovalSummaryItems(
  joinRequest: PendingApprovalJoinRequestView | null,
): PendingApprovalSummaryItem[] {
  if (!joinRequest) {
    return PENDING_APPROVAL_SUMMARY_ITEMS;
  }

  const guidance = getPendingApprovalStatusGuidance(joinRequest.status, joinRequest.requestType);

  return [
    {
      id: "request-status",
      label: "신청 상태",
      value: getPendingApprovalStatusLabel(joinRequest.status),
      description: guidance.nextAction,
    },
    {
      id: "request-type",
      label: "신청 유형",
      value: getPendingApprovalRequestTypeLabel(joinRequest.requestType),
      description: "멤버 초대와 고객사 초대를 같은 상태 화면에서 구분합니다.",
    },
    {
      id: "applicant-email",
      label: "신청 이메일",
      value: joinRequest.applicantEmail,
      description: "OAuth 연결 전에는 신청자가 입력한 이메일을 기준으로 상태를 확인합니다.",
    },
    {
      id: "target-company",
      label: "신청 회사",
      value: joinRequest.requestedCompanyName || "초대받은 고객사",
      description: "고객사 가입 신청은 requested_company_name, 멤버 신청은 invitation의 고객사 기준으로 확장합니다.",
    },
  ];
}
