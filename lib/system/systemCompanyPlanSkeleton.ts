export interface SystemCompanyPlanOption {
  id: string;
  name: string;
  code: string;
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
  memberUsageLabel: string;
  overrideLabel: string;
}

export interface SystemCompanyPlanField {
  id: string;
  label: string;
  value: string;
  description: string;
}

export const SYSTEM_COMPANY_PLAN_OPTIONS: SystemCompanyPlanOption[] = [
  {
    id: "plan-starter",
    name: "Starter",
    code: "starter",
    priceLabel: "29,000원 / 월",
    storageLabel: "5GB",
    memberLabel: "3명",
    description: "초기 소규모 고객사 기준 요금제 초안입니다.",
  },
  {
    id: "plan-team",
    name: "Team",
    code: "team",
    priceLabel: "79,000원 / 월",
    storageLabel: "50GB",
    memberLabel: "15명",
    description: "팀 단위 운영 고객사 기준 요금제 초안입니다.",
  },
  {
    id: "plan-business",
    name: "Business",
    code: "business",
    priceLabel: "199,000원 / 월",
    storageLabel: "200GB",
    memberLabel: "50명",
    description: "대용량/다인원 고객사 기준 요금제 초안입니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_COMPANIES: SystemCompanyPlanCompany[] = [
  {
    id: "sample-company",
    name: "샘플 고객사",
    currentPlan: "Team",
    storageUsageLabel: "0GB / 50GB",
    memberUsageLabel: "3명 / 15명",
    overrideLabel: "override 없음",
  },
  {
    id: "sample-company-2",
    name: "샘플 브랜드 B",
    currentPlan: "Starter",
    storageUsageLabel: "1.2GB / 5GB",
    memberUsageLabel: "2명 / 3명",
    overrideLabel: "저장용량 override 예정",
  },
];

export const SYSTEM_COMPANY_PLAN_FIELDS: SystemCompanyPlanField[] = [
  {
    id: "plan",
    label: "적용 요금제",
    value: "Team",
    description: "고객사별 plan assignment와 연결될 선택 영역입니다.",
  },
  {
    id: "storage",
    label: "저장용량 override",
    value: "80GB",
    description: "plan 허용 범위 안에서 고객사별 저장용량을 조정합니다.",
  },
  {
    id: "member",
    label: "멤버 수 override",
    value: "20명",
    description: "고객사별 멤버 제한을 운영자가 조정할 수 있게 준비합니다.",
  },
  {
    id: "price",
    label: "가격 override",
    value: "별도 협의",
    description: "실제 결제 자동화가 아니라 운영 정책 값입니다.",
  },
];

export const SYSTEM_COMPANY_PLAN_POLICY_NOTES = [
  "결제 자동화는 연결하지 않습니다.",
  "R2 실시간 집계가 아니라 DB attachment metadata 기준 snapshot을 우선합니다.",
  "업로드 차단/초과 과금 정책은 후순위입니다.",
  "0.9.68에서 저장공간 사용량 집계 API skeleton과 연결합니다.",
] as const;
