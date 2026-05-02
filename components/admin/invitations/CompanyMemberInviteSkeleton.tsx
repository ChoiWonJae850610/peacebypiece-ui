import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  COMPANY_MEMBER_INVITE_FORM_FIELDS,
  COMPANY_MEMBER_INVITE_POLICY_NOTES,
  COMPANY_MEMBER_INVITE_ROLE_OPTIONS,
} from "@/lib/admin/companyMemberInviteSkeleton";

export default function CompanyMemberInviteSkeleton() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                COMPANY INVITATION
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  고객관리자 멤버 초대
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  고객관리자가 자기 고객사에 디자이너, 검수담당자, 재고담당자, 조회자를 초대하는
                  화면 skeleton입니다. 실제 초대 링크 생성 API 연결 전까지 role/preset 선택 구조를
                  먼저 고정합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                관리자 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {COMPANY_MEMBER_INVITE_FORM_FIELDS.map((field) => (
            <article
              key={field.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-stone-500">{field.label}</p>
              <p className="mt-2 text-base font-semibold text-stone-950">{field.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">역할 / 권한 preset</h2>
            <p className="text-sm leading-6 text-stone-600">
              0.9.63 초대 링크 생성 API와 연결될 role 및 permission preset 선택 영역입니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {COMPANY_MEMBER_INVITE_ROLE_OPTIONS.map((option) => (
              <article
                key={option.role}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">
                    {option.label}
                  </h3>
                  <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-500">
                    {option.preset}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-600">
                  {option.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {option.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-600"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">초대 링크 생성 준비 영역</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                이메일
                <input
                  value="member@example.com"
                  readOnly
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                역할
                <select
                  value="designer"
                  disabled
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                >
                  {COMPANY_MEMBER_INVITE_ROLE_OPTIONS.map((option) => (
                    <option key={option.role} value={option.role}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                초대 링크
                <input
                  value="API 연결 후 생성 응답에서 1회 표시"
                  readOnly
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400"
              >
                멤버 초대 링크 생성 준비중
              </button>
              <button
                type="button"
                disabled
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-400"
              >
                링크 복사 준비중
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">초대 정책</h2>
            <div className="mt-4 space-y-3">
              {COMPANY_MEMBER_INVITE_POLICY_NOTES.map((note) => (
                <article key={note.title} className="rounded-2xl bg-stone-50 p-3">
                  <h3 className="text-sm font-semibold text-stone-900">{note.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {note.description}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
