export type WaflPresentationFrameScheduler = (callback: () => void) => unknown;

export async function waitForWaflPresentationBoundary(
  scheduleFrame?: WaflPresentationFrameScheduler,
): Promise<void> {
  const effectiveScheduleFrame = scheduleFrame ?? (typeof requestAnimationFrame === "function"
    ? requestAnimationFrame
    : (callback: () => void) => queueMicrotask(callback));
  await new Promise<void>((resolve) => {
    effectiveScheduleFrame(() => effectiveScheduleFrame(resolve));
  });
}

export async function beginWaflPresentationFirstOperation(input: {
  readonly enterPending: () => void;
  readonly present?: () => Promise<void>;
}): Promise<void> {
  input.enterPending();
  await (input.present ?? waitForWaflPresentationBoundary)();
}
