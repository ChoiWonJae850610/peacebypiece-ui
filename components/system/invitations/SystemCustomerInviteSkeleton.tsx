"use client";

import Link from "next/link";
import { useState } from "react";

import InvitationQrPreview from "@/components/invitations/InvitationQrPreview";
import { APP_VERSION } from "@/lib/constants/app";
import { createInvitationLink } from "@/lib/invitations/invitationClient";
import { SYSTEM_CUSTOMER_INVITE_QR_PREVIEW } from "@/lib/invitations/invitationQrPreview";
import {
  SYSTEM_CUSTOMER_INVITE_FIELDS,
  SYSTEM_CUSTOMER_INVITE_POLICY_NOTES,
  SYSTEM_CUSTOMER_INVITE_STEPS,
} from "@/lib/system/systemCustomerInviteSkeleton";

function getStepTone(status: string) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function SystemCustomerInviteSkeleton() {
  const [companyId, setCompanyId] = useState("company-sample-customer");
  const [email, setEmail] = useState("admin@example.com");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("초대 링크 생성 전입니다.");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateInvite() {
    setIsCreating(true);
    setMessage("고객관리자 초대 링크 생성 중입니다.");

    const result = await createInvitationLink({
      companyId,
      recipientEmail: email,
      recipientRole: "admin",
      permissionPreset: "company_admin",
      scope: "system_to_company_admin",
      createdBySystemUserId: "system-user-sample-admin",
    });

    if (!result.ok) {
      setInviteUrl("");
      setMessage(result.reasons?.join(", ") || result.message || result.error);
      setIsCreating(false);
      return;
    }

    setInviteUrl(result.inviteUrl);
    setMessage("고객관리자 초대 링크가 생성되었습니다. raw token은 응답에서 한 번만 반환됩니다.");
    setIsCreating(false);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM INVITATION
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                고객관리자 초대
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                시스템관리자가 고객사 관리자를 초대하는 화면입니다. 고객사 멤버 초대와 달리
                system_to_company_admin scope와 company_admin preset만 사용합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템관리자 홈
              </Link>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {SYSTEM_CUSTOMER_INVITE_STEPS.map((step) => (
            <article
              key={step.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStepTone(
                  step.status,
                )}`}
              >
                {step.statusLabel}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-stone-950">
                {step.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {step.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {SYSTEM_CUSTOMER_INVITE_FIELDS.map((field) => (
            <article
              key={field.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-stone-500">{field.label}</p>
              <p className="mt-2 text-base font-semibold text-stone-950">
                {field.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {field.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">
            고객관리자 초대 링크 생성
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            1차 연결은 초대 링크 생성까지입니다. 이메일 발송, 고객사 생성 자동화, 인증/회원가입 연결은 포함하지 않습니다.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              고객사 ID
              <input
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              고객관리자 이메일
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
            <button
              type="button"
              onClick={handleCreateInvite}
              disabled={isCreating}
              className="rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
            >
              {isCreating ? "생성 중" : "초대 링크 생성"}
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-stone-500">{message}</p>
          {inviteUrl ? (
            <p className="mt-3 truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
              {inviteUrl}
            </p>
          ) : null}
        </section>

        <InvitationQrPreview
          model={SYSTEM_CUSTOMER_INVITE_QR_PREVIEW}
          inviteUrl={inviteUrl}
        />

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">초대 정책</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_CUSTOMER_INVITE_POLICY_NOTES.map((note) => (
              <article key={note} className="rounded-2xl bg-stone-50 p-3">
                <p className="text-xs leading-5 text-stone-600">{note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
