export type DraftExitIntent = "background" | "list" | "work-order" | "feature" | "session-loss";
export type DraftExitDecision = "flush" | "blocked-saving";

export function decideDraftExit(input: {
  readonly intent: DraftExitIntent;
  readonly mutationInFlight: boolean;
}): DraftExitDecision {
  if (input.mutationInFlight) return "blocked-saving";
  return "flush";
}
