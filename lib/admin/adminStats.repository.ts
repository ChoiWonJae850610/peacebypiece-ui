import "server-only";

import type { AdminStatsSnapshot, AdminStatsSourceState } from "@/lib/admin/stats/types";
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

function buildEmptyStats(sourceState: Exclude<AdminStatsSourceState, "db">): AdminStatsSnapshot {
  const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(undefined);

  return {
    summaries: buildAdminSummaryCards({ totalWorkorders: 0, partnerCount: 0, fileUsageLabel, completedThisMonth: 0 }),
    workorderFlow: buildAdminWorkorderFlow([]),
    partnerDistribution: buildAdminPartnerDistribution([]),
    fileUsagePoints,
    keyMetrics: buildAdminKeyMetrics({ reviewWaiting: 0, inspectionWaiting: 0, inboundDelayed: 0, reworkCount: 0, factoryCount: 0 }),
    productionRoundDistribution: buildAdminRoundDistribution([]),
    productionCategoryDistribution: buildAdminCategoryDistribution([]),
    attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
    periodOptions: buildAdminPeriodOptions(),
    sourceState,
    sourceLabel: sourceState === "not_configured" ? "DB 미설정" : "조회 실패",
  };
}

export async function getAdminStatsSnapshot(): Promise<AdminStatsSnapshot> {
  if (!isDatabaseConfigured()) return buildEmptyStats("not_configured");

  try {
    const companyId = getAdminCompanyId();
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult, reviewWaitingResult, inspectionWaitingResult, inboundDelayedResult, reworkResult, factoryResult, roundResult, categoryResult] = await Promise.all([
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
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'review_requested'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'inspection'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'inspection'
            AND updated_at < now() - interval '1 day'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND COALESCE(is_rework, false) = true`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(DISTINCT partner_id)::text AS count_value
           FROM partner_items
          WHERE company_id = $1
            AND COALESCE(is_active, true) = true
            AND item_type = 'factory'`,
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
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 6`,
        [companyId],
      ),
    ]);

    const statusRows = workordersResult.rows;
    const totalWorkorders = statusRows.reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
    const completedThisMonth = readAdminCount(completedResult.rows[0]);
    const partnerCount = readAdminCount(partnersResult.rows[0]);
    const workorderFlow = buildAdminWorkorderFlow(statusRows);
    const partnerDistribution = buildAdminPartnerDistribution(partnerTypesResult.rows);
    const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(fileUsageResult.rows[0]);
    const summaries = buildAdminSummaryCards({ totalWorkorders, partnerCount, fileUsageLabel, completedThisMonth });

    return {
      summaries,
      workorderFlow,
      partnerDistribution,
      fileUsagePoints,
      keyMetrics: buildAdminKeyMetrics({
        reviewWaiting: readAdminCount(reviewWaitingResult.rows[0]),
        inspectionWaiting: readAdminCount(inspectionWaitingResult.rows[0]),
        inboundDelayed: readAdminCount(inboundDelayedResult.rows[0]),
        reworkCount: readAdminCount(reworkResult.rows[0]),
        factoryCount: readAdminCount(factoryResult.rows[0]),
      }),
      productionRoundDistribution: buildAdminRoundDistribution(roundResult.rows),
      productionCategoryDistribution: buildAdminCategoryDistribution(categoryResult.rows),
      attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
      periodOptions: buildAdminPeriodOptions(),
      sourceState: "db",
      sourceLabel: "DB",
    };
  } catch (error) {
    console.warn("[admin-stats] failed to load DB stats. Mock fallback is disabled.", error);
    return buildEmptyStats("error");
  }
}
