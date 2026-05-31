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
  ADMIN_RESPONSIVE_TABLE_CLICKABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS,
  ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_CLASS,
  ADMIN_RESPONSIVE_TABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import { AdminResponsiveTableShell } from "@/components/admin/common/responsiveTable/AdminResponsiveTableShell";
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
      className={`${ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS} ${alignClassName}`}
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <span className={isActive ? "text-[var(--admin-theme-primary)]" : ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS} aria-hidden="true">
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
      className={ADMIN_RESPONSIVE_TABLE_HEADER_CLASS}
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
      className={`${ADMIN_RESPONSIVE_TABLE_ROW_CLASS} ${getPartnerRowToneClass(item)} ${canUpdate ? ADMIN_RESPONSIVE_TABLE_CLICKABLE_ROW_CLASS : ""}`}
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
    <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
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
    <AdminResponsiveTableShell>
      <WideTableHeader listText={listText} sortState={sortState} onSort={onSort} />
      {isLoading ? (
        <PartnerRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerRowsEmpty label={listText.empty} />
      ) : (
        <div className={ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS}>
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
    </AdminResponsiveTableShell>
  );
}
