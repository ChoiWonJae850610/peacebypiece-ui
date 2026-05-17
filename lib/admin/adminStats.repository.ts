import "server-only";

import type { AdminStatsCompanyScope } from "@/lib/admin/stats/sessionScope";
import type { AdminStatsCategoryByRound, AdminStatsCategoryDrilldown, AdminStatsFactoryPerformance, AdminStatsPeriodKey, AdminStatsRatioPoint, AdminStatsSnapshot, AdminStatsSourceState } from "@/lib/admin/stats/types";
import {
  buildAdminAttachmentTrashCards,
  buildAdminCategoryDistribution,
  buildAdminFileUsagePoints,
  buildAdminFactoryProductionDistribution,
  buildAdminKeyMetrics,
  buildAdminPartnerDistribution,
  buildAdminPeriodOptions,
  buildAdminPeriodRange,
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

type PeriodTopProductRow = Record<string, unknown> & { product_label: string | null; count_value: string | number | null };
type CategoryByRoundRow = Record<string, unknown> & { round_key: "first" | "second" | "third" | null; category_label: string | null; count_value: string | number | null };
type CategoryDrilldownRow = Record<string, unknown> & { drilldown_key: "firstToSecond" | "secondToThird" | null; parent_label: string | null; child_label: string | null; count_value: string | number | null };
type FactoryPerformanceRow = Record<string, unknown> & {
  factory_label: string | null;
  production_count: string | number | null;
  due_target_count: string | number | null;
  due_delay_count: string | number | null;
  quality_target_count: string | number | null;
  quality_issue_count: string | number | null;
  due_delay_examples: string | null;
  quality_issue_examples: string | null;
};

function splitAdminStatsExamples(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split("|||").map((item) => item.trim()).filter(Boolean).slice(0, 3);
}

function toAdminRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function buildAdminPeriodTopProducts(rows: PeriodTopProductRow[]): AdminStatsRatioPoint[] {
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

function buildAdminCategoryDrilldown(rows: CategoryDrilldownRow[]): AdminStatsCategoryDrilldown {
  const result: AdminStatsCategoryDrilldown = { firstToSecond: {}, secondToThird: {} };
  rows.forEach((row) => {
    const key = row.drilldown_key === "secondToThird" ? "secondToThird" : "firstToSecond";
    const parentLabel = row.parent_label || "분류 미지정";
    const childLabel = row.child_label || "분류 미지정";
    const value = toAdminStatNumber(row.count_value);
    if (parentLabel === "분류 미지정" || childLabel === "분류 미지정" || value <= 0) return;
    if (!result[key][parentLabel]) result[key][parentLabel] = [];
    result[key][parentLabel].push({ label: childLabel, value });
  });
  Object.values(result).forEach((group) => {
    Object.keys(group).forEach((parentLabel) => {
      group[parentLabel] = group[parentLabel].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, 5);
    });
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
      dueDelayExamples: splitAdminStatsExamples(row.due_delay_examples),
      qualityIssueExamples: splitAdminStatsExamples(row.quality_issue_examples),
    };
  });
}

function getAdminStatsPeriodWhereClause(period: AdminStatsPeriodKey, startDate?: string, endDate?: string): string {
  if (period === "custom" && startDate && endDate) {
    return `AND updated_at::date BETWEEN DATE '${startDate}' AND DATE '${endDate}'`;
  }
  if (period === "7d") return "AND updated_at >= now() - interval '7 days'";
  return "AND updated_at >= now() - interval '30 days'";
}

const ADMIN_STATS_DATE_INPUT_PATTERN_SQL = "^\\d{4}-\\d{2}-\\d{2}$";

function buildAdminStatsSafeDateExpression(columnName: string): string {
  return `CASE WHEN COALESCE(${columnName}, '') ~ '${ADMIN_STATS_DATE_INPUT_PATTERN_SQL}' THEN ${columnName}::date ELSE NULL END`;
}

function buildAdminStatsColumnName(columnName: string, tableAlias?: string): string {
  return tableAlias ? `${tableAlias}.${columnName}` : columnName;
}

function buildAdminStatsReorderWorkorderCondition(tableAlias?: string): string {
  const reorderRoundColumn = buildAdminStatsColumnName("reorder_round", tableAlias);
  const parentColumn = buildAdminStatsColumnName("parent_spec_sheet_id", tableAlias);
  const kindColumn = buildAdminStatsColumnName("work_order_kind", tableAlias);
  return `(COALESCE(${reorderRoundColumn}, 0) > 1 OR ${parentColumn} IS NOT NULL) AND COALESCE(${kindColumn}, '') <> 'rework'`;
}

function buildAdminStatsDefectWorkorderCondition(tableAlias?: string): string {
  const statusColumn = buildAdminStatsColumnName("status", tableAlias);
  const reworkColumn = buildAdminStatsColumnName("is_rework", tableAlias);
  const kindColumn = buildAdminStatsColumnName("work_order_kind", tableAlias);
  return `${statusColumn} = 'rejected' OR COALESCE(${reworkColumn}, false) = true OR COALESCE(${kindColumn}, '') = 'rework'`;
}

function buildEmptyStats(sourceState: Exclude<AdminStatsSourceState, "db">, selectedPeriod: AdminStatsPeriodKey, selectedPeriodRange = buildAdminPeriodRange(selectedPeriod)): AdminStatsSnapshot {
  const { points: fileUsagePoints, fileUsageLabel, activeFileCount, trashFileCount } = buildAdminFileUsagePoints(undefined);

  return {
    currentOverview: {
      totalProducedCount: 0,
      completedCount: 0,
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
    periodSummary: { completedCount: 0, reorderCount: 0, qualityIssueCount: 0 },
    summaries: buildAdminSummaryCards({ totalWorkorders: 0, partnerCount: 0, fileUsageLabel, completedInPeriod: 0 }),
    workorderFlow: buildAdminWorkorderFlow([]),
    partnerDistribution: buildAdminPartnerDistribution([]),
    fileUsagePoints,
    keyMetrics: buildAdminKeyMetrics({ reviewWaiting: 0, inspectionWaiting: 0, inboundDelayed: 0, defectCount: 0 }),
    productionRoundDistribution: buildAdminRoundDistribution([]),
    factoryProductionDistribution: buildAdminFactoryProductionDistribution([]),
    productionCategoryDistribution: buildAdminCategoryDistribution([]),
    productionCategoryByRound: { first: [], second: [], third: [] },
    productionCategoryDrilldown: { firstToSecond: {}, secondToThird: {} },
    reorderTopProducts: [],
    periodTopProducts: { completed: [], reorder: [], defect: [] },
    factoryPerformance: [],
    attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
    periodOptions: buildAdminPeriodOptions(selectedPeriod, selectedPeriodRange),
    selectedPeriod,
    selectedPeriodRange,
    sourceState,
    sourceLabel: sourceState === "not_configured" ? "DB 미설정" : "조회 실패",
  };
}

export async function getAdminStatsSnapshot(companyScope: AdminStatsCompanyScope, periodValue?: string | string[], startDateValue?: string | string[], endDateValue?: string | string[]): Promise<AdminStatsSnapshot> {
  const requestedPeriod = normalizeAdminStatsPeriod(periodValue);
  const selectedPeriodRange = buildAdminPeriodRange(requestedPeriod, startDateValue, endDateValue);
  const selectedPeriod: AdminStatsPeriodKey = requestedPeriod === "custom" && !selectedPeriodRange.isCustom ? "30d" : requestedPeriod;
  const periodWhereClause = getAdminStatsPeriodWhereClause(selectedPeriod, selectedPeriodRange.startDate, selectedPeriodRange.endDate);
  if (!isDatabaseConfigured()) return buildEmptyStats("not_configured", selectedPeriod, selectedPeriodRange);

  try {
    const { companyId } = companyScope;
    const orderDueDateExpression = buildAdminStatsSafeDateExpression("o.due_date");
    const dueDateExpression = buildAdminStatsSafeDateExpression("due_date");
    const reorderWorkorderCondition = buildAdminStatsReorderWorkorderCondition();
    const sourceReorderWorkorderCondition = buildAdminStatsReorderWorkorderCondition("s");
    const defectWorkorderCondition = buildAdminStatsDefectWorkorderCondition();
    const sourceDefectWorkorderCondition = buildAdminStatsDefectWorkorderCondition("s");
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult, reviewWaitingResult, inspectionWaitingResult, inboundDelayedResult, defectResult, roundResult, factoryProductionResult, categoryResult, categoryByRoundResult, categoryDrilldownResult, completedTopProductsResult, reorderTopProductsResult, defectTopProductsResult, factoryPerformanceResult, currentWorkordersResult, currentReorderResult, periodReorderResult, periodQualityIssueResult, dueDateTargetResult, dueDelayedResult, qualityIssueResult] = await Promise.all([
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
            AND (${defectWorkorderCondition})
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
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 6`,
        [companyId],
      ),
      queryDb<CategoryCountRow>(
        `SELECT COALESCE(NULLIF(c2.name, ''), NULLIF(s.category2, ''), '분류 미지정') AS category_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets s
           LEFT JOIN item_categories c2 ON c2.id = s.category2_id AND c2.company_id = s.company_id
          WHERE s.company_id = $1
            AND s.deleted_at IS NULL
            AND COALESCE(s.is_active, true) = true
          GROUP BY 1
          ORDER BY COUNT(*) DESC
          LIMIT 6`,
        [companyId],
      ),
      queryDb<CategoryByRoundRow>(
        `WITH category_depth_rows AS (
            SELECT 'first'::text AS round_key,
                   COALESCE(NULLIF(c1.name, ''), NULLIF(s.category1, ''), '분류 미지정') AS category_label
              FROM spec_sheets s
              LEFT JOIN item_categories c1 ON c1.id = s.category1_id AND c1.company_id = s.company_id
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
            UNION ALL
            SELECT 'second'::text AS round_key,
                   COALESCE(NULLIF(c2.name, ''), NULLIF(s.category2, ''), '분류 미지정') AS category_label
              FROM spec_sheets s
              LEFT JOIN item_categories c2 ON c2.id = s.category2_id AND c2.company_id = s.company_id
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
            UNION ALL
            SELECT 'third'::text AS round_key,
                   COALESCE(NULLIF(c3.name, ''), NULLIF(s.category3, ''), '분류 미지정') AS category_label
              FROM spec_sheets s
              LEFT JOIN item_categories c3 ON c3.id = s.category3_id AND c3.company_id = s.company_id
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
          )
          SELECT round_key::text AS round_key,
                 category_label,
                 COUNT(*)::text AS count_value
            FROM category_depth_rows
           WHERE category_label <> '분류 미지정'
           GROUP BY round_key, category_label
           ORDER BY CASE round_key WHEN 'first' THEN 1 WHEN 'second' THEN 2 ELSE 3 END, COUNT(*) DESC, category_label
           LIMIT 45`,
        [companyId],
      ),
      queryDb<CategoryDrilldownRow>(
        `WITH category_drilldown_rows AS (
            SELECT 'firstToSecond'::text AS drilldown_key,
                   COALESCE(NULLIF(c1.name, ''), NULLIF(s.category1, ''), '분류 미지정') AS parent_label,
                   COALESCE(NULLIF(c2.name, ''), NULLIF(s.category2, ''), '분류 미지정') AS child_label
              FROM spec_sheets s
              LEFT JOIN item_categories c1 ON c1.id = s.category1_id AND c1.company_id = s.company_id
              LEFT JOIN item_categories c2 ON c2.id = s.category2_id AND c2.company_id = s.company_id
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
            UNION ALL
            SELECT 'secondToThird'::text AS drilldown_key,
                   COALESCE(NULLIF(c2.name, ''), NULLIF(s.category2, ''), '분류 미지정') AS parent_label,
                   COALESCE(NULLIF(c3.name, ''), NULLIF(s.category3, ''), '분류 미지정') AS child_label
              FROM spec_sheets s
              LEFT JOIN item_categories c2 ON c2.id = s.category2_id AND c2.company_id = s.company_id
              LEFT JOIN item_categories c3 ON c3.id = s.category3_id AND c3.company_id = s.company_id
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
          )
          SELECT drilldown_key::text AS drilldown_key,
                 parent_label,
                 child_label,
                 COUNT(*)::text AS count_value
            FROM category_drilldown_rows
           WHERE parent_label <> '분류 미지정'
             AND child_label <> '분류 미지정'
           GROUP BY drilldown_key, parent_label, child_label
           ORDER BY CASE drilldown_key WHEN 'firstToSecond' THEN 1 ELSE 2 END, parent_label, COUNT(*) DESC, child_label`,
        [companyId],
      ),
      queryDb<PeriodTopProductRow>(
        `SELECT COALESCE(NULLIF(s.title, ''), NULLIF(s.display_title, ''), '제품 미지정') AS product_label,
                COALESCE(SUM(COALESCE(o.quantity, 0)), 0)::text AS count_value
           FROM spec_sheets s
           LEFT JOIN orders o ON o.spec_sheet_id = s.id
            AND o.company_id = s.company_id
            AND o.deleted_at IS NULL
            AND COALESCE(o.is_active, true) = true
          WHERE s.company_id = $1
            AND s.deleted_at IS NULL
            AND COALESCE(s.is_active, true) = true
            AND s.status = 'completed'
            ${periodWhereClause.replace(/updated_at/g, "s.updated_at")}
          GROUP BY 1
          HAVING COALESCE(SUM(COALESCE(o.quantity, 0)), 0) > 0
          ORDER BY COALESCE(SUM(COALESCE(o.quantity, 0)), 0) DESC, product_label
          LIMIT 5`,
        [companyId],
      ),
      queryDb<PeriodTopProductRow>(
        `WITH reorder_rows AS (
            SELECT COALESCE(NULLIF(s.reorder_group_id, ''), s.parent_spec_sheet_id, s.id) AS reorder_group_key,
                   COALESCE(NULLIF(s.title, ''), NULLIF(s.display_title, ''), '제품 미지정') AS product_label,
                   GREATEST(COALESCE(s.reorder_round, 0), CASE WHEN s.parent_spec_sheet_id IS NOT NULL THEN 2 ELSE 0 END) AS reorder_round_value,
                   COALESCE(SUM(COALESCE(o.quantity, 0)), 0) AS order_quantity_value
              FROM spec_sheets s
              LEFT JOIN orders o ON o.spec_sheet_id = s.id
               AND o.company_id = s.company_id
               AND o.deleted_at IS NULL
               AND COALESCE(o.is_active, true) = true
             WHERE s.company_id = $1
               AND s.deleted_at IS NULL
               AND COALESCE(s.is_active, true) = true
               AND ${sourceReorderWorkorderCondition}
               ${periodWhereClause.replace(/updated_at/g, "s.updated_at")}
             GROUP BY reorder_group_key, product_label, reorder_round_value
          )
          SELECT COALESCE((ARRAY_AGG(product_label ORDER BY reorder_round_value DESC, order_quantity_value DESC, product_label))[1], '제품 미지정') AS product_label,
                 MAX(reorder_round_value)::text AS count_value
            FROM reorder_rows
           GROUP BY reorder_group_key
          HAVING MAX(reorder_round_value) > 1
           ORDER BY MAX(reorder_round_value) DESC, SUM(order_quantity_value) DESC, product_label
           LIMIT 5`,
        [companyId],
      ),
      queryDb<PeriodTopProductRow>(
        `SELECT COALESCE(NULLIF(title, ''), NULLIF(display_title, ''), '제품 미지정') AS product_label,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (${defectWorkorderCondition})
            ${periodWhereClause}
          GROUP BY 1
          ORDER BY COUNT(*) DESC, product_label
          LIMIT 5`,
        [companyId],
      ),
      queryDb<FactoryPerformanceRow>(
        `SELECT COALESCE(NULLIF(o.factory_name, ''), '공장 미지정') AS factory_label,
                COUNT(*)::text AS production_count,
                COUNT(*) FILTER (WHERE ${orderDueDateExpression} IS NOT NULL)::text AS due_target_count,
                COUNT(*) FILTER (
                  WHERE ${orderDueDateExpression} IS NOT NULL
                    AND ${orderDueDateExpression} < CURRENT_DATE
                    AND o.status <> 'completed'
                )::text AS due_delay_count,
                COUNT(*)::text AS quality_target_count,
                COUNT(*) FILTER (WHERE ${sourceDefectWorkorderCondition})::text AS quality_issue_count,
                STRING_AGG(DISTINCT COALESCE(NULLIF(s.title, ''), NULLIF(s.display_title, ''), '작업지시서 미지정'), '|||')
                  FILTER (
                    WHERE ${orderDueDateExpression} IS NOT NULL
                      AND ${orderDueDateExpression} < CURRENT_DATE
                      AND o.status <> 'completed'
                  ) AS due_delay_examples,
                STRING_AGG(DISTINCT COALESCE(NULLIF(s.title, ''), NULLIF(s.display_title, ''), '작업지시서 미지정'), '|||')
                  FILTER (WHERE ${sourceDefectWorkorderCondition}) AS quality_issue_examples
           FROM orders o
           LEFT JOIN spec_sheets s ON s.id = o.spec_sheet_id
          WHERE o.company_id = $1
            AND o.deleted_at IS NULL
            AND COALESCE(o.is_active, true) = true
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
            AND ${reorderWorkorderCondition}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND ${reorderWorkorderCondition}
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (${defectWorkorderCondition})
            ${periodWhereClause}`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND ${dueDateExpression} IS NOT NULL`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND ${dueDateExpression} IS NOT NULL
            AND ${dueDateExpression} < CURRENT_DATE
            AND status <> 'completed'`,
        [companyId],
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND (${defectWorkorderCondition})`,
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
    const periodReorderCount = readAdminCount(periodReorderResult.rows[0]);
    const periodQualityIssueCount = readAdminCount(periodQualityIssueResult.rows[0]);
    const dueDateTargetCount = readAdminCount(dueDateTargetResult.rows[0]);
    const dueDelayCount = readAdminCount(dueDelayedResult.rows[0]);
    const qualityIssueCount = readAdminCount(qualityIssueResult.rows[0]);
    const storageUsedBytes = toAdminStatNumber(fileUsageResult.rows[0]?.total_size_bytes);

    return {
      currentOverview: {
        totalProducedCount: currentTotalProducedCount,
        completedCount: completedInPeriod,
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
      periodSummary: { completedCount: completedInPeriod, reorderCount: periodReorderCount, qualityIssueCount: periodQualityIssueCount },
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
      productionCategoryDrilldown: buildAdminCategoryDrilldown(categoryDrilldownResult.rows),
      reorderTopProducts: buildAdminPeriodTopProducts(reorderTopProductsResult.rows),
      periodTopProducts: {
        completed: buildAdminPeriodTopProducts(completedTopProductsResult.rows),
        reorder: buildAdminPeriodTopProducts(reorderTopProductsResult.rows),
        defect: buildAdminPeriodTopProducts(defectTopProductsResult.rows),
      },
      factoryPerformance: buildAdminFactoryPerformance(factoryPerformanceResult.rows),
      attachmentTrashCards: buildAdminAttachmentTrashCards(activeFileCount, trashFileCount),
      periodOptions: buildAdminPeriodOptions(selectedPeriod, selectedPeriodRange),
      selectedPeriod,
      selectedPeriodRange,
      sourceState: "db",
      sourceLabel: "DB",
    };
  } catch (error) {
    console.warn("[admin-stats] failed to load DB stats. Returning empty stats.", error);
    return buildEmptyStats("error", selectedPeriod, selectedPeriodRange);
  }
}
