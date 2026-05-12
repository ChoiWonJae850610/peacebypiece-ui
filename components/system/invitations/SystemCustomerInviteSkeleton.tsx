"use client";

import { useState } from "react";
import Link from "next/link";

import InvitationQrPreview from "@/components/invitations/InvitationQrPreview";
import { APP_VERSION } from "@/lib/constants/app";
import { SYSTEM_CUSTOMER_INVITE_QR_PREVIEW } from "@/lib/invitations/invitationQrPreview";
import {
  SYSTEM_CUSTOMER_INVITE_APPROVAL_RULES,
  SYSTEM_CUSTOMER_INVITE_FIELDS,
  SYSTEM_CUSTOMER_INVITE_FORM_FIELDS,
  SYSTEM_CUSTOMER_INVITE_POLICY_NOTES,
  SYSTEM_CUSTOMER_INVITE_RESULT_ACTIONS,
  SYSTEM_CUSTOMER_INVITE_STEPS,
} from "@/lib/system/systemCustomerInviteSkeleton";

function getStepStatusClassName(status: "ready" | "planned" | "locked") {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getActionClassName(state: "ready" | "disabled") {
  if (state === "ready") {
    return "border-stone-900 bg-stone-900 text-white hover:bg-stone-800";
  }

  return "border-stone-200 bg-stone-100 text-stone-400";
}

type CreatedSystemInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: {
    id: string;
    expiresAt: string;
  };
};

function getAbsoluteInviteUrl(inviteUrl: string): string {
  if (typeof window === "undefined") return inviteUrl;
  return new URL(inviteUrl, window.location.origin).toString();
}

export default function SystemCustomerInviteSkeleton() {
  const [adminEmail, setAdminEmail] = useState("customer-admin@example.com");
  const [createdInvitation, setCreatedInvitation] = useState<CreatedSystemInvitationResult | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const canCreateInvite = adminEmail.trim().length > 0 && !isCreatingInvite;

  async function handleCreateInvite() {
    if (!canCreateInvite) return;

    setIsCreatingInvite(true);
    setInviteError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "system_to_company_admin",
          recipientEmail: adminEmail.trim(),
          recipientRole: "admin",
          permissionPreset: "company_admin",
          createdBySystemUserId: "system-user-sample-admin",
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "INVITATION_CREATE_FAILED");
      }

      setCreatedInvitation({
        inviteUrl: payload.inviteUrl,
        rawToken: payload.rawToken,
        invitation: payload.invitation,
      });
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "INVITATION_CREATE_FAILED");
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function handleCopyInviteLink() {
    if (!createdInvitation?.inviteUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(getAbsoluteInviteUrl(createdInvitation.inviteUrl));
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM CUSTOMER INVITATION
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  시스템관리자 고객사 초대
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  신규 고객사 담당자에게 초대 링크와 QR을 전달하고, 가입 신청 후 시스템관리자가 고객사 생성과 고객관리자 권한을 확정하는 흐름입니다.
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

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">초대 정보 입력</h2>
            <p className="text-sm leading-6 text-stone-600">
              실제 저장 전 단계에서는 입력 필드, 기본값, 승인 시 연결될 DB 컬럼 후보를 화면에 고정합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SYSTEM_CUSTOMER_INVITE_FORM_FIELDS.map((field) => (
              <label key={field.id} className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <span className="text-xs font-semibold text-stone-500">{field.label}</span>
                <input
                  readOnly={field.id !== "admin-email"}
                  type={field.inputType === "email" ? "email" : "text"}
                  value={field.id === "admin-email" ? adminEmail : field.value}
                  onChange={(event) => {
                    if (field.id === "admin-email") setAdminEmail(event.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-stone-400"
                />
                <span className="mt-2 block text-xs leading-5 text-stone-500">{field.helper}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">초대 생성 흐름</h2>
            <p className="text-sm leading-6 text-stone-600">
              초대 링크 생성, QR 표시, 가입 신청, 고객사 생성 승인을 단계별로 분리합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {SYSTEM_CUSTOMER_INVITE_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStepStatusClassName(
                      step.status,
                    )}`}
                  >
                    {step.statusLabel}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <InvitationQrPreview model={{
              ...SYSTEM_CUSTOMER_INVITE_QR_PREVIEW,
              inviteUrl: createdInvitation?.inviteUrl ? getAbsoluteInviteUrl(createdInvitation.inviteUrl) : SYSTEM_CUSTOMER_INVITE_QR_PREVIEW.inviteUrl,
            }} />
            {createdInvitation ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                <p>초대 생성 완료</p>
                <p className="mt-1 break-all">{getAbsoluteInviteUrl(createdInvitation.inviteUrl)}</p>
              </div>
            ) : null}
            {inviteError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                {inviteError}
              </div>
            ) : null}
          </div>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">초대 결과 액션</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                실제 초대 생성 API 연결 후 활성화할 버튼의 위치와 의미를 먼저 고정합니다.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {SYSTEM_CUSTOMER_INVITE_RESULT_ACTIONS.map((action) => {
                const actionClassName = `block w-full rounded-xl border px-4 py-2 text-center text-sm font-semibold ${getActionClassName(
                  action.state,
                )}`;

                return (
                  <div key={action.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    {action.id === "create-invite" ? (
                      <button
                        type="button"
                        onClick={handleCreateInvite}
                        disabled={!canCreateInvite}
                        className={canCreateInvite
                          ? "block w-full rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-stone-800"
                          : actionClassName}
                      >
                        {isCreatingInvite ? "생성 중" : action.label}
                      </button>
                    ) : action.id === "copy-link" ? (
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        disabled={!createdInvitation}
                        className={createdInvitation
                          ? "block w-full rounded-xl border border-stone-900 bg-white px-4 py-2 text-center text-sm font-semibold text-stone-900 hover:bg-stone-50"
                          : actionClassName}
                      >
                        {action.label}
                      </button>
                    ) : action.state === "ready" && action.href ? (
                      <Link href={action.href} className={actionClassName}>
                        {action.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={actionClassName}
                      >
                        {action.label}
                      </button>
                    )}
                    <p className="mt-2 text-xs leading-5 text-stone-500">{action.helper}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">승인 기준</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              고객사 초대는 링크 접속이 아니라 시스템관리자 승인 시점에 고객사와 고객관리자 권한을 확정합니다.
            </p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {SYSTEM_CUSTOMER_INVITE_APPROVAL_RULES.map((rule) => (
              <article key={rule.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <h3 className="text-sm font-semibold text-stone-950">{rule.title}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">{rule.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
          <ul className="mt-4 space-y-3">
            {SYSTEM_CUSTOMER_INVITE_POLICY_NOTES.map((note) => (
              <li key={note} className="flex gap-2 text-sm leading-6 text-stone-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
