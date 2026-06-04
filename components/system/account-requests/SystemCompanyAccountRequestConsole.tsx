"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import {
  formatSystemCompanyAccountRequestDate,
  getSystemCompanyAccountRequestFilterLabel,
  getSystemCompanyAccountRequestStatusLabel,
  getSystemCompanyAccountRequestStatusTone,
  getSystemCompanyAccountRequestTypeLabel,
  matchesSystemCompanyAccountRequestFilter,
  type SystemCompanyAccountRequestFilter,
  type SystemCompanyAccountRequestRecord,
} from "@/lib/system/companyAccountRequestPresentation";

type SystemCompanyAccountRequestListResponse = {
  ok?: boolean;
  requests?: SystemCompanyAccountRequestRecord[];
  error?: string;
  message?: string;
};

const REQUEST_FILTERS: SystemCompanyAccountRequestFilter[] = [
  "all",
  "pending",
  "reviewing",
  "approved",
  "rejected",
  "cancelled",
];

function TruncatedText({ value, className = "" }: { value: string | null | undefined; className?: string }) {
  const label = value?.trim() || "-";
  return (
    <span className={["block min-w-0 max-w-full truncate", className].filter(Boolean).join(" ")} title={label}>
      {label}
    </span>
  );
}

export default function SystemCompanyAccountRequestConsole() {
  const [requests, setRequests] = useState<SystemCompanyAccountRequestRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SystemCompanyAccountRequestFilter>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const filteredRequests = useMemo(
    () => requests.filter((request) => matchesSystemCompanyAccountRequestFilter(request, activeFilter)),
    [activeFilter, requests],
  );
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? null;

  const summaryCounts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.requestStatus === "pending").length,
      reviewing: requests.filter((request) => request.requestStatus === "reviewing").length,
      approved: requests.filter((request) => request.requestStatus === "approved").length,
      rejected: requests.filter((request) => request.requestStatus === "rejected").length,
    };
  }, [requests]);

  const columns = useMemo<AdminTableColumn<SystemCompanyAccountRequestRecord>[]>(
    () => [
      {
        key: "company",
        label: "고객사",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={request.companyName} className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`} />
            <TruncatedText value={request.businessName} className="mt-1 text-xs text-[var(--pbp-text-muted)]" />
          </div>
        ),
      },
      {
        key: "type",
        label: "요청",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={getSystemCompanyAccountRequestTypeLabel(request.requestType)} className="font-semibold text-[var(--pbp-text-primary)]" />
            <TruncatedText value={request.requestTitle} className="mt-1" />
          </div>
        ),
      },
      {
        key: "status",
        label: "상태",
        render: (request) => (
          <AdminStatusBadge tone={getSystemCompanyAccountRequestStatusTone(request.requestStatus)}>
            {getSystemCompanyAccountRequestStatusLabel(request.requestStatus)}
          </AdminStatusBadge>
        ),
      },
      {
        key: "requester",
        label: "요청자",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => (
          <div className="min-w-0">
            <TruncatedText value={request.requesterName} className="font-semibold text-[var(--pbp-text-primary)]" />
            <TruncatedText value={request.requesterEmail} className="mt-1" />
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "접수일",
        className: "text-xs text-[var(--pbp-text-muted)]",
        render: (request) => <TruncatedText value={formatSystemCompanyAccountRequestDate(request.createdAt)} />,
      },
      {
        key: "actions",
        label: "검토",
        headerClassName: "text-center",
        className: "text-center",
        render: (request) => (
          <AdminButton onClick={() => setSelectedRequestId(request.id)} variant="secondary">
            상세
          </AdminButton>
        ),
      },
    ],
    [],
  );

  async function loadRequests() {
    setLoadStatus("loading");
    setLoadError(null);

    try {
      const response = await fetch("/api/system/company-account-requests?limit=80", { cache: "no-store" });
      const payload = (await response.json()) as SystemCompanyAccountRequestListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? payload.error ?? "SYSTEM_COMPANY_ACCOUNT_REQUESTS_LOAD_FAILED");
      }

      setRequests(payload.requests ?? []);
      setLoadStatus("loaded");
    } catch (error) {
      setRequests([]);
      setLoadStatus("failed");
      setLoadError(error instanceof Error ? error.message : "회사 계정 요청 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  return (
    <SystemShell>
      <header className={SYSTEM_HEADER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM ACCOUNT REQUESTS</p>
            <div className="space-y-2">
              <h1 className={SYSTEM_TITLE_CLASS}>회사 계정 요청 검토</h1>
              <p className={SYSTEM_SUBTITLE_CLASS}>
                고객사 관리자가 환경설정에서 접수한 회사 정보 변경 요청과 계정 비활성화 요청을 확인합니다.
              </p>
            </div>
          </div>

          <AdminButton onClick={() => void loadRequests()} disabled={loadStatus === "loading"} variant="secondary">
            {loadStatus === "loading" ? "새로고침 중" : "새로고침"}
          </AdminButton>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className={SYSTEM_CARD_CLASS}>
          <p className={SYSTEM_SMALL_TEXT_CLASS}>전체 요청</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--pbp-text-primary)]">{summaryCounts.total}</p>
        </div>
        <div className={SYSTEM_CARD_CLASS}>
          <p className={SYSTEM_SMALL_TEXT_CLASS}>접수됨</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--pbp-text-primary)]">{summaryCounts.pending}</p>
        </div>
        <div className={SYSTEM_CARD_CLASS}>
          <p className={SYSTEM_SMALL_TEXT_CLASS}>검토 중</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--pbp-text-primary)]">{summaryCounts.reviewing}</p>
        </div>
        <div className={SYSTEM_CARD_CLASS}>
          <p className={SYSTEM_SMALL_TEXT_CLASS}>승인됨</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--pbp-text-primary)]">{summaryCounts.approved}</p>
        </div>
        <div className={SYSTEM_CARD_CLASS}>
          <p className={SYSTEM_SMALL_TEXT_CLASS}>반려됨</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--pbp-text-primary)]">{summaryCounts.rejected}</p>
        </div>
      </section>

      <section className={SYSTEM_CARD_CLASS}>
        <div className={SYSTEM_SECTION_HEADER_CLASS}>
          <div>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>요청 목록</h2>
            <p className={SYSTEM_SMALL_TEXT_CLASS}>상태별로 접수 요청을 확인하고 상세 내용을 검토합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {REQUEST_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  activeFilter === filter
                    ? "border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] text-[var(--pbp-text-inverse)]"
                    : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] hover:bg-[var(--pbp-surface-muted)]",
                ].join(" ")}
              >
                {getSystemCompanyAccountRequestFilterLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <div className="mt-4 rounded-2xl border border-[var(--pbp-status-danger-border)] bg-[var(--pbp-status-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--pbp-status-danger)]">
            {loadError}
          </div>
        ) : null}

        <div className="mt-5">
          <AdminTable
            columns={columns}
            items={filteredRequests}
            getRowKey={(request) => request.id}
            emptyLabel="표시할 회사 계정 요청이 없습니다."
            isLoading={loadStatus === "loading"}
            loadingLabel="요청 목록을 불러오는 중입니다."
            onRowClick={(request) => setSelectedRequestId(request.id)}
            scrollMode="page"
          />
        </div>
      </section>

      <section className={SYSTEM_CARD_CLASS}>
        <div className={SYSTEM_SECTION_HEADER_CLASS}>
          <div>
            <h2 className={SYSTEM_SECTION_TITLE_CLASS}>요청 상세</h2>
            <p className={SYSTEM_SMALL_TEXT_CLASS}>승인/반려 처리는 다음 단계에서 연결하고, 현재는 검토용 정보를 먼저 노출합니다.</p>
          </div>
          {selectedRequest ? (
            <AdminStatusBadge tone={getSystemCompanyAccountRequestStatusTone(selectedRequest.requestStatus)}>
              {getSystemCompanyAccountRequestStatusLabel(selectedRequest.requestStatus)}
            </AdminStatusBadge>
          ) : null}
        </div>

        {selectedRequest ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <dl className="grid gap-2">
              <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-3">
                <dt className={SYSTEM_SMALL_TEXT_CLASS}>고객사</dt>
                <dd className="mt-1 font-semibold text-[var(--pbp-text-primary)]">{selectedRequest.companyName}</dd>
              </div>
              <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-3">
                <dt className={SYSTEM_SMALL_TEXT_CLASS}>요청 유형</dt>
                <dd className="mt-1 font-semibold text-[var(--pbp-text-primary)]">{getSystemCompanyAccountRequestTypeLabel(selectedRequest.requestType)}</dd>
              </div>
              <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-3">
                <dt className={SYSTEM_SMALL_TEXT_CLASS}>요청자</dt>
                <dd className="mt-1 font-semibold text-[var(--pbp-text-primary)]">{selectedRequest.requesterName}</dd>
                <dd className="mt-1 text-xs text-[var(--pbp-text-muted)]">{selectedRequest.requesterEmail || "-"}</dd>
              </div>
              <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-3">
                <dt className={SYSTEM_SMALL_TEXT_CLASS}>접수일</dt>
                <dd className="mt-1 font-semibold text-[var(--pbp-text-primary)]">{formatSystemCompanyAccountRequestDate(selectedRequest.createdAt)}</dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{selectedRequest.requestTitle}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--pbp-text-muted)]">{selectedRequest.requestMessage}</p>
              {selectedRequest.reviewMessage ? (
                <div className="mt-4 rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-3">
                  <p className={SYSTEM_SMALL_TEXT_CLASS}>처리 메모</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">{selectedRequest.reviewMessage}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[var(--pbp-surface-muted)] px-4 py-6 text-center text-sm font-medium text-[var(--pbp-text-muted)]">
            검토할 요청을 선택해 주세요.
          </p>
        )}
      </section>
    </SystemShell>
  );
}
