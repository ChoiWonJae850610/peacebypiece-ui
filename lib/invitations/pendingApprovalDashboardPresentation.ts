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

export const PENDING_APPROVAL_DASHBOARD_TITLE = "승인 대기";

export const PENDING_APPROVAL_DASHBOARD_DESCRIPTION =
  "가입 신청이 접수된 사용자가 고객관리자 승인 전까지 확인하는 제한된 대시보드입니다.";

export const PENDING_APPROVAL_SUMMARY_ITEMS: PendingApprovalSummaryItem[] = [
  {
    id: "request-status",
    label: "신청 상태",
    value: "승인 대기",
    description: "고객관리자가 신청 정보를 검토하기 전 상태입니다.",
  },
  {
    id: "target-company",
    label: "신청 회사",
    value: "초대받은 고객사",
    description: "후속 API 연결 시 join_requests와 invitations 기준으로 표시합니다.",
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
    value: "제한됨",
    description: "승인 전에는 업무 메뉴와 고객사 데이터에 접근하지 못합니다.",
  },
];

export const PENDING_APPROVAL_ACCESS_ITEMS: PendingApprovalAccessItem[] = [
  {
    id: "status-check",
    title: "신청 상태 확인",
    description: "승인 대기 상태와 신청 접수 기준을 확인할 수 있습니다.",
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
    title: "문의 또는 개발 건의",
    description: "초기 버전에서는 문의 링크나 안내 문구 중심으로 처리합니다.",
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
    description: "초대 링크 접속 후 Google 로그인과 신청 폼 제출이 완료되면 join_requests.pending으로 저장합니다.",
  },
  {
    id: "admin-review",
    title: "고객관리자 검토",
    description: "고객관리자가 /admin/members에서 신청자 정보와 요청 메모를 확인합니다.",
  },
  {
    id: "permission-assignment",
    title: "권한 직접 부여",
    description: "role template은 기본 체크값으로만 사용하고, 최종 저장은 member_permissions.permission_code 기준으로 처리합니다.",
  },
  {
    id: "workspace-redirect",
    title: "승인 후 이동",
    description: "승인 후에는 부여된 permission_code에 따라 메인화면 카드와 API 접근이 제한됩니다.",
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
    title: "company_members pending 분리",
    description: "승인 전 사용자는 회사 멤버로 확정된 사용자가 아니므로 pending 상태와 approved 상태를 명확히 분리합니다.",
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
