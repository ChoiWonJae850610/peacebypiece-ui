export const ADMIN_CHART_COLOR_COUNT = 6;

export const ADMIN_CHART_COLORS = [
  "var(--pbp-chart-1, #111827)",
  "var(--pbp-chart-2, #d97706)",
  "var(--pbp-chart-3, #059669)",
  "var(--pbp-chart-4, #2563eb)",
  "var(--pbp-chart-5, #7c3aed)",
  "var(--pbp-chart-6, #64748b)",
] as const;

export function getAdminChartColor(index: number) {
  const normalizedIndex = Math.abs(index) % ADMIN_CHART_COLORS.length;
  return ADMIN_CHART_COLORS[normalizedIndex];
}

export function getAdminFileTypeChartColor(label: string, fallbackIndex = 0) {
  const normalizedLabel = label.trim().toLowerCase();

  if (
    normalizedLabel.includes("디자인") ||
    normalizedLabel.includes("design") ||
    normalizedLabel.includes("image")
  ) {
    return "var(--pbp-chart-4, #2563eb)";
  }

  if (
    normalizedLabel.includes("문서") ||
    normalizedLabel.includes("document") ||
    normalizedLabel.includes("pdf")
  ) {
    return "var(--pbp-chart-1, #111827)";
  }

  if (
    normalizedLabel.includes("작업지시서") ||
    normalizedLabel.includes("workorder") ||
    normalizedLabel.includes("work order")
  ) {
    return "var(--pbp-chart-2, #d97706)";
  }

  if (normalizedLabel.includes("메모") || normalizedLabel.includes("memo")) {
    return "var(--pbp-chart-3, #059669)";
  }

  return getAdminChartColor(fallbackIndex);
}
