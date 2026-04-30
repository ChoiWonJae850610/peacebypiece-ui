import "server-only";

import type { AdminStatsPeriodKey, AdminStatsSnapshot, AdminStatsSourceState } from "@/lib/admin/stats/types";
import { getAdminCompanyId } from "@/lib/admin/settings/companyScope";
import {
  buildAdminAttachmentTrashCards,
  buildAdminCategoryDistribution,
  buildAdminFileUsagePoints,
  buildAdminKeyMetrics,
  buildAdminPartnerDistribution,
  buildAdminPeriodOptions,
  buildAdminRoundDistribution,
  buildAdminSummaryCards,
  buildAdminWorkorderFlow,
  normalizeAdminStatsPeriod,
  readAdminCount,
  toAdminStatNumber,
  type AdminCategoryCountRow as CategoryCountRow,
  type AdminCountRow as CountRow,
  type AdminFileUsageRow as FileUsageRow,
  type AdminPartnerTypeCountRow as PartnerTypeCountRow,
  type AdminRoundCountRow as RoundCountRow,
  type AdminStatusCountRow as StatusCountRow,
} from "@/lib/admin/stats/selectors";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";

function getAdminStatsPeriodWhereClause(period: AdminStatsPeriodKey): string {
  if (period === "7d") return "AND updated_at >= now() - interval '7 days'";
  if (period === "15d") return "AND updated_at >= now() - interval '15 days'";
  if (period === "monthly") return "AND updated_at >= date_trunc('month', now())";
  return "AND updated_at >= now() - interval '30 days'";
}

function buildEmptyStats(sourceState: Exclude<AdminStatsSourceState, "db">, selectedPeriod: AdminStatsPeriodKey): AdminStatsSnapshot {
  const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(undefined);

  return {
    summaries: buildAdminSummaryCards({ totalWorkorders: 0, partnerCount: 0, fileUsageLabel, completedInPeriod: 0 }),
    workorderFlow: buildAdminWorkorderFlow([]),
    partnerDistribution: buildAdminPartnerDistribution([]),
    fileUsagePoints,
    keyMetrics: buildAdminKeyMetrics({ reviewWaiting: 0, inspectionWaiting: 0, inboundDelayed: 0, defectCount: 0 }),
    productionRoundDistribution: buildAdminRoundDistribution([]),
    productionCategoryDistribution: buildAdminCategoryDistribution([]),
    attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
    periodOptions: buildAdminPeriodOptions(selectedPeriod),
    selectedPeriod,
    sourceState,
    sourceLabel: sourceState === "not_configured" ? "DB 미설정" : "조회 실패",
  };
}

export async function getAdminStatsSnapshot(periodValue?: string | string[]): Promise<AdminStatsSnapshot> {
  const selectedPeriod = normalizeAdminStatsPeriod(periodValue);
  const periodWhereClause = getAdminStatsPeriodWhereClause(selectedPeriod);
  if (!isDatabaseConfigured()) return buildEmptyStats("not_configured", selectedPeriod);

  try {
    const companyId = getAdminCompanyId();
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult, reviewWaitingResult, inspectionWaitingResult, inboundDelayedResult, defectResult, roundResult, categoryResult] = await Promise.all([
      queryDb<StatusCountRow>(
        `SELECT COALESCE(status, 'draft') AS status,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            ${periodWhereClause}
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
            ${periodWhereClause}`,
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
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'review_requested'
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'inspection'
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'inspection'
            AND updated_at < now() - interval '1 day'
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND COALESCE(is_rework, false) = true
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<RoundCountRow>(
        `SELECT CASE
                  WHEN COALESCE(reorder_round, 0) <= 1 THEN '1차'
                  WHEN reorder_round = 2 THEN '2차'
                  ELSE '3차 이상'
                END AS round_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            ${periodWhereClause}
          GROUP BY 1
          ORDER BY 1`,
        [companyId],
      ),
      queryDb<CategoryCountRow>(
        `SELECT COALESCE(NULLIF(payload->>'categoryLabel', ''), NULLIF(payload->>'category', ''), NULLIF(payload->>'itemCategory', ''), '분류 미지정') AS category_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            ${periodWhereClause}
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 6`,
        [companyId],
      ),
    ]);

    const statusRows = workordersResult.rows;
    const totalWorkorders = statusRows.reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
    const completedInPeriod = readAdminCount(completedResult.rows[0]);
    const partnerCount = readAdminCount(partnersResult.rows[0]);
    const workorderFlow = buildAdminWorkorderFlow(statusRows);
    const partnerDistribution = buildAdminPartnerDistribution(partnerTypesResult.rows);
    const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(fileUsageResult.rows[0]);
    const summaries = buildAdminSummaryCards({ totalWorkorders, partnerCount, fileUsageLabel, completedInPeriod });

    return {
      summaries,
      workorderFlow,
      partnerDistribution,
      fileUsagePoints,
      keyMetrics: buildAdminKeyMetrics({
        reviewWaiting: readAdminCount(reviewWaitingResult.rows[0]),
        inspectionWaiting: readAdminCount(inspectionWaitingResult.rows[0]),
        inboundDelayed: readAdminCount(inboundDelayedResult.rows[0]),
        defectCount: readAdminCount(defectResult.rows[0]),
      }),
      productionRoundDistribution: buildAdminRoundDistribution(roundResult.rows),
      productionCategoryDistribution: buildAdminCategoryDistribution(categoryResult.rows),
      attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
      periodOptions: buildAdminPeriodOptions(selectedPeriod),
      selectedPeriod,
      sourceState: "db",
      sourceLabel: "DB",
    };
  } catch (error) {
    console.warn("[admin-stats] failed to load DB stats. Mock fallback is disabled.", error);
    return buildEmptyStats("error", selectedPeriod);
  }
}
