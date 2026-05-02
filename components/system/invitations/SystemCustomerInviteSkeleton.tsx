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

export default function SystemCustomerInviteSkeleton() {
  const [email, setEmail] = useState("admin@example.com");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("초대 링크 생성 전입니다.");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateInvite() {
    setIsCreating(true);
    setMessage("초대 링크 생성 중입니다.");

    const result = await createInvitationLink({
      companyId: "company-sample-customer",
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
    setMessage("초대 링크가 생성되었습니다. raw token은 응답에서 한 번만 반환됩니다.");
    setIsCreating(false);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            SYSTEM INVITATION
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-950">
            시스템관리자 고객 초대
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            시스템관리자가 고객사 관리자를 초대하는 화면입니다. v{APP_VERSION}
          </p>
          <Link
            href="/system"
            className="mt-4 inline-flex rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            시스템 콘솔
          </Link>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {SYSTEM_CUSTOMER_INVITE_FIELDS.map((field) => (
            <article
              key={field.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-stone-500">{field.label}</p>
              <p className="mt-2 text-lg font-semibold text-stone-950">{field.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                {field.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {SYSTEM_CUSTOMER_INVITE_STEPS.map((step) => (
            <article
              key={step.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold text-stone-500">
                {step.statusLabel}
              </p>
              <h2 className="mt-2 text-sm font-semibold text-stone-950">
                {step.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {step.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">
            초대 링크 생성
          </h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
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
          <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            {SYSTEM_CUSTOMER_INVITE_POLICY_NOTES.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
