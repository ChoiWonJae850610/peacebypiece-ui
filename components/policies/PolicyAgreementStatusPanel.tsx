"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";

type PolicyAgreementDocument = {
  documentKey: string;
  title: string;
  category: string;
  versionId: string;
  versionLabel: string;
  requiredForApproval: boolean;
  requiresReagreement: boolean;
  agreedAt: string | null;
};

type PolicyAgreementStatus = {
  documents: PolicyAgreementDocument[];
  requiredCount: number;
  agreedRequiredCount: number;
  allRequiredAgreed: boolean;
};

type PolicyAgreementResponse = {
  ok: boolean;
  status?: PolicyAgreementStatus;
  message?: string;
};

const categoryTone: Record<string, AdminStatusBadgeTone> = {
  service: "brand",
  privacy: "info",
  billing: "success",
  data: "warning",
  operation: "neutral",
};

function formatDateTime(value: string | null): string {
  if (!value) return "미동의";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDocumentAgreementTone(document: PolicyAgreementDocument): AdminStatusBadgeTone {
  if (document.agreedAt) return "success";
  if (document.requiredForApproval) return "warning";
  return "neutral";
}

function getDocumentAgreementLabel(document: PolicyAgreementDocument): string {
  if (document.agreedAt) return "동의 완료";
  if (document.requiredForApproval) return "동의 필요";
  return "선택 문서";
}

export function PolicyAgreementStatusPanel() {
  const [status, setStatus] = useState<PolicyAgreementStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remainingRequiredCount = useMemo(() => {
    if (!status) return 0;
    return Math.max(status.requiredCount - status.agreedRequiredCount, 0);
  }, [status]);

  async function loadStatus() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/policies/current", { cache: "no-store" });
      const payload = (await response.json()) as PolicyAgreementResponse;
      if (!response.ok || !payload.ok || !payload.status) {
        throw new Error(payload.message || "정책 동의 상태를 불러오지 못했습니다.");
      }
      setStatus(payload.status);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "정책 동의 상태를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAgreement() {
    if (isSubmitting || status?.allRequiredAgreed) return;
    const confirmed = window.confirm("필수 약관·정책에 모두 동의하시겠습니까?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/policies/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json()) as PolicyAgreementResponse;
      if (!response.ok || !payload.ok || !payload.status) {
        throw new Error(payload.message || "필수 약관·정책 동의 저장에 실패했습니다.");
      }
      setStatus(payload.status);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "필수 약관·정책 동의 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <AdminCard as="section" className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Agreement Status</p>
          <h2 className="text-base font-semibold pbp-text-primary">필수 약관·정책 동의 상태</h2>
          <p className="mt-1 text-sm leading-6 pbp-text-muted">
            고객사 승인 요청과 서비스 이용에 필요한 필수 약관·정책 동의 상태를 확인합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status ? (
            <AdminStatusBadge tone={status.allRequiredAgreed ? "success" : "warning"}>
              {status.agreedRequiredCount}/{status.requiredCount} 동의
            </AdminStatusBadge>
          ) : null}
          <AdminButton variant="secondary" size="sm" onClick={loadStatus} disabled={isLoading || isSubmitting}>
            새로고침
          </AdminButton>
        </div>
      </div>

      {isLoading ? <p className="mt-4 text-sm pbp-text-muted">동의 상태를 불러오는 중입니다.</p> : null}
      {errorMessage ? <p className="mt-4 text-sm font-semibold text-[var(--pbp-danger-text)]">{errorMessage}</p> : null}

      {status ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
              <p className="text-xs font-semibold pbp-text-subtle">필수 동의 문서</p>
              <p className="mt-2 text-xl font-semibold pbp-text-primary">{status.requiredCount}건</p>
            </div>
            <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
              <p className="text-xs font-semibold pbp-text-subtle">동의 완료</p>
              <p className="mt-2 text-xl font-semibold pbp-text-primary">{status.agreedRequiredCount}건</p>
            </div>
            <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
              <p className="text-xs font-semibold pbp-text-subtle">남은 필수 동의</p>
              <p className="mt-2 text-xl font-semibold pbp-text-primary">{remainingRequiredCount}건</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {status.documents.map((document) => (
              <div key={document.versionId} className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={categoryTone[document.category] ?? "neutral"}>{document.category}</AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">{document.versionLabel}</AdminStatusBadge>
                      <AdminStatusBadge tone={getDocumentAgreementTone(document)}>{getDocumentAgreementLabel(document)}</AdminStatusBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold pbp-text-primary">{document.title}</p>
                  </div>
                  <p className="text-xs font-semibold pbp-text-muted">{formatDateTime(document.agreedAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 pbp-text-muted">
              {status.allRequiredAgreed
                ? "필수 약관·정책 동의가 완료되었습니다."
                : "필수 약관·정책 전체 동의를 저장하면 현재 사용자 기준 동의 이력이 기록됩니다."}
            </p>
            <AdminButton variant="primary" size="sm" onClick={submitAgreement} disabled={isSubmitting || status.allRequiredAgreed}>
              {isSubmitting ? "저장 중" : status.allRequiredAgreed ? "동의 완료" : "필수 약관·정책 전체 동의"}
            </AdminButton>
          </div>
        </div>
      ) : null}
    </AdminCard>
  );
}
