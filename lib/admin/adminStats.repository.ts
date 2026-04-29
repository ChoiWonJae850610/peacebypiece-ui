import "server-only";

import {
  type AdminFileUsagePoint,
  type AdminStatChartPoint,
  type AdminSummaryCard,
} from "@/lib/admin/adminDashboard.presentation";
import { getAdminCompanyId } from "@/lib/admin/companyScope";
import {
  buildAdminFileUsagePoints,
  buildAdminPartnerDistribution,
  buildAdminSummaryCards,
  buildAdminWorkorderFlow,
  readAdminCount,
  toAdminStatNumber,
  type AdminCountRow as CountRow,
  type AdminFileUsageRow as FileUsageRow,
  type AdminPartnerTypeCountRow as PartnerTypeCountRow,
  type AdminStatusCountRow as StatusCountRow,
} from "@/lib/admin/stats/selectors";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";

export type AdminStatsSourceState = "db" | "not_configured" | "error";

export type AdminStatsSnapshot = {
  summaries: AdminSummaryCard[];
  workorderFlow: AdminStatChartPoint[];
  partnerDistribution: AdminStatChartPoint[];
  fileUsagePoints: AdminFileUsagePoint[];
  sourceState: AdminStatsSourceState;
  sourceLabel: "DB" | "DB 미설정" | "조회 실패";
};

function buildEmptyStats(sourceState: Exclude<AdminStatsSourceState, "db">): AdminStatsSnapshot {
  const { points: fileUsagePoints, fileUsageLabel } = buildAdminFileUsagePoints(undefined);

  return {
    summaries: buildAdminSummaryCards({
      totalWorkorders: 0,
      partnerCount: 0,
      fileUsageLabel,
      completedThisMonth: 0,
    }),
    workorderFlow: buildAdminWorkorderFlow([]),
    partnerDistribution: buildAdminPartnerDistribution([]),
    fileUsagePoints,
    sourceState,
    sourceLabel: sourceState === "not_configured" ? "DB 미설정" : "조회 실패",
  };
}

export async function getAdminStatsSnapshot(): Promise<AdminStatsSnapshot> {
  if (!isDatabaseConfigured()) return buildEmptyStats("not_configured");

  try {
    const companyId = getAdminCompanyId();
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult] = await Promise.all([
      queryDb<StatusCountRow>(
        `SELECT COALESCE(status, 'draft') AS status,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
          GROUP BY COALESCE(status, 'draft')`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'completed'
            AND updated_at >= date_trunc('month', now())`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM partners
          WHERE company_id = $1
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
      queryDb<PartnerTypeCountRow>(
        `SELECT item_type,
                COUNT(DISTINCT partner_id)::text AS count_value
           FROM partner_items
          WHERE company_id = $1
            AND COALESCE(is_active, true) = true
          GROUP BY item_type`,
        [companyId],
      ),
      queryDb<FileUsageRow>(
        `SELECT COALESCE(SUM(COALESCE(size_bytes, 0)), 0)::text AS total_size_bytes,
                COUNT(*) FILTER (WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true)::text AS active_count,
                COUNT(*) FILTER (WHERE deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)::text AS trash_count
           FROM attachments
          WHERE company_id = $1`,
        [companyId],
      ),
    ]);

    const statusRows = workordersResult.rows;
    const totalWorkorders = statusRows.reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
    const completedThisMonth = readAdminCount(completedResult.rows[0]);
    const partnerCount = readAdminCount(partnersResult.rows[0]);
    const workorderFlow = buildAdminWorkorderFlow(statusRows);
    const partnerDistribution = buildAdminPartnerDistribution(partnerTypesResult.rows);
    const { points: fileUsagePoints, fileUsageLabel } = buildAdminFileUsagePoints(fileUsageResult.rows[0]);
    const summaries = buildAdminSummaryCards({
      totalWorkorders,
      partnerCount,
      fileUsageLabel,
      completedThisMonth,
    });

    return {
      summaries,
      workorderFlow,
      partnerDistribution,
      fileUsagePoints,
      sourceState: "db",
      sourceLabel: "DB",
    };
  } catch (error) {
    console.warn("[admin-stats] failed to load DB stats. Mock fallback is disabled.", error);
    return buildEmptyStats("error");
  }
}
