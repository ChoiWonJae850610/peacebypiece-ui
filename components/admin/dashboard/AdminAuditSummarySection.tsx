"use client";

import { useState } from "react";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
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
              <AdminStatusBadge tone="neutral">
                {getAdminCompletionAuditStatusLabel(completionAuditSummary.overallStatus)}
              </AdminStatusBadge>
              <AdminStatusBadge tone="success">
                {completionAuditSummary.decisionLabel}
              </AdminStatusBadge>
            </div>
            <p className="mt-1 text-xs leading-5 text-stone-500">{completionAuditSummary.decisionSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
            <AdminStatusBadge tone="neutral">{t("auditSummary.chips.db", "데이터")} {completionAuditSummary.dbConnectedCount}+{completionAuditSummary.dbWatchCount}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{t("auditSummary.chips.domain", "구조")} {completionAuditSummary.readyDomainCount}/{completionAuditSummary.totalDomainCount}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{t("auditSummary.chips.sample", "초기자료")} {completionAuditSummary.mockRemoveReadyCount}/{completionAuditSummary.mockRetainedCount}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{t("auditSummary.chips.finalAudit", "마감점검")} {completionAuditSummary.finalAuditWatchCount}/{completionAuditSummary.finalAuditTotalCount}</AdminStatusBadge>
            <AdminButton
              type="button"
              onClick={() => setOpen((value) => !value)}
              variant="primary"
              className="px-3 py-1.5 text-xs"
              aria-expanded={open}
            >
              {open ? t("auditSummary.close", "점검 닫기") : t("auditSummary.open", "점검 펼치기")}
            </AdminButton>
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
