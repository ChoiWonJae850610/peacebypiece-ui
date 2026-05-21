import {
  DEFAULT_PLAN_DEFINITIONS,
  getStorageUsageRatio,
  isMemberLimitExceeded,
  isStorageUsageExceeded,
  resolveCompanyPlanPolicy,
  type CompanyPlanAssignment,
  type PlanDefinition,
  type ResolvedCompanyPlanPolicy,
  getCompanyPlanChangeFields,
  getCompanyPlanChangePreview,
  getCompanyPlanChangeValidationItems,
  type CompanyPlanChangeFieldDefinition,
  type CompanyPlanChangePreview,
  type CompanyPlanChangeValidationItem,
} from "@/lib/billing";
import { getUsageRiskLabelKo, getUsageRiskTone, resolveUsageRiskCode, type UsageRiskCode, type UsageRiskTone } from "@/lib/domain/usageRisk";

export interface SystemCompanyPlanOption {
  id: string;
  name: string;
  code: string;
  statusLabel: string;
  priceLabel: string;
  storageLabel: string;
  memberLabel: string;
  description: string;
}

export interface SystemCompanyPlanCompany {
  id: string;
  name: string;
  currentPlan: string;
  storageUsageLabel: string;
  storageRisk: UsageRiskCode;
  storageRiskLabel: string;
  storageRiskTone: UsageRiskTone;
  memberUsageLabel: string;
  memberRisk: UsageRiskCode;
  memberRiskLabel: string;
  memberRiskTone: UsageRiskTone;
  overrideLabel: string;
  policySourceLabel: string;
}

export interface SystemCompanyPlanField {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface SystemCompanyPlanPolicyStep {
  id: string;
  title: string;
  statusLabel: string;
  description: string;
}

export type SystemCompanyPlanChangeField = CompanyPlanChangeFieldDefinition;
export type SystemCompanyPlanChangePreview = CompanyPlanChangePreview;
export type SystemCompanyPlanChangeValidationItem = CompanyPlanChangeValidationItem;

const sampleAssignments: CompanyPlanAssignment[] = [
  {
    id: "assignment-sample-company",
    companyId: "sample-company",
    planId: "plan-team",
    status: "active",
    startsAt: "2026-05-01T00:00:00.000Z",
    override: null,
  },
  {
    id: "assignment-sample-brand-b",
    companyId: "sample-company-2",
    planId: "plan-starter",
    status: "active",
    startsAt: "2026-05-01T00:00:00.000Z",
    override: {
      storageLimitBytes: 8 * 1024 * 1024 * 1024,
      memberLimit: 5,
      memo: "초기 도입 고객사 예외 한도 예시",
    },
  },
];

const sampleUsageByCompanyId: Record<
  string,
  { usedBytes: number; attachmentCount: number; memberCount: number }
> = {
  "sample-company": {
    usedBytes: 12 * 1024 * 1024 * 1024,
    attachmentCount: 148,
    memberCount: 3,
  },
  "sample-company-2": {
    usedBytes: 7.4 * 1024 * 1024 * 1024,
    attachmentCount: 82,
    memberCount: 5,
  },
};

const sampleCompanyNamesById: Record<string, string> = {
  "sample-company": "A 고객사",
  "sample-company-2": "B 고객사",
};

function formatBytes(bytes: number): string {
  const gib = bytes / 1024 / 1024 / 1024;

  if (gib >= 10) {
    return `${Math.round(gib)}GB`;
  }

  return `${Math.round(gib * 10) / 10}GB`;
}

function formatKrw(priceKrw: number): string {
  return `${priceKrw.toLocaleString("ko-KR")}원 / 월`;
}

function getPlanDescription(plan: PlanDefinition): string {
  if (plan.code === "starter") {
    return "초기 소규모 고객사 기준 요금제입니다.";
  }

  if (plan.code === "team") {
    return "팀 단위 운영 고객사 기준 요금제입니다.";
  }

  return "대용량 또는 다인원 고객사 기준 요금제입니다.";
}

function findPlanById(planId: string): PlanDefinition {
  return (
    DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.id === planId) ??
    DEFAULT_PLAN_DEFINITIONS[0]
  );
}

function getOverrideLabel(policy: ResolvedCompanyPlanPolicy): string {
  const labels = [
    policy.source.storage === "override" ? "저장용량" : null,
    policy.source.member === "override" ? "멤버" : null,
    policy.source.price === "override" ? "가격" : null,
  ].filter(Boolean);

  if (labels.length === 0) {
    return "기본 한도 적용";
  }

  return `${labels.join(" · ")} 예외 한도 적용`;
}

export const SYSTEM_COMPANY_PLAN_OPTIONS: SystemCompanyPlanOption[] =
  DEFAULT_PLAN_DEFINITIONS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
    statusLabel: plan.status,
    priceLabel: formatKrw(plan.priceKrw),
    storageLabel: formatBytes(plan.storage.includedStorageBytes),
    memberLabel: `${plan.members.includedMembers}명`,
    description: getPlanDescription(plan),
  }));

export const SYSTEM_COMPANY_PLAN_COMPANIES: SystemCompanyPlanCompany[] =
  sampleAssignments.map((assignment) => {
    const plan = findPlanById(assignment.planId);
    const policy = resolveCompanyPlanPolicy(plan, assignment);
    const usage = sampleUsageByCompanyId[assignment.companyId] ?? {
      usedBytes: 0,
      attachmentCount: 0,
      memberCount: 0,
    };
    const storageRatio = getStorageUsageRatio(usage.usedBytes, policy);
    const storageExceeded = isStorageUsageExceeded(usage.usedBytes, policy);
    const memberExceeded = isMemberLimitExceeded(usage.memberCount, policy);
    const storageRisk = resolveUsageRiskCode({
      ratio: storageRatio,
      exceeded: storageExceeded,
    });
    const memberRisk = resolveUsageRiskCode({
      ratio: usage.memberCount / Math.max(1, policy.memberLimit),
      exceeded: memberExceeded,
      warningThreshold: 1,
    });

    return {
      id: assignment.companyId,
      name: sampleCompanyNamesById[assignment.companyId] ?? assignment.companyId,
      currentPlan: policy.planName,
      storageUsageLabel: `${formatBytes(usage.usedBytes)} / ${formatBytes(policy.storageLimitBytes)}`,
      storageRisk,
      storageRiskLabel: getUsageRiskLabelKo(storageRisk),
      storageRiskTone: getUsageRiskTone(storageRisk),
      memberUsageLabel: `${usage.memberCount}명 / ${policy.memberLimit}명`,
      memberRisk,
      memberRiskLabel: getUsageRiskLabelKo(memberRisk),
      memberRiskTone: getUsageRiskTone(memberRisk),
      overrideLabel: getOverrideLabel(policy),
      policySourceLabel: policy.source.storage === "override" || policy.source.member === "override" || policy.source.price === "override" ? "예외 한도 적용" : "기본 요금제 적용",
    };
  });


const samplePlanChangeDraft = {
  companyId: "sample-company-2",
  companyName: "B 고객사",
  currentAssignment: sampleAssignments[1],
  nextPlanCode: "team",
  storageLimitBytesOverride: 80 * 1024 * 1024 * 1024,
  memberLimitOverride: 20,
  priceKrwOverride: 99000,
  effectiveDate: "2026-06-01",
  memo: "초기 도입 고객사 한시 예외 한도 예시",
};

export const SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW =
  getCompanyPlanChangePreview(samplePlanChangeDraft);

export const SYSTEM_COMPANY_PLAN_CHANGE_FIELDS =
  getCompanyPlanChangeFields(samplePlanChangeDraft);

export const SYSTEM_COMPANY_PLAN_CHANGE_VALIDATION_ITEMS =
  getCompanyPlanChangeValidationItems(samplePlanChangeDraft);

export const SYSTEM_COMPANY_PLAN_FIELDS: SystemCompanyPlanField[] = [
  {
    id: "plan",
    label: "적용 요금제",
    value: "Team",
    description: "고객사에 적용할 요금제를 선택합니다.",
  },
  {
    id: "storage",
    label: "저장용량 예외 한도",
    value: "80GB",
    description:
      "기본 저장용량을 기준으로 필요한 고객사에만 예외 한도를 적용합니다.",
  },
  {
    id: "member",
    label: "멤버 수 예외 한도",
    value: "20명",
    description:
      "승인된 멤버 수를 기준으로 이용 한도를 계산합니다.",
  },
  {
    id: "price",
    label: "월 이용 금액 예외",
    value: "별도 협의",
    description: "고객사별 계약 조건에 따라 조정되는 월 이용 금액입니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_POLICY_STEPS: SystemCompanyPlanPolicyStep[] = [
  {
    id: "plan-master",
    title: "기본 요금제",
    statusLabel: "기준 확정",
    description:
      "Starter, Team, Business 기본 정책을 한 기준으로 관리합니다.",
  },
  {
    id: "company-assignment",
    title: "고객사 배정",
    statusLabel: "운영 준비",
    description:
      "고객사별 현재 요금제와 적용 기간을 관리합니다.",
  },
  {
    id: "override-policy",
    title: "예외 한도",
    statusLabel: "운영 준비",
    description:
      "저장용량, 멤버 수, 가격만 고객사별 예외값으로 관리합니다.",
  },
  {
    id: "usage-snapshot",
    title: "사용량 현황",
    statusLabel: "운영 예정",
    description:
      "저장소 사용량과 멤버 사용량을 요금제 한도와 함께 확인합니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_POLICY_NOTES = [
  "고객관리자는 읽기 전용으로 현재 plan과 한도만 확인합니다.",
  "시스템관리자만 고객사별 plan과 override를 변경합니다.",
  "요금제 변경 저장은 운영 정책과 권한 확인 후 활성화합니다.",
  "저장공간 사용률이 85% 이상이면 주의, 한도 초과는 초과 상태로 표시합니다.",
  "업로드 제한과 초과 사용 정책은 요금제 운영 기준에 맞춰 별도로 확정합니다.",
] as const;
