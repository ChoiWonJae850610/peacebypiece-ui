import type { PartnerListItemViewModel } from "@/lib/admin/partner";

export const PARTNER_TABLE_MIN_WIDTH = 1080;

export const PARTNER_WIDE_TABLE_GRID =
  "minmax(220px,1.35fr) minmax(120px,0.65fr) minmax(140px,0.75fr) minmax(190px,1fr) minmax(170px,0.95fr) 96px";

export function getPartnerRowToneClass(item: PartnerListItemViewModel): string {
  return item.isActive
    ? "bg-[var(--pbp-surface)]"
    : "bg-[var(--pbp-surface-muted)]";
}

export function getPartnerEmptyValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : "-";
}
