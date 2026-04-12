export function normalizeComparableText(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSameComparableText(left: string | null | undefined, right: string | null | undefined) {
  return normalizeComparableText(left) === normalizeComparableText(right);
}
