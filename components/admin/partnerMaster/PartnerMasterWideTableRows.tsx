"use client";

import type { PartnerListItemViewModel, PartnerSortKey, PartnerSortState } from "@/lib/admin/partner";
import type { PartnerMasterListText, PartnerMasterRowsProps } from "@/components/admin/partnerMaster/partnerMasterListTypes";
import {
  getPartnerRowToneClass,
  PARTNER_WIDE_TABLE_GRID,
} from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  ADMIN_RESPONSIVE_TABLE_CLICKABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_CLASS,
  ADMIN_RESPONSIVE_TABLE_ROW_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import { AdminResponsiveTableShell } from "@/components/admin/common/responsiveTable/AdminResponsiveTableShell";
import {
  handlePartnerRowKeyDown,
  PartnerNameSummary,
  PartnerStatusBadge,
  PartnerTypeBadges,
  PartnerValueText,
} from "@/components/admin/partnerMaster/PartnerMasterSharedCells";
import PartnerMasterRowsEmpty from "@/components/admin/partnerMaster/PartnerMasterRowsEmpty";
import { PartnerMasterTableSortButton } from "@/components/admin/partnerMaster/PartnerMasterSortButton";

type PartnerMasterWideTableRowsProps = PartnerMasterRowsProps;

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
      <PartnerMasterTableSortButton sortKey="name" label={listText.columns.name} activeSort={sortState} onSort={onSort} align="left" />
      <PartnerMasterTableSortButton sortKey="contact" label={listText.columns.contact} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="phone" label={listText.columns.phone} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="email" label={listText.columns.email} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="type" label={listText.columns.type} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="status" label={listText.columns.status} activeSort={sortState} onSort={onSort} />
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
        <PartnerMasterRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerMasterRowsEmpty label={listText.empty} />
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
