"use client";

import AdminTable from "@/components/admin/common/AdminTable";
import type { PartnerListItemViewModel } from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";

type PartnerMasterListProps = {
  items: PartnerListItemViewModel[];
  isLoading?: boolean;
  onEditPartner: (partnerId: string) => void;
  className?: string;
};

const PARTNER_TABLE_GRID = "minmax(0,1.18fr) minmax(0,0.72fr) minmax(0,0.82fr) minmax(0,1.02fr) minmax(0,1.08fr) 84px";

export default function PartnerMasterList({ items, isLoading = false, onEditPartner, className = "mt-5" }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;

  return (
    <AdminTable
      className={`${className} md:min-h-[360px] rounded-[28px] bg-white shadow-sm`}
      items={items}
      isLoading={isLoading}
      loadingLabel={listText.loading}
      emptyLabel={listText.empty}
      getRowKey={(item) => item.id}
      gridTemplateColumns={PARTNER_TABLE_GRID}
      rowClassName={(item) => ["px-4 py-4 md:gap-3 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--admin-theme-ring)]", item.isActive ? "bg-white" : "bg-stone-50/80"].join(" ")}
      onRowClick={(item) => onEditPartner(item.id)}
      columns={[
        {
          key: "name",
          label: listText.columns.name,
          render: (item) => (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 max-w-full truncate text-sm font-semibold text-stone-900 md:text-base" title={item.name}>{item.name}</p>
                {!item.isActive ? (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">{listText.inactiveBadge}</span>
                ) : null}
              </div>
              {item.memo ? <p className="mt-1 truncate text-xs text-stone-500">{item.memo}</p> : null}
            </div>
          ),
        },
        { key: "contact", label: listText.columns.contact, className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-stone-600" title={item.contactName}>{item.contactName}</p> },
        { key: "phone", label: listText.columns.phone, className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-stone-600" title={item.phone}>{item.phone}</p> },
        { key: "email", label: listText.columns.email, className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-stone-600" title={item.email}>{item.email}</p> },
        {
          key: "type",
          label: listText.columns.type,
          render: (item) => (
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
                  <span className="block max-w-[160px] truncate" title={item.outsourcingProcessLabel}>{item.outsourcingProcessLabel}</span>
                </div>
              ) : null}
            </div>
          ),
        },
        {
          key: "status",
          label: listText.columns.status,
          render: (item) => (
            <span className={["inline-flex rounded-full px-2.5 py-1 text-xs font-medium", item.isActive ? "bg-teal-100 text-teal-700" : "bg-stone-200 text-stone-600"].join(" ")}>
              {item.isActive ? listText.active : listText.inactive}
            </span>
          ),
        },
      ]}
    />
  );
}
