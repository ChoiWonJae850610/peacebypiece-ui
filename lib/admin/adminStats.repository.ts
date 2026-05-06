import "server-only";

import type { AdminStatsCategoryByRound, AdminStatsFactoryPerformance, AdminStatsPeriodKey, AdminStatsRatioPoint, AdminStatsSnapshot, AdminStatsSourceState } from "@/lib/admin/stats/types";
import { getAdminCompanyId } from "@/lib/admin/settings/companyScope";
import {
  buildAdminAttachmentTrashCards,
  buildAdminCategoryDistribution,
  buildAdminFileUsagePoints,
  buildAdminFactoryProductionDistribution,
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
  type AdminFactoryProductionCountRow as FactoryProductionCountRow,
  type AdminPartnerTypeCountRow as PartnerTypeCountRow,
  type AdminRoundCountRow as RoundCountRow,
  type AdminStatusCountRow as StatusCountRow,
} from "@/lib/admin/stats/selectors";
import { ADMIN_FILE_LIMIT_BYTES } from "@/lib/constants/adminStats";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";

type ReorderTopProductRow = Record<string, unknown> & { product_label: string | null; count_value: string | number | null };
type CategoryByRoundRow = Record<string, unknown> & { round_key: "first" | "second" | "third" | null; category_label: string | null; count_value: string | number | null };
type FactoryPerformanceRow = Record<string, unknown> & {
  factory_label: string | null;
  production_count: string | number | null;
  due_target_count: string | number | null;
  due_delay_count: string | number | null;
  quality_target_count: string | number | null;
  quality_issue_count: string | number | null;
};

function toAdminRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function buildAdminReorderTopProducts(rows: ReorderTopProductRow[]): AdminStatsRatioPoint[] {
  return rows
    .map((row) => ({ label: row.product_label || "제품 미지정", value: toAdminStatNumber(row.count_value) }))
    .filter((item) => item.value > 0)
    .slice(0, 5);
}


function buildAdminCategoryByRound(rows: CategoryByRoundRow[]): AdminStatsCategoryByRound {
  const result: AdminStatsCategoryByRound = { first: [], second: [], third: [] };
  rows.forEach((row) => {
    const key = row.round_key === "second" ? "second" : row.round_key === "third" ? "third" : "first";
    const value = toAdminStatNumber(row.count_value);
    if (value <= 0) return;
    result[key].push({ label: row.category_label || "분류 미지정", value });
  });
  return result;
}

function buildAdminFactoryPerformance(rows: FactoryPerformanceRow[]): AdminStatsFactoryPerformance[] {
  return rows.map((row) => {
    const productionCount = toAdminStatNumber(row.production_count);
    const dueDateTargetCount = toAdminStatNumber(row.due_target_count);
    const dueDelayCount = toAdminStatNumber(row.due_delay_count);
    const qualityTargetCount = toAdminStatNumber(row.quality_target_count);
    const qualityIssueCount = toAdminStatNumber(row.quality_issue_count);
    return {
      label: row.factory_label || "공장 미지정",
      productionCount,
      dueDelayRate: toAdminRate(dueDelayCount, dueDateTargetCount),
      dueDelayCount,
      dueDateTargetCount,
      qualityIssueRate: toAdminRate(qualityIssueCount, qualityTargetCount),
      qualityIssueCount,
      qualityTargetCount,
    };
  });
}

function getAdminStatsPeriodWhereClause(period: AdminStatsPeriodKey): string {
  if (period === "all") return "";
  if (period === "7d") return "AND updated_at >= now() - interval '7 days'";
  if (period === "15d") return "AND updated_at >= now() - interval '15 days'";
  if (period === "monthly") return "AND updated_at >= date_trunc('month', now())";
  return "AND updated_at >= now() - interval '30 days'";
}

function buildEmptyStats(sourceState: Exclude<AdminStatsSourceState, "db">, selectedPeriod: AdminStatsPeriodKey): AdminStatsSnapshot {
  const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(undefined);

  return {
    currentOverview: {
      totalProducedCount: 0,
      reorderCount: 0,
      dueDelayRate: null,
      dueDelayCount: 0,
      dueDateTargetCount: 0,
      qualityIssueRate: null,
      qualityIssueCount: 0,
      qualityTargetCount: 0,
      storageUsedBytes: 0,
      storageLimitBytes: ADMIN_FILE_LIMIT_BYTES,
    },
    summaries: buildAdminSummaryCards({ totalWorkorders: 0, partnerCount: 0, fileUsageLabel, completedInPeriod: 0 }),
    workorderFlow: buildAdminWorkorderFlow([]),
    partnerDistribution: buildAdminPartnerDistribution([]),
    fileUsagePoints,
    keyMetrics: buildAdminKeyMetrics({ reviewWaiting: 0, inspectionWaiting: 0, inboundDelayed: 0, defectCount: 0 }),
    productionRoundDistribution: buildAdminRoundDistribution([]),
    factoryProductionDistribution: buildAdminFactoryProductionDistribution([]),
    productionCategoryDistribution: buildAdminCategoryDistribution([]),
    productionCategoryByRound: { first: [], second: [], third: [] },
    reorderTopProducts: [],
    factoryPerformance: [],
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
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult, reviewWaitingResult, inspectionWaitingResult, inboundDelayedResult, defectResult, roundResult, factoryProductionResult, categoryResult, categoryByRoundResult, reorderTopProductsResult, factoryPerformanceResult, currentWorkordersResult, currentReorderResult, dueDateTargetResult, dueDelayedResult, qualityIssueResult] = await Promise.all([
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
      queryDb<FactoryProductionCountRow>(
        `SELECT COALESCE(NULLIF(factory_name, ''), '공장 미지정') AS factory_label,
                COUNT(*)::text AS count_value
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            ${periodWhereClause}
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 6`,
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
      queryDb<CategoryByRoundRow>(
        `SELECT CASE
                  WHEN COALESCE(reorder_round, 0) <= 1 THEN 'first'
                  WHEN reorder_round = 2 THEN 'second'
                  ELSE 'third'
                END AS round_key,
                COALESCE(NULLIF(payload->>'categoryLabel', ''), NULLIF(payload->>'category', ''), NULLIF(payload->>'itemCategory', ''), '분류 미지정') AS category_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            ${periodWhereClause}
          GROUP BY 1, 2
          ORDER BY 1, COUNT(*) DESC
          LIMIT 30`,
        [companyId],
      ),
      queryDb<ReorderTopProductRow>(
        `SELECT COALESCE(NULLIF(title, ''), NULLIF(payload->>'name', ''), NULLIF(payload->>'productName', ''), '제품 미지정') AS product_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (COALESCE(reorder_round, 0) > 1 OR COALESCE(is_rework, false) = true)
            ${periodWhereClause}
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 5`,
        [companyId],
      ),
      queryDb<FactoryPerformanceRow>(
        `SELECT COALESCE(NULLIF(o.factory_name, ''), '공장 미지정') AS factory_label,
                COUNT(*)::text AS production_count,
                COUNT(*) FILTER (WHERE COALESCE(o.due_date, '') ~ '^\\d{4}-\\d{2}-\\d{2}$')::text AS due_target_count,
                COUNT(*) FILTER (
                  WHERE COALESCE(o.due_date, '') ~ '^\\d{4}-\\d{2}-\\d{2}$'
                    AND o.due_date::date < CURRENT_DATE
                    AND o.status <> 'completed'
                )::text AS due_delay_count,
                COUNT(*)::text AS quality_target_count,
                COUNT(*) FILTER (WHERE s.status = 'rejected' OR COALESCE(s.is_rework, false) = true)::text AS quality_issue_count
           FROM orders o
           LEFT JOIN spec_sheets s ON s.id = o.spec_sheet_id
          WHERE o.company_id = $1
            AND o.deleted_at IS NULL
            AND COALESCE(o.is_active, true) = true
            ${periodWhereClause.replace(/updated_at/g, "o.updated_at")}
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 5`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (COALESCE(reorder_round, 0) > 1 OR COALESCE(is_rework, false) = true)`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND COALESCE(due_date, '') ~ '^\\d{4}-\\d{2}-\\d{2}$'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND COALESCE(due_date, '') ~ '^\\d{4}-\\d{2}-\\d{2}$'
            AND due_date::date < CURRENT_DATE
            AND status <> 'completed'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (status = 'rejected' OR COALESCE(is_rework, false) = true)`,
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
    const currentTotalProducedCount = readAdminCount(currentWorkordersResult.rows[0]);
    const currentReorderCount = readAdminCount(currentReorderResult.rows[0]);
    const dueDateTargetCount = readAdminCount(dueDateTargetResult.rows[0]);
    const dueDelayCount = readAdminCount(dueDelayedResult.rows[0]);
    const qualityIssueCount = readAdminCount(qualityIssueResult.rows[0]);
    const storageUsedBytes = toAdminStatNumber(fileUsageResult.rows[0]?.total_size_bytes);

    return {
      currentOverview: {
        totalProducedCount: currentTotalProducedCount,
        reorderCount: currentReorderCount,
        dueDelayRate: dueDateTargetCount > 0 ? Math.round((dueDelayCount / dueDateTargetCount) * 1000) / 10 : null,
        dueDelayCount,
        dueDateTargetCount,
        qualityIssueRate: currentTotalProducedCount > 0 ? Math.round((qualityIssueCount / currentTotalProducedCount) * 1000) / 10 : null,
        qualityIssueCount,
        qualityTargetCount: currentTotalProducedCount,
        storageUsedBytes,
        storageLimitBytes: ADMIN_FILE_LIMIT_BYTES,
      },
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
      factoryProductionDistribution: buildAdminFactoryProductionDistribution(factoryProductionResult.rows),
      productionCategoryDistribution: buildAdminCategoryDistribution(categoryResult.rows),
      productionCategoryByRound: buildAdminCategoryByRound(categoryByRoundResult.rows),
      reorderTopProducts: buildAdminReorderTopProducts(reorderTopProductsResult.rows),
      factoryPerformance: buildAdminFactoryPerformance(factoryPerformanceResult.rows),
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
