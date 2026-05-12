"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import {
  SYSTEM_COMPANY_APPROVAL_ACTIONS,
  SYSTEM_COMPANY_APPROVAL_PERMISSION_ITEMS,
  SYSTEM_COMPANY_APPROVAL_POLICY_NOTES,
  SYSTEM_COMPANY_APPROVAL_STEPS,
  getSystemCompanyApprovalSummaryItems,
  toSystemCompanyJoinRequestPreviews,
  type SystemCompanyApprovalStepStatus,
  type SystemCompanyJoinRequestLoadStatus,
  type SystemCompanyRequestEmailMatchStatus,
} from "@/lib/system/systemCompanyApprovalConsole";

type JoinRequestListResponse = {
  ok?: boolean;
  joinRequests?: JoinRequestRecord[];
  error?: string;
};

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

function getLoadStatusClassName(status: SystemCompanyJoinRequestLoadStatus) {
  if (status === "loaded") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "loading") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getEmailMatchClassName(status: SystemCompanyRequestEmailMatchStatus) {
  if (status === "matched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "mismatched") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getLoadStatusLabel(status: SystemCompanyJoinRequestLoadStatus) {
  if (status === "loaded") return "DB 연결";
  if (status === "loading") return "불러오는 중";
  if (status === "failed") return "조회 실패";
  return "대기";
}

function getEmailMatchLabel(status: SystemCompanyRequestEmailMatchStatus) {
  if (status === "matched") return "일치";
  if (status === "mismatched") return "불일치";
  return "확인 필요";
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-6 text-center">
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
    </div>
  );
}

export default function SystemCompanyApprovalConsole() {
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<SystemCompanyJoinRequestLoadStatus>("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);

  const joinRequests = useMemo(() => toSystemCompanyJoinRequestPreviews(joinRequestRecords), [joinRequestRecords]);
  const summaryItems = useMemo(
    () => getSystemCompanyApprovalSummaryItems(joinRequests.length, joinRequestLoadStatus),
    [joinRequestLoadStatus, joinRequests.length],
  );

  async function loadCompanyJoinRequests() {
    setJoinRequestLoadStatus("loading");
    setJoinRequestLoadError(null);

    try {
      const response = await fetch(
        "/api/invitations/join-requests?requestType=company&status=pending&invitationScope=system_to_company_admin&limit=50",
        { cache: "no-store" },
      );
      const payload = (await response.json()) as JoinRequestListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUESTS_LOAD_FAILED");
      }

      setJoinRequestRecords(payload.joinRequests ?? []);
      setJoinRequestLoadStatus("loaded");
    } catch (error) {
      setJoinRequestRecords([]);
      setJoinRequestLoadStatus("failed");
      setJoinRequestLoadError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUESTS_LOAD_FAILED");
    }
  }

  useEffect(() => {
    void loadCompanyJoinRequests();
  }, []);

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
                <h1 className="text-2xl font-semibold text-stone-950">시스템관리자 고객사 승인</h1>
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
          {summaryItems.map((item) => (
            <article key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-stone-950">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-600">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">가입 신청 검토</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                request_type = company, invitation.scope = system_to_company_admin 조건의 승인 대기 신청만 표시합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLoadStatusClassName(joinRequestLoadStatus)}`}>
                {getLoadStatusLabel(joinRequestLoadStatus)}
              </span>
              <button
                type="button"
                onClick={() => void loadCompanyJoinRequests()}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                새로고침
              </button>
            </div>
          </div>

          {joinRequestLoadError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {joinRequestLoadError}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            {joinRequests.length === 0 ? (
              <EmptyState
                title="승인 대기 고객사 가입 신청이 없습니다."
                description="고객사 초대 링크로 가입 신청이 들어오면 이 영역에 실제 join_requests.pending 데이터가 표시됩니다."
              />
            ) : (
              <table className="min-w-full divide-y divide-stone-100 text-left text-sm">
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  <tr>
                    <th className="px-4 py-3">회사</th>
                    <th className="px-4 py-3">신청자</th>
                    <th className="px-4 py-3">초대 이메일</th>
                    <th className="px-4 py-3 text-center">비교</th>
                    <th className="px-4 py-3">연락처</th>
                    <th className="px-4 py-3">메모</th>
                    <th className="px-4 py-3">신청일</th>
                    <th className="px-4 py-3 text-center">승인</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {joinRequests.map((request) => (
                    <tr key={request.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-stone-950">{request.requestedCompanyName}</p>
                        <p className="mt-1 text-xs text-stone-500">{request.businessName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-stone-900">{request.applicantName}</p>
                        <p className="mt-1 text-xs text-stone-500">{request.applicantEmail}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-600">{request.invitationEmailLabel}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getEmailMatchClassName(request.emailMatchStatus)}`}>
                          {getEmailMatchLabel(request.emailMatchStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-600">{request.applicantPhoneLabel}</td>
                      <td className="max-w-[260px] px-4 py-4 text-xs leading-5 text-stone-600">{request.requestMemoLabel}</td>
                      <td className="px-4 py-4 text-xs text-stone-600">{request.requestedAtLabel}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          disabled
                          className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-400"
                        >
                          0.10.85 연결
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                고객사 생성/거절 저장은 다음 단계에서 API로 연결하고, 이번 버전에서는 실제 신청 목록 검토까지 연결합니다.
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
