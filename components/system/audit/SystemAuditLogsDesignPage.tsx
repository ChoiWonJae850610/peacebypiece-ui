import Link from "next/link";

import {
  SYSTEM_AUDIT_LOG_DB_DECISIONS,
  SYSTEM_AUDIT_LOG_IMPLEMENTATION_STEPS,
  SYSTEM_AUDIT_LOG_LAYER_DECISIONS,
  SYSTEM_AUDIT_LOG_SCHEMA_FIELDS,
  SYSTEM_AUDIT_LOG_SCOPES,
  SYSTEM_AUDIT_LOG_TARGETS,
  type SystemAuditLogEventLevel,
} from "@/lib/system/audit/systemAuditLogs.design";

function getLevelClassName(level: SystemAuditLogEventLevel) {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (level === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "medium") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-stone-200 bg-stone-100 text-stone-600";
}

export default function SystemAuditLogsDesignPage() {
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
