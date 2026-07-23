export type DraftExitIntent = "background" | "list" | "work-order" | "feature" | "session-loss";
export type DraftExitDecision = "preserve" | "discard" | "blocked-saving";

export function decideDraftExit(input: {
  readonly intent: DraftExitIntent;
  readonly mutationInFlight: boolean;
}): DraftExitDecision {
  if (input.intent === "background") return "preserve";
  if (input.mutationInFlight) return "blocked-saving";
  return "discard";
}
