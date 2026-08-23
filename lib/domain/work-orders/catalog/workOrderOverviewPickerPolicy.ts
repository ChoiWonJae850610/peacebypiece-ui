import type { WorkOrderMajorCategoryCode } from "./workOrderCategoryPolicy.ts";

export const WORK_ORDER_SEASON_TERMS = ["SS", "FW", "상시"] as const;
export const WORK_ORDER_DIRECT_INPUT_SENTINEL = "__WAFL_DIRECT_INPUT__";

const DETAIL_ITEMS: Readonly<Record<Extract<WorkOrderMajorCategoryCode, "T" | "B" | "O" | "D">, readonly string[]>> = {
  T: ["티셔츠", "셔츠", "블라우스", "니트", "맨투맨", "후드", "탑·나시", "폴로"],
  B: ["팬츠", "슬랙스", "데님", "쇼츠", "스커트", "레깅스"],
  O: ["재킷", "코트", "점퍼", "패딩", "가디건", "베스트"],
  D: ["원피스", "점프수트", "셔츠원피스", "니트원피스"],
};

export function workOrderSeasonYearOptions(currentYear = new Date().getFullYear()): readonly string[] {
  return [-1, 0, 1, 2].map((offset) => String(currentYear + offset));
}

export function composeWorkOrderSeason(year: string, term: (typeof WORK_ORDER_SEASON_TERMS)[number]): string {
  const suffix = year.slice(-2);
  return `${suffix}${term}`;
}

export function parseWorkOrderSeason(value: string, currentYear = new Date().getFullYear()): { readonly year: string; readonly term: "SS" | "FW" | "상시" } | null {
  const match = /^(\d{2})(SS|FW|상시)$/.exec(value.trim());
  if (!match) return null;
  const century = Math.floor(currentYear / 100) * 100;
  return { year: String(century + Number(match[1])), term: match[2] as "SS" | "FW" | "상시" };
}

export function workOrderDetailItemOptions(categoryCode: WorkOrderMajorCategoryCode | null): readonly string[] {
  if (categoryCode !== "T" && categoryCode !== "B" && categoryCode !== "O" && categoryCode !== "D") return [];
  return DETAIL_ITEMS[categoryCode];
}
