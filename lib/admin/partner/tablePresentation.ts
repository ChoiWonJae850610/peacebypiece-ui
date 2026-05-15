import type { PartnerListItemViewModel } from "@/lib/admin/partner/types";

export type PartnerSortKey = "name" | "contact" | "phone" | "email" | "type" | "status";
export type PartnerSortDirection = "asc" | "desc";

export type PartnerSortState = {
  key: PartnerSortKey;
  direction: PartnerSortDirection;
};

export const PARTNER_DEFAULT_SORT_STATE: PartnerSortState = {
  key: "name",
  direction: "asc",
};

function normalizePartnerSortValue(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function getPartnerSortValue(item: PartnerListItemViewModel, key: PartnerSortKey) {
  switch (key) {
    case "name":
      return item.name;
    case "contact":
      return item.contactName;
    case "phone":
      return item.phone;
    case "email":
      return item.email;
    case "type":
      return item.typeDisplayLabel;
    case "status":
      return item.isActive ? "1" : "0";
    default:
      return "";
  }
}

export function sortPartnerListItems(items: PartnerListItemViewModel[], sort: PartnerSortState) {
  return [...items].sort((a, b) => {
    const left = normalizePartnerSortValue(getPartnerSortValue(a, sort.key));
    const right = normalizePartnerSortValue(getPartnerSortValue(b, sort.key));
    const result = left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? result : -result;
  });
}

export function togglePartnerSort(current: PartnerSortState, nextKey: PartnerSortKey): PartnerSortState {
  if (current.key !== nextKey) {
    return { key: nextKey, direction: "asc" };
  }

  return {
    key: current.key,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}
