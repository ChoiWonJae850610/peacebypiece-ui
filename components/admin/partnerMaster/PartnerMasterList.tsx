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

const PARTNER_TABLE_GRID = "minmax(0,1.3fr) minmax(0,0.9fr) minmax(0,1fr) minmax(0,1.4fr) minmax(0,1.4fr) 100px 100px";

export default function PartnerMasterList({ items, isLoading = false, onEditPartner, className = "mt-5" }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;

  return (
    <AdminTable
      className={`${className} rounded-[28px] bg-white shadow-sm`}
      items={items}
      isLoading={isLoading}
      loadingLabel={listText.loading}
      emptyLabel={listText.empty}
      getRowKey={(item) => item.id}
      gridTemplateColumns={PARTNER_TABLE_GRID}
      rowClassName={(item) => ["px-4 py-4 md:gap-4", item.isActive ? "bg-white" : "bg-stone-50/80"].join(" ")}
      columns={[
        {
          key: "name",
          label: listText.columns.name,
          render: (item) => (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-stone-900 md:text-base">{item.name}</p>
                {!item.isActive ? (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">{listText.inactiveBadge}</span>
                ) : null}
              </div>
              {item.memo ? <p className="mt-1 truncate text-xs text-stone-500">{item.memo}</p> : null}
            </div>
          ),
        },
        { key: "contact", label: listText.columns.contact, render: (item) => <p className="text-sm text-stone-600">{item.contactName}</p> },
        { key: "phone", label: listText.columns.phone, render: (item) => <p className="text-sm text-stone-600">{item.phone}</p> },
        { key: "email", label: listText.columns.email, render: (item) => <p className="min-w-0 truncate text-sm text-stone-600">{item.email}</p> },
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
                  <span className="block truncate">{item.outsourcingProcessLabel}</span>
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
        {
          key: "actions",
          label: listText.columns.actions,
          render: (item) => (
            <button
              type="button"
              onClick={() => onEditPartner(item.id)}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              {listText.edit}
            </button>
          ),
        },
      ]}
    />
  );
}
