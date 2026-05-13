"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminStatChartPoint } from "@/lib/admin/adminDashboard.presentation";

type ChartPoint = AdminStatChartPoint & {
  valueLabel?: string;
};

type BasicBarChartProps = {
  points: readonly ChartPoint[];
  emptyLabel: string;
  valueSuffix?: string;
};

type BasicDonutChartProps = {
  points: readonly ChartPoint[];
  totalLabel: string;
  valueSuffix?: string;
  emptyLabel?: string;
  compact?: boolean;
  selectedLabel?: string | null;
  onSelectPoint?: (label: string) => void;
};

const CHART_SEGMENT_COLORS = [
  "var(--admin-theme-surface)",
  "#44403c",
  "#78716c",
  "#a8a29e",
  "#d6d3d1",
  "#e7e5e4",
] as const;

function formatTooltipValue(value: number | string, suffix: string) {
  const normalizedValue = typeof value === "number" ? value.toLocaleString("ko-KR") : value;
  return suffix ? `${normalizedValue}${suffix}` : normalizedValue;
}

function getPointValueLabel(point: ChartPoint, suffix: string) {
  if (point.valueLabel) return point.valueLabel;
  return formatTooltipValue(point.value, suffix);
}

export function AdminBasicBarChart({ points, emptyLabel, valueSuffix = "" }: BasicBarChartProps) {
  const total = points.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative mt-3 min-h-[236px] rounded-[20px] border border-stone-100 bg-stone-50/70 px-3 py-4 sm:mt-5 sm:min-h-[280px] sm:rounded-[22px] sm:px-4 sm:py-5">
      {total === 0 ? (
        <div className="absolute inset-x-5 top-5 z-10 rounded-2xl border border-dashed border-stone-300 bg-white/75 px-4 py-3 text-center text-xs font-semibold text-stone-500">
          {emptyLabel}
        </div>
      ) : null}
      <div className="h-44 w-full sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 18, right: 4, bottom: 0, left: -24 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#78716c" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a8a29e" }} />
            <Tooltip
              cursor={{ fill: "rgba(231, 229, 228, 0.55)" }}
              formatter={(value) => formatTooltipValue(value as number | string, valueSuffix)}
              contentStyle={{ borderRadius: 16, borderColor: "#e7e5e4", fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[16, 16, 4, 4]} fill="var(--admin-theme-surface)" maxBarSize={58} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 lg:grid-cols-5">
        {points.map((item) => (
          <div key={item.label} className="min-w-0 rounded-2xl bg-white px-2.5 py-2 text-center shadow-sm sm:px-3">
            <p className="text-sm font-bold text-stone-950">{getPointValueLabel(item, valueSuffix)}</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-stone-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminBasicDonutChart({ points, totalLabel, valueSuffix = "", emptyLabel = "표시할 데이터가 없습니다", compact = false, selectedLabel = null, onSelectPoint }: BasicDonutChartProps) {
  const total = points.reduce((sum, item) => sum + item.value, 0);
  const chartLayoutClassName = compact ? "mt-3 grid gap-3 sm:mt-5 sm:gap-4" : "mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-[150px_minmax(0,1fr)]";
  const chartBoxClassName = compact ? "relative mx-auto h-32 w-full max-w-[136px] min-w-0 sm:h-36 sm:max-w-[150px]" : "relative h-32 w-full min-w-0 sm:h-36";

  return (
    <div className={chartLayoutClassName}>
      <div className={chartBoxClassName}>
        {total === 0 ? (
          <div className="absolute inset-1 z-10 flex items-center justify-center rounded-full border border-dashed border-stone-300 bg-white/80 px-4 text-center text-[11px] font-semibold leading-4 text-stone-500">
            {emptyLabel}
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={points} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} strokeWidth={0}>
              {points.map((item, index) => (
                <Cell key={item.label} fill={CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatTooltipValue(value as number | string, valueSuffix)}
              contentStyle={{ borderRadius: 16, borderColor: "#e7e5e4", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-stone-950">{formatTooltipValue(total, valueSuffix)}</span>
            <span className="text-[11px] font-semibold text-stone-400">{totalLabel}</span>
          </div>
        ) : null}
      </div>
      <div className="grid min-w-0 content-center gap-1.5 sm:gap-2">
        {points.map((item, index) => {
          const isSelected = selectedLabel === item.label;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length] }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0">{getPointValueLabel(item, valueSuffix)}</span>
            </>
          );
          const className = `flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${isSelected ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "bg-stone-50 text-stone-600"}`;
          if (!onSelectPoint) {
            return <div key={item.label} className={className}>{content}</div>;
          }
          return (
            <button key={item.label} type="button" onClick={() => onSelectPoint(item.label)} className={`${className} text-left hover:bg-stone-100 ${isSelected ? "hover:bg-[var(--admin-theme-surface)]" : ""}`}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
