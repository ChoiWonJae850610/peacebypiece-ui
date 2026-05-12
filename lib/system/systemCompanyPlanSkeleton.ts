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
  storageRiskLabel: string;
  memberUsageLabel: string;
  memberRiskLabel: string;
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
      memo: "초기 테스트 고객사 storage/member override 예시",
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
  "sample-company": "샘플 고객사",
  "sample-company-2": "샘플 브랜드 B",
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
    return "초기 소규모 고객사 기준 요금제 초안입니다.";
  }

  if (plan.code === "team") {
    return "팀 단위 운영 고객사 기준 요금제 초안입니다.";
  }

  return "대용량/다인원 고객사 기준 요금제 초안입니다.";
}

function findPlanById(planId: string): PlanDefinition {
  return (
    DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.id === planId) ??
    DEFAULT_PLAN_DEFINITIONS[0]
  );
}

function getUsageRiskLabel(ratio: number, exceeded: boolean): string {
  if (exceeded) {
    return "초과";
  }

  if (ratio >= 0.85) {
    return "주의";
  }

  return "정상";
}

function getOverrideLabel(policy: ResolvedCompanyPlanPolicy): string {
  const labels = [
    policy.source.storage === "override" ? "저장용량" : null,
    policy.source.member === "override" ? "멤버" : null,
    policy.source.price === "override" ? "가격" : null,
  ].filter(Boolean);

  if (labels.length === 0) {
    return "override 없음";
  }

  return `${labels.join(" · ")} override 적용`;
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

    return {
      id: assignment.companyId,
      name: sampleCompanyNamesById[assignment.companyId] ?? assignment.companyId,
      currentPlan: policy.planName,
      storageUsageLabel: `${formatBytes(usage.usedBytes)} / ${formatBytes(policy.storageLimitBytes)}`,
      storageRiskLabel: getUsageRiskLabel(storageRatio, storageExceeded),
      memberUsageLabel: `${usage.memberCount}명 / ${policy.memberLimit}명`,
      memberRiskLabel: memberExceeded ? "초과" : "정상",
      overrideLabel: getOverrideLabel(policy),
      policySourceLabel: `storage:${policy.source.storage} · member:${policy.source.member} · price:${policy.source.price}`,
    };
  });


const samplePlanChangeDraft = {
  companyId: "sample-company-2",
  companyName: "샘플 브랜드 B",
  currentAssignment: sampleAssignments[1],
  nextPlanCode: "team",
  storageLimitBytesOverride: 80 * 1024 * 1024 * 1024,
  memberLimitOverride: 20,
  priceKrwOverride: 99000,
  effectiveDate: "2026-06-01",
  memo: "초기 도입 고객사 한시 override 예시",
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
    description: "company_plan_assignments.plan_id와 연결될 선택 영역입니다.",
  },
  {
    id: "storage",
    label: "저장용량 override",
    value: "80GB",
    description:
      "plan storage 정책을 기본값으로 사용하고 고객사별 예외 한도만 override로 저장합니다.",
  },
  {
    id: "member",
    label: "멤버 수 override",
    value: "20명",
    description:
      "role/permission 수가 아니라 승인된 company_members 수 기준으로 한도를 계산합니다.",
  },
  {
    id: "price",
    label: "가격 override",
    value: "별도 협의",
    description: "결제 자동화가 아니라 운영자가 관리하는 계약 정책 값입니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_POLICY_STEPS: SystemCompanyPlanPolicyStep[] = [
  {
    id: "plan-master",
    title: "요금제 master",
    statusLabel: "기준 확정",
    description:
      "Starter, Team, Business 기본 정책은 lib/billing/defaultPlans를 단일 출처로 사용합니다.",
  },
  {
    id: "company-assignment",
    title: "고객사 배정",
    statusLabel: "변경 화면 준비",
    description:
      "company_plan_assignments에서 고객사별 현재 plan과 적용 기간을 관리합니다.",
  },
  {
    id: "override-policy",
    title: "예외 한도",
    statusLabel: "입력 구조 준비",
    description:
      "저장용량, 멤버 수, 가격만 override 대상으로 두고 기능 플래그는 plan 기준을 우선합니다.",
  },
  {
    id: "usage-snapshot",
    title: "사용량 snapshot",
    statusLabel: "후속 연결",
    description:
      "초기에는 DB attachment metadata 기준 snapshot을 사용하고 R2 inventory는 후속 검토합니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_POLICY_NOTES = [
  "고객관리자는 읽기 전용으로 현재 plan과 한도만 확인합니다.",
  "시스템관리자만 고객사별 plan과 override를 변경합니다.",
  "0.10.73 기준 변경 입력은 preview이며 실제 저장은 company_plan_assignments API 연결 후 활성화합니다.",
  "저장공간 사용률이 85% 이상이면 주의, 한도 초과는 초과 상태로 표시합니다.",
  "업로드 차단과 초과 과금 정책은 실제 결제 연동 이후 결정합니다.",
] as const;
