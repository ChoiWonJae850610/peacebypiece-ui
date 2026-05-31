"use client";

import { useRef } from "react";

import PartnerMasterCompactListRows from "@/components/admin/partnerMaster/PartnerMasterCompactListRows";
import PartnerMasterWideTableRows from "@/components/admin/partnerMaster/PartnerMasterWideTableRows";
import { PARTNER_TABLE_MIN_WIDTH } from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import type { PartnerMasterRowsProps } from "@/components/admin/partnerMaster/partnerMasterListTypes";
import { useElementSize } from "@/lib/responsive/useElementSize";

type PartnerMasterResponsiveRowsProps = PartnerMasterRowsProps;

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
