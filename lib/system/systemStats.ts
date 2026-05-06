export type SystemStatTone = "neutral" | "success" | "warning" | "danger";

export type SystemStatCard = {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: SystemStatTone;
};

export type SystemCompanyUsageRow = {
  id: string;
  companyName: string;
  planLabel: string;
  workOrderCount: number;
  storageUsedLabel: string;
  storageLimitLabel: string;
  storagePercent: number;
  recentActivityLabel: string;
  riskLabel: string;
  riskTone: SystemStatTone;
};

export type SystemPlanDistributionItem = {
  id: string;
  label: string;
  companyCount: number;
  description: string;
};

export type SystemRiskItem = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  tone: SystemStatTone;
};

export const SYSTEM_STATS_OVERVIEW_CARDS: SystemStatCard[] = [
  {
    id: "company-count",
    label: "고객사",
    value: "3곳",
    description: "테스트 고객사와 초대 준비 고객사를 포함한 운영 대상",
    tone: "neutral",
  },
  {
    id: "active-company-count",
    label: "활성 고객사",
    value: "2곳",
    description: "최근 활동 또는 운영중 상태가 확인된 고객사",
    tone: "success",
  },
  {
    id: "storage-risk-count",
    label: "용량 주의",
    value: "1곳",
    description: "기본 제공 용량의 70% 이상 사용한 고객사 후보",
    tone: "warning",
  },
  {
    id: "system-action-count",
    label: "운영 확인",
    value: "4건",
    description: "요금제, 용량, 초대, 스토리지 점검 대상 합계",
    tone: "neutral",
  },
];

export const SYSTEM_COMPANY_USAGE_ROWS: SystemCompanyUsageRow[] = [
  {
    id: "company-apm-studio",
    companyName: "APM 스튜디오",
    planLabel: "Standard",
    workOrderCount: 128,
    storageUsedLabel: "3.8GB",
    storageLimitLabel: "5GB",
    storagePercent: 76,
    recentActivityLabel: "오늘 09:40",
    riskLabel: "용량 주의",
    riskTone: "warning",
  },
  {
    id: "company-dongdaemun-lab",
    companyName: "동대문 랩",
    planLabel: "Basic",
    workOrderCount: 42,
    storageUsedLabel: "1.1GB",
    storageLimitLabel: "3GB",
    storagePercent: 37,
    recentActivityLabel: "어제 17:12",
    riskLabel: "정상",
    riskTone: "success",
  },
  {
    id: "company-nueva-line",
    companyName: "누에바 라인",
    planLabel: "Premium",
    workOrderCount: 86,
    storageUsedLabel: "4.5GB",
    storageLimitLabel: "10GB",
    storagePercent: 45,
    recentActivityLabel: "3일 전",
    riskLabel: "활동 확인",
    riskTone: "neutral",
  },
];

export const SYSTEM_PLAN_DISTRIBUTION: SystemPlanDistributionItem[] = [
  {
    id: "basic",
    label: "Basic",
    companyCount: 1,
    description: "기본 통계와 저장소 확인 중심",
  },
  {
    id: "standard",
    label: "Standard",
    companyCount: 1,
    description: "분류/협력업체 통계 preview 대상",
  },
  {
    id: "premium",
    label: "Premium",
    companyCount: 1,
    description: "리오더/품질 통계 확장 대상",
  },
];

export const SYSTEM_RISK_ITEMS: SystemRiskItem[] = [
  {
    id: "storage-limit",
    title: "저장 용량 초과 위험",
    description: "APM 스튜디오가 기본 용량의 70% 이상을 사용 중입니다.",
    statusLabel: "확인 필요",
    tone: "warning",
  },
  {
    id: "inactive-company",
    title: "최근 활동일 확인",
    description: "누에바 라인의 최근 활동일이 3일 전으로 표시됩니다.",
    statusLabel: "관찰",
    tone: "neutral",
  },
  {
    id: "purge-candidate",
    title: "스토리지 purge 후보",
    description: "R2 실제 삭제 후보는 스토리지 화면에서 별도로 확인합니다.",
    statusLabel: "스토리지 연동",
    tone: "neutral",
  },
];

export function getSystemUsageSummary() {
  const totalWorkOrders = SYSTEM_COMPANY_USAGE_ROWS.reduce(
    (sum, row) => sum + row.workOrderCount,
    0,
  );
  const averageStoragePercent = Math.round(
    SYSTEM_COMPANY_USAGE_ROWS.reduce((sum, row) => sum + row.storagePercent, 0) /
      SYSTEM_COMPANY_USAGE_ROWS.length,
  );
  const riskCompanyCount = SYSTEM_COMPANY_USAGE_ROWS.filter(
    (row) => row.storagePercent >= 70,
  ).length;

  return {
    totalWorkOrders,
    averageStoragePercent,
    riskCompanyCount,
  };
}
