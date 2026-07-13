type ProcessInstructionParts = {
  readonly applicationArea?: string | null;
  readonly applicationColorTarget?: string | null;
  readonly memo?: string | null;
};

export function formatProcessInstruction(parts: ProcessInstructionParts): string {
  return [
    parts.applicationArea?.trim() ? `적용 부위: ${parts.applicationArea.trim()}` : null,
    parts.applicationColorTarget?.trim() ? `적용 대상: ${parts.applicationColorTarget.trim()}` : null,
    parts.memo?.trim() || null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" / ");
}
