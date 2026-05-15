"use client";

import { useMemo, useState, type ReactNode } from "react";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import {
  PARTNER_DEFAULT_SORT_STATE,
  sortPartnerListItems,
  togglePartnerSort,
  type PartnerListItemViewModel,
  type PartnerSortKey,
  type PartnerSortState,
} from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";

type PartnerMasterListProps = {
  items: PartnerListItemViewModel[];
  isLoading?: boolean;
  onEditPartner: (partnerId: string) => void;
  className?: string;
};

type SortableHeaderProps = {
  label: string;
  sortKey: PartnerSortKey;
  activeSort: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
};

const PARTNER_TABLE_GRID = "minmax(0,1.18fr) minmax(0,0.72fr) minmax(0,0.82fr) minmax(0,1.02fr) minmax(0,1.08fr) 84px";

function SortableHeader({ label, sortKey, activeSort, onSort }: SortableHeaderProps) {
  const isActive = activeSort.key === sortKey;
  const marker = isActive ? (activeSort.direction === "asc" ? "↑" : "↓") : "↕";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-1 text-left transition hover:bg-[var(--admin-theme-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-ring)]"
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <span className={isActive ? "text-[var(--admin-theme-primary)]" : "text-[var(--pbp-text-muted)]"} aria-hidden="true">
        {marker}
      </span>
    </button>
  );
}

export default function PartnerMasterList({ items, isLoading = false, onEditPartner, className = "mt-5" }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;
  const [sortState, setSortState] = useState<PartnerSortState>(PARTNER_DEFAULT_SORT_STATE);
  const sortedItems = useMemo(() => sortPartnerListItems(items, sortState), [items, sortState]);

  const handleSort = (sortKey: PartnerSortKey) => {
    setSortState((current) => togglePartnerSort(current, sortKey));
  };

  const buildHeader = (key: PartnerSortKey, label: string): ReactNode => (
    <SortableHeader label={label} sortKey={key} activeSort={sortState} onSort={handleSort} />
  );

  return (
    <AdminTable
      className={`${className} rounded-[28px] bg-white shadow-sm`}
      items={sortedItems}
      isLoading={isLoading}
      loadingLabel={listText.loading}
      emptyLabel={listText.empty}
      getRowKey={(item) => item.id}
      gridTemplateColumns={PARTNER_TABLE_GRID}
      rowClassName={(item) => [
        "px-4 py-3 md:gap-3 transition hover:bg-[var(--admin-theme-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--admin-theme-ring)]",
        item.isActive ? "bg-white" : "bg-[var(--pbp-surface-muted)]",
      ].join(" ")}
      onRowClick={(item) => onEditPartner(item.id)}
      columns={[
        {
          key: "name",
          label: buildHeader("name", listText.columns.name),
          render: (item) => (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 max-w-full truncate text-sm font-semibold text-[var(--pbp-text-strong)] md:text-base" title={item.name}>{item.name}</p>
                {!item.isActive ? (
                  <AdminStatusBadge tone="neutral" size="xs">{listText.inactiveBadge}</AdminStatusBadge>
                ) : null}
              </div>
              {item.memo ? <p className="mt-1 truncate text-xs text-[var(--pbp-text-muted)]">{item.memo}</p> : null}
            </div>
          ),
        },
        { key: "contact", label: buildHeader("contact", listText.columns.contact), className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-[var(--pbp-text-muted)]" title={item.contactName}>{item.contactName}</p> },
        { key: "phone", label: buildHeader("phone", listText.columns.phone), className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-[var(--pbp-text-muted)]" title={item.phone}>{item.phone}</p> },
        { key: "email", label: buildHeader("email", listText.columns.email), className: "min-w-0", render: (item) => <p className="min-w-0 truncate text-sm text-[var(--pbp-text-muted)]" title={item.email}>{item.email}</p> },
        {
          key: "type",
          label: buildHeader("type", listText.columns.type),
          render: (item) => (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label={item.typeDisplayLabel || listText.typeMissing}>
              {item.hasBaseTypes ? (
                item.baseTypeBadges.map((badge) => (
                  <AdminStatusBadge key={badge.key} tone="info" size="xs">
                    {badge.label}
                  </AdminStatusBadge>
                ))
              ) : (
                <span className="text-xs text-[var(--pbp-text-muted)]">{listText.noBaseType}</span>
              )}
              {item.outsourcingProcessBadges.map((badge) => (
                <AdminStatusBadge key={badge.key} tone="warning" size="xs" title={badge.label}>
                  {badge.label}
                </AdminStatusBadge>
              ))}
            </div>
          ),
        },
        {
          key: "status",
          label: buildHeader("status", listText.columns.status),
          render: (item) => (
            <AdminStatusBadge tone={item.isActive ? "success" : "neutral"} size="sm">
              {item.isActive ? listText.active : listText.inactive}
            </AdminStatusBadge>
          ),
        },
      ]}
    />
  );
}
