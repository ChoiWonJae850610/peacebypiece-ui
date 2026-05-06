export type PlanTier = "Basic" | "Standard" | "Growth" | "Premium" | "Enterprise";

export type FeatureFlagKey =
  | "stats.basic"
  | "stats.category"
  | "stats.factory"
  | "stats.reorder"
  | "stats.quality"
  | "stats.storageAdvanced"
  | "stats.export"
  | "stats.system"
  | "storage.trashPolicy"
  | "storage.purgeRequest"
  | "workorder.drawing"
  | "notification.policy"
  | "notification.service"
  | "ai.workorderNameSuggestion";

export type FeatureFlagPolicy = {
  key: FeatureFlagKey;
  title: string;
  minimumPlan: PlanTier | "System";
  status: "active" | "preview" | "planned" | "development";
  description: string;
};

export const PLAN_TIERS: readonly PlanTier[] = ["Basic", "Standard", "Growth", "Premium", "Enterprise"] as const;

export const FEATURE_FLAG_POLICIES: readonly FeatureFlagPolicy[] = [
  {
    key: "stats.basic",
    title: "Basic 통계",
    minimumPlan: "Basic",
    status: "active",
    description: "상태별 작업지시서, 기본 저장소, 최근 작업 흐름을 노출합니다.",
  },
  {
    key: "stats.category",
    title: "생산품유형 통계",
    minimumPlan: "Standard",
    status: "preview",
    description: "생산품유형별 작업지시서 수와 TOP 분포를 노출합니다.",
  },
  {
    key: "stats.factory",
    title: "협력업체/공장 성과",
    minimumPlan: "Standard",
    status: "preview",
    description: "공장별 발주 건수, 수량, 비용, 납기 지표로 확장합니다.",
  },
  {
    key: "stats.reorder",
    title: "리오더 통계",
    minimumPlan: "Growth",
    status: "preview",
    description: "2차 이상 반복 생산 흐름과 리오더 TOP 지표를 노출합니다.",
  },
  {
    key: "stats.quality",
    title: "검수/불량 통계",
    minimumPlan: "Premium",
    status: "planned",
    description: "검수 수량, 불량 수량, 불량 사유 저장 기준 확정 후 노출합니다.",
  },
  {
    key: "stats.storageAdvanced",
    title: "저장소 고급 통계",
    minimumPlan: "Premium",
    status: "planned",
    description: "active/trash/purged 용량, purge 실패율, 증가 추이를 노출합니다.",
  },
  {
    key: "stats.export",
    title: "통계 내보내기",
    minimumPlan: "Premium",
    status: "planned",
    description: "CSV export와 감사 로그를 함께 설계합니다.",
  },
  {
    key: "stats.system",
    title: "시스템 통계",
    minimumPlan: "System",
    status: "preview",
    description: "시스템관리자 전용 고객사 사용량, 요금제, 위험 신호 통계입니다.",
  },
  {
    key: "workorder.drawing",
    title: "작업지시서 드로잉",
    minimumPlan: "Premium",
    status: "planned",
    description: "태블릿 드로잉 라이브러리 도입 시 디자인 첨부 기능과 연결합니다.",
  },
  {
    key: "notification.policy",
    title: "알림 정책",
    minimumPlan: "Premium",
    status: "development",
    description: "상태 변경과 검토 요청 알림 정책은 개발중 기능으로 유지합니다.",
  },
  {
    key: "notification.service",
    title: "알림 서비스",
    minimumPlan: "Enterprise",
    status: "development",
    description: "실제 알림 발송 서비스는 이벤트 로그와 권한 체계 이후 연결합니다.",
  },
  {
    key: "ai.workorderNameSuggestion",
    title: "작업지시서 이름 추천 AI",
    minimumPlan: "Enterprise",
    status: "development",
    description: "초기 제품에서는 개발중 기능으로 표시하고 실제 추천 로직은 연결하지 않습니다.",
  },
] as const;

const PLAN_ORDER: readonly PlanTier[] = ["Basic", "Standard", "Growth", "Premium", "Enterprise"] as const;

export function canUsePlanFeature(plan: PlanTier, feature: FeatureFlagKey): boolean {
  const policy = FEATURE_FLAG_POLICIES.find((item) => item.key === feature);
  if (!policy) return false;
  if (policy.minimumPlan === "System") return false;
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(policy.minimumPlan);
}
