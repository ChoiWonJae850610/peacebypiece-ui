import Link from "next/link";

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
            <span className="justify-self-end rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
              {row.statusLabel}
            </span>
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
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템 콘솔
              </Link>
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
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                  {tab.label}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {tab.statusLabel}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-stone-950">{tab.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{tab.description}</p>
              <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
                {tab.scopeLabel}
              </p>
              {tab.id === "units" ? (
                <Link
                  href="/system/standards/units"
                  className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  단위 표준 관리 화면 열기
                </Link>
              ) : null}
              {tab.id === "outsourcingProcesses" ? (
                <Link
                  href="/system/standards/processes"
                  className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  외주공정 유형 관리 화면 열기
                </Link>
              ) : null}
              {tab.id === "productTypeTemplates" ? (
                <Link
                  href="/system/standards/product-templates"
                  className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  생산품 유형 기본 템플릿 화면 열기
                </Link>
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
              이번 버전은 설계 화면입니다. 실제 추가·수정·삭제, 고객사별 사용 여부 저장, DB schema 변경은 후속 버전에서 분리합니다.
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
