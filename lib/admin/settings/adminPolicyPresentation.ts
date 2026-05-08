import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export type AdminPolicyStatus = "active" | "fixed" | "planned" | "development";

export type AdminPolicySummaryItem = {
  id: string;
  title: string;
  value: string;
  description: string;
  status: AdminPolicyStatus;
  statusLabel: string;
};

export type AdminPolicyDevelopmentFeature = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
};

export type AdminPolicyOverviewViewModel = {
  filePolicies: AdminPolicySummaryItem[];
  workspacePolicies: AdminPolicySummaryItem[];
  developmentFeatures: AdminPolicyDevelopmentFeature[];
  nextSteps: string[];
};

function formatBoolean(value: boolean): string {
  return value ? "포함" : "제외";
}

export function buildAdminPolicyOverviewViewModel(settings: CompanySettings): AdminPolicyOverviewViewModel {
  const storageLimitGb = settings.filePolicy.storageLimitGb;
  const warningThresholdPercent = settings.filePolicy.warningThresholdPercent;
  const includeTrashInUsage = settings.filePolicy.includeTrashInUsage;

  return {
    filePolicies: [
      {
        id: "delete-mode",
        title: "삭제 방식",
        value: "휴지통 보관 후 삭제 요청",
        description: "작업지시서와 첨부파일은 즉시 R2에서 제거하지 않고 DB soft delete와 휴지통 상태를 먼저 거칩니다.",
        status: "fixed",
        statusLabel: "고정",
      },
      {
        id: "storage-limit",
        title: "기본 용량 한도",
        value: `${storageLimitGb}GB`,
        description: "고객사별 기본 저장소 한도입니다. 요금제/시스템관리자 override와 연결할 수 있도록 환경설정 메인에 노출합니다.",
        status: "active",
        statusLabel: "사용중",
      },
      {
        id: "trash-usage",
        title: "휴지통 용량 포함",
        value: formatBoolean(includeTrashInUsage),
        description: "휴지통 파일도 실제 R2 객체가 남아 있으므로 기본적으로 저장소 사용량에 포함합니다.",
        status: "active",
        statusLabel: "사용중",
      },
      {
        id: "warning-threshold",
        title: "용량 주의 기준",
        value: `${warningThresholdPercent}%`,
        description: "저장소 경고 기준을 별도 파일정책 모달이 아니라 환경설정 메인에서 바로 확인하게 합니다.",
        status: "active",
        statusLabel: "사용중",
      },
    ],
    workspacePolicies: [
      {
        id: "policy-location",
        title: "정책 표시 위치",
        value: "환경설정 메인",
        description: "삭제방식, 용량 한도, 휴지통 포함 여부, 용량 주의 기준은 고객사 관리자 환경설정의 중심 정책으로 관리합니다.",
        status: "fixed",
        statusLabel: "정리됨",
      },
      {
        id: "history-policy",
        title: "로그/히스토리 노출",
        value: "업무 화면과 분리",
        description: "고객관리자 메인에서는 업무 요약을 우선하고 로그성 이벤트는 시스템/추적 화면으로 분리합니다.",
        status: "planned",
        statusLabel: "후속",
      },
      {
        id: "permission-ui",
        title: "권한 설정 UI",
        value: "DB seed 이후 연결",
        description: "0.9.215 permission code 기준을 먼저 사용하고 실제 권한 편집 UI는 DB seed와 API 차단 이후 연결합니다.",
        status: "planned",
        statusLabel: "후속",
      },
    ],
    developmentFeatures: [
      {
        id: "notification-policy",
        title: "알림 정책",
        description: "상태 변경 이벤트와 사용자 권한 차단 기준이 고정된 뒤 활성화합니다.",
        statusLabel: "개발중",
      },
      {
        id: "notification-service",
        title: "알림 서비스",
        description: "이메일/앱 알림 채널과 발송 로그가 준비된 뒤 연결합니다.",
        statusLabel: "개발중",
      },
      {
        id: "ai-workorder-name",
        title: "작업지시서 이름 추천 AI",
        description: "초기 제품에서는 핵심 기능이 아니므로 통계/권한/저장소 안정화 이후 검토합니다.",
        statusLabel: "개발중",
      },
    ],
    nextSteps: [
      "권한 UI는 permission/feature flag DB seed 반영 이후 실제 저장과 연결합니다.",
      "파일정책 모달에 흩어진 설명은 환경설정 메인 정책 카드로 점진 통합합니다.",
      "알림/AI 기능은 개발중 표시를 유지하고 실제 업무 흐름 안정화 이후 활성화합니다.",
    ],
  };
}
