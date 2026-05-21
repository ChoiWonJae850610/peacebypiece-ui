import { DEFAULT_PLAN_DEFINITIONS } from "@/lib/billing/defaultPlans";
import { DEFAULT_PLAN_CODES } from "@/lib/billing/planPolicy";
import { BYTES_PER_GB, formatStorageBytes } from "@/lib/billing/storageQuotaPolicy";
import { formatPbpKrw, formatPbpNumberWithUnit } from "@/lib/utils/formatters";

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

export type AdminBillingPlanOverview = {
  title: string;
  description: string;
  currentPlanLabel: string;
  planCodeLabel: string;
  billingStatusLabel: string;
  systemManagedLabel: string;
  dataSourceLabel: string;
  metrics: AdminBillingPlanMetric[];
  actions: AdminBillingPlanAction[];
  policyNotes: readonly string[];
};

export type AdminBillingPlanOverviewInput = {
  company?: {
    id?: string | null;
    name?: string | null;
    isActive?: boolean | null;
  } | null;
  settings?: {
    filePolicy?: {
      storageLimitGb?: number | null;
      warningThresholdPercent?: number | null;
      includeTrashInUsage?: boolean | null;
    } | null;
  } | null;
  ok?: boolean | null;
};

function normalizeStorageLimitBytes(input: AdminBillingPlanOverviewInput | undefined, fallbackBytes: number): number {
  const storageLimitGb = input?.settings?.filePolicy?.storageLimitGb;
  if (typeof storageLimitGb !== "number" || !Number.isFinite(storageLimitGb) || storageLimitGb <= 0) {
    return fallbackBytes;
  }

  return Math.trunc(storageLimitGb * BYTES_PER_GB);
}

function normalizeWarningThreshold(input: AdminBillingPlanOverviewInput | undefined): string {
  const threshold = input?.settings?.filePolicy?.warningThresholdPercent;
  if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold <= 0) {
    return "80%";
  }

  return `${Math.trunc(threshold)}%`;
}

function resolveCompanyLabel(input: AdminBillingPlanOverviewInput | undefined): string {
  const companyName = input?.company?.name?.trim();
  return companyName ? companyName : "현재 고객사";
}

const starterPlan = DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.code === DEFAULT_PLAN_CODES.STARTER) ?? DEFAULT_PLAN_DEFINITIONS[0];

export function buildAdminBillingPlanOverview(input?: AdminBillingPlanOverviewInput): AdminBillingPlanOverview {
  const fallbackPlan = starterPlan;
  const fallbackStorageBytes = fallbackPlan?.storage.includedStorageBytes ?? 5 * BYTES_PER_GB;
  const storageLimitBytes = normalizeStorageLimitBytes(input, fallbackStorageBytes);
  const companyLabel = resolveCompanyLabel(input);
  const dataSourceLabel = input?.ok ? "현재 고객사 설정 조회" : "현재 고객사 설정 없음";
  const includeTrashInUsage = input?.settings?.filePolicy?.includeTrashInUsage;

  return {
    title: `${companyLabel} 요금제·결제 현황`,
    description:
      "고객관리자는 현재 요금제, 저장공간 한도, 결제 연결 상태를 읽기 전용으로 확인하고 변경 요청은 시스템관리자에게 전달하는 흐름으로 시작합니다.",
    currentPlanLabel: fallbackPlan?.name ?? "Starter",
    planCodeLabel: fallbackPlan?.code ?? DEFAULT_PLAN_CODES.STARTER,
    billingStatusLabel: "결제 연동 전",
    systemManagedLabel: "시스템관리자 관리",
    dataSourceLabel,
    metrics: [
      {
        id: "current-plan",
        label: "현재 요금제",
        value: fallbackPlan?.name ?? "Starter",
        description: "정식 plan assignment 연결 전까지 기본 요금제 정책을 표시합니다.",
      },
      {
        id: "storage-limit",
        label: "저장공간 한도",
        value: formatStorageBytes(storageLimitBytes),
        description: "현재 고객사 파일 정책의 storageLimitGb를 우선 표시하고 없으면 기본 요금제 기준을 사용합니다.",
      },
      {
        id: "storage-warning",
        label: "저장공간 경고 기준",
        value: normalizeWarningThreshold(input),
        description: `휴지통 포함 기준은 ${includeTrashInUsage === false ? "미포함" : "포함"} 상태로 표시합니다.`,
      },
      {
        id: "member-limit",
        label: "멤버 한도",
        value: fallbackPlan ? formatPbpNumberWithUnit(fallbackPlan.members.includedMembers, "명") : "3명",
        description: "승인된 company_members 수와 실제 멤버 한도 override는 후속 버전에서 연결합니다.",
      },
      {
        id: "monthly-price",
        label: "월 이용료",
        value: fallbackPlan ? formatPbpKrw(fallbackPlan.priceKrw) : "29,000원",
        description: "정식 결제 연동 전까지는 참고용 정책값으로만 사용합니다.",
      },
    ],
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
    ],
    policyNotes: [
      "고객관리자 화면에서는 요금제와 용량을 직접 수정하지 않습니다.",
      "저장공간 한도는 현재 고객사 설정 응답을 우선하고 없으면 기본 요금제 정책을 사용합니다.",
      "정식 결제 API, 카드 등록, 자동 청구는 후순위입니다.",
      "요금제·결제 화면은 현재 읽기 전용 조회 단계입니다.",
    ] as const,
  };
}

