export type WaflSheetKeyboardRestoreSnapshot = {
  readonly settledOffset: number;
  readonly userDragged: boolean;
};

export function resolveWaflSheetKeyboardRestoreOffset(
  snapshot: WaflSheetKeyboardRestoreSnapshot | null,
) {
  if (snapshot === null || snapshot.userDragged) return null;
  return snapshot.settledOffset;
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
