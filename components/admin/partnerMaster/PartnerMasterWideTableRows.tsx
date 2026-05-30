"use client";

import type {
  PartnerListItemViewModel,
  PartnerSortKey,
  PartnerSortState,
} from "@/lib/admin/partner";
import {
  getPartnerRowToneClass,
  PARTNER_WIDE_TABLE_GRID,
} from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  handlePartnerRowKeyDown,
  PartnerNameSummary,
  PartnerStatusBadge,
  PartnerTypeBadges,
  PartnerValueText,
} from "@/components/admin/partnerMaster/PartnerMasterSharedCells";

type PartnerMasterListText = {
  empty: string;
  loading: string;
  inactiveBadge: string;
  active: string;
  inactive: string;
  noBaseType: string;
  typeMissing: string;
  columns: Record<PartnerSortKey, string>;
};

type PartnerMasterWideTableRowsProps = {
  items: PartnerListItemViewModel[];
  isLoading: boolean;
  canUpdate: boolean;
  listText: PartnerMasterListText;
  sortState: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  onEditPartner: (partnerId: string) => void;
};

function SortButton({
  sortKey,
  label,
  activeSort,
  onSort,
  align = "center",
}: {
  sortKey: PartnerSortKey;
  label: string;
  activeSort: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  align?: "left" | "center";
}) {
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

function WideTableHeader({
  listText,
  sortState,
  onSort,
}: {
  listText: PartnerMasterListText;
  sortState: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
}) {
  return (
    <div
      className="grid items-center gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)]"
      style={{ gridTemplateColumns: PARTNER_WIDE_TABLE_GRID }}
    >
      <SortButton sortKey="name" label={listText.columns.name} activeSort={sortState} onSort={onSort} align="left" />
      <SortButton sortKey="contact" label={listText.columns.contact} activeSort={sortState} onSort={onSort} />
      <SortButton sortKey="phone" label={listText.columns.phone} activeSort={sortState} onSort={onSort} />
      <SortButton sortKey="email" label={listText.columns.email} activeSort={sortState} onSort={onSort} />
      <SortButton sortKey="type" label={listText.columns.type} activeSort={sortState} onSort={onSort} />
      <SortButton sortKey="status" label={listText.columns.status} activeSort={sortState} onSort={onSort} />
    </div>
  );
}

function WidePartnerRow({
  item,
  canUpdate,
  listText,
  onEditPartner,
}: {
  item: PartnerListItemViewModel;
  canUpdate: boolean;
  listText: PartnerMasterListText;
  onEditPartner: (partnerId: string) => void;
}) {
  const openPartner = () => {
    if (canUpdate) onEditPartner(item.id);
  };

  return (
    <div
      role={canUpdate ? "button" : undefined}
      tabIndex={canUpdate ? 0 : undefined}
      onClick={openPartner}
      onKeyDown={(event) => handlePartnerRowKeyDown(event, item, canUpdate, onEditPartner)}
      className={`grid w-full items-center gap-3 px-4 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] ${getPartnerRowToneClass(item)} ${canUpdate ? "cursor-pointer hover:bg-[var(--admin-theme-soft)]" : ""}`}
      style={{ gridTemplateColumns: PARTNER_WIDE_TABLE_GRID }}
    >
      <PartnerNameSummary item={item} listText={listText} />
      <PartnerValueText value={item.contactName} />
      <PartnerValueText value={item.phone} />
      <PartnerValueText value={item.email} />
      <PartnerTypeBadges item={item} listText={listText} align="center" />
      <div className="flex justify-center">
        <PartnerStatusBadge item={item} listText={listText} />
      </div>
    </div>
  );
}

function PartnerRowsEmpty({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">
      {label}
    </div>
  );
}

export default function PartnerMasterWideTableRows({
  items,
  isLoading,
  canUpdate,
  listText,
  sortState,
  onSort,
  onEditPartner,
}: PartnerMasterWideTableRowsProps) {
  return (
    <section className="flex min-h-fit touch-pan-y flex-col overflow-visible rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-sm">
      <WideTableHeader listText={listText} sortState={sortState} onSort={onSort} />
      {isLoading ? (
        <PartnerRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerRowsEmpty label={listText.empty} />
      ) : (
        <div className="divide-y divide-[var(--pbp-border)]">
          {items.map((item) => (
            <WidePartnerRow
              key={item.id}
              item={item}
              canUpdate={canUpdate}
              listText={listText}
              onEditPartner={onEditPartner}
            />
          ))}
        </div>
      )}
    </section>
  );
}
