import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_COMPANY_PLAN_CHANGE_FIELDS,
  SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW,
  SYSTEM_COMPANY_PLAN_CHANGE_VALIDATION_ITEMS,
  SYSTEM_COMPANY_PLAN_COMPANIES,
  SYSTEM_COMPANY_PLAN_FIELDS,
  SYSTEM_COMPANY_PLAN_OPTIONS,
  SYSTEM_COMPANY_PLAN_POLICY_NOTES,
  SYSTEM_COMPANY_PLAN_POLICY_STEPS,
} from "@/lib/system/systemCompanyPlanSkeleton";

export default function SystemCompanyPlanSkeleton() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM BILLING
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  고객별 요금제 / 용량 관리
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  시스템관리자가 고객사별 plan을 선택하고 저장용량, 멤버 수, 가격 override를
                  조정하는 설계 화면입니다. 기본 요금제 정책은 lib/billing 기준을 사용하고,
                  실제 결제 자동화와 업로드 차단은 후속 단계로 분리합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system" size="sm">
                시스템 콘솔
              </AdminLinkButton>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {SYSTEM_COMPANY_PLAN_OPTIONS.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-stone-950">
                    {plan.name}
                  </h2>
                  <p className="text-xs font-medium text-stone-500">{plan.code}</p>
                </div>
                <AdminStatusBadge>{plan.statusLabel}</AdminStatusBadge>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>가격</dt>
                  <dd className="font-semibold text-stone-900">{plan.priceLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>저장용량</dt>
                  <dd className="font-semibold text-stone-900">{plan.storageLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>멤버</dt>
                  <dd className="font-semibold text-stone-900">{plan.memberLabel}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-stone-500">
                {plan.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">요금제·용량 관리 설계 기준</h2>
            <p className="text-sm leading-6 text-stone-600">
              하드코딩된 저장공간 값 대신 billing policy와 고객사별 assignment를 분리해서 관리합니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_COMPANY_PLAN_POLICY_STEPS.map((step) => (
              <article
                key={step.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{step.title}</h3>
                  <AdminStatusBadge>{step.statusLabel}</AdminStatusBadge>
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">고객별 요금제 변경 preview</h2>
            <p className="text-sm leading-6 text-stone-600">
              시스템관리자가 고객사별 plan, 저장공간, 멤버 수, 가격 override를 한 화면에서 확인한 뒤 저장하는 구조입니다.
              현재는 저장 전 preview이며 실제 API 연결 전까지 버튼은 비활성 상태로 유지합니다.
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-stone-950">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.companyName}
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.companyId}
                  </p>
                </div>
                <AdminStatusBadge>{SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.policySourceLabel}</AdminStatusBadge>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>현재 요금제</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.currentPlanLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>변경 요금제</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.nextPlanLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>저장공간</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.storageChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>멤버</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.memberChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>금액</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.priceChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>적용 시작일</dt>
                  <dd className="font-semibold text-stone-900">
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.effectiveDateLabel}
                  </dd>
                </div>
              </dl>
            </article>

            <div className="grid gap-3">
              {SYSTEM_COMPANY_PLAN_CHANGE_FIELDS.map((field) => (
                <article
                  key={field.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-950">{field.label}</h3>
                      <p className="mt-1 text-sm font-medium text-stone-700">{field.value}</p>
                    </div>
                    <AdminStatusBadge>{field.statusLabel}</AdminStatusBadge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">{field.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_COMPANY_PLAN_CHANGE_VALIDATION_ITEMS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                  <AdminStatusBadge>{item.statusLabel}</AdminStatusBadge>
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-600">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <AdminButton disabled>고객사 요금제 변경 저장 준비중</AdminButton>
            <AdminButton disabled>변경 이력 기록 준비중</AdminButton>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">고객사 목록</h2>
            <div className="mt-4 space-y-3">
              {SYSTEM_COMPANY_PLAN_COMPANIES.map((company) => (
                <article
                  key={company.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-stone-950">
                      {company.name}
                    </h3>
                    <AdminStatusBadge>{company.currentPlan}</AdminStatusBadge>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-stone-600">
                    <p>저장공간: {company.storageUsageLabel}</p>
                    <p>저장공간 상태: {company.storageRiskLabel}</p>
                    <p>멤버: {company.memberUsageLabel}</p>
                    <p>멤버 상태: {company.memberRiskLabel}</p>
                    <p>예외 정책: {company.overrideLabel}</p>
                    <p>정책 출처: {company.policySourceLabel}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">
                요금제 수정 준비 영역
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                company_plan_assignments와 company_plan_override 정책에 연결될 입력 영역입니다.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {SYSTEM_COMPANY_PLAN_FIELDS.map((field) => (
                <label
                  key={field.id}
                  className="grid gap-1 text-sm font-medium text-stone-700"
                >
                  {field.label}
                  <input
                    value={field.value}
                    readOnly
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                  />
                  <span className="text-xs leading-5 text-stone-500">
                    {field.description}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <AdminButton disabled>요금제 변경 저장 준비중</AdminButton>
              <AdminButton disabled>사용량 snapshot 새로고침 준비중</AdminButton>
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">운영 정책 메모</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_COMPANY_PLAN_POLICY_NOTES.map((note) => (
              <li
                key={note}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
