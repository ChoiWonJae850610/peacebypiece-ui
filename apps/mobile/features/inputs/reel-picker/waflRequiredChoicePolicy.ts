export function resolveWaflReelOpeningValue(input: {
  readonly candidateValues: readonly string[];
  readonly currentValue: string;
  readonly stageFirstRealOption: boolean;
}) {
  const currentIsValid = input.currentValue.trim().length > 0
    && input.candidateValues.includes(input.currentValue);
  if (!input.stageFirstRealOption || currentIsValid) return input.currentValue;
  return input.candidateValues.find((candidate) => candidate.trim().length > 0) ?? input.currentValue;
}
