"use client";

import type {
  PartnerListItemViewModel,
  PartnerSortKey,
  PartnerSortState,
} from "@/lib/admin/partner";
import { getPartnerEmptyValue, getPartnerRowToneClass } from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";
import {
  ADMIN_RESPONSIVE_COMPACT_CARD_CLASS,
  ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_BOX_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS,
  ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS,
  ADMIN_RESPONSIVE_TABLE_SHELL_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import {
  handlePartnerRowKeyDown,
  PartnerNameSummary,
  PartnerStatusBadge,
  PartnerTypeBadges,
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

type PartnerMasterCompactListRowsProps = {
  items: PartnerListItemViewModel[];
  isLoading: boolean;
  canUpdate: boolean;
  listText: PartnerMasterListText;
  sortState: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  onEditPartner: (partnerId: string) => void;
};

const COMPACT_SORT_KEYS: PartnerSortKey[] = ["name", "type", "status", "contact"];

function CompactSortButton({
  sortKey,
  label,
  activeSort,
  onSort,
}: {
  sortKey: PartnerSortKey;
  label: string;
  activeSort: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
}) {
  const isActive = activeSort.key === sortKey;
  const marker = isActive ? (activeSort.direction === "asc" ? "↑" : "↓") : "↕";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
        isActive
          ? "border-[var(--admin-theme-primary)] bg-[var(--admin-theme-soft)] text-[var(--admin-theme-primary)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] hover:border-[var(--pbp-border-strong)]",
      ].join(" ")}
      aria-pressed={isActive}
    >
      <span>{label}</span>
      <span aria-hidden="true">{marker}</span>
    </button>
  );
}

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

function PartnerRowsEmpty({ label }: { label: string }) {
  return (
    <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
      {label}
    </div>
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
            <CompactSortButton
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
        <PartnerRowsEmpty label={listText.loading} />
      ) : items.length === 0 ? (
        <PartnerRowsEmpty label={listText.empty} />
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
