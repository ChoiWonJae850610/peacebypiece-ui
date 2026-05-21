import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
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
  type SystemCompanyPlanCompany,
  type SystemCompanyPlanField,
} from "@/lib/system/systemCompanyPlanSkeleton";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";

const companyPlanColumns: AdminTableColumn<SystemCompanyPlanCompany>[] = [
  {
    key: "company",
    label: "고객사",
    render: (company) => (
      <div className="space-y-1">
        <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.name}</p>
        <p className="text-[10px] font-medium text-[var(--pbp-text-subtle)]">{company.policySourceLabel}</p>
      </div>
    ),
  },
  {
    key: "plan",
    label: "요금제",
    render: (company) => <AdminStatusBadge>{company.currentPlan}</AdminStatusBadge>,
  },
  {
    key: "storage",
    label: "저장공간",
    render: (company) => (
      <div className="space-y-1 text-xs text-stone-600">
        <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.storageUsageLabel}</p>
        <AdminStatusBadge tone={company.storageRiskTone} size="xs">
          {company.storageRiskLabel}
        </AdminStatusBadge>
      </div>
    ),
  },
  {
    key: "members",
    label: "멤버",
    render: (company) => (
      <div className="space-y-1 text-xs text-stone-600">
        <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.memberUsageLabel}</p>
        <AdminStatusBadge tone={company.memberRiskTone} size="xs">
          {company.memberRiskLabel}
        </AdminStatusBadge>
      </div>
    ),
  },
  {
    key: "policy",
    label: "정책",
    render: (company) => (
      <div className="space-y-1 text-xs text-stone-600">
        <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.overrideLabel}</p>
        <p className="leading-5 text-[var(--pbp-text-subtle)]">{company.policySourceLabel}</p>
      </div>
    ),
  },
];

const companyPlanFieldColumns: AdminTableColumn<SystemCompanyPlanField>[] = [
  {
    key: "field",
    label: "필드",
    render: (field) => (
      <div className="space-y-1">
        <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{field.label}</p>
        
      </div>
    ),
  },
  {
    key: "value",
    label: "현재 입력값",
    render: (field) => (
      <input
        value={field.value}
        readOnly
        className="w-full rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2 text-sm text-[var(--pbp-text-muted)]"
      />
    ),
  },
  {
    key: "description",
    label: "연결 기준",
    render: (field) => <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{field.description}</p>,
  },
];

export default function SystemCompanyPlanSkeleton() {
  return (
    <SystemShell contentClassName="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6">
        <header className={SYSTEM_HEADER_PANEL_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className={SYSTEM_EYEBROW_CLASS}>
                SYSTEM BILLING
              </p>
              <div className="space-y-2">
                <h1 className={SYSTEM_TITLE_CLASS}>
                  고객별 요금제 / 용량 관리
                </h1>
                <p className={SYSTEM_SUBTITLE_CLASS}>
                  시스템관리자가 고객사별 요금제, 저장용량, 멤버 수, 월 이용 금액을 확인하고 조정하는 운영 화면입니다.
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
                  <p className="text-xs font-medium text-stone-500">{plan.statusLabel}</p>
                </div>
                <AdminStatusBadge>{plan.statusLabel}</AdminStatusBadge>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>가격</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{plan.priceLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>저장용량</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{plan.storageLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>멤버</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{plan.memberLabel}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-stone-500">
                {plan.description}
              </p>
            </article>
          ))}
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>요금제·용량 운영 기준</h2>
            <p className={SYSTEM_BODY_TEXT_CLASS}>
              기본 요금제와 고객사별 예외 한도를 분리해 안전하게 관리합니다.
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

        <section className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>고객별 요금제 변경</h2>
            <p className={SYSTEM_BODY_TEXT_CLASS}>
              고객사별 현재 요금제와 변경 예정 값을 한 화면에서 확인합니다. 저장 기능은 운영 정책 확정 후 활성화합니다.
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
                    요금제 변경 대상 고객사
                  </p>
                </div>
                <AdminStatusBadge>{SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.policySourceLabel}</AdminStatusBadge>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>현재 요금제</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.currentPlanLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>변경 요금제</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.nextPlanLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>저장공간</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.storageChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>멤버</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.memberChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>금액</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                    {SYSTEM_COMPANY_PLAN_CHANGE_PREVIEW.priceChangeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>적용 시작일</dt>
                  <dd className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
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
            <AdminButton disabled>요금제 변경 저장</AdminButton>
            <AdminButton disabled>변경 이력 확인</AdminButton>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className={SYSTEM_CARD_CLASS}>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>고객사 목록</h2>
            <div className="mt-4">
              <AdminTable
                items={SYSTEM_COMPANY_PLAN_COMPANIES}
                columns={companyPlanColumns}
                getRowKey={(company) => company.id}
                emptyLabel="요금제 관리 대상 고객사가 없습니다."
                gridTemplateColumns="1.1fr 0.7fr 1fr 0.9fr 1.2fr"
                rowBaseClassName="grid w-full gap-3 px-4 py-3 text-left text-[11px] md:items-center"
              />
            </div>
          </aside>

          <section className={SYSTEM_CARD_CLASS}>
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>
                요금제 변경 입력
              </h2>
              <p className={SYSTEM_BODY_TEXT_CLASS}>
                요금제, 저장공간, 멤버 수, 금액 조정값을 확인합니다.
              </p>
            </div>

            <div className="mt-4">
              <AdminTable
                items={SYSTEM_COMPANY_PLAN_FIELDS}
                columns={companyPlanFieldColumns}
                getRowKey={(field) => field.id}
                emptyLabel="요금제 변경 항목이 없습니다."
                gridTemplateColumns="0.8fr 0.9fr 1.3fr"
                rowBaseClassName="grid w-full gap-3 px-4 py-3 text-left text-[11px] md:items-center"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <AdminButton disabled>요금제 변경 저장</AdminButton>
              <AdminButton disabled>사용량 새로고침</AdminButton>
            </div>
          </section>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>운영 정책 메모</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_COMPANY_PLAN_POLICY_NOTES.map((note) => (
              <li
                key={note}
                className={SYSTEM_MUTED_CARD_CLASS + " text-xs leading-5 text-[var(--pbp-text-muted)]"}
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
    </SystemShell>
  );
}
