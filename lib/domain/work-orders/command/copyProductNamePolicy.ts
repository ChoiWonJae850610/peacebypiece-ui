export const WORK_ORDER_COPY_NAME_PREFIX = "(복사본)";

export function resolveWorkOrderCopyProductName(sourceName: string): string {
  const withoutRepeatedPrefix = sourceName
    .trim()
    .replace(/^(?:\(복사본\)\s*)+/u, "")
    .trim();
  return `${WORK_ORDER_COPY_NAME_PREFIX} ${withoutRepeatedPrefix || "제목 미지정"}`;
}
