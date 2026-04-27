import type { AdminFileUsageCard, AdminStoragePolicyItem, AdminStoragePolicySettings, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  policyItems: AdminStoragePolicyItem[];
  policySettings: AdminStoragePolicySettings;
  onChangePolicySettings: (next: AdminStoragePolicySettings) => void;
};

const PURGE_DAY_OPTIONS: AdminStoragePolicySettings["purgeAfterDays"][] = [1, 5, 15, 30];

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex h-8 w-16 items-center rounded-full border px-1 transition ${checked ? "border-stone-900 bg-stone-900" : "border-stone-300 bg-stone-200"}`}
    >
      <span className="sr-only">{label}</span>
      <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-8" : "translate-x-0"}`} />
    </button>
  );
}

export default function FileStorageSummary({ usageCards, usageSummary, policySettings, onChangePolicySettings }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        {usageCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">용량 사용량</h2>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${isWarning ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-500"}`}>
            {usageSummary.statusLabel}
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700">{usageSummary.usedLabel} 사용</span>
            <span className="text-stone-500">{usageSummary.usagePercent}% / {usageSummary.limitLabel}</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-stone-800" style={{ width: `${usageSummary.usagePercent}%` }} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">용량 / 휴지통 정책</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500">삭제 방식</p>
                <p className="mt-2 text-base font-semibold text-stone-900">소프트 삭제</p>
              </div>
              <ToggleSwitch
                checked={policySettings.softDeleteEnabled}
                label="소프트 삭제"
                onChange={(softDeleteEnabled) => onChangePolicySettings({ ...policySettings, softDeleteEnabled })}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500">용량 계산</p>
                <p className="mt-2 text-base font-semibold text-stone-900">휴지통 포함</p>
              </div>
              <ToggleSwitch
                checked={policySettings.includeTrashInUsage}
                label="휴지통 포함"
                onChange={(includeTrashInUsage) => onChangePolicySettings({ ...policySettings, includeTrashInUsage })}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-medium text-stone-500">실제 삭제 기간</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PURGE_DAY_OPTIONS.map((days) => {
                const isSelected = policySettings.purgeAfterDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onChangePolicySettings({ ...policySettings, purgeAfterDays: days })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-600 hover:bg-stone-100"}`}
                  >
                    {days}일
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
