import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_PROCESS_STANDARD_SAMPLES,
  SYSTEM_PRODUCT_TEMPLATE_SAMPLES,
  SYSTEM_STANDARD_DESIGN_TABS,
  SYSTEM_STANDARDS_POLICY_NOTES,
  SYSTEM_UNIT_STANDARD_SAMPLES,
  type SystemStandardSampleRow,
} from "@/lib/system/systemStandardsDesign";

function SampleRows({ rows, showSecondary = true }: { rows: SystemStandardSampleRow[]; showSecondary?: boolean }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
      <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
        <span>이름</span>
        <span>{showSecondary ? "코드/하위 예시" : "분류"}</span>
        <span>설명</span>
        <span className="text-right">상태</span>
      </div>
      <div className="divide-y divide-stone-100 bg-white">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-3 px-4 py-3 text-sm text-stone-700"
          >
            <span className="font-semibold text-stone-950">{row.primary}</span>
            <span className="text-xs text-stone-500">{row.secondary || "시스템 표준"}</span>
            <span className="text-xs leading-5 text-stone-600">{row.description}</span>
            <AdminStatusBadge className="justify-self-end">{row.statusLabel}</AdminStatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemStandardsDesignPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM STANDARDS
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  시스템 기준정보 관리 설계
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  고객관리자 기준정보 화면에서 단위 표준과 외주공정 유형을 사용 여부 선택형으로 전환했기 때문에,
                  시스템관리자가 관리할 표준 원장과 고객사별 사용 관계를 먼저 설계합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system/standards/seed-status">seed 상태</AdminLinkButton>
              <AdminLinkButton href="/system/standards/regression">회귀점검</AdminLinkButton>
              <AdminLinkButton href="/system/standards/customer-onboarding">고객사 초기 기준정보</AdminLinkButton>
              <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {SYSTEM_STANDARD_DESIGN_TABS.map((tab) => (
            <article
              key={tab.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <AdminStatusBadge>{tab.label}</AdminStatusBadge>
                <AdminStatusBadge tone="info">{tab.statusLabel}</AdminStatusBadge>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-stone-950">{tab.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{tab.description}</p>
              <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
                {tab.scopeLabel}
              </p>
              {tab.id === "units" ? (
                <AdminLinkButton href="/system/standards/units" className="mt-4">
                  단위 표준 관리 화면 열기
                </AdminLinkButton>
              ) : null}
              {tab.id === "outsourcingProcesses" ? (
                <AdminLinkButton href="/system/standards/processes" className="mt-4">
                  외주공정 유형 관리 화면 열기
                </AdminLinkButton>
              ) : null}
              {tab.id === "productTypeTemplates" ? (
                <AdminLinkButton href="/system/standards/product-templates" className="mt-4">
                  생산품 유형 기본 템플릿 화면 열기
                </AdminLinkButton>
              ) : null}
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">단위 표준 원장</h2>
              <p className="text-sm leading-6 text-stone-600">
                시스템관리자가 한글명과 영문 코드/약어를 관리하고 고객사는 필요한 단위만 사용합니다.
              </p>
            </div>
            <SampleRows rows={SYSTEM_UNIT_STANDARD_SAMPLES} />
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">외주공정 유형 원장</h2>
              <p className="text-sm leading-6 text-stone-600">
                공정명 중복을 막기 위해 시스템 표준을 관리하고 고객사는 사용하는 공정만 선택합니다.
              </p>
            </div>
            <SampleRows rows={SYSTEM_PROCESS_STANDARD_SAMPLES} showSecondary={false} />
          </article>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">DB ONLY CHECK</p>
              <h2 className="mt-2 text-lg font-semibold text-blue-950">기준정보는 DB 결과만 표시합니다</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
                0.10.46부터 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿은 fallback을 섞지 않습니다. 숫자가 0개이거나 최소 기준보다 부족하면 seed 상태를 확인하고 0.10.48 seed 보강 SQL을 실행합니다.
              </p>
            </div>
            <AdminLinkButton href="/system/standards/seed-status" className="shrink-0">
              seed 상태 확인
            </AdminLinkButton>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                SCHEMA 0.10.38
              </p>
              <h2 className="mt-2 text-lg font-semibold text-emerald-950">
                시스템 기준정보 DB schema 확정
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-900">
                단위 표준과 외주공정 유형은 시스템 원장과 고객사별 사용 관계 테이블로 분리하고,
                생산품 유형은 신규 고객사 기본값으로 복사할 템플릿 테이블을 별도 관리합니다.
              </p>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-emerald-800 sm:grid-cols-3 lg:min-w-[520px]">
              <span className="rounded-2xl border border-emerald-200 bg-white/70 px-3 py-2">
                system_unit_standards
              </span>
              <span className="rounded-2xl border border-emerald-200 bg-white/70 px-3 py-2">
                system_outsourcing_process_standards
              </span>
              <span className="rounded-2xl border border-emerald-200 bg-white/70 px-3 py-2">
                system_product_type_templates
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">생산품 유형 기본 템플릿</h2>
              <p className="text-sm leading-6 text-stone-600">
                생산품 유형은 고객사별 직접 관리를 유지하고, 시스템에서는 신규 고객사 생성 시 복사할 기본 템플릿만 설계합니다.
              </p>
            </div>
            <SampleRows rows={SYSTEM_PRODUCT_TEMPLATE_SAMPLES} />
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
            <ul className="mt-4 grid gap-3">
              {SYSTEM_STANDARDS_POLICY_NOTES.map((note) => (
                <li
                  key={note}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600"
                >
                  {note}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              0.10.38에서 DB schema와 seed 기준을 확정했습니다. 0.10.51에서는 고객사 신규 생성 시 생산품 유형 기본 템플릿을 고객사 item_categories로 복사하고 단위·외주공정 사용 연결을 초기화하는 설계 화면을 추가했습니다.
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
