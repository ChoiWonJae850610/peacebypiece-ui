export type SystemAuditLogScopeId =
  | "systemAdminOnly"
  | "customerVisibleMinimal";

export type SystemAuditLogTargetId =
  | "company"
  | "member"
  | "invitation"
  | "plan"
  | "storage"
  | "workOrder"
  | "file"
  | "settings"
  | "auth";

export type SystemAuditLogEventLevel = "low" | "medium" | "high" | "critical";

export type SystemAuditLogScope = {
  id: SystemAuditLogScopeId;
  title: string;
  description: string;
  examples: string[];
};

export type SystemAuditLogTarget = {
  id: SystemAuditLogTargetId;
  label: string;
  description: string;
  level: SystemAuditLogEventLevel;
  examples: string[];
};

export type SystemAuditLogSchemaField = {
  name: string;
  purpose: string;
  required: boolean;
};

export type SystemAuditLogImplementationStep = {
  versionHint: string;
  title: string;
  description: string;
};

export const SYSTEM_AUDIT_LOG_SCOPES: SystemAuditLogScope[] = [
  {
    id: "systemAdminOnly",
    title: "시스템관리자 감사 로그",
    description:
      "고객사 전체에 영향을 줄 수 있는 운영 변경, 권한 변경, 용량·요금제 변경, 영구 삭제 처리처럼 시스템관리자만 확인해야 하는 원장 로그입니다.",
    examples: [
      "고객사 생성·중지·재활성화",
      "요금제·저장용량 override 변경",
      "영구 삭제 승인·실행·실패",
      "시스템관리자 또는 고객관리자 권한 변경",
    ],
  },
  {
    id: "customerVisibleMinimal",
    title: "고객관리자 최소 이력",
    description:
      "고객관리자가 자기 회사의 작업 흐름을 이해하는 데 필요한 최소 이력입니다. 시스템 운영 판단용 상세 로그와 분리합니다.",
    examples: [
      "작업지시서 상태 변경 요약",
      "첨부파일 업로드·삭제 요약",
      "협력업체 정보 변경 요약",
      "검토·발주·입고·완료 흐름 요약",
    ],
  },
];

export const SYSTEM_AUDIT_LOG_TARGETS: SystemAuditLogTarget[] = [
  {
    id: "company",
    label: "고객사",
    description: "고객사 생성, 중지, 재활성화, 기본 정책 변경을 기록합니다.",
    level: "high",
    examples: ["company.created", "company.suspended", "company.reactivated"],
  },
  {
    id: "member",
    label: "멤버·권한",
    description: "시스템관리자, 고객관리자, 디자이너, 검수자 권한 변경을 기록합니다.",
    level: "critical",
    examples: ["member.role_changed", "member.disabled", "member.access_restored"],
  },
  {
    id: "invitation",
    label: "초대",
    description: "초대 생성, 재발송, 만료, 수락, 취소 흐름을 기록합니다.",
    level: "medium",
    examples: ["invite.created", "invite.accepted", "invite.expired"],
  },
  {
    id: "plan",
    label: "요금제·용량",
    description: "요금제, 좌석 수, 저장용량 한도와 override 변경을 기록합니다.",
    level: "critical",
    examples: ["plan.changed", "storage_limit.overridden", "seat_limit.changed"],
  },
  {
    id: "storage",
    label: "저장소",
    description: "휴지통, 삭제 요청, purge 후보, 실제 R2 삭제 처리 결과를 기록합니다.",
    level: "critical",
    examples: ["trash.restore_requested", "purge.approved", "purge.failed"],
  },
  {
    id: "workOrder",
    label: "작업지시서",
    description: "상태 변경, 리오더 생성, 삭제·복원 요약을 기록합니다.",
    level: "medium",
    examples: ["workorder.status_changed", "workorder.reordered", "workorder.restored"],
  },
  {
    id: "file",
    label: "문서·디자인·메모",
    description: "파일 업로드, 삭제, 복원, 다운로드 실패 같은 파일 단위 이벤트를 기록합니다.",
    level: "medium",
    examples: ["file.uploaded", "file.deleted", "memo.restored"],
  },
  {
    id: "settings",
    label: "환경설정",
    description: "언어, 색상, 알림, 저장 정책 등 고객사 설정 변경을 기록합니다.",
    level: "low",
    examples: ["settings.language_changed", "settings.notification_changed"],
  },
  {
    id: "auth",
    label: "인증·접근",
    description: "로그인, 접근 거부, 세션 만료 같은 보안 이벤트를 기록합니다.",
    level: "high",
    examples: ["auth.login", "auth.denied", "session.expired"],
  },
];

export const SYSTEM_AUDIT_LOG_SCHEMA_FIELDS: SystemAuditLogSchemaField[] = [
  { name: "id", purpose: "감사 로그 고유 ID", required: true },
  { name: "created_at", purpose: "이벤트 발생 시각", required: true },
  { name: "actor_user_id", purpose: "행위자 사용자 ID", required: false },
  { name: "actor_role", purpose: "system_admin, customer_admin 등 구조화된 행위자 역할", required: true },
  { name: "company_id", purpose: "대상 고객사 ID. 시스템 전체 이벤트는 null 허용", required: false },
  { name: "target_type", purpose: "company, member, plan, storage, work_order 등 대상 유형", required: true },
  { name: "target_id", purpose: "대상 레코드 ID", required: false },
  { name: "event_type", purpose: "domain.action 형식의 이벤트 코드", required: true },
  { name: "severity", purpose: "low, medium, high, critical", required: true },
  { name: "summary", purpose: "목록 표시용 짧은 요약", required: true },
  { name: "metadata", purpose: "변경 전후 값, 파일 수, 용량 등 구조화 JSON", required: false },
  { name: "request_id", purpose: "API 요청 추적 ID", required: false },
  { name: "ip_address", purpose: "접근 위치 추적용 inet 값. 필요 시 null 허용", required: false },
];

export const SYSTEM_AUDIT_LOG_IMPLEMENTATION_STEPS: SystemAuditLogImplementationStep[] = [
  {
    versionHint: "0.10.10",
    title: "audit_logs DB 설계 확정",
    description:
      "0.10.10에서 시스템관리자 원장 로그를 별도 audit_logs 테이블로 확정합니다. 고객관리자 history_logs는 최소 업무 이력으로 유지합니다.",
  },
  {
    versionHint: "0.10.11",
    title: "repository/actionFlow 분리",
    description:
      "createSystemAuditLogSafe, listSystemAuditLogs, filter view model을 lib/system/audit 계층으로 분리합니다.",
  },
  {
    versionHint: "0.10.12",
    title: "읽기 API와 화면 연결",
    description:
      "/api/system/audit-logs 읽기 API를 붙이고 /system/audit-logs에서 필터, 검색, 기간 선택을 연결합니다.",
  },
  {
    versionHint: "0.10.13",
    title: "쓰기 지점 점진 연결",
    description:
      "고객사, 초대, 요금제·용량, 저장소 purge, 멤버 권한 변경 지점부터 audit log 작성을 붙입니다.",
  },
];


export const SYSTEM_AUDIT_LOG_DB_DECISIONS = [
  "시스템관리자 감사 원장은 history_logs와 분리해 audit_logs 테이블로 둔다.",
  "history_logs는 고객관리자 업무 흐름 요약용 최소 이력으로 유지한다.",
  "event_type은 화면 문구가 아닌 domain.action 코드 형식으로 저장한다.",
  "metadata는 변경 전후 값, 파일 수, 용량, 실패 코드 같은 구조화 JSON만 저장한다.",
  "ip_address는 선택값으로 두고 화면 필터와 요약에는 기본 노출하지 않는다.",
] as const;
