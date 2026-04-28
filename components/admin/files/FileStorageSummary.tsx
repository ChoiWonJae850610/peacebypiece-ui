import type { AdminFileUsageCard, AdminStoragePolicySettings, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

const PURGE_DAY_OPTIONS: AdminStoragePolicySettings["purgeAfterDays"][] = [1, 5, 15, 30];
const MINI_CHART_POINTS = [12, 18, 10, 24, 20, 32, 26];

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  policySettings: AdminStoragePolicySettings;
  onChangePolicySettings: (next: AdminStoragePolicySettings) => void;
  isSavingPolicy?: boolean;
};

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex h-7 w-14 items-center rounded-full border px-1 transition ${checked ? "border-stone-950 bg-stone-950" : "border-stone-300 bg-stone-200"}`}
    >
      <span className="sr-only">{label}</span>
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-7" : "translate-x-0"}`} />
    </button>
  );
}

function MiniUsageChart() {
  const max = Math.max(...MINI_CHART_POINTS);
  const points = MINI_CHART_POINTS.map((value, index) => {
    const x = 8 + index * 18;
    const y = 48 - (value / max) * 34;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mt-4 rounded-2xl bg-white/10 p-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
        <span>최근 첨부</span>
        <span>7일</span>
      </div>
      <svg viewBox="0 0 124 56" className="mt-2 h-14 w-full" aria-hidden="true">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
        {MINI_CHART_POINTS.map((value, index) => {
          const x = 8 + index * 18;
          const y = 48 - (value / max) * 34;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" className="fill-white" />;
        })}
      </svg>
    </div>
  );
}

export default function FileStorageSummary({ usageCards, usageSummary, policySettings, onChangePolicySettings, isSavingPolicy = false }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";

  return (
    <div className="grid shrink-0 gap-3 xl:grid-cols-[1.42fr_0.58fr]">
      <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.05fr_1.35fr]">
          <div className="rounded-[24px] bg-stone-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{usageSummary.usedLabel}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isWarning ? "bg-amber-100 text-amber-900" : "bg-white/10 text-white"}`}>{usageSummary.statusLabel}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone-300">
              <span>사용량</span>
              <span>{usageSummary.usagePercent}% / {usageSummary.limitLabel}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div className={`h-full rounded-full ${isWarning ? "bg-amber-300" : "bg-white"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
            </div>
            <MiniUsageChart />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {usageCards.map((card) => (
              <article key={card.label} className="flex min-h-[104px] flex-col justify-between rounded-3xl border border-stone-200 bg-white p-4">
                <p className="text-[11px] font-semibold text-stone-500">{card.label}</p>
                <p className="text-lg font-semibold tracking-tight text-stone-950">{card.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-stone-950">저장 정책</h2>
          {isSavingPolicy ? <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">저장 중</span> : null}
        </div>

        <div className="mt-3 grid gap-2">
          <article className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-3">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">삭제</p>
              <p className="mt-1 text-sm font-semibold text-stone-950">{policySettings.softDeleteEnabled ? "휴지통" : "즉시"}</p>
            </div>
            <ToggleSwitch checked={policySettings.softDeleteEnabled} label="소프트 삭제" onChange={(softDeleteEnabled) => onChangePolicySettings({ ...policySettings, softDeleteEnabled })} />
          </article>

          <article className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-3">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">용량</p>
              <p className="mt-1 text-sm font-semibold text-stone-950">{policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중만"}</p>
            </div>
            <ToggleSwitch checked={policySettings.includeTrashInUsage} label="휴지통 포함" onChange={(includeTrashInUsage) => onChangePolicySettings({ ...policySettings, includeTrashInUsage })} />
          </article>
        </div>

        <div className="mt-3 rounded-3xl border border-stone-200 bg-white p-3">
          <p className="text-[11px] font-semibold text-stone-500">실제 삭제</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PURGE_DAY_OPTIONS.map((days) => {
              const isSelected = policySettings.purgeAfterDays === days;
              return (
                <button key={days} type="button" onClick={() => onChangePolicySettings({ ...policySettings, purgeAfterDays: days })} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-stone-600 hover:bg-stone-100"}`}>
                  {days}일
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
