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
  canUpdate?: boolean;
  onEditPartner: (partnerId: string) => void;
  className?: string;
};

type SortableHeaderProps = {
  label: string;
  sortKey: PartnerSortKey;
  activeSort: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  align?: "left" | "center";
};

const PARTNER_TABLE_GRID = "minmax(0,1.18fr) minmax(0,0.72fr) minmax(0,0.82fr) minmax(0,1.02fr) minmax(0,1.08fr) 84px";

function SortableHeader({ label, sortKey, activeSort, onSort, align = "left" }: SortableHeaderProps) {
  const isActive = activeSort.key === sortKey;
  const marker = isActive ? (activeSort.direction === "asc" ? "↑" : "↓") : "↕";

  const alignClassName = align === "center" ? "justify-center text-center" : "justify-start text-left";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex w-full max-w-full items-center gap-1 rounded-full px-1.5 py-1 transition hover:bg-[var(--admin-theme-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-ring)] ${alignClassName}`}
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <span className={isActive ? "text-[var(--admin-theme-primary)]" : "text-[var(--pbp-text-muted)]"} aria-hidden="true">
        {marker}
      </span>
    </button>
  );
}

export default function PartnerMasterList({ items, isLoading = false, canUpdate = true, onEditPartner, className = "mt-5" }: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;
  const [sortState, setSortState] = useState<PartnerSortState>(PARTNER_DEFAULT_SORT_STATE);
  const sortedItems = useMemo(() => sortPartnerListItems(items, sortState), [items, sortState]);

  const handleSort = (sortKey: PartnerSortKey) => {
    setSortState((current) => togglePartnerSort(current, sortKey));
  };

  const buildHeader = (key: PartnerSortKey, label: string, align: "left" | "center" = "left"): ReactNode => (
    <SortableHeader label={label} sortKey={key} activeSort={sortState} onSort={handleSort} align={align} />
  );
  const centerCellClassName = "flex h-full min-w-0 items-center justify-center text-center";

  return (
    <AdminTable
      className={`${className} rounded-[28px] bg-[var(--pbp-surface)] shadow-sm`}
      items={sortedItems}
      isLoading={isLoading}
      loadingLabel={listText.loading}
      emptyLabel={listText.empty}
      getRowKey={(item) => item.id}
      gridTemplateColumns={PARTNER_TABLE_GRID}
      rowClassName={(item) => [
        "2xl:min-w-[920px] px-4 py-3 md:gap-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--admin-theme-ring)]",
        canUpdate ? "hover:bg-[var(--admin-theme-soft)]" : "",
        item.isActive ? "bg-[var(--pbp-surface)]" : "bg-[var(--pbp-surface-muted)]",
      ].join(" ")}
      onRowClick={canUpdate ? (item) => onEditPartner(item.id) : undefined}
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
        { key: "contact", label: buildHeader("contact", listText.columns.contact, "center"), headerClassName: "text-center", className: centerCellClassName, render: (item) => <p className="min-w-0 max-w-full truncate text-center text-sm text-[var(--pbp-text-muted)]" title={item.contactName}>{item.contactName}</p> },
        { key: "phone", label: buildHeader("phone", listText.columns.phone, "center"), headerClassName: "text-center", className: centerCellClassName, render: (item) => <p className="min-w-0 max-w-full truncate text-center text-sm text-[var(--pbp-text-muted)]" title={item.phone}>{item.phone}</p> },
        { key: "email", label: buildHeader("email", listText.columns.email, "center"), headerClassName: "text-center", className: centerCellClassName, render: (item) => <p className="min-w-0 max-w-full truncate text-center text-sm text-[var(--pbp-text-muted)]" title={item.email}>{item.email}</p> },
        {
          key: "type",
          label: buildHeader("type", listText.columns.type, "center"),
          headerClassName: "text-center",
          className: centerCellClassName,
          render: (item) => (
            <div className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center" aria-label={item.typeDisplayLabel || listText.typeMissing}>
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5">
                {item.hasBaseTypes ? (
                  item.baseTypeBadges.map((badge) => (
                    <AdminStatusBadge key={badge.key} tone="info" size="xs">
                      {badge.label}
                    </AdminStatusBadge>
                  ))
                ) : (
                  <span className="text-xs text-[var(--pbp-text-muted)]">{listText.noBaseType}</span>
                )}
              </div>
              {item.outsourcingProcessBadges.length > 0 ? (
                <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5">
                  {item.outsourcingProcessBadges.map((badge) => (
                    <AdminStatusBadge key={badge.key} tone="warning" size="xs" title={badge.label}>
                      {badge.label}
                    </AdminStatusBadge>
                  ))}
                </div>
              ) : null}
            </div>
          ),
        },
        {
          key: "status",
          label: buildHeader("status", listText.columns.status, "center"),
          headerClassName: "text-center",
          className: centerCellClassName,
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
