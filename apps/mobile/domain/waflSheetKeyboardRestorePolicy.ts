export function resolveWaflSheetKeyboardRestoreOffset(
  staticRestingOffset: number,
) {
  return Math.max(0, Number.isFinite(staticRestingOffset) ? staticRestingOffset : 0);
}

export function resolveWaflSheetSystemKeyboardTarget(input: {
  readonly requestedOffset: number;
  readonly staticRestingOffset: number;
}) {
  const staticRestingOffset = resolveWaflSheetKeyboardRestoreOffset(input.staticRestingOffset);
  const requestedOffset = Number.isFinite(input.requestedOffset)
    ? input.requestedOffset
    : staticRestingOffset;
  return Math.max(0, Math.min(staticRestingOffset, requestedOffset));
}

export type WaflSheetFocusRevealCycle = {
  readonly focusGeneration: number;
  readonly lifecycle: "ACTIVE" | "DISMISSING" | "TRANSFERRING" | "TERMINATED";
  readonly bodyBaselineOffset: number;
  readonly systemBodyDelta: number;
  readonly userBodyDelta: number;
};

export function resolveWaflSheetFocusRevealCycleTransfer(input: {
  readonly keyboardHiding: boolean;
  readonly keyboardVisible: boolean;
  readonly previous: WaflSheetFocusRevealCycle | null;
  readonly registeredHandoffMatched: boolean;
}) {
  return input.registeredHandoffMatched
    && input.keyboardVisible
    && !input.keyboardHiding
    && input.previous !== null
    && input.previous.lifecycle !== "TERMINATED";
}

export function beginWaflSheetFocusRevealCycle(input: {
  readonly transferPrevious?: boolean;
  readonly bodyOffset: number;
  readonly focusGeneration: number;
  readonly previous?: WaflSheetFocusRevealCycle | null;
}) : WaflSheetFocusRevealCycle {
  const previous = input.transferPrevious ? input.previous : null;
  return {
    focusGeneration: input.focusGeneration,
    lifecycle: previous === null ? "ACTIVE" : "TRANSFERRING",
    bodyBaselineOffset: previous?.bodyBaselineOffset ?? Math.max(0, input.bodyOffset),
    systemBodyDelta: previous?.systemBodyDelta ?? 0,
    userBodyDelta: previous?.userBodyDelta ?? 0,
  };
}

export function markWaflSheetFocusRevealCycleDismissing(
  cycle: WaflSheetFocusRevealCycle | null,
) : WaflSheetFocusRevealCycle | null {
  return cycle === null ? null : { ...cycle, lifecycle: "DISMISSING" };
}

export function markWaflSheetFocusRevealCycleTerminated(
  cycle: WaflSheetFocusRevealCycle | null,
) : WaflSheetFocusRevealCycle | null {
  return cycle === null ? null : { ...cycle, lifecycle: "TERMINATED" };
}

export function markWaflSheetFocusRevealCycleActive(
  cycle: WaflSheetFocusRevealCycle | null,
) : WaflSheetFocusRevealCycle | null {
  return cycle === null ? null : { ...cycle, lifecycle: "ACTIVE" };
}

export function replaceWaflSheetSystemRevealBodyDelta(
  cycle: WaflSheetFocusRevealCycle,
  desiredSystemBodyDelta: number,
) {
  const desired = Math.max(0, Number.isFinite(desiredSystemBodyDelta) ? desiredSystemBodyDelta : 0);
  return {
    appliedDelta: desired - cycle.systemBodyDelta,
    cycle: { ...cycle, lifecycle: "ACTIVE" as const, systemBodyDelta: desired },
  } as const;
}

export function applyWaflSheetSystemRevealBodyDelta(
  cycle: WaflSheetFocusRevealCycle,
  delta: number,
) : WaflSheetFocusRevealCycle {
  return {
    ...cycle,
    systemBodyDelta: cycle.systemBodyDelta + (Number.isFinite(delta) ? delta : 0),
  };
}

export function observeWaflSheetUserBodyOffset(
  cycle: WaflSheetFocusRevealCycle,
  bodyOffset: number,
) : WaflSheetFocusRevealCycle {
  return {
    ...cycle,
    userBodyDelta: Math.max(
      -cycle.bodyBaselineOffset,
      bodyOffset - cycle.bodyBaselineOffset - cycle.systemBodyDelta,
    ),
  };
}

export function resolveWaflSheetFocusRevealRestore(input: {
  readonly cycle: WaflSheetFocusRevealCycle | null;
}) {
  if (input.cycle === null) return { bodyOffset: null } as const;
  return {
    bodyOffset: Math.max(0, input.cycle.bodyBaselineOffset + input.cycle.userBodyDelta),
  } as const;
}

export function resolveWaflSheetBodyMeasurements(input: {
  readonly intrinsicContentHeight: number;
  readonly reportedScrollContentHeight: number;
  readonly staticEndGap: number;
}) {
  const intrinsicContentHeight = Math.max(0, Math.ceil(input.intrinsicContentHeight));
  const staticEndGap = Math.max(0, Math.ceil(input.staticEndGap));
  return {
    adaptiveBodyHeight: intrinsicContentHeight + staticEndGap,
    scrollContentHeight: Math.max(
      intrinsicContentHeight + staticEndGap,
      Math.ceil(input.reportedScrollContentHeight),
    ),
  } as const;
}
