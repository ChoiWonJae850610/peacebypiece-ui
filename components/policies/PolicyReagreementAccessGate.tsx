"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";

const POLICY_REAGREEMENT_ALLOWED_PATHS = new Set(["/workspace/legal"]);

type PolicyReagreementStatus = {
  pendingReagreementCount: number;
  hasPendingReagreement: boolean;
};

type PolicyReagreementResponse = {
  ok: boolean;
  status?: PolicyReagreementStatus;
};

function isPolicyReagreementAllowedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (POLICY_REAGREEMENT_ALLOWED_PATHS.has(pathname)) return true;
  return pathname.startsWith("/workspace/legal/");
}

function PolicyReagreementBlockingPanel({ pendingCount, onRetry }: { pendingCount: number; onRetry: () => void }) {
  return (
    <main className="min-h-screen bg-[var(--pbp-bg-app)] p-4 text-[var(--pbp-text-primary)] sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <AdminCard as="section" className="w-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 shadow-[var(--pbp-shadow-card)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] pbp-text-subtle">Policy Reagreement Required</p>
              <h1 className="mt-2 text-xl font-semibold pbp-text-primary">정책 재동의가 필요합니다.</h1>
              <p className="mt-3 text-sm leading-6 pbp-text-muted">
                중요 정책 변경사항에 동의하기 전까지 업무 화면 사용을 잠시 제한합니다. 약관·정책 화면에서 내용을 확인한 뒤 재동의를 완료해 주세요.
              </p>
            </div>
            <AdminStatusBadge tone="danger">{pendingCount}건 대기</AdminStatusBadge>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4 text-sm leading-6 pbp-text-muted">
            <p>허용되는 작업: 약관·정책 열람, 재동의 저장, 로그아웃, 고객지원 문의</p>
            <p className="mt-1">차단되는 작업: 작업지시서, 협력업체, 저장소, 통계, 환경설정 등 업무 데이터 화면 진입</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AdminLinkButton href="/workspace/legal" variant="primary" size="md">
                약관·정책 확인하기
              </AdminLinkButton>
              <AdminLinkButton href="mailto:support@wafl.co.kr" variant="secondary" size="md">
                고객지원 문의
              </AdminLinkButton>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AdminButton variant="ghost" size="md" onClick={onRetry}>
                상태 다시 확인
              </AdminButton>
              <form action="/api/auth/logout" method="post">
                <AdminButton type="submit" variant="secondary" size="md">
                  로그아웃
                </AdminButton>
              </form>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 pbp-text-subtle">
            재동의 완료 후 업무 화면 접근이 자동으로 복구되지 않으면 상태 다시 확인을 누르거나 화면을 새로고침하세요.
          </p>
        </AdminCard>
      </div>
    </main>
  );
}

export default function PolicyReagreementAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<PolicyReagreementStatus | null>(null);
  const [checkKey, setCheckKey] = useState(0);

  const allowedPath = useMemo(() => isPolicyReagreementAllowedPath(pathname), [pathname]);

  useEffect(() => {
    if (allowedPath) {
      setStatus(null);
      return;
    }

    let cancelled = false;

    async function loadReagreementStatus() {
      try {
        const response = await fetch("/api/policies/reagreement", { cache: "no-store" });
        const payload = (await response.json()) as PolicyReagreementResponse;
        if (!cancelled && response.ok && payload.ok && payload.status) {
          setStatus(payload.status);
        }
      } catch {
        if (!cancelled) setStatus(null);
      }
    }

    void loadReagreementStatus();

    return () => {
      cancelled = true;
    };
  }, [allowedPath, checkKey]);

  if (!allowedPath && status?.hasPendingReagreement) {
    return <PolicyReagreementBlockingPanel pendingCount={status.pendingReagreementCount} onRetry={() => setCheckKey((value) => value + 1)} />;
  }

  return <>{children}</>;
}
