import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";

export type SystemCompanyApprovalStepStatus = "ready" | "planned" | "locked";
export type SystemCompanyJoinRequestLoadStatus = "idle" | "loading" | "loaded" | "failed";
export type SystemCompanyRequestEmailMatchStatus = "matched" | "mismatched" | "unknown";

export interface SystemCompanyApprovalSummaryItem {
  id: "requestType" | "pendingRequests" | "createPolicy" | "adminPermission";
  label: string;
  value: string;
  description: string;
}

export interface SystemCompanyJoinRequestPreview {
  id: string;
  requestedCompanyName: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhoneLabel: string;
  requestMemoLabel: string;
  invitationEmailLabel: string;
  emailMatchStatus: SystemCompanyRequestEmailMatchStatus;
  requestedAtLabel: string;
}

export interface SystemCompanyApprovalStep {
  id: string;
  title: string;
  description: string;
  status: SystemCompanyApprovalStepStatus;
  statusLabel: string;
}

export interface SystemCompanyApprovalAction {
  id: string;
  label: string;
  helper: string;
  requiredPermission: string;
  state: "disabled" | "ready";
}

export interface SystemCompanyApprovalPolicyNote {
  id: string;
  title: string;
  description: string;
}

export interface SystemCompanyApprovalPermissionItem {
  id: string;
  label: string;
  permissionCode: string;
  enabled: boolean;
}

export const SYSTEM_COMPANY_APPROVAL_SUMMARY_ITEMS: readonly SystemCompanyApprovalSummaryItem[] = [
  {
    id: "requestType",
    label: "신청 유형",
    value: "company",
    description: "시스템관리자 고객사 초대 링크에서 들어온 고객사 생성 신청입니다.",
  },
  {
    id: "pendingRequests",
    label: "승인 대기",
    value: "0",
    description: "join_requests.pending 상태의 고객사 가입 신청 수입니다.",
  },
  {
    id: "createPolicy",
    label: "회사 생성",
    value: "승인 버튼 기준",
    description: "가입 신청만으로 companies를 만들지 않고 승인 시점에 생성합니다.",
  },
  {
    id: "adminPermission",
    label: "초기 권한",
    value: "permission_code 직접 부여",
    description: "role은 기본 묶음이며 실제 저장은 member_permissions 기준입니다.",
  },
] as const;

export const SYSTEM_COMPANY_APPROVAL_STEPS: readonly SystemCompanyApprovalStep[] = [
  {
    id: "review-request",
    title: "가입 신청 검토",
    description: "join_requests.pending 신청의 초대 유형, 신청자, 회사명, 연락처, 메모를 확인합니다.",
    status: "ready",
    statusLabel: "실제 조회 연결",
  },
  {
    id: "create-company",
    title: "고객사 생성",
    description: "회사명, 사업자명, 요금제, 저장공간 한도를 확정해 companies를 생성합니다.",
    status: "ready",
    statusLabel: "API 연결 완료",
  },
  {
    id: "approve-admin",
    title: "고객관리자 승인",
    description: "신청자를 company_members.approved 상태로 연결하고 고객관리자 기본 권한을 저장합니다.",
    status: "ready",
    statusLabel: "API 연결 완료",
  },
  {
    id: "initialize-standards",
    title: "초기 기준정보 복사",
    description: "고객사 생성 후 initializeCompanyStandards로 활성 단위 표준, 외주공정 유형, 기본 생산품 유형 템플릿을 복사합니다.",
    status: "ready",
    statusLabel: "연결 완료",
  },
] as const;

export const SYSTEM_COMPANY_APPROVAL_PERMISSION_ITEMS: readonly SystemCompanyApprovalPermissionItem[] = [
  { id: "workorder-read", label: "작업지시서 조회", permissionCode: MEMBER_PERMISSION_CODE.workorderRead, enabled: true },
  { id: "workorder-manage", label: "작업지시서 생성·수정", permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate, enabled: true },
  { id: "partner-manage", label: "협력업체 관리", permissionCode: MEMBER_PERMISSION_CODE.partnerManage, enabled: true },
  { id: "storage-manage", label: "저장소 조회·삭제 요청", permissionCode: MEMBER_PERMISSION_CODE.storageDeleteRequest, enabled: true },
  { id: "stats-read", label: "통계 조회", permissionCode: MEMBER_PERMISSION_CODE.statsRead, enabled: true },
  { id: "settings-manage", label: "환경설정 관리", permissionCode: MEMBER_PERMISSION_CODE.settingsManage, enabled: true },
  { id: "member-manage", label: "멤버 초대·승인·권한 변경", permissionCode: MEMBER_PERMISSION_CODE.memberPermissionUpdate, enabled: true },
  { id: "audit-read-company", label: "고객사 감사 로그 조회", permissionCode: MEMBER_PERMISSION_CODE.auditReadCompany, enabled: true },
] as const;

export const SYSTEM_COMPANY_APPROVAL_ACTIONS: readonly SystemCompanyApprovalAction[] = [
  {
    id: "approve-create-company",
    label: "고객사 생성 및 승인",
    helper: "companies, users, company_members, member_permissions, join_requests, invitations를 하나의 승인 흐름으로 처리합니다.",
    requiredPermission: "system.company.approve",
    state: "ready",
  },
  {
    id: "reject-request",
    label: "가입 신청 거절",
    helper: "join_requests.rejected와 invitations.cancelled 상태 정리, 거절 감사 로그를 연결합니다.",
    requiredPermission: "system.company.reject",
    state: "ready",
  },
  {
    id: "open-invite",
    label: "고객사 초대 화면으로 이동",
    helper: "새 초대 링크와 QR을 다시 만들 때 사용하는 연결입니다.",
    requiredPermission: "system.invitation.create",
    state: "ready",
  },
] as const;

export const SYSTEM_COMPANY_APPROVAL_POLICY_NOTES: readonly SystemCompanyApprovalPolicyNote[] = [
  {
    id: "single-transaction",
    title: "승인 흐름은 트랜잭션 기준",
    description: "고객사 승인 흐름은 고객사 생성, 고객관리자 멤버십 생성, 권한 저장, 신청 승인을 하나의 트랜잭션으로 묶고, 거절 흐름은 신청 상태와 초대 상태를 함께 정리합니다.",
  },
  {
    id: "permission-code-first",
    title: "permission_code 우선",
    description: "role_code는 기본 체크값과 표시용으로만 사용하고 실제 접근 제어는 member_permissions.permission_code 기준으로 처리합니다.",
  },
  {
    id: "standards-after-company",
    title: "기준정보 복사는 회사 생성 후",
    description: "고객사 id가 확정된 뒤 initializeCompanyStandards가 company_enabled_unit_standards, company_enabled_process_standards, item_categories를 초기화합니다.",
  },
  {
    id: "audit-log-candidates",
    title: "감사 로그 기준",
    description: "승인 시 company.created와 member.approved를 기록하고, 거절 시 company_invitation.rejected를 기록합니다.",
  },
] as const;

function normalizeEmailForCompare(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
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

function resolveEmailMatchStatus(joinRequest: JoinRequestRecord): SystemCompanyRequestEmailMatchStatus {
  const applicantEmail = normalizeEmailForCompare(joinRequest.applicantEmail);
  const invitationEmail = normalizeEmailForCompare(joinRequest.invitation?.recipientEmail);

  if (!applicantEmail || !invitationEmail) return "unknown";
  return applicantEmail === invitationEmail ? "matched" : "mismatched";
}

export function toSystemCompanyJoinRequestPreviews(
  joinRequests: readonly JoinRequestRecord[],
): readonly SystemCompanyJoinRequestPreview[] {
  return joinRequests.map((joinRequest) => ({
    id: joinRequest.id,
    requestedCompanyName: joinRequest.requestedCompanyName?.trim() || "-",
    businessName: joinRequest.businessName?.trim() || "-",
    applicantName: joinRequest.applicantName?.trim() || joinRequest.applicantEmail,
    applicantEmail: joinRequest.applicantEmail,
    applicantPhoneLabel: joinRequest.applicantPhone?.trim() || "-",
    requestMemoLabel: joinRequest.requestMemo?.trim() || "-",
    invitationEmailLabel: joinRequest.invitation?.recipientEmail?.trim() || "-",
    emailMatchStatus: resolveEmailMatchStatus(joinRequest),
    requestedAtLabel: toCompactDateTimeLabel(joinRequest.createdAt),
  }));
}

export function getSystemCompanyApprovalSummaryItems(
  pendingRequestCount: number,
  loadStatus: SystemCompanyJoinRequestLoadStatus,
): readonly SystemCompanyApprovalSummaryItem[] {
  return SYSTEM_COMPANY_APPROVAL_SUMMARY_ITEMS.map((item) =>
    item.id === "pendingRequests"
      ? {
          ...item,
          value: loadStatus === "loaded" ? String(pendingRequestCount) : "-",
          description: loadStatus === "failed"
            ? "가입 신청 목록을 불러오지 못했습니다."
            : item.description,
        }
      : item,
  );
}
