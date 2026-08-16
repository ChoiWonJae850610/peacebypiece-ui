export type WaflSheetDetent = "medium" | "expanded";
export type WaflSheetSizing = "contentFit" | "adaptiveExpandable" | "reelAdaptive" | "expandable" | "fullView";

export const WAFL_REUSABLE_CATALOG_CREATE_SIZING: WaflSheetSizing = "adaptiveExpandable";
export const WAFL_TEXT_ENTRY_FORM_SIZING: WaflSheetSizing = "adaptiveExpandable";

export function resolveWaflSheetMeasurementIdentity(input: {
  readonly title: string;
  readonly sizing: WaflSheetSizing;
  readonly hasActions: boolean;
  readonly openSessionGeneration?: number;
  readonly presentationGeneration?: number;
  readonly measurementVariant?: string;
}) {
  return JSON.stringify([
    input.title,
    input.sizing,
    input.hasActions ? "actions" : "actionless",
    input.presentationGeneration ?? 0,
    input.openSessionGeneration ?? 0,
    input.measurementVariant ?? "default",
  ]);
}

export function resolveWaflSheetEntranceReadiness(input: {
  readonly sizing: WaflSheetSizing;
  readonly hasActions: boolean;
  readonly headerMeasured: boolean;
  readonly footerMeasured: boolean;
  readonly currentGenerationBodyMeasured: boolean;
  readonly deterministicBodyHeight: number;
}) {
  const chromeReady = input.headerMeasured && (!input.hasActions || input.footerMeasured);
  const deterministic = input.sizing === "reelAdaptive" && input.deterministicBodyHeight > 0;
  const bodyReady = deterministic
    || input.sizing === "expandable"
    || input.sizing === "fullView"
    || input.currentGenerationBodyMeasured;
  return {
    ready: chromeReady && bodyReady,
    targetSource: deterministic ? "deterministic-reel" : input.currentGenerationBodyMeasured ? "current-generation-measurement" : "fixed-detent",
  } as const;
}

export function resolveWaflAdaptiveBodyHeight(measuredBodyHeight: number, minimumBodyHeight = 0) {
  return Math.max(0, Math.ceil(Math.max(measuredBodyHeight, minimumBodyHeight)));
}

export function resolveWaflContentFitHeight(input: {
  readonly windowHeight: number;
  readonly headerHeight: number;
  readonly bodyHeight: number;
  readonly footerHeight: number;
  readonly safeBottom: number;
  readonly minHeight: number;
  readonly maxRatio: number;
  readonly verticalChrome: number;
}) {
  const maximum = Math.max(input.minHeight, Math.round(input.windowHeight * input.maxRatio));
  const fixedHeight = input.headerHeight + input.footerHeight + input.safeBottom + input.verticalChrome;
  const measured = fixedHeight + input.bodyHeight;
  const bodyViewportHeight = Math.max(0, Math.min(input.bodyHeight, maximum - fixedHeight));
  return {
    bodyViewportHeight,
    height: Math.max(input.minHeight, Math.min(maximum, Math.ceil(measured))),
    overflow: measured > maximum,
  } as const;
}

export function resolveWaflExpandableInitialHeight(input: {
  readonly windowHeight: number;
  readonly detentRatio: number;
  readonly headerHeight: number;
  readonly footerHeight: number;
  readonly safeBottom: number;
  readonly verticalChrome: number;
  readonly minimumBodyViewport: number;
}) {
  const ratioHeight = Math.round(input.windowHeight * input.detentRatio);
  const actionSafeMinimum = input.headerHeight
    + input.footerHeight
    + input.safeBottom
    + input.verticalChrome
    + input.minimumBodyViewport;
  return Math.max(280, ratioHeight, Math.ceil(actionSafeMinimum));
}

export function resolveWaflAdaptiveInitialHeight(input: {
  readonly windowHeight: number;
  readonly headerHeight: number;
  readonly bodyHeight: number;
  readonly footerHeight: number;
  readonly safeBottom: number;
  readonly minHeight: number;
  readonly maxRatio: number;
  readonly verticalChrome: number;
}) {
  const fixedHeight = input.headerHeight + input.footerHeight + input.safeBottom + input.verticalChrome;
  const maximum = Math.max(input.minHeight, Math.round(input.windowHeight * input.maxRatio));
  return Math.max(input.minHeight, Math.min(maximum, Math.ceil(fixedHeight + input.bodyHeight)));
}

export function resolveWaflSheetBodyViewportHeight(expandedBodyViewportHeight: number, sheetOffset: number) {
  return Math.max(0, expandedBodyViewportHeight - Math.max(0, sheetOffset));
}

export function resolveWaflSheetKeyboardLayout(input: {
  readonly expandedHeight: number;
  readonly headerHeight: number;
  readonly footerHeight: number;
  readonly restingSafeBottom: number;
  readonly keyboardInset: number;
  readonly sheetOffset: number;
  readonly verticalChrome: number;
}) {
  // The keyboard occludes the sheet; it does not turn the sheet-level X/V
  // footer into an input accessory. Keep physical layout anchored to the
  // resting safe area and expose the occluded viewport separately.
  const bottomInset = input.restingSafeBottom;
  const expandedBodyViewportHeight = Math.max(
    0,
    input.expandedHeight
      - input.headerHeight
      - input.footerHeight
      - bottomInset
      - input.verticalChrome,
  );
  return {
    bodyViewportHeight: resolveWaflSheetBodyViewportHeight(expandedBodyViewportHeight, input.sheetOffset),
    bottomInset,
    expandedBodyViewportHeight,
    keyboardOcclusion: Math.max(0, input.keyboardInset - input.restingSafeBottom),
    visibleBodyViewportHeight: Math.max(
      0,
      resolveWaflSheetBodyViewportHeight(expandedBodyViewportHeight, input.sheetOffset) - input.keyboardInset,
    ),
  } as const;
}

export function resolveWaflSheetFocusExpansion(input: {
  readonly currentOffset: number;
  readonly focusedBottom: number;
  readonly keyboardTop: number;
  readonly revealContext: number;
}) {
  const requiredRise = Math.max(0, input.focusedBottom + input.revealContext - input.keyboardTop);
  return {
    requiredRise,
    targetOffset: Math.max(0, input.currentOffset - requiredRise),
  } as const;
}

export function resolveWaflSheetFieldReveal(input: {
  readonly fieldTop: number;
  readonly fieldBottom: number;
  readonly viewportTop: number;
  readonly viewportBottom: number;
  readonly keyboardTop: number;
  readonly semanticGap: number;
  readonly availableForwardScroll?: number;
}) {
  const fieldHeight = Math.max(0, input.fieldBottom - input.fieldTop);
  const visibleTop = input.viewportTop + input.semanticGap;
  const visibleBottom = Math.max(visibleTop, Math.min(input.viewportBottom, input.keyboardTop) - input.semanticGap);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  let scrollDelta = 0;
  if (fieldHeight > visibleHeight) {
    scrollDelta = input.fieldTop - visibleTop;
  } else if (input.fieldBottom > visibleBottom) {
    scrollDelta = input.fieldBottom - visibleBottom;
  } else if (input.fieldTop < visibleTop) {
    scrollDelta = input.fieldTop - visibleTop;
  }
  const availableForwardScroll = Math.max(0, input.availableForwardScroll ?? Number.POSITIVE_INFINITY);
  const requiredRise = Math.max(
    0,
    fieldHeight - visibleHeight,
    scrollDelta > 0 ? scrollDelta - availableForwardScroll : 0,
  );
  return { requiredRise, scrollDelta, visibleBottom, visibleTop } as const;
}

export function resolveWaflSheetDragStartOffset(value: number, expandedHeight: number) {
  return clampWaflSheetOffset(value, expandedHeight);
}

export function clampWaflSheetOffset(value: number, expandedHeight: number) {
  return Math.max(0, Math.min(expandedHeight, value));
}

export function resolveWaflSheetOpeningOffset(expandedHeight: number) {
  return Math.max(0, expandedHeight);
}

export function resolveWaflSheetDragOffset(input: {
  readonly dragStartOffset: number;
  readonly dy: number;
  readonly expandedHeight: number;
}) {
  return clampWaflSheetOffset(input.dragStartOffset + input.dy, input.expandedHeight);
}

export function shouldCaptureWaflSheetHeaderDrag(input: {
  readonly actionPending: boolean;
  readonly dx: number;
  readonly dy: number;
}) {
  if (input.actionPending || Math.abs(input.dy) < 4) return false;
  return Math.abs(input.dy) >= Math.abs(input.dx);
}

export function shouldCaptureWaflSheetDrag(input: {
  readonly actionPending: boolean;
  readonly bodyOffset: number;
  readonly detent: WaflSheetDetent;
  readonly dx: number;
  readonly dy: number;
}) {
  if (input.actionPending || Math.abs(input.dy) <= Math.abs(input.dx) || Math.abs(input.dy) < 7) return false;
  return (input.dy > 0 && input.bodyOffset <= 0) || (input.dy < 0 && input.detent === "medium");
}

export function resolveWaflSheetRelease(input: {
  readonly dragStartOffset: number;
  readonly dy: number;
  readonly vy: number;
  readonly maxSettleOffset: number;
  readonly dismissDistance: number;
  readonly dismissVelocity: number;
  readonly flickVelocity: number;
  readonly velocityProjectionMs: number;
  readonly maxVelocityProjection: number;
}) {
  const released = input.dragStartOffset + input.dy;
  const velocityProjection = Math.abs(input.vy) >= input.flickVelocity
    ? Math.max(
      -input.maxVelocityProjection,
      Math.min(input.maxVelocityProjection, input.vy * input.velocityProjectionMs),
    )
    : 0;
  const projected = released + velocityProjection;
  if (
    released >= input.maxSettleOffset + input.dismissDistance
    || (input.vy >= input.dismissVelocity && projected > input.maxSettleOffset)
  ) {
    return { kind: "dismiss" as const };
  }
  return {
    kind: "settle" as const,
    offset: Math.max(0, Math.min(input.maxSettleOffset, projected)),
  };
}
