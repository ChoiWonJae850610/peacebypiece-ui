import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  CUSTOMER_ONBOARDING_TEMPLATE_COPY_CHECKS,
  CUSTOMER_ONBOARDING_TEMPLATE_COPY_STEPS,
} from "@/lib/system/standards/customerOnboardingTemplateDesign";

export default function SystemCustomerOnboardingTemplateDesignPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                CUSTOMER ONBOARDING STANDARDS
              </p>
              <h1 className="text-2xl font-semibold text-stone-950">고객사 생성 시 기준정보 복사 설계</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                신규 고객사를 만들 때 시스템관리자가 지정한 생산품 유형 기본 템플릿을 고객사 소유의 생산품 유형으로 복사하고,
                단위 표준과 외주공정 유형은 활성 시스템 표준을 기본 사용 상태로 연결하는 흐름을 설계합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">v{APP_VERSION}</span>
              <Link href="/system/standards/regression" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50">
                회귀점검
              </Link>
              <Link href="/system/standards" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50">
                기준정보 관리
              </Link>
              <Link href="/system" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50">
                시스템 콘솔
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-5">
          {CUSTOMER_ONBOARDING_TEMPLATE_COPY_STEPS.map((step, index) => (
            <article key={step.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {step.statusLabel}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-stone-950">{step.title}</h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">{step.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">복사 정책</h2>
            <div className="mt-4 grid gap-3">
              {CUSTOMER_ONBOARDING_TEMPLATE_COPY_CHECKS.map((check) => (
                <div key={check.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">{check.label}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-600">{check.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">IMPLEMENTATION NOTE</p>
            <h2 className="mt-2 text-lg font-semibold text-amber-950">0.10.51은 설계 화면만 추가합니다</h2>
            <p className="mt-3">
              실제 고객사 생성 API, 템플릿 복사 repository, 고객사별 단위/외주공정 초기 연결, 감사 로그 기록은 후속 버전에서 분리합니다.
              이번 단계에서는 DB schema와 기존 기준정보 CRUD를 변경하지 않습니다.
            </p>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white/70 p-4 font-mono text-xs text-amber-900">
              /system/standards/customer-onboarding
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
