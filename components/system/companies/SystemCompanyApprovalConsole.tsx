"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
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
  type SystemCompanyJoinRequestPreview,
  type SystemCompanyRequestEmailMatchStatus,
} from "@/lib/system/systemCompanyApprovalConsole";
import type { AdminTableColumn } from "@/lib/admin/common/types";

type JoinRequestListResponse = {
  ok?: boolean;
  joinRequests?: JoinRequestRecord[];
  error?: string;
};

type CompanyJoinRequestReviewResponse = {
  ok?: boolean;
  error?: string;
};

function getCompanyStepStatusTone(status: SystemCompanyApprovalStepStatus) {
  if (status === "ready") return "success";
  if (status === "planned") return "warning";
  return "neutral";
}

function getCompanyActionVariant(state: "disabled" | "ready") {
  return state === "ready" ? "primary" : "secondary";
}

function getLoadStatusTone(status: SystemCompanyJoinRequestLoadStatus) {
  if (status === "loaded") return "success";
  if (status === "loading") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function getEmailMatchTone(status: SystemCompanyRequestEmailMatchStatus) {
  if (status === "matched") return "success";
  if (status === "mismatched") return "warning";
  return "neutral";
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

export default function SystemCompanyApprovalConsole() {
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<SystemCompanyJoinRequestLoadStatus>("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  const joinRequests = useMemo(() => toSystemCompanyJoinRequestPreviews(joinRequestRecords), [joinRequestRecords]);
  const summaryItems = useMemo(
    () => getSystemCompanyApprovalSummaryItems(joinRequests.length, joinRequestLoadStatus),
    [joinRequestLoadStatus, joinRequests.length],
  );
  const joinRequestTableColumns = useMemo<AdminTableColumn<SystemCompanyJoinRequestPreview>[]>(
    () => [
      {
        key: "company",
        label: "회사",
        render: (request) => (
          <div>
            <p className="font-semibold text-stone-950">{request.requestedCompanyName}</p>
            <p className="mt-1 text-xs text-stone-500">{request.businessName}</p>
          </div>
        ),
      },
      {
        key: "applicant",
        label: "신청자",
        render: (request) => (
          <div>
            <p className="font-medium text-stone-900">{request.applicantName}</p>
            <p className="mt-1 text-xs text-stone-500">{request.applicantEmail}</p>
          </div>
        ),
      },
      {
        key: "invitationEmail",
        label: "초대 이메일",
        className: "text-xs text-stone-600",
        render: (request) => request.invitationEmailLabel,
      },
      {
        key: "emailMatch",
        label: "비교",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => (
          <AdminStatusBadge tone={getEmailMatchTone(request.emailMatchStatus)}>
            {getEmailMatchLabel(request.emailMatchStatus)}
          </AdminStatusBadge>
        ),
      },
      {
        key: "phone",
        label: "연락처",
        className: "text-xs text-stone-600",
        render: (request) => request.applicantPhoneLabel,
      },
      {
        key: "memo",
        label: "메모",
        className: "max-w-[260px] text-xs leading-5 text-stone-600",
        render: (request) => request.requestMemoLabel,
      },
      {
        key: "requestedAt",
        label: "신청일",
        className: "text-xs text-stone-600",
        render: (request) => request.requestedAtLabel,
      },
      {
        key: "actions",
        label: "처리",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => (
          <div className="flex justify-center gap-2">
            <AdminButton
              onClick={() => void approveCompanyJoinRequest(request.id)}
              disabled={approvingRequestId !== null || rejectingRequestId !== null}
              variant="primary"
            >
              {approvingRequestId === request.id ? "승인 중" : "승인"}
            </AdminButton>
            <AdminButton
              onClick={() => void rejectCompanyJoinRequest(request.id)}
              disabled={approvingRequestId !== null || rejectingRequestId !== null}
              variant="danger"
            >
              {rejectingRequestId === request.id ? "거절 중" : "거절"}
            </AdminButton>
          </div>
        ),
      },
    ],
    [approvingRequestId, rejectingRequestId],
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

  async function approveCompanyJoinRequest(requestId: string) {
    setApprovingRequestId(requestId);
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      const response = await fetch(`/api/system/companies/join-requests/${encodeURIComponent(requestId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as CompanyJoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUEST_APPROVE_FAILED");
      }

      setReviewActionMessage("고객사 생성과 고객관리자 승인 처리를 완료했습니다.");
      await loadCompanyJoinRequests();
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUEST_APPROVE_FAILED");
    } finally {
      setApprovingRequestId(null);
    }
  }

  async function rejectCompanyJoinRequest(requestId: string) {
    setRejectingRequestId(requestId);
    setReviewActionError(null);
    setReviewActionMessage(null);

    try {
      const response = await fetch(`/api/system/companies/join-requests/${encodeURIComponent(requestId)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCode: "system_admin_rejected" }),
      });
      const payload = (await response.json()) as CompanyJoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "COMPANY_JOIN_REQUEST_REJECT_FAILED");
      }

      setReviewActionMessage("고객사 가입 신청을 거절 처리했습니다.");
      await loadCompanyJoinRequests();
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "COMPANY_JOIN_REQUEST_REJECT_FAILED");
    } finally {
      setRejectingRequestId(null);
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
              <AdminStatusBadge tone="neutral">v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
              <AdminLinkButton href="/system/invites">고객 초대</AdminLinkButton>
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
              <AdminStatusBadge tone={getLoadStatusTone(joinRequestLoadStatus)}>
                {getLoadStatusLabel(joinRequestLoadStatus)}
              </AdminStatusBadge>
              <AdminButton onClick={() => void loadCompanyJoinRequests()}>새로고침</AdminButton>
            </div>
          </div>

          {joinRequestLoadError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {joinRequestLoadError}
            </div>
          ) : null}

          {reviewActionError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {reviewActionError}
            </div>
          ) : null}

          {reviewActionMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {reviewActionMessage}
            </div>
          ) : null}

          <div className="mt-5">
            <AdminTable
              items={[...joinRequests]}
              columns={joinRequestTableColumns}
              getRowKey={(request) => request.id}
              emptyLabel="승인 대기 고객사 가입 신청이 없습니다. 고객사 초대 링크로 가입 신청이 들어오면 이 영역에 실제 join_requests.pending 데이터가 표시됩니다."
              isLoading={joinRequestLoadStatus === "loading"}
              loadingLabel="고객사 가입 신청을 불러오는 중입니다."
              gridTemplateColumns="1.2fr 1.1fr 1fr 0.7fr 0.8fr 1.2fr 0.8fr 1fr"
              rowBaseClassName="grid w-full gap-3 px-4 py-4 text-left text-sm md:items-start"
            />
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
                  <AdminStatusBadge tone={getCompanyStepStatusTone(step.status)}>
                    {step.statusLabel}
                  </AdminStatusBadge>
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
                    <AdminStatusBadge tone="success">기본 체크</AdminStatusBadge>
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
                고객사 생성과 고객관리자 승인, 가입 신청 거절 처리를 실제 API 흐름으로 연결했습니다.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {SYSTEM_COMPANY_APPROVAL_ACTIONS.map((action) => (
                <div key={action.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  {action.id === "open-invite" ? (
                    <AdminLinkButton href="/system/invites" variant={getCompanyActionVariant(action.state)} className="w-full rounded-xl">
                      {action.label}
                    </AdminLinkButton>
                  ) : (
                    <AdminButton disabled variant={getCompanyActionVariant(action.state)} className="w-full rounded-xl">
                      {action.label}
                    </AdminButton>
                  )}
                  <p className="mt-2 text-xs leading-5 text-stone-500">{action.helper}</p>
                  <code className="mt-2 block rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-600">
                    {action.requiredPermission}
                  </code>
                </div>
              ))}
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
