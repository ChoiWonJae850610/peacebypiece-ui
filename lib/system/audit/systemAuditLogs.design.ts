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
    examples: ["work_order.status_changed", "work_order.deleted", "work_order.restored"],
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
    title: "repository/actionFlow 분리 완료",
    description:
      "createSystemAuditLogSafe, listSystemAuditLogs, selector, filter action, view model 변환을 lib/system/audit 계층으로 분리했습니다.",
  },
  {
    versionHint: "0.10.12",
    title: "읽기 API와 화면 연결 완료",
    description:
      "/api/system/audit-logs 읽기 API와 /system/audit-logs 목록 조회·검색·대상 유형·심각도 필터를 연결했습니다. 실제 쓰기 지점은 후속 버전에서 점진 연결합니다.",
  },
  {
    versionHint: "0.10.13",
    title: "저장소 실제 삭제 감사 로그 연결",
    description:
      "시스템관리자 저장소 실제 삭제 API에서 storage.purge_run 감사 로그를 기록합니다. 고객사, 초대, 요금제·용량, 멤버 권한 변경 지점은 후속 버전에서 점진 연결합니다.",
  },
  {
    versionHint: "0.10.14",
    title: "작업지시서·첨부파일 삭제/복원 감사 로그 연결",
    description:
      "작업지시서 삭제·복원과 개별 첨부파일 삭제·복원 액션을 audit_logs에 기록합니다.",
  },
  {
    versionHint: "0.10.15",
    title: "작업지시서 상태 변경 감사 로그 연결",
    description:
      "작업지시서 workflowState 변경을 work_order.status_changed 이벤트로 기록합니다. 기존 고객관리자 history_logs 상태 이력은 유지하고, 시스템관리자 감사 로그 원장에 동일 상태 변경을 구조화해 남깁니다.",
  },
];


export const SYSTEM_AUDIT_LOG_DB_DECISIONS = [
  "시스템관리자 감사 원장은 history_logs와 분리해 audit_logs 테이블로 둔다.",
  "history_logs는 고객관리자 업무 흐름 요약용 최소 이력으로 유지한다.",
  "event_type은 화면 문구가 아닌 domain.action 코드 형식으로 저장한다.",
  "metadata는 변경 전후 값, 파일 수, 용량, 실패 코드 같은 구조화 JSON만 저장한다.",
  "ip_address는 선택값으로 두고 화면 필터와 요약에는 기본 노출하지 않는다.",
] as const;


export const SYSTEM_AUDIT_LOG_LAYER_DECISIONS = [
  "repository.ts는 audit_logs DB 읽기·쓰기와 safe wrapper만 담당한다.",
  "actionFlow.ts는 필터 적용과 화면용 view model 변환만 담당한다.",
  "selectors.ts는 검색어, 고객사, 대상 유형, 심각도 필터를 순수 함수로 처리한다.",
  "types.ts는 DB schema와 화면 사이에서 공유하는 구조화 타입을 제공한다.",
  "쓰기 연결은 각 도메인 actionFlow에서 createSystemAuditLogSafe를 호출하는 방식으로 후속 버전에서 붙인다.",
] as const;

export const SYSTEM_AUDIT_LOG_API_DECISIONS = [
  "GET /api/system/audit-logs는 audit_logs 원장을 읽는 시스템관리자 전용 조회 API로 둔다.",
  "API route는 lib/system/audit/api/routeHandlers.ts로 위임하고 app/api route는 얇게 유지한다.",
  "화면 조회는 repository 결과를 actionFlow에서 view model로 변환해 표시한다.",
  "query 검색은 목록을 가져온 뒤 selector에서 처리하고, companyId·targetType·eventType·severity는 repository 조회 조건으로 넘긴다.",
  "아직 실제 이벤트 쓰기 지점은 연결하지 않아 빈 목록이 정상 상태일 수 있다.",
] as const;


export const SYSTEM_AUDIT_LOG_WRITE_DECISIONS = [
  "0.10.13의 첫 쓰기 지점은 시스템관리자 저장소 실제 삭제 처리로 제한한다.",
  "쓰기 실패가 기존 삭제 처리를 막지 않도록 createSystemAuditLogSafe를 사용한다.",
  "storage.purge_run 이벤트는 완료·실패 개수와 후보 수를 metadata에 구조화해서 남긴다.",
  "실제 R2 key 원문은 목록 화면 기본 노출 대상이 아니므로 보유 여부만 요약한다.",
  "0.10.14부터 작업지시서·첨부파일 삭제/복원 이벤트를 기록한다.",
  "0.10.15부터 작업지시서 workflowState 변경을 work_order.status_changed 이벤트로 기록한다.",
  "고객사, 초대, 요금제·용량, 멤버 권한 변경 로그는 후속 버전에서 연결한다.",
] as const;
