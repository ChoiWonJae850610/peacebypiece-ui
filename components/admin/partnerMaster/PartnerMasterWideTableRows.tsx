"use client";

import type { PartnerListItemViewModel, PartnerSortKey, PartnerSortState } from "@/lib/admin/partner";
import type { PartnerMasterListText, PartnerMasterRowsProps } from "@/components/admin/partnerMaster/partnerMasterListTypes";
import {
  getPartnerRowToneClass,
  PARTNER_WIDE_TABLE_GRID,
} from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  WaflDataTableBody,
  WaflDataTableHeader,
  WaflDataTableRow,
  WaflDataTableShell,
  WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS,
} from "@/components/admin/common/WaflDataTable";
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
    <WaflDataTableHeader gridTemplateColumns={PARTNER_WIDE_TABLE_GRID}>
      <PartnerMasterTableSortButton sortKey="name" label={listText.columns.name} activeSort={sortState} onSort={onSort} align="left" />
      <PartnerMasterTableSortButton sortKey="contact" label={listText.columns.contact} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="phone" label={listText.columns.phone} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="email" label={listText.columns.email} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="type" label={listText.columns.type} activeSort={sortState} onSort={onSort} />
      <PartnerMasterTableSortButton sortKey="status" label={listText.columns.status} activeSort={sortState} onSort={onSort} />
    </WaflDataTableHeader>
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
    <WaflDataTableRow
      role={canUpdate ? "button" : undefined}
      tabIndex={canUpdate ? 0 : undefined}
      onClick={openPartner}
      onKeyDown={(event) => handlePartnerRowKeyDown(event, item, canUpdate, onEditPartner)}
      gridTemplateColumns={PARTNER_WIDE_TABLE_GRID}
      className={`${getPartnerRowToneClass(item)} ${canUpdate ? WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS : ""}`}
    >
      <PartnerNameSummary item={item} listText={listText} />
      <PartnerValueText value={item.contactName} />
      <PartnerValueText value={item.phone} />
      <PartnerValueText value={item.email} />
      <PartnerTypeBadges item={item} listText={listText} align="center" />
      <div className="flex justify-center">
        <PartnerStatusBadge item={item} listText={listText} />
      </div>
    </WaflDataTableRow>
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
    <WaflDataTableShell>
      <WideTableHeader listText={listText} sortState={sortState} onSort={onSort} />
      {isLoading ? (
        <PartnerMasterRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerMasterRowsEmpty label={listText.empty} />
      ) : (
        <WaflDataTableBody>
          {items.map((item) => (
            <WidePartnerRow
              key={item.id}
              item={item}
              canUpdate={canUpdate}
              listText={listText}
              onEditPartner={onEditPartner}
            />
          ))}
        </WaflDataTableBody>
      )}
    </WaflDataTableShell>
  );
}
