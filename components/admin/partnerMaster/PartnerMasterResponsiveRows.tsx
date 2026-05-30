"use client";

import { useRef } from "react";

import PartnerMasterCompactListRows from "@/components/admin/partnerMaster/PartnerMasterCompactListRows";
import PartnerMasterWideTableRows from "@/components/admin/partnerMaster/PartnerMasterWideTableRows";
import { PARTNER_TABLE_MIN_WIDTH } from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  type PartnerListItemViewModel,
  type PartnerSortKey,
  type PartnerSortState,
} from "@/lib/admin/partner";
import { useElementSize } from "@/lib/responsive/useElementSize";

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

type PartnerMasterResponsiveRowsProps = {
  items: PartnerListItemViewModel[];
  isLoading: boolean;
  canUpdate: boolean;
  listText: PartnerMasterListText;
  sortState: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  onEditPartner: (partnerId: string) => void;
};

export default function PartnerMasterResponsiveRows({
  items,
  isLoading,
  canUpdate,
  listText,
  sortState,
  onSort,
  onEditPartner,
}: PartnerMasterResponsiveRowsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useElementSize(containerRef);
  const shouldUseWideTable = width >= PARTNER_TABLE_MIN_WIDTH;

  return (
    <div ref={containerRef}>
      {shouldUseWideTable ? (
        <PartnerMasterWideTableRows
          items={items}
          isLoading={isLoading}
          canUpdate={canUpdate}
          listText={listText}
          sortState={sortState}
          onSort={onSort}
          onEditPartner={onEditPartner}
        />
      ) : (
        <PartnerMasterCompactListRows
          items={items}
          isLoading={isLoading}
          canUpdate={canUpdate}
          listText={listText}
          sortState={sortState}
          onSort={onSort}
          onEditPartner={onEditPartner}
        />
      )}
    </div>
  );
}
