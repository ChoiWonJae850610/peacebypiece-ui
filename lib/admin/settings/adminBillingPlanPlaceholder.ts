import { DEFAULT_PLAN_DEFINITIONS } from "@/lib/billing/defaultPlans";
import { DEFAULT_PLAN_CODES } from "@/lib/billing/planPolicy";

export type AdminBillingPlanMetric = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type AdminBillingPlanAction = {
  id: string;
  label: string;
  statusLabel: string;
  description: string;
};

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatStorage(bytes: number): string {
  const gib = bytes / 1024 / 1024 / 1024;
  return `${gib.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}GB`;
}

const starterPlan = DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.code === DEFAULT_PLAN_CODES.STARTER) ?? DEFAULT_PLAN_DEFINITIONS[0];

export const ADMIN_BILLING_PLAN_PLACEHOLDER = {
  title: "요금제·결제는 시스템관리자 관리 기준입니다.",
  description:
    "고객관리자는 현재 요금제, 저장공간 한도, 결제 연결 상태를 읽기 전용으로 확인하고 변경 요청은 시스템관리자에게 전달하는 흐름으로 시작합니다.",
  currentPlanLabel: starterPlan?.name ?? "Starter",
  planCodeLabel: starterPlan?.code ?? DEFAULT_PLAN_CODES.STARTER,
  billingStatusLabel: "결제 연동 전",
  systemManagedLabel: "시스템관리자 관리",
  metrics: [
    {
      id: "current-plan",
      label: "현재 요금제",
      value: starterPlan?.name ?? "Starter",
      description: "실제 운영에서는 companies.plan_code 또는 company_plan_assignments 기준으로 표시합니다.",
    },
    {
      id: "storage-limit",
      label: "저장공간 한도",
      value: starterPlan ? formatStorage(starterPlan.storage.includedStorageBytes) : "5GB",
      description: "고객사별 override가 있으면 시스템관리자 설정값을 우선 표시합니다.",
    },
    {
      id: "member-limit",
      label: "멤버 한도",
      value: starterPlan ? `${starterPlan.members.includedMembers}명` : "3명",
      description: "승인된 company_members 수와 함께 후속 버전에서 연결합니다.",
    },
    {
      id: "monthly-price",
      label: "월 이용료",
      value: starterPlan ? formatKrw(starterPlan.priceKrw) : "29,000원",
      description: "정식 결제 연동 전까지는 참고용 정책값으로만 사용합니다.",
    },
  ] satisfies AdminBillingPlanMetric[],
  actions: [
    {
      id: "request-plan-change",
      label: "요금제 변경 요청",
      statusLabel: "후속 연결",
      description: "고객관리자 직접 변경이 아니라 시스템관리자 검토 요청으로 처리합니다.",
    },
    {
      id: "request-storage-upgrade",
      label: "저장공간 증설 요청",
      statusLabel: "후속 연결",
      description: "저장소 사용량과 요금제 한도를 함께 확인한 뒤 시스템관리자가 override를 적용합니다.",
    },
    {
      id: "billing-contact",
      label: "결제 문의",
      statusLabel: "안내 전용",
      description: "결제수단, 세금계산서, 청구 정보 변경은 정식 결제 연동 이후 확장합니다.",
    },
  ] satisfies AdminBillingPlanAction[],
  policyNotes: [
    "고객관리자 화면에서는 요금제와 용량을 직접 수정하지 않습니다.",
    "저장공간 한도는 system billing 또는 companies override 정책을 우선합니다.",
    "정식 결제 API, 카드 등록, 자동 청구는 후순위입니다.",
    "요금제·결제 화면은 현재 읽기 전용 placeholder 단계입니다.",
  ] as const,
} as const;
