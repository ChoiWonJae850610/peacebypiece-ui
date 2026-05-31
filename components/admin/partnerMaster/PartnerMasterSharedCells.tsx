"use client";

import type { KeyboardEvent } from "react";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_VALUE_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
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
        <p
          className={`${ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS} min-w-0 max-w-full`}
          title={item.name}
        >
          {item.name}
        </p>
        {!item.isActive ? (
          <AdminStatusBadge tone="neutral" size="xs">
            {listText.inactiveBadge}
          </AdminStatusBadge>
        ) : null}
      </div>
      {item.memo ? (
        <p
          className={ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS}
          title={item.memo}
        >
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
  const alignment =
    align === "center"
      ? "justify-center text-center"
      : "justify-start text-left";

  return (
    <div
      className={`flex min-w-0 max-w-full flex-wrap items-center gap-1.5 ${alignment}`}
      aria-label={item.typeDisplayLabel || listText.typeMissing}
    >
      {item.hasBaseTypes ? (
        item.baseTypeBadges.map((badge) => (
          <AdminStatusBadge key={badge.key} tone="info" size="xs">
            {badge.label}
          </AdminStatusBadge>
        ))
      ) : (
        <span className={ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS}>
          {listText.noBaseType}
        </span>
      )}
      {item.outsourcingProcessBadges.map((badge) => (
        <AdminStatusBadge
          key={badge.key}
          tone="warning"
          size="xs"
          title={badge.label}
        >
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
    <p
      className={`${ADMIN_RESPONSIVE_TABLE_VALUE_TEXT_CLASS} ${alignClassName}`}
      title={displayValue}
    >
      {displayValue}
    </p>
  );
}
