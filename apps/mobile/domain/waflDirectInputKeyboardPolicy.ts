export type WaflSheetKeyboardMode = "default" | "directInput";

export type WaflDirectInputNavigationAction = "previous" | "next" | "done";

export type WaflDirectInputAccessoryMode = "none" | "singleAction";

export type WaflDirectInputSessionState = "editing" | "confirming" | "cancelling" | "closing";

export type WaflSheetCloseReason = "programmatic" | "userCancel";

export function resolveWaflSheetClosePlan(input: {
  readonly actionPending: boolean;
  readonly alreadyClosing: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly reason: WaflSheetCloseReason;
}) {
  const accepted = !input.alreadyClosing
    && (input.reason === "programmatic" || !input.actionPending);
  return {
    accepted,
    blurAndDismissKeyboard: accepted && input.keyboardMode === "directInput",
    invokeCancel: accepted && input.reason === "userCancel",
    sessionState: input.reason === "userCancel" ? "cancelling" as const : "closing" as const,
  };
}

export function resolveWaflInputSheetPresentation(input: {
  readonly hasConfirmOwner: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly processingMessagePresent: boolean;
  readonly processingPresentation: "overlay" | "replaceSheet";
}) {
  return {
    renderFooterActions: input.hasConfirmOwner && input.keyboardMode !== "directInput",
    replaceSheetDuringProcessing: input.processingPresentation === "replaceSheet"
      && input.processingMessagePresent,
  } as const;
}

export type WaflDirectInputDragRelease =
  | { readonly kind: "dismiss" }
  | { readonly kind: "settle"; readonly offset: number; readonly commitSettled: boolean };

export function resolveWaflDirectInputKeyboardDetent(input: {
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly keyboardVisible: boolean;
  readonly currentOffset: number;
  readonly expandedHeight: number;
  readonly headerHeight: number;
  readonly intrinsicBodyHeight: number;
  readonly keyboardInset: number;
  readonly minimumBodyViewport: number;
  readonly restingOffset: number;
  readonly safeBottom: number;
  readonly semanticGap: number;
}) {
  if (input.keyboardMode !== "directInput" || !input.keyboardVisible) {
    return Math.max(0, input.currentOffset);
  }
  const expandedHeight = Math.max(0, input.expandedHeight);
  const keyboardInset = Math.max(0, input.keyboardInset);
  const availableAboveKeyboard = Math.max(0, expandedHeight - keyboardInset);
  const headerHeight = Math.max(0, input.headerHeight);
  const semanticGap = Math.max(0, input.semanticGap);
  const minimumBodyViewport = Math.max(0, input.minimumBodyViewport);
  const safeBottom = Math.max(0, input.safeBottom);
  const intermediateHeadroom = safeBottom + semanticGap;
  const maximumIntermediateBodyViewport = Math.max(
    minimumBodyViewport,
    availableAboveKeyboard - headerHeight - semanticGap - intermediateHeadroom,
  );
  const desiredBodyViewport = Math.min(
    Math.max(minimumBodyViewport, Math.max(0, input.intrinsicBodyHeight)),
    maximumIntermediateBodyViewport,
  );
  const requiredVisibleHeight = headerHeight + desiredBodyViewport + semanticGap;
  return Math.max(
    0,
    Math.min(Math.max(0, input.restingOffset), availableAboveKeyboard - requiredVisibleHeight),
  );
}

export function shouldRestoreDirectInputKeyboard(input: {
  readonly appActive: boolean;
  readonly gestureActive?: boolean;
  readonly hasEditableTarget: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly mounted: boolean;
  readonly restoreAlreadyAttempted: boolean;
  readonly sessionState: WaflDirectInputSessionState;
  readonly visible: boolean;
}) {
  return input.keyboardMode === "directInput"
    && input.visible
    && input.mounted
    && input.appActive
    && !input.gestureActive
    && input.sessionState === "editing"
    && input.hasEditableTarget
    && !input.restoreAlreadyAttempted;
}

export function shouldSuppressWaflSheetKeyboardHideGeometry(input: {
  readonly dismissing: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly sessionState: WaflDirectInputSessionState;
  readonly visible: boolean;
}) {
  return input.dismissing
    || !input.visible
    || (input.keyboardMode === "directInput" && input.sessionState !== "editing");
}

export function canRunWaflSheetSettlingAnimation(input: {
  readonly dismissing: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly sessionState: WaflDirectInputSessionState;
}) {
  return !input.dismissing
    && (input.keyboardMode !== "directInput" || input.sessionState === "editing");
}

export function resolveWaflDirectInputRevealMotion(input: {
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly requiredRise: number;
  readonly scrollDelta: number;
  readonly targetOffset: number;
}) {
  return {
    scrollDelta: input.scrollDelta,
    sheetRise: input.keyboardMode === "directInput" ? 0 : Math.max(0, input.requiredRise),
    targetOffset: input.targetOffset,
  } as const;
}

export function resolveWaflDirectInputSubmitBehavior(input: {
  readonly directInput: boolean;
  readonly multiline: boolean;
}) {
  return input.directInput && !input.multiline ? "submit" as const : null;
}

export function resolveWaflDirectInputDragRelease(input: {
  readonly directInputKeyboardVisible: boolean;
  readonly genericRelease: { readonly kind: "dismiss" } | { readonly kind: "settle"; readonly offset: number };
  readonly keyboardDetent: number;
}) : WaflDirectInputDragRelease {
  if (!input.directInputKeyboardVisible) {
    return input.genericRelease.kind === "dismiss"
      ? input.genericRelease
      : { ...input.genericRelease, commitSettled: true };
  }
  return input.genericRelease.kind === "dismiss"
    ? input.genericRelease
    : {
      commitSettled: false,
      kind: "settle",
      offset: Math.max(0, input.keyboardDetent),
    };
}

export function resolveWaflDirectInputAccessoryNativeID(input: {
  readonly instanceId: number;
  readonly sessionGeneration: number;
}) {
  return `wafl-direct-input-${Math.max(1, Math.trunc(input.instanceId))}-${Math.max(0, Math.trunc(input.sessionGeneration))}`;
}

export function resolveWaflDirectInputTapPersistence(keyboardMode: WaflSheetKeyboardMode) {
  return keyboardMode === "directInput"
    ? { keyboardDismissMode: "none" as const, keyboardShouldPersistTaps: "always" as const }
    : { keyboardDismissMode: null, keyboardShouldPersistTaps: "handled" as const };
}

export function resolveWaflDirectInputAccessoryMode(input: {
  readonly keyboardType?: string | null;
  readonly multiline: boolean;
}): WaflDirectInputAccessoryMode {
  if (input.multiline) return "none";
  return input.keyboardType === "phone-pad"
    || input.keyboardType === "name-phone-pad"
    || input.keyboardType === "number-pad"
    || input.keyboardType === "decimal-pad"
    || input.keyboardType === "numeric"
    || input.keyboardType === "ascii-capable-number-pad"
    ? "singleAction"
    : "none";
}

export function resolveWaflDirectInputMinimalAccessoryAction(input: {
  readonly fieldKeys: readonly string[];
  readonly focusedKey: string | null;
}) {
  if (input.focusedKey === null) return null;
  const focusedIndex = input.fieldKeys.indexOf(input.focusedKey);
  if (focusedIndex < 0) return null;
  return focusedIndex < input.fieldKeys.length - 1 ? "next" as const : "done" as const;
}

export function resolveWaflDirectInputReturnKey(input: {
  readonly fieldIndex: number;
  readonly fieldCount: number;
  readonly multiline: boolean;
}) {
  if (input.multiline) return null;
  return input.fieldIndex >= 0 && input.fieldIndex < input.fieldCount - 1
    ? "next" as const
    : "done" as const;
}

export function resolveWaflDirectInputNavigation(input: {
  readonly action: WaflDirectInputNavigationAction;
  readonly fieldKeys: readonly string[];
  readonly focusedKey: string | null;
}) {
  const focusedIndex = input.focusedKey === null
    ? -1
    : input.fieldKeys.indexOf(input.focusedKey);
  if (input.action === "done") {
    return { confirm: true, targetKey: null } as const;
  }
  if (focusedIndex < 0) {
    return { confirm: false, targetKey: null } as const;
  }
  const targetIndex = input.action === "previous" ? focusedIndex - 1 : focusedIndex + 1;
  return {
    confirm: false,
    targetKey: targetIndex >= 0 && targetIndex < input.fieldKeys.length
      ? input.fieldKeys[targetIndex]!
      : null,
  } as const;
}

export function resolveWaflDirectInputAccessoryState(input: {
  readonly confirmDisabled?: boolean;
  readonly fieldKeys: readonly string[];
  readonly focusedKey: string | null;
}) {
  const focusedIndex = input.focusedKey === null
    ? -1
    : input.fieldKeys.indexOf(input.focusedKey);
  return {
    doneDisabled: Boolean(input.confirmDisabled),
    nextDisabled: focusedIndex < 0 || focusedIndex >= input.fieldKeys.length - 1,
    previousDisabled: focusedIndex <= 0,
  } as const;
}
