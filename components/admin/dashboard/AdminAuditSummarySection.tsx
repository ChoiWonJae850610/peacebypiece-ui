"use client";

import { useState } from "react";
import AdminCompletionAuditPanel from "@/components/admin/dashboard/AdminCompletionAuditPanel";
import AdminDbConnectionAuditPanel from "@/components/admin/dashboard/AdminDbConnectionAuditPanel";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminCompletionAuditSummary } from "@/lib/admin/completionAudit";
import { getAdminCompletionAuditStatusLabel } from "@/lib/admin/completionAudit";
import type { AdminDbCompletionSummary } from "@/lib/admin/dbCompletionAudit";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminAuditSummarySectionProps = {
  dbCompletionSummary: AdminDbCompletionSummary;
  completionAuditSummary: AdminCompletionAuditSummary;
};

export default function AdminAuditSummarySection({ dbCompletionSummary, completionAuditSummary }: AdminAuditSummarySectionProps) {
  const t = useAdminTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5">
      <AdminCard className="bg-stone-50/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-stone-950">{t("auditSummary.title", "관리자 점검")}</h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">
                {getAdminCompletionAuditStatusLabel(completionAuditSummary.overallStatus)}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {completionAuditSummary.decisionLabel}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-stone-500">{completionAuditSummary.decisionSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-200">DB {completionAuditSummary.dbConnectedCount}+{completionAuditSummary.dbWatchCount}</span>
            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-200">domain {completionAuditSummary.readyDomainCount}/{completionAuditSummary.totalDomainCount}</span>
            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-200">mock {completionAuditSummary.mockRemoveReadyCount}/{completionAuditSummary.mockRetainedCount}</span>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)] transition hover:opacity-90"
              aria-expanded={open}
            >
              {open ? t("auditSummary.close", "점검 닫기") : t("auditSummary.open", "점검 펼치기")}
            </button>
          </div>
        </div>
      </AdminCard>

      {open ? (
        <div className="mt-4 max-h-[70vh] overflow-y-auto overscroll-contain pr-1">
          <div className="grid gap-4">
            <AdminDbConnectionAuditPanel summary={dbCompletionSummary} />
            <AdminCompletionAuditPanel summary={completionAuditSummary} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
