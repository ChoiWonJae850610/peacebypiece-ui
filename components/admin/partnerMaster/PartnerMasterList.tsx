"use client";

import { formatPartnerDate, formatPartnerPhone, PARTNER_TYPE_META } from "@/lib/admin/partnerMaster";
import { useI18n } from "@/lib/i18n";
import type { Partner } from "@/types/partner";

type PartnerProcessMeta = Record<string, { label: string; tone: string }>;

type PartnerMasterListProps = {
  partners: Partner[];
  processMeta: PartnerProcessMeta;
  onEditPartner: (partner: Partner) => void;
};

export default function PartnerMasterList({ partners, processMeta, onEditPartner }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
      <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_120px_120px_140px] gap-4 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
        <span>{listText.columns.name}</span>
        <span>{listText.columns.type}</span>
        <span>{listText.columns.status}</span>
        <span>{listText.columns.updatedAt}</span>
        <span>{listText.columns.actions}</span>
      </div>
      <div className="divide-y divide-stone-200">
        {partners.length === 0 ? (
          <div className="px-4 py-10 text-sm text-stone-500">{listText.empty}</div>
        ) : (
          partners.map((partner) => (
            <article key={partner.id} className={["px-4 py-4", partner.isActive ? "bg-white" : "bg-stone-50/80"].join(" ")}>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_120px_120px_140px] md:items-center md:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-900 md:text-base">{partner.name}</p>
                    {!partner.isActive ? (
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">{listText.inactiveBadge}</span>
                    ) : null}
                  </div>
                  <div className="mt-1 space-y-1 text-xs leading-5 text-stone-500">
                    <p>
                      {partner.contactName || partner.phone
                        ? `${partner.contactName || listText.contactMissing} · ${formatPartnerPhone(partner.phone) || listText.phoneMissing}`
                        : `${listText.contactMissing} · ${listText.phoneMissing}`}
                    </p>
                    {partner.email ? <p>{partner.email}</p> : null}
                    <p>{partner.memo || listText.memoMissing}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {partner.partnerTypes
                    .filter((type) => type !== "outsourcing_vendor")
                    .map((type) => (
                      <span key={`${partner.id}-${type}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTNER_TYPE_META[type].tone}`}>
                        {PARTNER_TYPE_META[type].shortLabel}
                      </span>
                    ))}
                  {(partner.outsourcingProcessTypes ?? []).map((type) => (
                    <span key={`${partner.id}-${type}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${processMeta[type].tone}`}>
                      {processMeta[type].label}
                    </span>
                  ))}
                </div>

                <div>
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      partner.isActive ? "bg-teal-100 text-teal-700" : "bg-stone-200 text-stone-600",
                    ].join(" ")}
                  >
                    {partner.isActive ? listText.active : listText.inactive}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{formatPartnerDate(partner.updatedAt)}</p>
                <div>
                  <button
                    type="button"
                    onClick={() => onEditPartner(partner)}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
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
