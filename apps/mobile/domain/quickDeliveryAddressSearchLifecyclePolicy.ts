export type QuickDeliveryAddressSearchLifecyclePhase = "closed" | "idle" | "focused" | "searching";
export type QuickDeliveryAddressSearchLifecycleAction = "open" | "focus" | "blur" | "submit" | "close";

export function resolveQuickDeliveryAddressSearchLifecycle(input: {
  readonly action: QuickDeliveryAddressSearchLifecycleAction;
  readonly phase: QuickDeliveryAddressSearchLifecyclePhase;
}) {
  if (input.action === "close") return { focusRequested: false, phase: "closed" as const, runSearch: false };
  if (input.action === "open") return { focusRequested: false, phase: "idle" as const, runSearch: false };
  if (input.phase === "closed") return { focusRequested: false, phase: "closed" as const, runSearch: false };
  if (input.action === "focus") return { focusRequested: false, phase: "focused" as const, runSearch: false };
  if (input.action === "blur") return { focusRequested: false, phase: "idle" as const, runSearch: false };
  return { focusRequested: false, phase: "searching" as const, runSearch: true };
}

export function canPublishQuickDeliveryAddressSearchResult(input: {
  readonly currentGeneration: number;
  readonly requestGeneration: number;
  readonly visible: boolean;
}) {
  return input.visible && input.currentGeneration === input.requestGeneration;
}
