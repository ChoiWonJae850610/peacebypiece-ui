"use client";

import type { KeyboardEvent } from "react";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import type { PartnerListItemViewModel } from "@/lib/admin/partner";
import { getPartnerEmptyValue } from "@/components/admin/partnerMaster/partnerMasterResponsivePresentation";

type PartnerListText = {
  inactiveBadge: string;
  active: string;
  inactive: string;
  noBaseType: string;
  typeMissing: string;
};

export function handlePartnerRowKeyDown(
  event: KeyboardEvent<HTMLElement>,
  item: PartnerListItemViewModel,
  canUpdate: boolean,
  onEditPartner: (partnerId: string) => void,
) {
  if (!canUpdate) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onEditPartner(item.id);
  }
}

export function PartnerNameSummary({
  item,
  listText,
}: {
  item: PartnerListItemViewModel;
  listText: PartnerListText;
}) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 max-w-full truncate text-sm font-semibold text-[var(--pbp-text-strong)]" title={item.name}>
          {item.name}
        </p>
        {!item.isActive ? (
          <AdminStatusBadge tone="neutral" size="xs">
            {listText.inactiveBadge}
          </AdminStatusBadge>
        ) : null}
      </div>
      {item.memo ? (
        <p className="mt-1 truncate text-xs text-[var(--pbp-text-muted)]" title={item.memo}>
          {item.memo}
        </p>
      ) : null}
    </div>
  );
}

export function PartnerTypeBadges({
  item,
  listText,
  align = "center",
}: {
  item: PartnerListItemViewModel;
  listText: PartnerListText;
  align?: "left" | "center";
}) {
  const alignment = align === "center" ? "justify-center text-center" : "justify-start text-left";

  return (
    <div className={`flex min-w-0 max-w-full flex-wrap items-center gap-1.5 ${alignment}`} aria-label={item.typeDisplayLabel || listText.typeMissing}>
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

export function PartnerStatusBadge({
  item,
  listText,
}: {
  item: PartnerListItemViewModel;
  listText: PartnerListText;
}) {
  return (
    <AdminStatusBadge tone={item.isActive ? "success" : "neutral"} size="sm">
      {item.isActive ? listText.active : listText.inactive}
    </AdminStatusBadge>
  );
}

export function PartnerValueText({
  value,
  align = "center",
}: {
  value: string | null | undefined;
  align?: "left" | "center";
}) {
  const displayValue = getPartnerEmptyValue(value);
  const alignClassName = align === "center" ? "text-center" : "text-left";

  return (
    <p className={`min-w-0 max-w-full truncate text-sm text-[var(--pbp-text-muted)] ${alignClassName}`} title={displayValue}>
      {displayValue}
    </p>
  );
}
