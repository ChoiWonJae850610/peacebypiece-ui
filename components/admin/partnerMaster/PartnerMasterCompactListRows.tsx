"use client";

import type { PartnerListItemViewModel, PartnerSortKey } from "@/lib/admin/partner";
import type { PartnerMasterListText, PartnerMasterRowsProps } from "@/components/admin/partnerMaster/partnerMasterListTypes";
import { getPartnerEmptyValue, getPartnerRowToneClass } from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  ADMIN_RESPONSIVE_COMPACT_CARD_CLASS,
  ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_BOX_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS,
  ADMIN_RESPONSIVE_TABLE_SHELL_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import {
  handlePartnerRowKeyDown,
  PartnerNameSummary,
  PartnerStatusBadge,
  PartnerTypeBadges,
} from "@/components/admin/partnerMaster/PartnerMasterSharedCells";
import PartnerMasterRowsEmpty from "@/components/admin/partnerMaster/PartnerMasterRowsEmpty";
import { PartnerMasterCompactSortButton } from "@/components/admin/partnerMaster/PartnerMasterSortButton";

type PartnerMasterCompactListRowsProps = PartnerMasterRowsProps;

const COMPACT_SORT_KEYS: PartnerSortKey[] = ["name", "type", "status", "contact"];

function MetadataItem({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = getPartnerEmptyValue(value);

  return (
    <div className={ADMIN_RESPONSIVE_COMPACT_META_BOX_CLASS}>
      <p className={ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS}>{label}</p>
      <p className={ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS} title={displayValue}>
        {displayValue}
      </p>
    </div>
  );
}

function PartnerCompactRow({
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
  const handleOpen = () => {
    if (canUpdate) onEditPartner(item.id);
  };

  return (
    <article
      role={canUpdate ? "button" : undefined}
      tabIndex={canUpdate ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={(event) => handlePartnerRowKeyDown(event, item, canUpdate, onEditPartner)}
      className={[
        ADMIN_RESPONSIVE_COMPACT_CARD_CLASS,
        getPartnerRowToneClass(item),
        canUpdate ? ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <PartnerNameSummary item={item} listText={listText} />
          <PartnerTypeBadges item={item} listText={listText} align="left" />
        </div>
        <div className="shrink-0">
          <PartnerStatusBadge item={item} listText={listText} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MetadataItem label={listText.columns.contact} value={item.contactName} />
        <MetadataItem label={listText.columns.phone} value={item.phone} />
        <MetadataItem label={listText.columns.email} value={item.email} />
      </div>
    </article>
  );
}

export default function PartnerMasterCompactListRows({
  items,
  isLoading,
  canUpdate,
  listText,
  sortState,
  onSort,
  onEditPartner,
}: PartnerMasterCompactListRowsProps) {
  return (
    <section className={`${ADMIN_RESPONSIVE_TABLE_SHELL_CLASS} p-3 md:p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{listText.columns.name}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {COMPACT_SORT_KEYS.map((key) => (
            <PartnerMasterCompactSortButton
              key={key}
              sortKey={key}
              label={listText.columns[key]}
              activeSort={sortState}
              onSort={onSort}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <PartnerMasterRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerMasterRowsEmpty label={listText.empty} />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <PartnerCompactRow
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
