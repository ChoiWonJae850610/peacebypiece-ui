export const ADMIN_STATS_CHART_COLOR_COUNT = 6;

export const ADMIN_STATS_CHART_COLORS = [
  "var(--pbp-chart-1, #111827)",
  "var(--pbp-chart-2, #d97706)",
  "var(--pbp-chart-3, #059669)",
  "var(--pbp-chart-4, #2563eb)",
  "var(--pbp-chart-5, #7c3aed)",
  "var(--pbp-chart-6, #64748b)",
] as const;

export function getAdminStatsChartColor(index: number) {
  const normalizedIndex = Math.abs(index) % ADMIN_STATS_CHART_COLORS.length;
  return ADMIN_STATS_CHART_COLORS[normalizedIndex];
}
