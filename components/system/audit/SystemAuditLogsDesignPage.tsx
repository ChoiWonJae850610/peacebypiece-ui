import Link from "next/link";

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

function getLevelClassName(level: SystemAuditLogEventLevel) {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (level === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "medium") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-stone-200 bg-stone-100 text-stone-600";
}

export default function SystemAuditLogsDesignPage({
  activeFilter = {},
  auditLogViewModels = [],
}: SystemAuditLogsDesignPageProps) {
  const activeTargetType = activeFilter.targetType || "all";
  const activeSeverity = activeFilter.severity || "all";

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM AUDIT LOGS
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">시스템 감사 로그 설계</h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  고객관리자 히스토리는 업무 이해용 최소 이력으로 축소하고, 시스템관리자 화면에서는 권한·요금제·저장소·삭제 처리 같은 운영 이벤트를 감사 로그로 분리합니다.
                </p>
              </div>
            </div>
            <Link
              href="/system"
              className="w-fit rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              시스템 홈
            </Link>
          </div>
        </header>


        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">감사 로그 조회</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
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
            <button
              type="submit"
              className="rounded-2xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              조회
            </button>
          </form>

          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">발생 시각</th>
                  <th className="px-3 py-2 font-semibold">이벤트</th>
                  <th className="px-3 py-2 font-semibold">대상</th>
                  <th className="px-3 py-2 font-semibold">행위자</th>
                  <th className="px-3 py-2 text-center font-semibold">심각도</th>
                  <th className="px-3 py-2 font-semibold">요약</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {auditLogViewModels.length > 0 ? (
                  auditLogViewModels.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-stone-600">{log.occurredAt}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-stone-700">{log.eventType}</td>
                      <td className="px-3 py-3 text-stone-600">{log.targetLabel}</td>
                      <td className="px-3 py-3 text-stone-600">{log.actorLabel}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getLevelClassName(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-3 py-3 leading-5 text-stone-700">{log.summary}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-stone-500">
                      아직 표시할 감사 로그가 없습니다. 저장소 실제 삭제, 작업지시서 삭제·복원, 초대 생성, 고객사 생성, 멤버 권한 변경을 실행하면 이 목록에 운영 이벤트가 표시됩니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {SYSTEM_AUDIT_LOG_SCOPES.map((scope) => (
            <article key={scope.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">scope</p>
              <h2 className="mt-3 text-lg font-semibold text-stone-950">{scope.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{scope.description}</p>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-600">
                {scope.examples.map((example) => (
                  <li key={example}>· {example}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">감사 대상 분류</h2>
            <p className="text-sm leading-6 text-stone-600">
              이벤트 코드는 화면 문구가 아니라 domain.action 형식의 구조화 코드로 관리합니다. 화면 표시 문구는 후속 i18n 계층에서 변환합니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SYSTEM_AUDIT_LOG_TARGETS.map((target) => (
              <article key={target.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{target.label}</h3>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getLevelClassName(target.level)}`}>
                    {target.level}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-600">{target.description}</p>
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

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">0.10.13 쓰기 연결 기준</h2>
            <p className="text-sm leading-6 text-stone-600">
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
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">확정 스키마</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              0.10.10에서 audit_logs 테이블을 확정했습니다. 아래 필드는 DB patch와 full_reset에 반영된 기준입니다.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">필드</th>
                    <th className="px-3 py-2 font-semibold">용도</th>
                    <th className="px-3 py-2 text-center font-semibold">필수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {SYSTEM_AUDIT_LOG_SCHEMA_FIELDS.map((field) => (
                    <tr key={field.name}>
                      <td className="px-3 py-2 font-mono text-[11px] text-stone-700">{field.name}</td>
                      <td className="px-3 py-2 leading-5 text-stone-600">{field.purpose}</td>
                      <td className="px-3 py-2 text-center text-stone-600">{field.required ? "Y" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>


          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">DB 설계 확정 기준</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
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




          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">0.10.12 API 연결 기준</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
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

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">0.10.11 계층 분리 기준</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
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

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">구현 순서</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              작업지시서·저장소·휴지통의 정상 동작 흐름을 건드리지 않고, 시스템관리자 감사 로그를 별도 축으로 점진 연결합니다.
            </p>
            <div className="mt-4 space-y-3">
              {SYSTEM_AUDIT_LOG_IMPLEMENTATION_STEPS.map((step) => (
                <div key={step.versionHint} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-500">{step.versionHint}</p>
                  <h3 className="mt-2 text-sm font-semibold text-stone-950">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-stone-600">{step.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
