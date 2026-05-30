"use client";

import { useMemo, useState } from "react";

import PartnerMasterResponsiveRows from "@/components/admin/partnerMaster/PartnerMasterResponsiveRows";
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

export default function PartnerMasterList({
  items,
  isLoading = false,
  canUpdate = true,
  onEditPartner,
  className = "mt-5",
}: PartnerMasterListProps) {
  const { i18n } = useI18n();
  const listText = i18n.admin.partnerMaster.list;
  const [sortState, setSortState] = useState<PartnerSortState>(PARTNER_DEFAULT_SORT_STATE);
  const sortedItems = useMemo(() => sortPartnerListItems(items, sortState), [items, sortState]);

  const handleSort = (sortKey: PartnerSortKey) => {
    setSortState((current) => togglePartnerSort(current, sortKey));
  };

  return (
    <div className={className}>
      <PartnerMasterResponsiveRows
        items={sortedItems}
        isLoading={isLoading}
        canUpdate={canUpdate}
        listText={listText}
        sortState={sortState}
        onSort={handleSort}
        onEditPartner={onEditPartner}
      />
    </div>
  );
}
