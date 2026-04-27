import type { AdminFileUsageCard, AdminStoragePolicyItem, AdminStoragePolicySettings, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

const PURGE_DAY_OPTIONS: AdminStoragePolicySettings["purgeAfterDays"][] = [1, 5, 15, 30];

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  policyItems: AdminStoragePolicyItem[];
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
      className={`inline-flex h-8 w-16 items-center rounded-full border px-1 transition ${checked ? "border-stone-950 bg-stone-950" : "border-stone-300 bg-stone-200"}`}
    >
      <span className="sr-only">{label}</span>
      <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-8" : "translate-x-0"}`} />
    </button>
  );
}

export default function FileStorageSummary({ usageCards, usageSummary, policyItems, policySettings, onChangePolicySettings, isSavingPolicy = false }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">STORAGE STATUS</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">용량 사용량</h2>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${isWarning ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
            {usageSummary.statusLabel}
          </span>
        </div>

        <div className="mt-6 rounded-[28px] bg-stone-950 p-5 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-stone-300">현재 사용량</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{usageSummary.usedLabel}</p>
            </div>
            <p className="text-sm text-stone-300">{usageSummary.usagePercent}% / {usageSummary.limitLabel}</p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
            <div className={`h-full rounded-full ${isWarning ? "bg-amber-300" : "bg-white"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {usageCards.map((card) => (
            <article key={card.label} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold text-stone-500">{card.label}</p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-stone-950">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">POLICY</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">용량 / 휴지통 정책</h2>
            {isSavingPolicy ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">저장 중</span> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <article className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">삭제 방식</p>
                <p className="mt-2 text-base font-semibold text-stone-950">소프트 삭제</p>
              </div>
              <ToggleSwitch checked={policySettings.softDeleteEnabled} label="소프트 삭제" onChange={(softDeleteEnabled) => onChangePolicySettings({ ...policySettings, softDeleteEnabled })} />
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">용량 계산</p>
                <p className="mt-2 text-base font-semibold text-stone-950">휴지통 포함</p>
              </div>
              <ToggleSwitch checked={policySettings.includeTrashInUsage} label="휴지통 포함" onChange={(includeTrashInUsage) => onChangePolicySettings({ ...policySettings, includeTrashInUsage })} />
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold text-stone-500">실제 삭제 기간</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PURGE_DAY_OPTIONS.map((days) => {
                const isSelected = policySettings.purgeAfterDays === days;
                return (
                  <button key={days} type="button" onClick={() => onChangePolicySettings({ ...policySettings, purgeAfterDays: days })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-stone-600 hover:bg-stone-100"}`}>
                    {days}일
                  </button>
                );
              })}
            </div>
          </article>
        </div>

        <div className="mt-4 grid gap-2">
          {policyItems.map((item) => (
            <div key={item.label} className="rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">{item.label}</span> · {item.value}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
