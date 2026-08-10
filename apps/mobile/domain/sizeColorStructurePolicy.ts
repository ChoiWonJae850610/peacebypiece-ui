import type { WorkOrderColorRow, WorkOrderSizeRow } from "./mobileContract";

export const SIZE_ALPHA_PRESETS = ["XS", "S", "M", "L", "XL", "2XL", "FREE"] as const;
export const SIZE_NUMERIC_PRESETS = ["44", "55", "66", "77", "88"] as const;

export const COLOR_PALETTE_PRESETS = [
  { name: "블랙", hex: "#111111" },
  { name: "화이트", hex: "#FFFFFF" },
  { name: "아이보리", hex: "#F5F0E6" },
  { name: "베이지", hex: "#D8C3A5" },
  { name: "브라운", hex: "#7A5135" },
  { name: "그레이", hex: "#8A8F98" },
  { name: "네이비", hex: "#1F2A44" },
  { name: "블루", hex: "#3E6FB0" },
  { name: "민트", hex: "#A8DCCB" },
  { name: "그린", hex: "#4D7A54" },
  { name: "옐로우", hex: "#E9C84A" },
  { name: "오렌지", hex: "#E48A3A" },
  { name: "레드", hex: "#B94A48" },
  { name: "핑크", hex: "#D98FA5" },
  { name: "퍼플", hex: "#80669D" },
] as const;

export const CUSTOM_COLOR_GROUPS = [
  { name: "무채색", colors: ["#FFFFFF", "#E5E7EB", "#9CA3AF", "#4B5563", "#111827"] },
  { name: "블루·시안", colors: ["#E0F2FE", "#7DD3FC", "#0EA5E9", "#075985", "#164E63"] },
  { name: "어스·올리브", colors: ["#F5F0E6", "#D8C3A5", "#A3A35D", "#7A5135", "#4D4A2C"] },
  { name: "레드·오렌지", colors: ["#FEE2E2", "#FCA5A5", "#EF4444", "#F97316", "#C2410C"] },
  { name: "옐로우·그린", colors: ["#FEF9C3", "#FDE047", "#86EFAC", "#22C55E", "#15803D"] },
  { name: "퍼플·핑크", colors: ["#F3E8FF", "#D8B4FE", "#A855F7", "#F9A8D4", "#BE185D"] },
  { name: "파스텔·뮤트", colors: ["#E8DCCF", "#C9D8D3", "#BFC9DC", "#D8C7DC", "#D8BFC3"] },
] as const;

export const CUSTOM_COLOR_GRID = CUSTOM_COLOR_GROUPS.flatMap((group) => group.colors.map((hex, toneIndex) => ({
  group: group.name,
  hex,
  label: `${group.name} ${toneIndex + 1}`,
})));

const naturalKorean = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });
const baseColorIndex = new Map(COLOR_PALETTE_PRESETS.map((preset, index) => [normalizedPresetKey(preset.name), index]));

export function normalizedPresetKey(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function compareStable(left: string, right: string, leftId: string, rightId: string) {
  return naturalKorean.compare(left, right) || leftId.localeCompare(rightId, "en-US");
}

function recognizedAlphaRank(label: string) {
  const normalized = label.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, "");
  const fixed = new Map([["XXS", 0], ["XS", 1], ["S", 2], ["M", 3], ["L", 4], ["XL", 5]]);
  if (fixed.has(normalized)) return fixed.get(normalized) as number;
  const numbered = /^(\d+)XL$/.exec(normalized);
  if (!numbered) return null;
  const multiplier = Number(numbered[1]);
  return Number.isSafeInteger(multiplier) && multiplier >= 2 ? 4 + multiplier : null;
}

type SizeSortable = Pick<WorkOrderSizeRow, "id" | "displayLabel">;
type ColorSortable = Pick<WorkOrderColorRow, "id" | "displayName">;

export function compareSizeRows(left: SizeSortable, right: SizeSortable) {
  const leftLabel = left.displayLabel.normalize("NFKC").trim();
  const rightLabel = right.displayLabel.normalize("NFKC").trim();
  const leftAlpha = recognizedAlphaRank(leftLabel);
  const rightAlpha = recognizedAlphaRank(rightLabel);
  const leftNumeric = /^\d+$/.test(leftLabel) ? BigInt(leftLabel) : null;
  const rightNumeric = /^\d+$/.test(rightLabel) ? BigInt(rightLabel) : null;
  const leftGroup = leftAlpha !== null ? 0 : leftNumeric !== null ? 1 : normalizedPresetKey(leftLabel) === "free" ? 2 : 3;
  const rightGroup = rightAlpha !== null ? 0 : rightNumeric !== null ? 1 : normalizedPresetKey(rightLabel) === "free" ? 2 : 3;
  if (leftGroup !== rightGroup) return leftGroup - rightGroup;
  if (leftAlpha !== null && rightAlpha !== null && leftAlpha !== rightAlpha) return leftAlpha - rightAlpha;
  if (leftNumeric !== null && rightNumeric !== null && leftNumeric !== rightNumeric) return leftNumeric < rightNumeric ? -1 : 1;
  return compareStable(leftLabel, rightLabel, left.id, right.id);
}

export function compareColorRows(left: ColorSortable, right: ColorSortable) {
  const leftName = left.displayName.normalize("NFKC").trim();
  const rightName = right.displayName.normalize("NFKC").trim();
  const leftBase = baseColorIndex.get(normalizedPresetKey(leftName));
  const rightBase = baseColorIndex.get(normalizedPresetKey(rightName));
  if (leftBase !== undefined || rightBase !== undefined) {
    if (leftBase === undefined) return 1;
    if (rightBase === undefined) return -1;
    if (leftBase !== rightBase) return leftBase - rightBase;
  }
  return compareStable(leftName, rightName, left.id, right.id);
}

export function sortSizeRows<T extends SizeSortable>(rows: readonly T[]) {
  return [...rows].sort(compareSizeRows);
}

export function sortColorRows<T extends ColorSortable>(rows: readonly T[]) {
  return [...rows].sort(compareColorRows);
}

export function createImmutableAddSnapshot(values: readonly string[], existingValues: readonly string[]) {
  const selected = Object.freeze(values.map((value) => value.normalize("NFKC").trim()).filter(Boolean));
  const seen = new Set(existingValues.map(normalizedPresetKey));
  const pending: string[] = [];
  const duplicates: string[] = [];
  for (const value of selected) {
    const key = normalizedPresetKey(value);
    if (seen.has(key)) {
      if (!duplicates.some((candidate) => normalizedPresetKey(candidate) === key)) duplicates.push(value);
      continue;
    }
    seen.add(key);
    pending.push(value);
  }
  return Object.freeze({ selected, pending: Object.freeze(pending), duplicates: Object.freeze(duplicates) });
}

export const createImmutableSizeAddSnapshot = createImmutableAddSnapshot;

export function unavailableSizePresetKeys(rows: readonly WorkOrderSizeRow[]) {
  return new Set(rows.map((row) => normalizedPresetKey(row.displayLabel)));
}

export function unavailableColorPresetKeys(rows: readonly WorkOrderColorRow[]) {
  return new Set(rows.map((row) => normalizedPresetKey(row.displayName)));
}

export function togglePresetSelection(values: readonly string[], value: string, unavailable: ReadonlySet<string>) {
  const normalized = normalizedPresetKey(value);
  if (!normalized || unavailable.has(normalized)) return values;
  return values.some((candidate) => normalizedPresetKey(candidate) === normalized)
    ? values.filter((candidate) => normalizedPresetKey(candidate) !== normalized)
    : [...values, value.trim()];
}

function channel(value: number) {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0").toUpperCase();
}

export function normalizeManualHex(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function hexToRgb(value: string) {
  const hex = normalizeManualHex(value);
  if (!hex) return null;
  return { r: Number.parseInt(hex.slice(1, 3), 16), g: Number.parseInt(hex.slice(3, 5), 16), b: Number.parseInt(hex.slice(5, 7), 16) };
}

export function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = Math.max(0, Math.min(100, lightness)) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${channel((r + m) * 255)}${channel((g + m) * 255)}${channel((b + m) * 255)}`;
}
