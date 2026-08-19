export function resolveProductionProcessAccentIndex(processTypeCode: string, accentCount: number) {
  if (!Number.isSafeInteger(accentCount) || accentCount < 1) return 0;
  const normalized = processTypeCode.trim().toUpperCase();
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % accentCount;
}
