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
          createCountMetric("workorders.in_progress", "진행중 작업지시서", 0),
          createCountMetric("attachments.count", "첨부파일", 0),
          createCountMetric("storage.used_bytes", "저장공간 사용량", 0),
        ],
        ratios: [
          createRatioMetric("workorders.completed_ratio", "완료율", 0, 0),
        ],
        series: [
          createSeriesMetricPoint("month.current", "이번 달", 0),
          createSeriesMetricPoint("month.previous", "지난 달", 0),
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
