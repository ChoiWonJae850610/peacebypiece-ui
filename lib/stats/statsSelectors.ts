import type {
  CountMetric,
  RatioMetric,
  SeriesMetricPoint,
  StatsPeriod,
  StatsSummary,
} from "./statsTypes";

export function createDefaultStatsPeriod(now = new Date()): StatsPeriod {
  const to = now.toISOString();
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);

  return {
    from: fromDate.toISOString(),
    to,
  };
}

export function createCountMetric(
  key: string,
  label: string,
  value: number,
): CountMetric {
  return {
    key,
    label,
    value: Math.max(0, value),
  };
}

export function createRatioMetric(
  key: string,
  label: string,
  numerator: number,
  denominator: number,
): RatioMetric {
  const safeNumerator = Math.max(0, numerator);
  const safeDenominator = Math.max(0, denominator);

  return {
    key,
    label,
    numerator: safeNumerator,
    denominator: safeDenominator,
    ratio: safeDenominator === 0 ? 0 : safeNumerator / safeDenominator,
  };
}

export function createSeriesMetricPoint(
  key: string,
  label: string,
  value: number,
): SeriesMetricPoint {
  return {
    key,
    label,
    value: Math.max(0, value),
  };
}

export function createStatsSummary(input: {
  scope: StatsSummary["scope"];
  period?: StatsPeriod;
  counts?: CountMetric[];
  ratios?: RatioMetric[];
  series?: SeriesMetricPoint[];
  generatedAt?: string;
}): StatsSummary {
  return {
    scope: input.scope,
    period: input.period ?? createDefaultStatsPeriod(),
    counts: input.counts ?? [],
    ratios: input.ratios ?? [],
    series: input.series ?? [],
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
