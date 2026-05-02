"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import {
  getInvitationAcceptStatusView,
  INVITATION_ACCEPT_POLICY_NOTES,
  maskInviteToken,
} from "@/lib/invitations/invitationAcceptanceSkeleton";
import type {
  InvitationAcceptanceResult,
  InvitationAcceptanceStatus,
} from "@/lib/invitations/invitationAcceptanceTypes";

interface InviteAcceptSkeletonProps {
  token: string;
}

type RequestState = "idle" | "loading" | "accepting" | "done" | "error";

const STATUS_ORDER: InvitationAcceptanceStatus[] = [
  "ready",
  "invalid",
  "expired",
  "revoked",
  "accepted",
];

function getStatusClassName(
  status: InvitationAcceptanceStatus,
  activeStatus: InvitationAcceptanceStatus,
) {
  if (status === activeStatus) {
    return "border-stone-900 bg-stone-900 text-white";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InviteAcceptSkeleton({ token }: InviteAcceptSkeletonProps) {
  const maskedToken = useMemo(() => maskInviteToken(token), [token]);
  const [result, setResult] = useState<InvitationAcceptanceResult | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("초대 링크를 확인하는 중입니다.");

  useEffect(() => {
    let mounted = true;

    async function previewInvitation() {
      const normalizedToken = token.trim();

      if (!normalizedToken) {
        setRequestState("error");
        setResult({
          ok: false,
          status: "invalid",
          invitation: null,
          message: "TOKEN_REQUIRED",
        });
        setMessage("초대 token이 없습니다.");
        return;
      }

      setRequestState("loading");

      try {
        const response = await fetch(
          `/api/invitations/accept?token=${encodeURIComponent(normalizedToken)}`,
          {
            method: "GET",
          },
        );
        const data = (await response.json()) as InvitationAcceptanceResult;

        if (!mounted) {
          return;
        }

        setResult(data);
        setMessage(data.message);
        setRequestState(response.ok ? "done" : "error");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setResult({
          ok: false,
          status: "invalid",
          invitation: null,
          message:
            error instanceof Error
              ? error.message
              : "초대 링크를 확인하지 못했습니다.",
        });
        setMessage(
          error instanceof Error
            ? error.message
            : "초대 링크를 확인하지 못했습니다.",
        );
        setRequestState("error");
      }
    }

    previewInvitation();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleAcceptInvitation() {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      return;
    }

    setRequestState("accepting");
    setMessage("초대 수락 처리 중입니다.");

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: normalizedToken,
          acceptedUserId: null,
        }),
      });

      const data = (await response.json()) as InvitationAcceptanceResult;
      setResult(data);
      setMessage(data.message);
      setRequestState(response.ok ? "done" : "error");
    } catch (error) {
      setResult({
        ok: false,
        status: "invalid",
        invitation: null,
        message:
          error instanceof Error
            ? error.message
            : "초대 수락 처리에 실패했습니다.",
      });
      setMessage(
        error instanceof Error
          ? error.message
          : "초대 수락 처리에 실패했습니다.",
      );
      setRequestState("error");
    }
  }

  const activeStatus = result?.status ?? "ready";
  const activeView = getInvitationAcceptStatusView(activeStatus);
  const invitation = result?.invitation ?? null;
  const canAccept = result?.ok === true && activeStatus === "ready";
  const isBusy = requestState === "loading" || requestState === "accepting";

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                INVITATION ACCEPT
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                초대 링크 수락
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                초대 링크 token을 API로 검증하고 ready / invalid / expired / revoked / accepted 상태를 표시합니다.
                실제 회원가입, 로그인, user 생성은 아직 연결하지 않습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">수신 token</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                URL에서 받은 token은 화면에서 마스킹해서만 표시합니다.
              </p>
            </div>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600">
              {requestState}
            </span>
          </div>
          <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            {maskedToken}
          </code>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            현재 상태
          </p>
          <h2 className="mt-3 text-xl font-semibold text-stone-950">
            {activeView.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            {activeView.description}
          </p>

          <button
            type="button"
            onClick={handleAcceptInvitation}
            disabled={!canAccept || isBusy}
            className="mt-5 rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            {requestState === "accepting" ? "수락 처리 중" : "초대 수락"}
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => {
            const card = getInvitationAcceptStatusView(status);

            return (
              <article
                key={status}
                className={`rounded-3xl border p-5 shadow-sm ${getStatusClassName(
                  status,
                  activeStatus,
                )}`}
              >
                <p className="text-xs font-semibold opacity-80">{card.label}</p>
                <h2 className="mt-3 text-base font-semibold">{card.title}</h2>
                <p className="mt-2 text-xs leading-5 opacity-80">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">초대 정보</h2>
            {invitation ? (
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-stone-500">이메일</dt>
                  <dd className="min-w-0 truncate font-semibold text-stone-950">
                    {invitation.recipientEmail}
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-stone-500">역할</dt>
                  <dd className="font-semibold text-stone-950">
                    {invitation.recipientRole}
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-stone-500">권한 preset</dt>
                  <dd className="font-semibold text-stone-950">
                    {invitation.permissionPreset}
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-stone-500">scope</dt>
                  <dd className="font-semibold text-stone-950">
                    {invitation.scope}
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-stone-500">만료</dt>
                  <dd className="font-semibold text-stone-950">
                    {formatDateTime(invitation.expiresAt)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-stone-600">
                표시할 초대 정보가 없습니다.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-600">
              {INVITATION_ACCEPT_POLICY_NOTES.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
