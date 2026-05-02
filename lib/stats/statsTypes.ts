export type StatsScope = "admin" | "system";

export interface StatsPeriod {
  from: string;
  to: string;
}

export interface CountMetric {
  key: string;
  label: string;
  value: number;
}

export interface RatioMetric {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
  ratio: number;
}

export interface SeriesMetricPoint {
  key: string;
  label: string;
  value: number;
}

export interface StatsSummary {
  scope: StatsScope;
  period: StatsPeriod;
  counts: CountMetric[];
  ratios: RatioMetric[];
  series: SeriesMetricPoint[];
  generatedAt: string;
}

export interface AdminStatsQuery {
  companyId: string;
  period?: StatsPeriod;
}

export interface SystemStatsQuery {
  period?: StatsPeriod;
}

export interface StatsRepository {
  getAdminStats(query: AdminStatsQuery): Promise<StatsSummary>;
  getSystemStats(query?: SystemStatsQuery): Promise<StatsSummary>;
}
