"use client";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  type PartnerListItemViewModel,
  type PartnerSortKey,
  type PartnerSortState,
} from "@/lib/admin/partner";

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

function TypeBadgeGroup({ item, listText }: { item: PartnerListItemViewModel; listText: PartnerMasterListText }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label={item.typeDisplayLabel || listText.typeMissing}>
      {item.hasBaseTypes ? (
        item.baseTypeBadges.map((badge) => (
          <AdminStatusBadge key={badge.key} tone="info" size="xs">
            {badge.label}
          </AdminStatusBadge>
        ))
      ) : (
        <span className="text-xs text-[var(--pbp-text-muted)]">{listText.noBaseType}</span>
      )}
      {item.outsourcingProcessBadges.map((badge) => (
        <AdminStatusBadge key={badge.key} tone="warning" size="xs" title={badge.label}>
          {badge.label}
        </AdminStatusBadge>
      ))}
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1 rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-2">
      <p className="text-[10px] font-semibold text-[var(--pbp-text-muted)]">{label}</p>
      <p className="truncate text-xs font-semibold text-[var(--pbp-text-primary)]" title={value}>
        {value || "-"}
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
      onKeyDown={(event) => {
        if (!canUpdate) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className={[
        "rounded-[24px] border px-4 py-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--admin-theme-ring)]",
        item.isActive ? "border-[var(--pbp-border)] bg-[var(--pbp-surface)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)]",
        canUpdate ? "cursor-pointer hover:border-[var(--pbp-border-strong)] hover:bg-[var(--admin-theme-soft)]" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold text-[var(--pbp-text-strong)]" title={item.name}>
              {item.name}
            </h3>
            <AdminStatusBadge tone={item.isActive ? "success" : "neutral"} size="xs">
              {item.isActive ? listText.active : listText.inactive}
            </AdminStatusBadge>
            {!item.isActive ? (
              <AdminStatusBadge tone="neutral" size="xs">{listText.inactiveBadge}</AdminStatusBadge>
            ) : null}
          </div>
          {item.memo ? <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{item.memo}</p> : null}
        </div>
      </div>

      <div className="mt-3">
        <TypeBadgeGroup item={item} listText={listText} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MetadataItem label={listText.columns.contact} value={item.contactName} />
        <MetadataItem label={listText.columns.phone} value={item.phone} />
        <MetadataItem label={listText.columns.email} value={item.email} />
      </div>
    </article>
  );
}

export default function PartnerMasterResponsiveRows({
  items,
  isLoading,
  canUpdate,
  listText,
  sortState,
  onSort,
  onEditPartner,
}: PartnerMasterResponsiveRowsProps) {
  return (
    <section className="rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-sm md:p-4">
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
        <div className="flex min-h-[180px] items-center justify-center rounded-[22px] bg-[var(--pbp-surface-muted)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">
          {listText.loading}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-[22px] bg-[var(--pbp-surface-muted)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">
          {listText.empty}
        </div>
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
