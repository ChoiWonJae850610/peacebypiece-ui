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
import { getAdminStatsChartColor } from "@/lib/admin/stats/chartPalette";
import {
  ADMIN_STATS_BODY_CLASS,
  ADMIN_STATS_ITEM_CLASS,
  ADMIN_STATS_MUTED_PANEL_CLASS,
  ADMIN_STATS_SELECTED_ITEM_CLASS,
  ADMIN_STATS_SUBTLE_TEXT_CLASS,
  ADMIN_STATS_TITLE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";

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

function formatTooltipValue(value: number | string, suffix: string) {
  const normalizedValue = typeof value === "number" ? value.toLocaleString("ko-KR") : value;
  return suffix ? `${normalizedValue}${suffix}` : normalizedValue;
}

function getPointValueLabel(point: ChartPoint, suffix: string) {
  if (point.valueLabel) return point.valueLabel;
  return formatTooltipValue(point.value, suffix);
}

function getDonutTooltipPosition(compact: boolean) {
  return compact ? { x: 142, y: 8 } : { x: 154, y: 8 };
}

type AdminDonutTooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: ChartPoint;
};

type AdminDonutTooltipProps = {
  active?: boolean;
  payload?: AdminDonutTooltipPayload[];
  valueSuffix: string;
};

function AdminDonutTooltip({ active, payload, valueSuffix }: AdminDonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const label = item.payload?.label ?? item.name ?? "";
  const value = item.payload?.value ?? item.value ?? 0;
  const color = item.color ?? "var(--pbp-chart-1, var(--pbp-text-primary))";

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs font-semibold text-[var(--pbp-text-primary)] shadow-[0_12px_30px_rgb(15_23_42_/_0.14)]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="max-w-[132px] truncate">{label}</span>
        <span className="shrink-0 text-[var(--pbp-text-muted)]">{formatTooltipValue(value, valueSuffix)}</span>
      </div>
    </div>
  );
}

export function AdminBasicBarChart({ points, emptyLabel, valueSuffix = "" }: BasicBarChartProps) {
  const total = points.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`${ADMIN_STATS_MUTED_PANEL_CLASS} relative mt-3 min-h-[258px] px-3.5 py-4.5 sm:mt-5 sm:min-h-[316px] sm:px-5 sm:py-6`}>
      {total === 0 ? (
        <div className={`absolute inset-x-5 top-5 z-10 rounded-2xl border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)]/85 px-4 py-3 text-center text-xs font-semibold ${ADMIN_STATS_BODY_CLASS}`}>
          {emptyLabel}
        </div>
      ) : null}
      <div className="h-52 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 20, right: 6, bottom: 0, left: -20 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--pbp-text-muted)" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--pbp-text-subtle)" }} />
            <Tooltip
              cursor={{ fill: "var(--pbp-surface-soft)" }}
              formatter={(value) => formatTooltipValue(value as number | string, valueSuffix)}
              contentStyle={{ borderRadius: 16, borderColor: "var(--pbp-border)", background: "var(--pbp-surface)", color: "var(--pbp-text-primary)", fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[16, 16, 4, 4]} fill="var(--admin-theme-surface)" maxBarSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 lg:grid-cols-5">
        {points.map((item) => (
          <div key={item.label} className={`${ADMIN_STATS_ITEM_CLASS} min-w-0 px-2.5 py-2 text-center sm:px-3`}>
            <p className={`text-sm font-bold ${ADMIN_STATS_TITLE_CLASS}`}>{getPointValueLabel(item, valueSuffix)}</p>
            <p className={`mt-1 truncate text-[11px] font-semibold ${ADMIN_STATS_BODY_CLASS}`}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminBasicDonutChart({ points, totalLabel, valueSuffix = "", emptyLabel = "표시할 데이터가 없습니다", compact = false, selectedLabel = null, onSelectPoint }: BasicDonutChartProps) {
  const total = points.reduce((sum, item) => sum + item.value, 0);
  const chartLayoutClassName = compact ? "mt-3 grid gap-3 sm:mt-5 sm:gap-4" : "mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-[188px_minmax(0,1fr)]";
  const chartBoxClassName = compact ? "relative mx-auto h-40 w-full max-w-[168px] min-w-0 sm:h-44 sm:max-w-[188px]" : "relative h-40 w-full min-w-0 sm:h-44";
  const innerRadius = compact ? 52 : 50;
  const outerRadius = compact ? 80 : 82;

  return (
    <div className={chartLayoutClassName}>
      <div className={chartBoxClassName}>
        {total === 0 ? (
          <div className={`absolute inset-1 z-10 flex items-center justify-center rounded-full border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)]/85 px-4 text-center text-[11px] font-semibold leading-4 ${ADMIN_STATS_BODY_CLASS}`}>
            {emptyLabel}
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={points} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} strokeWidth={0}>
              {points.map((item, index) => (
                <Cell key={item.label} fill={getAdminStatsChartColor(index)} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              allowEscapeViewBox={{ x: true, y: true }}
              position={getDonutTooltipPosition(compact)}
              content={(props) => <AdminDonutTooltip active={props.active} payload={props.payload as AdminDonutTooltipPayload[] | undefined} valueSuffix={valueSuffix} />}
              wrapperStyle={{ pointerEvents: "none", zIndex: 20 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-2xl font-bold leading-none ${ADMIN_STATS_TITLE_CLASS}`}>{total.toLocaleString("ko-KR")}</span>
            {totalLabel ? <span className={`mt-1 text-xs font-semibold leading-none ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}>{totalLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="grid min-w-0 content-center gap-1.5 sm:gap-2">
        {points.map((item, index) => {
          const isSelected = selectedLabel === item.label;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getAdminStatsChartColor(index) }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0">{getPointValueLabel(item, valueSuffix)}</span>
            </>
          );
          const className = `flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold transition sm:px-3.5 ${isSelected ? `${ADMIN_STATS_SELECTED_ITEM_CLASS} text-[var(--pbp-text-primary)]` : `bg-[var(--pbp-surface-muted)] ${ADMIN_STATS_BODY_CLASS}`}`;
          if (!onSelectPoint) {
            return <div key={item.label} className={className}>{content}</div>;
          }
          return (
            <button key={item.label} type="button" onClick={() => onSelectPoint(item.label)} className={`${className} text-left ${isSelected ? "" : "hover:bg-[var(--pbp-surface-soft)]"}`}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
