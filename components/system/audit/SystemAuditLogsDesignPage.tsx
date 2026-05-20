import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";

import {
  SYSTEM_AUDIT_LOG_API_DECISIONS,
  SYSTEM_AUDIT_LOG_DB_DECISIONS,
  SYSTEM_AUDIT_LOG_IMPLEMENTATION_STEPS,
  SYSTEM_AUDIT_LOG_LAYER_DECISIONS,
  SYSTEM_AUDIT_LOG_SCHEMA_FIELDS,
  SYSTEM_AUDIT_LOG_SCOPES,
  SYSTEM_AUDIT_LOG_WRITE_DECISIONS,
  SYSTEM_AUDIT_LOG_TARGETS,
  type SystemAuditLogEventLevel,
} from "@/lib/system/audit/systemAuditLogs.design";
import type { SystemAuditLogFilter, SystemAuditLogViewModel } from "@/lib/system/audit/types";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";

type SystemAuditLogsDesignPageProps = {
  activeFilter?: SystemAuditLogFilter;
  auditLogViewModels?: SystemAuditLogViewModel[];
};

const SYSTEM_AUDIT_TARGET_OPTIONS = [
  { value: "all", label: "전체 대상" },
  { value: "company", label: "고객사" },
  { value: "member", label: "멤버" },
  { value: "invitation", label: "초대" },
  { value: "plan", label: "요금제" },
  { value: "storage", label: "저장소" },
  { value: "work_order", label: "작업지시서" },
  { value: "file", label: "문서·디자인" },
  { value: "memo", label: "메모" },
  { value: "settings", label: "환경설정" },
  { value: "auth", label: "인증" },
  { value: "system", label: "시스템" },
] as const;

const SYSTEM_AUDIT_SEVERITY_OPTIONS = [
  { value: "all", label: "전체 심각도" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "critical", label: "critical" },
] as const;

function getLevelTone(level: SystemAuditLogEventLevel): AdminStatusBadgeTone {
  if (level === "critical") return "danger";
  if (level === "high") return "warning";
  if (level === "medium") return "info";
  return "neutral";
}

const AUDIT_LOG_TABLE_COLUMNS: AdminTableColumn<SystemAuditLogViewModel>[] = [
  {
    key: "occurredAt",
    label: "발생 시각",
    className: "font-mono text-[11px] text-[var(--pbp-text-muted)]",
    render: (log) => log.occurredAt,
  },
  {
    key: "eventType",
    label: "이벤트",
    className: "font-mono text-[11px] text-[var(--pbp-text-primary)]",
    render: (log) => log.eventType,
  },
  {
    key: "target",
    label: "대상",
    className: "text-[var(--pbp-text-muted)]",
    render: (log) => log.targetLabel,
  },
  {
    key: "actor",
    label: "행위자",
    className: "text-[var(--pbp-text-muted)]",
    render: (log) => log.actorLabel,
  },
  {
    key: "severity",
    label: "심각도",
    className: "text-center",
    headerClassName: "text-center",
    render: (log) => <AdminStatusBadge tone={getLevelTone(log.severity)}>{log.severity}</AdminStatusBadge>,
  },
  {
    key: "summary",
    label: "요약",
    className: "leading-5 text-[var(--pbp-text-primary)]",
    render: (log) => log.summary,
  },
];

const AUDIT_SCHEMA_FIELD_TABLE_COLUMNS: AdminTableColumn<(typeof SYSTEM_AUDIT_LOG_SCHEMA_FIELDS)[number]>[] = [
  {
    key: "name",
    label: "필드",
    className: "font-mono text-[11px] text-[var(--pbp-text-primary)]",
    render: (field) => field.name,
  },
  {
    key: "purpose",
    label: "용도",
    className: "leading-5 text-stone-600",
    render: (field) => field.purpose,
  },
  {
    key: "required",
    label: "필수",
    className: "text-center",
    headerClassName: "text-center",
    render: (field) => (
      <AdminStatusBadge tone={field.required ? "success" : "neutral"} size="xs">
        {field.required ? "필수" : "선택"}
      </AdminStatusBadge>
    ),
  },
];

export default function SystemAuditLogsDesignPage({
  activeFilter = {},
  auditLogViewModels = [],
}: SystemAuditLogsDesignPageProps) {
  const activeTargetType = activeFilter.targetType || "all";
  const activeSeverity = activeFilter.severity || "all";

  return (
    <SystemShell>
        <header className={SYSTEM_HEADER_PANEL_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className={SYSTEM_EYEBROW_CLASS}>
                SYSTEM AUDIT LOGS
              </p>
              <div className="space-y-2">
                <h1 className={SYSTEM_TITLE_CLASS}>시스템 감사 로그 설계</h1>
                <p className={SYSTEM_SUBTITLE_CLASS}>
                  고객관리자 히스토리는 업무 이해용 최소 이력으로 축소하고, 시스템관리자 화면에서는 권한·요금제·저장소·삭제 처리 같은 운영 이벤트를 감사 로그로 분리합니다.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <AdminStatusBadge tone="primary">v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system">시스템 홈</AdminLinkButton>
            </div>
          </div>
        </header>


        <section className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>감사 로그 조회</h2>
              <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
                /api/system/audit-logs와 audit_logs repository를 연결했습니다. 0.10.75부터 초대 생성, 고객사 생성, 멤버 승인/거절/권한 변경, 요금제 변경 이벤트 빌더를 같은 감사 로그 계층에서 관리합니다.
              </p>
            </div>
            <code className="w-fit rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              GET /api/system/audit-logs
            </code>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_160px_auto]" method="get">
            <input
              name="query"
              defaultValue={activeFilter.query || ""}
              placeholder="요약, 이벤트 코드, 대상 ID 검색"
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-stone-400"
            />
            <select
              name="targetType"
              defaultValue={activeTargetType}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-stone-400"
            >
              {SYSTEM_AUDIT_TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="severity"
              defaultValue={activeSeverity}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-stone-400"
            >
              {SYSTEM_AUDIT_SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <AdminButton type="submit" variant="primary" size="md" className="rounded-2xl">
              조회
            </AdminButton>
          </form>

          <AdminTable
            items={auditLogViewModels}
            columns={AUDIT_LOG_TABLE_COLUMNS}
            getRowKey={(log) => log.id}
            emptyLabel="아직 표시할 감사 로그가 없습니다."
            gridTemplateColumns="140px 160px 1fr 1fr 90px 1.7fr"
            rowBaseClassName="grid w-full gap-3 px-4 py-3 text-left text-xs md:items-center"
            className="mt-5"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {SYSTEM_AUDIT_LOG_SCOPES.map((scope) => (
            <article key={scope.id} className={SYSTEM_CARD_CLASS}>
              <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">scope</p>
              <h2 className="mt-3 text-lg font-semibold text-stone-950">{scope.title}</h2>
              <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>{scope.description}</p>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-600">
                {scope.examples.map((example) => (
                  <li key={example}>· {example}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>감사 대상 분류</h2>
            <p className={SYSTEM_BODY_TEXT_CLASS}>
              이벤트 코드는 화면 문구가 아니라 domain.action 형식의 구조화 코드로 관리합니다. 화면 표시 문구는 후속 i18n 계층에서 변환합니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SYSTEM_AUDIT_LOG_TARGETS.map((target) => (
              <article key={target.id} className={SYSTEM_MUTED_CARD_CLASS}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{target.label}</h3>
                  <AdminStatusBadge tone={getLevelTone(target.level)}>{target.level}</AdminStatusBadge>
                </div>
                <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{target.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {target.examples.map((example) => (
                    <code key={example} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-500">
                      {example}
                    </code>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>0.10.13 쓰기 연결 기준</h2>
            <p className={SYSTEM_BODY_TEXT_CLASS}>
              첫 쓰기 지점은 시스템관리자 저장소 실제 삭제 API로 제한했습니다. 삭제 처리 자체가 감사 로그 실패에 막히지 않도록 안전 기록 방식을 사용합니다.
            </p>
          </div>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {SYSTEM_AUDIT_LOG_WRITE_DECISIONS.map((decision) => (
              <li key={decision} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
                {decision}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>확정 스키마</h2>
            <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
              0.10.10에서 audit_logs 테이블을 확정했습니다. 아래 필드는 DB patch와 full_reset에 반영된 기준입니다.
            </p>
            <AdminTable
              items={SYSTEM_AUDIT_LOG_SCHEMA_FIELDS}
              columns={AUDIT_SCHEMA_FIELD_TABLE_COLUMNS}
              getRowKey={(field) => field.name}
              emptyLabel="표시할 감사 로그 스키마 필드가 없습니다."
              gridTemplateColumns="140px 1fr 80px"
              rowBaseClassName="grid w-full gap-3 px-4 py-3 text-left text-xs md:items-center"
              className="mt-4"
            />
          </article>


          <article className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>DB 설계 확정 기준</h2>
            <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
              고객관리자 history_logs와 시스템관리자 audit_logs를 분리해 운영 로그의 책임 범위를 명확히 합니다.
            </p>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-600">
              {SYSTEM_AUDIT_LOG_DB_DECISIONS.map((decision) => (
                <li key={decision} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                  {decision}
                </li>
              ))}
            </ul>
          </article>




          <article className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>0.10.12 API 연결 기준</h2>
            <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
              조회 API와 화면 목록을 연결하되, 쓰기 이벤트 삽입은 다음 단계로 분리해 기존 업무 흐름을 건드리지 않습니다.
            </p>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-600">
              {SYSTEM_AUDIT_LOG_API_DECISIONS.map((decision) => (
                <li key={decision} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                  {decision}
                </li>
              ))}
            </ul>
          </article>

          <article className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>0.10.11 계층 분리 기준</h2>
            <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
              감사 로그의 DB 접근, 필터, 화면 변환을 분리해 후속 API와 쓰기 연결이 기존 작업지시서·저장소 흐름을 침범하지 않도록 했습니다.
            </p>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-600">
              {SYSTEM_AUDIT_LOG_LAYER_DECISIONS.map((decision) => (
                <li key={decision} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                  {decision}
                </li>
              ))}
            </ul>
          </article>

          <article className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>구현 순서</h2>
            <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
              작업지시서·저장소·휴지통의 정상 동작 흐름을 건드리지 않고, 시스템관리자 감사 로그를 별도 축으로 점진 연결합니다.
            </p>
            <div className="mt-4 space-y-3">
              {SYSTEM_AUDIT_LOG_IMPLEMENTATION_STEPS.map((step) => (
                <div key={step.versionHint} className={SYSTEM_MUTED_CARD_CLASS}>
                  <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{step.versionHint}</p>
                  <h3 className="mt-2 text-sm font-semibold text-stone-950">{step.title}</h3>
                  <p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>{step.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
    </SystemShell>
  );
}
