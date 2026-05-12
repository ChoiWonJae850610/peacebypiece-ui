import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";
import type {
  SystemStandardsRegressionCheck,
  SystemStandardsRegressionSnapshot,
} from "@/lib/system/standards/regressionRepository";

function statusTone(status: SystemStandardsRegressionCheck["status"]): AdminStatusBadgeTone {
  if (status === "pass") return "success";
  if (status === "warn") return "warning";
  return "danger";
}

function statusLabel(status: SystemStandardsRegressionCheck["status"]) {
  if (status === "pass") return "정상";
  if (status === "warn") return "주의";
  return "확인 필요";
}

export default function SystemStandardsRegressionPage({ snapshot }: { snapshot: SystemStandardsRegressionSnapshot }) {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">SYSTEM STANDARDS REGRESSION</p>
              <h1 className="text-2xl font-semibold text-stone-950">기준정보 DB-only 회귀 점검</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿이 fallback 없이 DB 결과만 사용하는지 점검합니다.
                새로고침마다 수량이 흔들리는 문제를 추적할 때 이 화면과 API 응답을 기준으로 봅니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system/standards/seed-status">seed 상태</AdminLinkButton>
              <AdminLinkButton href="/system/standards">기준정보 관리</AdminLinkButton>
              <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
            </div>
          </div>
        </header>

        <section className={`rounded-3xl border p-5 shadow-sm ${snapshot.ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{snapshot.mode === "db" ? "DB ONLY" : "DB UNAVAILABLE"}</p>
          <h2 className="mt-2 text-lg font-semibold">{snapshot.ready ? "회귀 점검 통과" : "회귀 점검 확인 필요"}</h2>
          <p className="mt-2 text-sm leading-6">{snapshot.summary}</p>
          <p className="mt-2 text-xs font-medium opacity-80">생성 시각: {snapshot.generatedAt}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {snapshot.checks.map((check) => (
            <article key={check.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">{check.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{check.detail}</p>
                </div>
                <AdminStatusBadge tone={statusTone(check.status)}>{statusLabel(check.status)}</AdminStatusBadge>
              </div>
              <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800">
                {check.valueLabel}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">점검 기준</h2>
          <ul className="mt-3 space-y-2">
            <li>· 기준정보 화면과 작업지시서 선택지는 fallback을 사용하지 않고 DB 결과만 사용합니다.</li>
            <li>· 단위 표준과 외주공정 유형 수량은 시스템 원장 기준 전체 수와 고객사별 사용 수를 분리해서 봐야 합니다.</li>
            <li>· 생산품 유형 기본값 복원은 시스템관리자가 기본으로 지정한 활성 템플릿 1개를 기준으로 합니다.</li>
            <li>· 수량이 부족하면 db/schema/patch_0_10_48_system_standards_seed_refresh.sql을 먼저 실행합니다.</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-xs text-stone-700">
            /api/system/standards/regression
          </div>
        </section>
      </div>
    </main>
  );
}
