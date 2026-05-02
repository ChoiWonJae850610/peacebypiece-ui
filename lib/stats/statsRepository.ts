import {
  createCountMetric,
  createDefaultStatsPeriod,
  createRatioMetric,
  createSeriesMetricPoint,
  createStatsSummary,
} from "./statsSelectors";
import type {
  AdminStatsQuery,
  StatsRepository,
  SystemStatsQuery,
} from "./statsTypes";

export function createStatsRepositorySkeleton(): StatsRepository {
  return {
    async getAdminStats(query: AdminStatsQuery) {
      const period = query.period ?? createDefaultStatsPeriod();

      return createStatsSummary({
        scope: "admin",
        period,
        counts: [
          createCountMetric("workorders.total", "전체 작업지시서", 0),
          createCountMetric("workorders.draft", "작성중", 0),
          createCountMetric("workorders.review_requested", "검토요청", 0),
          createCountMetric("workorders.reviewed", "검토완료", 0),
          createCountMetric("workorders.inspection", "생산/검수", 0),
          createCountMetric("workorders.completed", "완료", 0),
          createCountMetric("attachments.count", "첨부파일", 0),
          createCountMetric("storage.used_bytes", "저장공간 사용량", 0),
        ],
        ratios: [
          createRatioMetric("workorders.completed_ratio", "완료율", 0, 0),
          createRatioMetric("storage.usage_ratio", "저장공간 사용률", 0, 0),
        ],
        series: [
          createSeriesMetricPoint("monthly.workorders.current", "이번 달 작업지시서", 0),
          createSeriesMetricPoint("monthly.workorders.previous", "지난 달 작업지시서", 0),
          createSeriesMetricPoint("designer.workload.unassigned", "담당자 미지정", 0),
          createSeriesMetricPoint("factory.production.unassigned", "공장 미지정", 0),
          createSeriesMetricPoint("category.production.uncategorized", "카테고리 미분류", 0),
        ],
      });
    },

    async getSystemStats(query?: SystemStatsQuery) {
      const period = query?.period ?? createDefaultStatsPeriod();

      return createStatsSummary({
        scope: "system",
        period,
        counts: [
          createCountMetric("companies.total", "전체 고객사", 0),
          createCountMetric("companies.active", "활성 고객사", 0),
          createCountMetric("storage.used_bytes", "전체 저장공간 사용량", 0),
          createCountMetric("invitations.pending", "대기중 초대", 0),
        ],
        ratios: [
          createRatioMetric("companies.active_ratio", "고객사 활성 비율", 0, 0),
        ],
        series: [
          createSeriesMetricPoint("plan.starter", "Starter", 0),
          createSeriesMetricPoint("plan.team", "Team", 0),
          createSeriesMetricPoint("plan.business", "Business", 0),
        ],
      });
    },
  };
}

export const statsRepository = createStatsRepositorySkeleton();
