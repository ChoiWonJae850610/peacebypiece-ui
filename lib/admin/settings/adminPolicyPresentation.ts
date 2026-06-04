import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export type AdminPolicyStatus = "active" | "fixed" | "planned";

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
        value: "멤버관리에서 처리",
        description: "역할과 권한 편집은 멤버관리 상세 모달에서 관리하고 환경설정은 운영 기준을 확인하는 역할로 유지합니다.",
        status: "planned",
        statusLabel: "후속",
      },
    ],
    developmentFeatures: [
      {
        id: "notification-policy",
        title: "알림 정책",
        description: "상태 변경 이벤트와 사용자 권한 차단 기준이 안정화된 뒤 운영 알림 기준으로 연결합니다.",
      },
      {
        id: "notification-service",
        title: "알림 서비스",
        description: "이메일과 앱 알림 채널, 발송 로그를 운영 화면과 분리해 연결합니다.",
      },
      {
        id: "ai-workorder-name",
        title: "작업지시서 이름 추천 AI",
        description: "초기 제품에서는 핵심 업무 안정화를 우선하고 통계/권한/저장소 정리 이후 검토합니다.",
      },
    ],
    nextSteps: [
      "권한 편집은 멤버관리 상세 모달에서 처리하고 환경설정은 운영 기준 안내로 분리합니다.",
      "파일정책 모달에 흩어진 설명은 환경설정 메인 정책 카드로 점진 통합합니다.",
      "알림과 AI 항목은 운영 기준 안내로만 두고 실제 적용은 별도 기능 버전에서 분리합니다.",
    ],
  };
}
