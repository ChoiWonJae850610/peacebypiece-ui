import type { AdminFileUsageCard, AdminStoragePolicyItem, AdminStoragePolicySettings, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

const PURGE_DAY_OPTIONS: AdminStoragePolicySettings["purgeAfterDays"][] = [1, 5, 15, 30];

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  policyItems: AdminStoragePolicyItem[];
  policySettings: AdminStoragePolicySettings;
  onChangePolicySettings: (next: AdminStoragePolicySettings) => void;
  isSavingPolicy?: boolean;
  policySourceLabel?: string;
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

export default function FileStorageSummary({ usageCards, usageSummary, policyItems, policySettings, onChangePolicySettings, isSavingPolicy = false, policySourceLabel = "company_settings 기준" }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";

  return (
    <div className="grid shrink-0 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[24px] bg-stone-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">STORAGE</p>
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
          </div>

          <div className="grid grid-cols-2 gap-2">
            {usageCards.map((card) => (
              <article key={card.label} className="rounded-3xl border border-stone-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-stone-500">{card.label}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-stone-950">{card.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">POLICY</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-stone-950">파일 정책 빠른 수정</h2>
          </div>
          {isSavingPolicy ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">저장 중</span> : null}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-1">
          <article className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-3">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">삭제 방식</p>
              <p className="mt-1 text-sm font-semibold text-stone-950">{policySettings.softDeleteEnabled ? "소프트 삭제" : "즉시 삭제"}</p>
            </div>
            <ToggleSwitch checked={policySettings.softDeleteEnabled} label="소프트 삭제" onChange={(softDeleteEnabled) => onChangePolicySettings({ ...policySettings, softDeleteEnabled })} />
          </article>

          <article className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-3">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">용량 계산</p>
              <p className="mt-1 text-sm font-semibold text-stone-950">{policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만"}</p>
            </div>
            <ToggleSwitch checked={policySettings.includeTrashInUsage} label="휴지통 포함" onChange={(includeTrashInUsage) => onChangePolicySettings({ ...policySettings, includeTrashInUsage })} />
          </article>
        </div>

        <div className="mt-3 rounded-3xl border border-stone-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-stone-500">실제 삭제 기간</p>
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">{policySourceLabel}</span>
          {policyItems.slice(0, 1).map((item) => (
            <span key={item.label} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">{item.label}: {item.value}</span>
          ))}
          <a href="/admin/settings" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50">전체 정책 관리</a>
        </div>
      </section>
    </div>
  );
}
