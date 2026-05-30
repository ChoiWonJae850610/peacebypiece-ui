export function StorageCylinder({ percent }: { percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative mx-auto mt-2 h-[90px] w-[100px] 2xl:mt-2 2xl:h-[98px] 2xl:w-[108px]" aria-hidden="true">
      <div className="absolute inset-x-4 bottom-0 h-[72px] overflow-hidden rounded-b-[32px] border-x border-b border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-inner">
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-[28px] bg-[color-mix(in_srgb,var(--pbp-chart-2)_18%,var(--pbp-surface))]"
          style={{ height: `${Math.max(6, safePercent)}%` }}
        />
      </div>
      <div className="absolute inset-x-4 top-0 h-10 rounded-[50%] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-sm" />
      <div
        className="absolute inset-x-4 rounded-[50%] border border-[color-mix(in_srgb,var(--pbp-chart-2)_45%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-2)_18%,var(--pbp-surface))]"
        style={{ bottom: `${Math.max(0, Math.min(62, safePercent * 0.62))}px`, height: 34 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="rounded-full bg-[var(--pbp-surface)]/90 px-3 py-1 text-base font-bold text-[var(--pbp-text-primary)] shadow-sm">
          {safePercent}%
        </span>
      </div>
    </div>
  );
}
