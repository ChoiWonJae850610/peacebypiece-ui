import type { AdminCompanySummary } from "@/lib/admin/settings/companyTypes";
import { COMPANY_ONBOARDING_STATUS, COMPANY_SUBSCRIPTION_STATUS } from "@/lib/domain/companyStatus";

export type AdminAccountSettingsMetric = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type AdminAccountSettingsAction = {
  id: string;
  label: string;
  statusLabel: string;
  description: string;
  tone: "neutral" | "warning" | "success";
  requestType?: "company_info_change" | "account_deactivation";
};

export type AdminAccountSettingsOverview = {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
  metrics: AdminAccountSettingsMetric[];
  actions: AdminAccountSettingsAction[];
  policyNotes: readonly string[];
};

export type AdminAccountSettingsSnapshot = {
  companyMemberId?: string | null;
  companyMemberStatus?: string | null;
  roleTemplateCode?: string | null;
  displayName?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  approvedAt?: string | null;
  joinedAt?: string | null;
};

export type AdminAccountSettingsOverviewInput = {
  company?: AdminCompanySummary | null;
  account?: AdminAccountSettingsSnapshot | null;
};

function formatEmpty(value: string | null | undefined, fallback = "미입력"): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatAddress(company: AdminCompanySummary | null | undefined): string {
  const parts = [company?.postalCode, company?.roadAddress, company?.addressDetail, company?.addressExtra]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "주소 미입력";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "기록 없음";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function resolveCompanyStatusLabel(company: AdminCompanySummary | null | undefined): string {
  if (company?.onboardingStatus === COMPANY_ONBOARDING_STATUS.active) return "승인됨";
  if (company?.onboardingStatus === COMPANY_ONBOARDING_STATUS.approvalPending) return "승인 대기";
  if (company?.onboardingStatus === COMPANY_ONBOARDING_STATUS.profileRequired) return "회사 정보 필요";
  if (company?.onboardingStatus === COMPANY_ONBOARDING_STATUS.rejected) return "거절됨";
  if (company?.isActive === false) return "비활성";
  return "상태 확인";
}

function resolveSubscriptionLabel(company: AdminCompanySummary | null | undefined): string {
  if (company?.subscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.trialing) return "체험 이용 중";
  if (company?.subscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.active) return "정상 이용 중";
  if (company?.subscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.trialExpired) return "체험 만료";
  if (company?.subscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.pastDue) return "결제 확인 필요";
  if (company?.subscriptionStatus === COMPANY_SUBSCRIPTION_STATUS.canceled) return "구독 취소";
  return "요금 상태 확인";
}

function resolveMemberStatusLabel(account: AdminAccountSettingsSnapshot | null | undefined): string {
  if (account?.companyMemberStatus === "approved") return "승인됨";
  if (account?.companyMemberStatus === "pending") return "승인 대기";
  if (account?.companyMemberStatus === "rejected") return "거절됨";
  if (account?.companyMemberStatus === "suspended") return "정지됨";
  return "멤버 상태 확인";
}

export function buildAdminAccountSettingsOverview(input: AdminAccountSettingsOverviewInput = {}): AdminAccountSettingsOverview {
  const company = input.company ?? null;
  const account = input.account ?? null;
  const companyName = formatEmpty(company?.name, "현재 고객사");
  const businessName = formatEmpty(company?.businessName, "사업자명 미입력");
  const accountName = formatEmpty(account?.displayName || account?.userName, "관리자 이름 미입력");

  return {
    title: `${companyName} 계정 정보`,
    description: "회사 정보, 대표 로그인 계정, 상태, 변경 요청 범위를 한 곳에서 확인합니다. 개인 프로필과 테마는 개인설정에서 관리합니다.",
    statusLabel: resolveCompanyStatusLabel(company),
    statusTone: company?.onboardingStatus === COMPANY_ONBOARDING_STATUS.active ? "success" : "warning",
    metrics: [
      {
        id: "company-name",
        label: "회사명",
        value: companyName,
        description: `사업자명: ${businessName}`,
      },
      {
        id: "business-registration-number",
        label: "사업자등록번호",
        value: formatEmpty(company?.businessRegistrationNumber),
        description: "회사명, 사업자명, 사업자등록번호 변경은 시스템관리자 검토 요청으로 처리합니다.",
      },
      {
        id: "company-address",
        label: "회사 주소",
        value: formatAddress(company),
        description: company?.jibunAddress ? `지번주소: ${company.jibunAddress}` : "주소 변경은 회사정보 변경 요청 흐름으로 분리합니다.",
      },
      {
        id: "representative-account",
        label: "대표 로그인 이메일",
        value: formatEmpty(account?.userEmail, "Google 로그인 이메일 없음"),
        description: `관리자 표시명: ${accountName}`,
      },
      {
        id: "member-status",
        label: "계정 상태",
        value: resolveMemberStatusLabel(account),
        description: `역할: ${formatEmpty(account?.roleTemplateCode, "company_admin")}`,
      },
      {
        id: "subscription-status",
        label: "이용 상태",
        value: resolveSubscriptionLabel(company),
        description: `체험 만료일: ${formatDate(company?.trialEndsAt)}`,
      },
    ],
    actions: [
      {
        id: "request-company-info-change",
        label: "회사 정보 변경 요청",
        statusLabel: "요청 가능",
        tone: "neutral",
        requestType: "company_info_change",
        description: "회사명, 사업자명, 사업자등록번호, 주소, 대표 연락처 변경은 시스템관리자 검토 요청으로 접수합니다.",
      },
      {
        id: "request-account-deactivation",
        label: "계정 비활성화 요청",
        statusLabel: "검토 요청",
        tone: "warning",
        requestType: "account_deactivation",
        description: "고객사 폐쇄, 관리자 교체, 서비스 중지는 즉시 삭제가 아니라 검토 요청으로 처리합니다.",
      },
      {
        id: "open-personal-settings",
        label: "개인 설정으로 이동",
        statusLabel: "상단 사람 아이콘",
        tone: "success",
        description: "개인 표시명, 연락처, 생년월일, 언어, 색상 테마는 회사 설정이 아니라 개인 설정에서 관리합니다.",
      },
    ],
    policyNotes: [
      "조직 정보와 개인 설정을 같은 저장 흐름으로 섞지 않습니다.",
      "로그인 이메일은 Google OAuth 식별값이므로 고객사 관리자가 직접 변경하지 않습니다.",
      "회사명·사업자 정보·관리자 교체·탈퇴 요청은 시스템관리자 검토 이력이 남는 요청 흐름으로 확장합니다.",
      "대표 담당자 연락처와 회사 주소 직접 수정은 다음 단계에서 저장 버튼 기반으로 분리합니다.",
    ] as const,
  };
}
