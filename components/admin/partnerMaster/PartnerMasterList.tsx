"use client";

import type { PartnerListItemViewModel } from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";

type PartnerMasterListProps = {
  items: PartnerListItemViewModel[];
  isLoading?: boolean;
  onEditPartner: (partnerId: string) => void;
  className?: string;
};

export default function PartnerMasterList({ items, isLoading = false, onEditPartner, className = "mt-5" }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;

  return (
    <div className={`${className} flex flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm`}>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_100px_100px] gap-4 bg-stone-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
        <span>{listText.columns.name}</span>
        <span>{listText.columns.contact}</span>
        <span>{listText.columns.phone}</span>
        <span>{listText.columns.email}</span>
        <span>{listText.columns.type}</span>
        <span>{listText.columns.status}</span>
        <span>{listText.columns.actions}</span>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full min-h-[320px] items-center justify-center px-4 py-10 text-center text-sm font-medium text-stone-400">협력업체 목록을 불러오는 중입니다.</div>
        ) : items.length === 0 ? (
          <div className="flex h-full min-h-[320px] items-center justify-center px-4 py-10 text-center text-sm font-medium text-stone-500">{listText.empty}</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className={["px-4 py-4", item.isActive ? "bg-white" : "bg-stone-50/80"].join(" ")}>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_100px_100px] md:items-center md:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-900 md:text-base">{item.name}</p>
                    {!item.isActive ? (
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">{listText.inactiveBadge}</span>
                    ) : null}
                  </div>
                  {item.memo ? <p className="mt-1 truncate text-xs text-stone-500">{item.memo}</p> : null}
                </div>

                <p className="text-sm text-stone-600">{item.contactName}</p>
                <p className="text-sm text-stone-600">{item.phone}</p>
                <p className="min-w-0 truncate text-sm text-stone-600">{item.email}</p>

                <div className="min-w-0 space-y-1.5" aria-label={item.typeDisplayLabel || listText.typeMissing}>
                  <div className="flex min-h-7 flex-wrap items-center gap-1.5">
                    {item.hasBaseTypes ? (
                      item.baseTypeBadges.map((badge) => (
                        <span key={badge.key} className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.tone}`}>
                          {badge.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400">{listText.noBaseType}</span>
                    )}
                  </div>
                  {item.hasOutsourcingProcesses ? (
                    <div className="max-w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium leading-5 text-slate-600">
                      <span className="block truncate">{item.outsourcingProcessLabel}</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      item.isActive ? "bg-teal-100 text-teal-700" : "bg-stone-200 text-stone-600",
                    ].join(" ")}
                  >
                    {item.isActive ? listText.active : listText.inactive}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onEditPartner(item.id)}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                  >
                    {listText.edit}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
