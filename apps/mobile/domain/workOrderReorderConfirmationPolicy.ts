export function resolveExpectedNextReorderRound(rounds: readonly number[]): number {
  const maximum = rounds.reduce(
    (current, value) => Number.isSafeInteger(value) && value >= 0 ? Math.max(current, value) : current,
    0,
  );
  return maximum + 1;
}
