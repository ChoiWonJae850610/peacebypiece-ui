import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_COMPANY_APPROVAL_ACTIONS,
  SYSTEM_COMPANY_APPROVAL_PERMISSION_ITEMS,
  SYSTEM_COMPANY_APPROVAL_POLICY_NOTES,
  SYSTEM_COMPANY_APPROVAL_REQUEST_FIELDS,
  SYSTEM_COMPANY_APPROVAL_STEPS,
  SYSTEM_COMPANY_APPROVAL_SUMMARY_ITEMS,
  type SystemCompanyApprovalStepStatus,
} from "@/lib/system/systemCompanyApprovalConsole";

function getStepStatusClassName(status: SystemCompanyApprovalStepStatus) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getActionClassName(state: "disabled" | "ready") {
  if (state === "ready") {
    return "border-stone-900 bg-stone-900 text-white hover:bg-stone-800";
  }

  return "border-stone-200 bg-stone-100 text-stone-400";
}

export default function SystemCompanyApprovalConsole() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM COMPANY APPROVAL
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  시스템관리자 고객사 승인
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  고객사 초대 링크로 들어온 가입 신청을 검토하고, 승인 시 고객사 생성·고객관리자 멤버십·권한 부여·초기 기준정보 복사로 이어지는 흐름입니다.
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
              <Link
                href="/system/invites"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                고객 초대
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SYSTEM_COMPANY_APPROVAL_SUMMARY_ITEMS.map((item) => (
            <article key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-stone-950">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-600">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">가입 신청 검토</h2>
            <p className="text-sm leading-6 text-stone-600">
              실제 join_requests 조회 전 단계에서는 승인 화면의 필드, 최종 확정값, 저장 대상 컬럼을 먼저 고정합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SYSTEM_COMPANY_APPROVAL_REQUEST_FIELDS.map((field) => (
              <label key={field.id} className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <span className="text-xs font-semibold text-stone-500">{field.label}</span>
                <input
                  readOnly
                  type={field.inputType === "email" ? "email" : "text"}
                  value={field.value}
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none"
                />
                <span className="mt-2 block text-xs leading-5 text-stone-500">{field.helper}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">승인 처리 단계</h2>
            <p className="text-sm leading-6 text-stone-600">
              고객사 생성과 고객관리자 승인, 권한 저장, 초기 기준정보 복사를 분리하지 말고 승인 흐름으로 묶습니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {SYSTEM_COMPANY_APPROVAL_STEPS.map((step, index) => (
              <article key={step.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStepStatusClassName(step.status)}`}>
                    {step.statusLabel}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-950">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">고객관리자 기본 권한</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                승인 시 role template은 기본 체크값으로만 사용하고 실제 저장은 permission_code 목록으로 처리합니다.
              </p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {SYSTEM_COMPANY_APPROVAL_PERMISSION_ITEMS.map((item) => (
                <article key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-950">{item.label}</p>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      기본 체크
                    </span>
                  </div>
                  <code className="mt-3 block rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-600">
                    {item.permissionCode}
                  </code>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">승인 액션</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                실제 DB 연결 전에는 버튼 위치와 필요한 시스템 권한만 고정합니다.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {SYSTEM_COMPANY_APPROVAL_ACTIONS.map((action) => {
                const className = `block w-full rounded-xl border px-4 py-2 text-center text-sm font-semibold ${getActionClassName(action.state)}`;

                return (
                  <div key={action.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    {action.id === "open-invite" ? (
                      <Link href="/system/invites" className={className}>{action.label}</Link>
                    ) : (
                      <button type="button" disabled className={className}>{action.label}</button>
                    )}
                    <p className="mt-2 text-xs leading-5 text-stone-500">{action.helper}</p>
                    <code className="mt-2 block rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-600">
                      {action.requiredPermission}
                    </code>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">처리 정책</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              고객사 승인 기능을 실제 API로 연결할 때 깨지면 안 되는 기준입니다.
            </p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {SYSTEM_COMPANY_APPROVAL_POLICY_NOTES.map((note) => (
              <article key={note.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <h3 className="text-sm font-semibold text-stone-950">{note.title}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">{note.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
