export type WaflSheetKeyboardMode = "default" | "directInput";

export type WaflDirectInputNavigationAction = "previous" | "next" | "done";

export type WaflDirectInputAccessoryMode = "none" | "singleAction";
export type WaflDirectInputAccessoryPolicy = "auto" | "none";
export type WaflDirectInputReturnKeyPolicy = "auto" | "none";

export type WaflDirectInputSessionState = "editing" | "confirming" | "cancelling" | "closing";

export type WaflSheetCloseReason = "programmatic" | "userCancel";

export type WaflInputSheetFooterPolicy = "auto" | "always" | "cancelOnly" | "hidden";

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
  readonly footerPolicy?: WaflInputSheetFooterPolicy;
  readonly hasConfirmOwner: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly processingMessagePresent: boolean;
  readonly processingPresentation: "overlay" | "replaceSheet";
}) {
  const footerPolicy = input.footerPolicy ?? "auto";
  const renderConfirmAction = input.hasConfirmOwner
    && footerPolicy !== "cancelOnly"
    && footerPolicy !== "hidden";
  const renderCancelAction = footerPolicy === "cancelOnly"
    || renderConfirmAction;
  return {
    renderCancelAction,
    renderConfirmAction,
    renderFooterActions: footerPolicy === "always"
      ? input.hasConfirmOwner
      : footerPolicy === "cancelOnly"
        ? true
        : footerPolicy === "hidden"
          ? false
          : input.hasConfirmOwner && input.keyboardMode !== "directInput",
    replaceSheetDuringProcessing: input.processingPresentation === "replaceSheet"
      && input.processingMessagePresent,
  } as const;
}

export function shouldRestoreDirectInputKeyboard(input: {
  readonly appActive: boolean;
  readonly hasEditableTarget: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly mounted: boolean;
  readonly restoreAlreadyAttempted: boolean;
  readonly sessionState: WaflDirectInputSessionState;
  readonly visible: boolean;
}) {
  // A73C canonical lifecycle is manual after an explicit blur. Keeping this
  // resolver makes the superseded contract auditable without allowing an
  // ordinary hide/blur to reopen the keyboard.
  void input;
  return false;
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
  readonly availableForwardScroll?: number;
  readonly allowSheetExpansion: boolean;
  readonly bodyOffset?: number;
  readonly keyboardMode: WaflSheetKeyboardMode;
  readonly requiredRise: number;
  readonly scrollDelta: number;
  readonly targetOffset: number;
}) {
  const desiredScroll = Number.isFinite(input.scrollDelta) ? input.scrollDelta : 0;
  const appliedScroll = desiredScroll >= 0
    ? Math.min(desiredScroll, Math.max(0, input.availableForwardScroll ?? desiredScroll))
    : Math.max(desiredScroll, -Math.max(0, input.bodyOffset ?? Math.abs(desiredScroll)));
  const sheetRise = input.keyboardMode === "directInput" && !input.allowSheetExpansion
    ? 0
    : Math.max(0, input.requiredRise);
  return {
    scrollDelta: appliedScroll,
    sheetRise,
    targetOffset: input.targetOffset,
  } as const;
}

export function resolveWaflRootFirstMeasuredReveal(input: {
  readonly availableForwardScroll: number;
  readonly currentOffset: number;
  readonly fieldBottom: number;
  readonly fieldTop: number;
  readonly keyboardTop: number;
  readonly requiredTargetOffset: number;
  readonly semanticGap: number;
  readonly viewportBottom: number;
  readonly viewportTop: number;
}) {
  const currentOffset = Math.max(0, input.currentOffset);
  const semanticGap = Math.max(0, input.semanticGap);
  const fieldHeight = Math.max(0, input.fieldBottom - input.fieldTop);
  const occlusionBottom = Math.min(input.viewportBottom, input.keyboardTop);
  const visibleTop = input.viewportTop + semanticGap;
  const visibleBottom = Math.max(visibleTop, occlusionBottom - semanticGap);
  const rootRequirement = Math.max(
    0,
    semanticGap - (occlusionBottom - input.fieldBottom),
    fieldHeight - Math.max(0, visibleBottom - visibleTop),
  );
  const targetOffset = Math.max(0, Math.min(
    currentOffset,
    input.requiredTargetOffset,
    currentOffset - rootRequirement,
  ));
  const sheetRise = currentOffset - targetOffset;
  const shiftedFieldTop = input.fieldTop - sheetRise;
  const shiftedFieldBottom = input.fieldBottom - sheetRise;
  const shiftedViewportTop = input.viewportTop - sheetRise;
  const shiftedViewportBottom = input.viewportBottom - sheetRise;
  const shiftedOcclusionBottom = Math.min(shiftedViewportBottom, input.keyboardTop);
  const shiftedVisibleTop = shiftedViewportTop + semanticGap;
  const shiftedVisibleBottom = Math.max(shiftedVisibleTop, shiftedOcclusionBottom - semanticGap);
  const shiftedVisibleHeight = Math.max(0, shiftedVisibleBottom - shiftedVisibleTop);
  let desiredBodyScroll = 0;
  if (fieldHeight > shiftedVisibleHeight) {
    desiredBodyScroll = shiftedFieldTop - shiftedVisibleTop;
  } else if (shiftedFieldBottom > shiftedVisibleBottom) {
    desiredBodyScroll = shiftedFieldBottom - shiftedVisibleBottom;
  } else if (shiftedFieldTop < shiftedVisibleTop) {
    desiredBodyScroll = shiftedFieldTop - shiftedVisibleTop;
  }
  const availableForwardScroll = Math.max(0, input.availableForwardScroll);
  const appliedBodyScroll = desiredBodyScroll >= 0
    ? Math.min(desiredBodyScroll, availableForwardScroll)
    : desiredBodyScroll;
  return {
    appliedBodyScroll,
    desiredBodyScroll,
    semanticFieldGap: shiftedOcclusionBottom
      - shiftedFieldBottom
      + Math.max(0, appliedBodyScroll),
    sheetRise,
    targetOffset,
  } as const;
}

export function resolveWaflDirectInputKeyboardVisibilityFloor(input: {
  readonly currentOffset: number;
  readonly expandedHeight: number;
  readonly headerHeight: number;
  readonly keyboardInset: number;
  readonly maximumOffset: number;
  readonly minimumBodyViewportHeight: number;
  readonly verticalChrome: number;
}) {
  const requiredVisibleHeight = Math.max(0, input.headerHeight)
    + Math.max(0, input.minimumBodyViewportHeight)
    + Math.max(0, input.verticalChrome);
  const maximumSafeOffset = input.expandedHeight
    - Math.max(0, input.keyboardInset)
    - requiredVisibleHeight;
  const targetOffset = Math.min(
    Math.max(0, input.currentOffset),
    Math.max(0, Math.min(Math.max(0, input.maximumOffset), maximumSafeOffset)),
  );
  return {
    requiredVisibleHeight,
    targetOffset,
    usableBodyViewportHeight: Math.max(
      0,
      input.expandedHeight
        - targetOffset
        - Math.max(0, input.keyboardInset)
        - Math.max(0, input.headerHeight)
        - Math.max(0, input.verticalChrome),
    ),
  } as const;
}

export function resolveWaflDirectInputMergedKeyboardTarget(input: {
  readonly currentOffset: number;
  readonly floorTargetOffset: number;
  readonly measuredTargetOffset?: number | null;
}) {
  return Math.max(0, Math.min(
    input.currentOffset,
    input.floorTargetOffset,
    input.measuredTargetOffset ?? input.currentOffset,
  ));
}

export type WaflPreparedDirectInputLocalGeometry = {
  readonly bodyContentHeight: number;
  /** Capture-time evidence only. Reveal decisions must supply liveBodyOffset. */
  readonly bodyOffset: number;
  readonly bodyViewportHeight: number;
  readonly compactComposition: boolean;
  readonly expandedHeight: number;
  readonly explicitSemanticRegion: boolean;
  readonly fieldHeight: number;
  readonly fieldTop: number;
  readonly fieldWidth: number;
  readonly fieldX: number;
  readonly footerHeight: number;
  readonly headerHeight: number;
  readonly maximumOffset: number;
  readonly minimumBodyViewportHeight: number;
  readonly revealOrder?: WaflDirectInputRevealOrder;
  readonly staticRestingOffset: number;
  readonly safeBottom: number;
  readonly semanticGap: number;
  readonly semanticLayoutAtMs: number | null;
  readonly semanticLayoutRevision: number;
  readonly semanticScopeComplete: boolean;
  readonly verticalChrome: number;
};

export type WaflDirectInputRevealOrder = "bodyFirst" | "rootFirst";

export function resolveWaflPreparedModeFocusTransaction(input: {
  readonly directInputTargetCount: number;
  readonly handledRequestGeneration: number;
  readonly hasPreparedFocusOwner: boolean;
  readonly openReady: boolean;
  readonly preparedLocalGeometryCount: number;
  readonly requestGeneration: number;
  readonly requiredMeasurementsComplete: boolean;
  readonly visible: boolean;
}) {
  const requestGeneration = Math.max(0, Math.trunc(input.requestGeneration));
  const handledRequestGeneration = Math.max(0, Math.trunc(input.handledRequestGeneration));
  const pending = input.hasPreparedFocusOwner && requestGeneration > handledRequestGeneration;
  const ready = pending
    && input.visible
    && input.openReady
    && input.requiredMeasurementsComplete
    && input.directInputTargetCount > 0
    && input.preparedLocalGeometryCount >= input.directInputTargetCount;
  return {
    handledRequestGeneration,
    nextHandledRequestGeneration: ready ? requestGeneration : handledRequestGeneration,
    pending,
    ready,
    requestGeneration,
    suppressStaticRest: pending,
  } as const;
}

export type WaflPreparedGeometryFreshnessReason =
  | "CURRENT"
  | "PRESENTATION_IDENTITY_STALE"
  | "LAYOUT_GENERATION_STALE"
  | "GEOMETRY_REVISION_STALE"
  | "REGISTRY_REVISION_STALE"
  | "OPEN_NOT_READY"
  | "REQUIRED_MEASUREMENTS_INCOMPLETE"
  | "SEMANTIC_TARGET_MISSING"
  | "SEMANTIC_TARGET_GEOMETRY_STALE"
  | "SEMANTIC_SCOPE_INCOMPLETE";

export function resolveWaflPreparedGeometryFreshness(input: {
  readonly currentGeometryRevision: number;
  readonly currentLayoutGeneration: number;
  readonly currentRegistryRevision: number;
  readonly currentSemanticTargetPresent: boolean;
  readonly semanticTargetGeometryCurrent: boolean;
  readonly openReady: boolean;
  readonly presentationIdentityCurrent: boolean;
  readonly requiredMeasurementsComplete: boolean;
  readonly snapshotGeometryRevision: number;
  readonly snapshotLayoutGeneration: number;
  readonly snapshotRegistryRevision: number;
  readonly snapshotSemanticScopeComplete: boolean;
  readonly snapshotSemanticTargetPresent: boolean;
}) {
  let reason: WaflPreparedGeometryFreshnessReason = "CURRENT";
  if (!input.presentationIdentityCurrent) reason = "PRESENTATION_IDENTITY_STALE";
  else if (input.snapshotLayoutGeneration !== input.currentLayoutGeneration) reason = "LAYOUT_GENERATION_STALE";
  else if (input.snapshotGeometryRevision !== input.currentGeometryRevision) reason = "GEOMETRY_REVISION_STALE";
  else if (input.snapshotRegistryRevision !== input.currentRegistryRevision) reason = "REGISTRY_REVISION_STALE";
  else if (!input.openReady) reason = "OPEN_NOT_READY";
  else if (!input.requiredMeasurementsComplete) reason = "REQUIRED_MEASUREMENTS_INCOMPLETE";
  else if (!input.snapshotSemanticTargetPresent || !input.currentSemanticTargetPresent) reason = "SEMANTIC_TARGET_MISSING";
  else if (!input.semanticTargetGeometryCurrent) reason = "SEMANTIC_TARGET_GEOMETRY_STALE";
  else if (!input.snapshotSemanticScopeComplete) reason = "SEMANTIC_SCOPE_INCOMPLETE";
  return { current: reason === "CURRENT", reason } as const;
}

export type WaflSheetSemanticKeyboardClass = "TEXT" | "PHONE_NUMBER" | "MULTILINE" | "SEARCH";

export type WaflKeyboardFrameRootRevealState = {
  readonly frameIdentity: string | null;
  readonly rootAuthorCount: 0 | 1;
};

export type WaflKeyboardAppearanceRootRevealState = {
  readonly appearanceIdentity: string | null;
  readonly rootAuthorCount: 0 | 1;
};

export type WaflSheetRootMotionOwner = "entrance" | "staticRest" | "systemKeyboard" | "exit";

export type WaflSheetRootMotionState = {
  readonly active: boolean;
  readonly generation: number;
  readonly owner: WaflSheetRootMotionOwner | null;
  readonly targetOffset: number | null;
};

/**
 * Chooses the root baseline that a new keyboard reveal is actually planning
 * from. Static rest remains the hide/restore bound; it is not a substitute
 * for an already keyboard-raised root during a registered field handoff.
 */
export function resolveWaflCurrentRootPlanningOffset(input: {
  readonly currentMotion: WaflSheetRootMotionState;
  readonly staticRestingOffset: number;
  readonly systemKeyboardTargetOffset: number | null;
}) {
  const staticRestingOffset = Math.max(0, input.staticRestingOffset);
  const ownedTarget = input.currentMotion.owner === "systemKeyboard"
    ? input.currentMotion.targetOffset
    : null;
  const candidate = ownedTarget ?? input.systemKeyboardTargetOffset ?? staticRestingOffset;
  return Math.max(0, Math.min(staticRestingOffset, Number.isFinite(candidate) ? candidate! : staticRestingOffset));
}

export type WaflKeyboardAppearanceRootResolution = "unresolved" | "animation" | "trueNoop";

/**
 * Resolves keyboard root ownership from both the numeric completion value and
 * the currently active root writer. A restore targeting static rest is an
 * incompatible writer even when the JS completion value still equals the
 * requested keyboard target.
 */
export function resolveWaflKeyboardRootMotionDecision(input: {
  readonly currentMotion: WaflSheetRootMotionState;
  readonly requestedTargetOffset: number;
  readonly translatedCompletionOffset: number;
  readonly tolerance?: number;
}) {
  const tolerance = Math.max(0, Number.isFinite(input.tolerance) ? input.tolerance! : 1);
  const restoreActive = input.currentMotion.active && input.currentMotion.owner === "staticRest";
  const restoreTargetMatches = input.currentMotion.targetOffset !== null
    && Math.abs(input.currentMotion.targetOffset - input.requestedTargetOffset) <= tolerance;
  const incompatibleRestoreActive = restoreActive && !restoreTargetMatches;
  const currentKeyboardTargetMatches = input.currentMotion.owner === "systemKeyboard"
    && input.currentMotion.targetOffset !== null
    && Math.abs(input.currentMotion.targetOffset - input.requestedTargetOffset) <= tolerance;
  const numericRevealRequired = !currentKeyboardTargetMatches
    && input.requestedTargetOffset < input.translatedCompletionOffset - tolerance;
  const requestsRootAnimation = numericRevealRequired || incompatibleRestoreActive;
  return {
    incompatibleRestoreActive,
    currentKeyboardTargetMatches,
    previousAnimationMustBeSuperseded: restoreActive,
    reason: requestsRootAnimation
      ? incompatibleRestoreActive
        ? "ACTIVE_STATIC_REST_MUST_BE_SUPERSEDED"
        : "NUMERIC_REVEAL_REQUIRED"
      : currentKeyboardTargetMatches
        ? "CURRENT_KEYBOARD_TARGET_ALREADY_RESOLVED_TRUE_NOOP"
        : restoreActive
          ? "MATCHING_STATIC_REST_RETIRED_TRUE_NOOP"
          : "ROOT_ALREADY_RESOLVED_TRUE_NOOP",
    requestsRootAnimation,
    resolution: requestsRootAnimation ? "animation" : "trueNoop",
  } as const;
}

export type WaflKeyboardAppearanceNativeEvent =
  | "willShow"
  | "willChangeFrame"
  | "didShow"
  | "stateEffect";

export type WaflKeyboardTransitionTrustReason =
  | "TRUSTWORTHY_NATIVE_TRANSITION"
  | "DID_SHOW_FINAL_FALLBACK"
  | "NON_IOS_EARLY_EVENT"
  | "PREPARED_GEOMETRY_STALE"
  | "SEMANTIC_CLASS_STALE"
  | "LAYOUT_GENERATION_STALE"
  | "INVALID_NATIVE_FRAME"
  | "PROVISIONAL_UNANCHORED_FRAME"
  | "STATE_EFFECT_CANNOT_AUTHOR_ROOT";

export function resolveWaflKeyboardTransitionTrust(input: {
  readonly event: WaflKeyboardAppearanceNativeEvent;
  readonly frameHeight: number;
  readonly frameWidth: number;
  readonly frameY: number;
  readonly keyboardInset: number;
  readonly keyboardClassCurrent: boolean;
  readonly layoutGenerationCurrent: boolean;
  readonly platform: "android" | "ios" | "other";
  readonly preparedGeometryCurrent: boolean;
  readonly windowHeight: number;
}) {
  if (input.event === "stateEffect") {
    return { reason: "STATE_EFFECT_CANNOT_AUTHOR_ROOT", trustworthy: false } as const;
  }
  if (!input.layoutGenerationCurrent) {
    return { reason: "LAYOUT_GENERATION_STALE", trustworthy: false } as const;
  }
  if (!input.keyboardClassCurrent) {
    return { reason: "SEMANTIC_CLASS_STALE", trustworthy: false } as const;
  }
  const values = [
    input.frameHeight,
    input.frameWidth,
    input.frameY,
    input.keyboardInset,
    input.windowHeight,
  ];
  if (
    values.some((value) => !Number.isFinite(value))
    || input.frameHeight <= 0
    || input.frameWidth <= 0
    || input.keyboardInset <= 0
    || input.windowHeight <= 0
    || input.frameY < 0
    || input.frameY >= input.windowHeight
  ) {
    return { reason: "INVALID_NATIVE_FRAME", trustworthy: false } as const;
  }
  if (input.event === "didShow") {
    return { reason: "DID_SHOW_FINAL_FALLBACK", trustworthy: true } as const;
  }
  if (input.platform !== "ios") {
    return { reason: "NON_IOS_EARLY_EVENT", trustworthy: false } as const;
  }
  if (!input.preparedGeometryCurrent) {
    return { reason: "PREPARED_GEOMETRY_STALE", trustworthy: false } as const;
  }
  const frameBottom = input.frameY + input.frameHeight;
  const geometryTolerance = 1;
  if (
    Math.abs(frameBottom - input.windowHeight) > geometryTolerance
    || Math.abs((input.windowHeight - input.frameY) - input.keyboardInset) > geometryTolerance
  ) {
    return { reason: "PROVISIONAL_UNANCHORED_FRAME", trustworthy: false } as const;
  }
  return { reason: "TRUSTWORTHY_NATIVE_TRANSITION", trustworthy: true } as const;
}

export type WaflPendingPreFocusKeyboardTransitionIdentity = {
  readonly layoutGeneration: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
  readonly sheetInstanceId: number;
};

export function resolveWaflPendingPreFocusKeyboardTransitionConsumption(input: {
  readonly candidate: WaflPendingPreFocusKeyboardTransitionIdentity;
  readonly current: WaflPendingPreFocusKeyboardTransitionIdentity;
  readonly dismissing: boolean;
  readonly keyboardClassTransition: boolean;
  readonly visible: boolean;
}) {
  let reason = "CURRENT" as
    | "CURRENT"
    | "SHEET_NOT_VISIBLE"
    | "SHEET_DISMISSING"
    | "SHEET_INSTANCE_STALE"
    | "OPEN_GENERATION_STALE"
    | "LAYOUT_GENERATION_STALE"
    | "MEASUREMENT_IDENTITY_STALE"
    | "KEYBOARD_CLASS_TRANSITION";
  if (!input.visible) reason = "SHEET_NOT_VISIBLE";
  else if (input.dismissing) reason = "SHEET_DISMISSING";
  else if (input.candidate.sheetInstanceId !== input.current.sheetInstanceId) reason = "SHEET_INSTANCE_STALE";
  else if (input.candidate.openGeneration !== input.current.openGeneration) reason = "OPEN_GENERATION_STALE";
  else if (input.candidate.layoutGeneration !== input.current.layoutGeneration) reason = "LAYOUT_GENERATION_STALE";
  else if (input.candidate.measurementIdentity !== input.current.measurementIdentity) reason = "MEASUREMENT_IDENTITY_STALE";
  else if (input.keyboardClassTransition) reason = "KEYBOARD_CLASS_TRANSITION";
  return { consume: reason === "CURRENT", reason } as const;
}

export function resolveWaflKeyboardAppearanceRevealIdentity(input: {
  readonly appearanceGeneration: number;
  readonly focusGeneration: number;
  readonly keyboardClass: WaflSheetSemanticKeyboardClass;
  readonly layoutGeneration?: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
}) {
  return [
    Math.max(0, Math.trunc(input.openGeneration)),
    Math.max(0, Math.trunc(input.focusGeneration)),
    input.measurementIdentity,
    input.keyboardClass,
    Math.max(0, Math.trunc(input.layoutGeneration ?? 0)),
    Math.max(0, Math.trunc(input.appearanceGeneration)),
  ].join(":");
}

export function resolveWaflKeyboardAppearanceRootRevealClaim(input: {
  readonly appearanceIdentity: string;
  readonly current: WaflKeyboardAppearanceRootRevealState;
  readonly requestsRoot: boolean;
}) {
  const current = input.current.appearanceIdentity === input.appearanceIdentity
    ? input.current
    : { appearanceIdentity: input.appearanceIdentity, rootAuthorCount: 0 as const };
  if (!input.requestsRoot || current.rootAuthorCount >= 1) {
    return { allowRootAuthor: false, state: current } as const;
  }
  return {
    allowRootAuthor: true,
    state: { appearanceIdentity: input.appearanceIdentity, rootAuthorCount: 1 as const },
  } as const;
}

export function resolveWaflKeyboardAppearanceRootScheduling(input: {
  readonly event: WaflKeyboardAppearanceNativeEvent;
  readonly keyboardVisibleAtAppearanceStart: boolean;
  readonly platform: "android" | "ios" | "other";
  readonly trustworthyNativeTransition?: boolean;
}) {
  if (input.event === "stateEffect") return false;
  if (input.event === "didShow") return true;
  if (input.platform !== "ios") return false;
  if (input.trustworthyNativeTransition === false) return false;
  if (input.trustworthyNativeTransition === undefined) {
    return input.event === "willShow"
      ? !input.keyboardVisibleAtAppearanceStart
      : input.keyboardVisibleAtAppearanceStart;
  }
  return input.event === "willShow" || input.event === "willChangeFrame";
}

export function resolveWaflKeyboardFrameRevealIdentity(input: {
  readonly focusGeneration: number;
  readonly frameHeight: number;
  readonly frameWidth: number;
  readonly frameX: number;
  readonly frameY: number;
  readonly keyboardClass: WaflSheetSemanticKeyboardClass;
  readonly keyboardInset: number;
  readonly layoutGeneration?: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
}) {
  const finitePixel = (value: number) => Number.isFinite(value) ? Math.round(value) : 0;
  return [
    Math.max(0, Math.trunc(input.openGeneration)),
    Math.max(0, Math.trunc(input.focusGeneration)),
    input.measurementIdentity,
    input.keyboardClass,
    Math.max(0, Math.trunc(input.layoutGeneration ?? 0)),
    finitePixel(input.frameX),
    finitePixel(input.frameY),
    finitePixel(input.frameWidth),
    finitePixel(input.frameHeight),
    Math.max(0, finitePixel(input.keyboardInset)),
  ].join(":");
}

export function resolveWaflKeyboardFrameRootRevealClaim(input: {
  readonly current: WaflKeyboardFrameRootRevealState;
  readonly frameIdentity: string;
  readonly requestsRoot: boolean;
}) {
  const current = input.current.frameIdentity === input.frameIdentity
    ? input.current
    : { frameIdentity: input.frameIdentity, rootAuthorCount: 0 as const };
  if (!input.requestsRoot || current.rootAuthorCount >= 1) {
    return { allowRootAuthor: false, state: current } as const;
  }
  return {
    allowRootAuthor: true,
    state: { frameIdentity: input.frameIdentity, rootAuthorCount: 1 as const },
  } as const;
}

export function resolveWaflSheetSemanticKeyboardClass(input: {
  readonly completionMode?: "form" | "dismiss" | "search";
  readonly keyboardType?: string | null;
  readonly multiline: boolean;
}): WaflSheetSemanticKeyboardClass {
  if (input.completionMode === "search") return "SEARCH";
  if (input.multiline) return "MULTILINE";
  return input.keyboardType === "phone-pad"
    || input.keyboardType === "name-phone-pad"
    || input.keyboardType === "number-pad"
    || input.keyboardType === "decimal-pad"
    || input.keyboardType === "numeric"
    || input.keyboardType === "ascii-capable-number-pad"
    ? "PHONE_NUMBER"
    : "TEXT";
}

export function resolveWaflSheetKeyboardClassTransition(input: {
  readonly currentFrameClass: WaflSheetSemanticKeyboardClass | null;
  readonly keyboardVisible: boolean;
  readonly nextClass: WaflSheetSemanticKeyboardClass;
}) {
  const requiresFreshFrame = input.keyboardVisible
    && input.currentFrameClass !== null
    && input.currentFrameClass !== input.nextClass;
  return {
    canRevealWithCurrentFrame: !requiresFreshFrame,
    requiresFreshFrame,
  } as const;
}

export function resolveWaflPreparedDirectInputKeyboardTarget(input: {
  readonly geometry: WaflPreparedDirectInputLocalGeometry;
  readonly keyboardInset: number;
  readonly currentRootOffset?: number;
  readonly liveBodyOffset?: number;
}) {
  const geometry = input.geometry;
  const staticRestingOffset = Math.max(0, geometry.staticRestingOffset);
  const currentRootOffset = Math.max(0, Math.min(
    staticRestingOffset,
    Number.isFinite(input.currentRootOffset) ? input.currentRootOffset! : staticRestingOffset,
  ));
  const keyboardInset = Math.max(0, input.keyboardInset);
  const capturedBodyOffset = Math.max(0, geometry.bodyOffset);
  const liveBodyOffset = Math.max(0, Number.isFinite(input.liveBodyOffset)
    ? input.liveBodyOffset!
    : capturedBodyOffset);
  const visibilityFloor = resolveWaflDirectInputKeyboardVisibilityFloor({
    currentOffset: currentRootOffset,
    expandedHeight: geometry.expandedHeight,
    headerHeight: geometry.headerHeight,
    keyboardInset,
    maximumOffset: geometry.maximumOffset,
    minimumBodyViewportHeight: geometry.minimumBodyViewportHeight,
    verticalChrome: geometry.verticalChrome,
  });
  const bodyLocalTop = Math.max(0, geometry.headerHeight) + (Math.max(0, geometry.verticalChrome) / 2);
  const fieldTop = bodyLocalTop
    + Math.max(0, geometry.fieldTop)
    - liveBodyOffset;
  const fieldBottom = bodyLocalTop
    + Math.max(0, geometry.fieldTop)
    + Math.max(0, geometry.fieldHeight)
    - liveBodyOffset;
  const visibleBottomAtFloor = Math.max(
    0,
    geometry.expandedHeight - keyboardInset - visibilityFloor.targetOffset,
  );
  const availableForwardScroll = Math.max(
    0,
    geometry.bodyContentHeight - geometry.bodyViewportHeight - liveBodyOffset,
  );
  const availableBackwardScroll = liveBodyOffset;
  const semanticGap = Math.max(0, geometry.semanticGap);
  const revealOrder = geometry.revealOrder ?? "bodyFirst";
  const unscrolledFocusedRequirementBottom = fieldBottom + semanticGap;
  const rootFirstMeasuredTargetOffset = Math.max(
    0,
    Math.min(
      currentRootOffset,
      geometry.expandedHeight - keyboardInset - unscrolledFocusedRequirementBottom,
    ),
  );
  const rootFirstTargetOffset = resolveWaflDirectInputMergedKeyboardTarget({
    currentOffset: currentRootOffset,
    floorTargetOffset: visibilityFloor.targetOffset,
    measuredTargetOffset: rootFirstMeasuredTargetOffset,
  });
  const visibleBottomAfterRootAllocation = Math.max(
    0,
    geometry.expandedHeight - keyboardInset - rootFirstTargetOffset,
  );
  // The semantic gap is keyboard/bottom clearance. The top edge is a real
  // viewport boundary, not an aesthetic alignment margin.
  const rootFirstVisibleTop = bodyLocalTop;
  const rootFirstVisibleBottom = Math.max(
    rootFirstVisibleTop,
    visibleBottomAfterRootAllocation - semanticGap,
  );
  const fieldHeight = Math.max(0, fieldBottom - fieldTop);
  const rootFirstVisibleHeight = Math.max(0, rootFirstVisibleBottom - rootFirstVisibleTop);
  const topClippingRequirement = Math.max(0, rootFirstVisibleTop - fieldTop);
  const bottomKeyboardGapRequirement = Math.max(0, fieldBottom - rootFirstVisibleBottom);
  const rootFirstDesiredBodyScroll = fieldHeight > rootFirstVisibleHeight
    ? fieldTop - rootFirstVisibleTop
    : fieldBottom > rootFirstVisibleBottom
      ? fieldBottom - rootFirstVisibleBottom
      : fieldTop < rootFirstVisibleTop
        ? fieldTop - rootFirstVisibleTop
        : 0;
  const desiredBodyScroll = revealOrder === "rootFirst"
    ? rootFirstDesiredBodyScroll
    : geometry.compactComposition
      ? 0
      : Math.max(0, unscrolledFocusedRequirementBottom - visibleBottomAtFloor);
  const appliedBodyScroll = desiredBodyScroll >= 0
    ? Math.min(desiredBodyScroll, availableForwardScroll)
    : Math.max(desiredBodyScroll, -availableBackwardScroll);
  const focusedRequirementBottom = fieldBottom
    - appliedBodyScroll
    + semanticGap;
  const compactCompositionBottom = bodyLocalTop
    + Math.max(0, geometry.bodyContentHeight)
    + Math.max(0, geometry.footerHeight)
    + Math.max(0, geometry.safeBottom);
  // Ordinary compact fields must not inherit unrelated body height. An
  // explicit semantic scope already supplies its complete required rectangle
  // through focusedRequirementBottom; adding the whole compact body plus safe
  // bottom would double-compensate its clearance. Only a real persistent
  // footer extends the required compact composition independently.
  const compactCompositionRequired = geometry.compactComposition
    && geometry.footerHeight > 0;
  const requiredBottom = compactCompositionRequired
    ? Math.max(focusedRequirementBottom, compactCompositionBottom)
    : focusedRequirementBottom;
  const measuredTargetOffset = revealOrder === "rootFirst"
    ? rootFirstMeasuredTargetOffset
    : Math.max(
      0,
      Math.min(currentRootOffset, geometry.expandedHeight - keyboardInset - requiredBottom),
    );
  const targetOffset = revealOrder === "rootFirst"
    ? rootFirstTargetOffset
    : resolveWaflDirectInputMergedKeyboardTarget({
      currentOffset: currentRootOffset,
      floorTargetOffset: visibilityFloor.targetOffset,
      measuredTargetOffset,
    });
  return {
    appliedBodyScroll,
    availableBackwardScroll,
    availableForwardScroll,
    bodyLocalTop,
    bodyScrollTargetOffset: Math.max(0, liveBodyOffset + appliedBodyScroll),
    capturedBodyOffset,
    compactCompositionRequired,
    compactCompositionBottom: geometry.compactComposition ? compactCompositionBottom : null,
    currentRootOffset,
    desiredBodyScroll,
    explicitSemanticRegion: geometry.explicitSemanticRegion,
    fieldBottom,
    fieldTop,
    focusedRequirementBottom,
    measuredTargetOffset,
    revealOrder,
    requiredBottom,
    semanticContentBottom: fieldBottom - appliedBodyScroll,
    targetOffset,
    liveBodyOffset,
    bottomKeyboardGapRequirement,
    rootFirstVisibleBottom,
    rootFirstVisibleTop,
    topClippingRequirement,
    visibleBottomAfterRootAllocation,
    visibilityFloorTargetOffset: visibilityFloor.targetOffset,
  } as const;
}

export function resolveWaflCoordinatedDirectInputEntrance(input: {
  readonly directInputTargetCount: number;
  readonly preparedLocalGeometryCount?: number;
  readonly hasPreparedAutoFocusOwner: boolean;
  readonly keyboardMode: WaflSheetKeyboardMode;
}) {
  const eligible = input.keyboardMode === "directInput"
    && input.hasPreparedAutoFocusOwner;
  return {
    eligible,
    prepared: eligible
      && input.directInputTargetCount > 0
      && (input.preparedLocalGeometryCount ?? input.directInputTargetCount) >= input.directInputTargetCount,
  } as const;
}

export function resolveWaflDirectInputReconciliationSheetRise(input: {
  readonly currentGap: number;
  readonly finalReconciliation: boolean;
  readonly requiredRise: number;
  readonly tolerance: number;
}) {
  const requiredRise = Math.max(0, input.requiredRise);
  if (
    input.finalReconciliation
    && input.currentGap >= 0
    && requiredRise <= Math.max(0, input.tolerance)
  ) return 0;
  return requiredRise;
}

export type WaflDirectInputFinalReconciliationClassification =
  | "CLEAR"
  | "MICRO_SETTLING"
  | "REAL_OCCLUSION";

export function resolveWaflDirectInputFinalReconciliation(input: {
  readonly compactCompositionGap: number | null;
  readonly coordinatedFirstTarget: boolean;
  readonly microSettlingTolerance: number;
  readonly minimumVisibleFieldGap: number;
  readonly rawSheetRise: number;
  readonly semanticFieldGap: number;
}) {
  const semanticFieldGap = Number.isFinite(input.semanticFieldGap)
    ? input.semanticFieldGap
    : Number.NEGATIVE_INFINITY;
  const compactCompositionGap = input.compactCompositionGap === null
    ? null
    : Number.isFinite(input.compactCompositionGap)
      ? input.compactCompositionGap
      : Number.NEGATIVE_INFINITY;
  const minimumVisibleFieldGap = Math.max(0, input.minimumVisibleFieldGap);
  const rawSheetRise = Math.max(0, input.rawSheetRise);
  const fieldVisible = semanticFieldGap >= minimumVisibleFieldGap;
  const compactCompositionVisible = compactCompositionGap === null || compactCompositionGap >= 0;
  const requiredSheetRise = Math.max(
    rawSheetRise,
    minimumVisibleFieldGap - semanticFieldGap,
    compactCompositionGap === null ? 0 : -compactCompositionGap,
  );
  const classification: WaflDirectInputFinalReconciliationClassification = !fieldVisible || !compactCompositionVisible
    ? "REAL_OCCLUSION"
    : requiredSheetRise <= 0
      ? "CLEAR"
      : "MICRO_SETTLING";
  const sheetRise = classification === "REAL_OCCLUSION" ? requiredSheetRise : 0;
  return {
    classification,
    compactCompositionGap,
    compactCompositionVisible,
    fieldVisible,
    firstTargetMiss: input.coordinatedFirstTarget && classification === "REAL_OCCLUSION",
    rawSheetRise,
    requiredSheetRise,
    semanticFieldGap,
    sheetRise,
    withinMicroSettlingTolerance: classification === "MICRO_SETTLING"
      && requiredSheetRise <= Math.max(0, input.microSettlingTolerance),
  } as const;
}

export function resolveWaflKeyboardTransitionDuration(input: {
  readonly durationMs: number;
  readonly elapsedMs: number;
}) {
  if (!Number.isFinite(input.durationMs) || !Number.isFinite(input.elapsedMs)) return 0;
  return Math.max(0, input.durationMs - Math.max(0, input.elapsedMs));
}

export function resolveWaflDirectInputSubmitBehavior(input: {
  readonly directInput: boolean;
  readonly multiline: boolean;
}) {
  return input.directInput && !input.multiline ? "submit" as const : null;
}

export function resolveWaflDirectInputAccessoryNativeID(input: {
  readonly instanceId: number;
  readonly sessionGeneration: number;
}) {
  return `wafl-direct-input-${Math.max(1, Math.trunc(input.instanceId))}-${Math.max(0, Math.trunc(input.sessionGeneration))}`;
}

export function resolveWaflDirectInputTapPersistence(keyboardMode: WaflSheetKeyboardMode) {
  return keyboardMode === "directInput"
    ? { keyboardDismissMode: "interactive" as const, keyboardShouldPersistTaps: "handled" as const }
    : { keyboardDismissMode: null, keyboardShouldPersistTaps: "handled" as const };
}

export function resolveWaflRegisteredInputBodyTouch(input: {
  readonly focusedRegistrationKey: string | null;
  readonly registeredTargets: readonly {
    readonly inputTarget: number | null;
    readonly registrationKey: string;
  }[];
  readonly touchTarget: number | null;
}) {
  if (input.focusedRegistrationKey === null) {
    return { action: "preserve", destinationRegistrationKey: null, reason: "NO_FOCUSED_INPUT" } as const;
  }
  const touched = input.touchTarget === null
    ? null
    : input.registeredTargets.find((target) => target.inputTarget !== null
      && String(target.inputTarget) === String(input.touchTarget)) ?? null;
  if (touched === null) {
    return { action: "dismiss", destinationRegistrationKey: null, reason: "TRUE_NON_INPUT_TOUCH" } as const;
  }
  if (touched.registrationKey === input.focusedRegistrationKey) {
    return { action: "preserve", destinationRegistrationKey: touched.registrationKey, reason: "CURRENT_INPUT_TOUCH" } as const;
  }
  return { action: "handoff", destinationRegistrationKey: touched.registrationKey, reason: "REGISTERED_INPUT_HANDOFF" } as const;
}

export function resolveWaflDirectInputAccessoryMode(input: {
  readonly accessoryPolicy?: WaflDirectInputAccessoryPolicy;
  readonly keyboardType?: string | null;
  readonly multiline: boolean;
}): WaflDirectInputAccessoryMode {
  if (input.accessoryPolicy === "none") return "none";
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

export function resolveWaflDirectInputReturnKeyPolicy(input: {
  readonly completionMode: "form" | "dismiss" | "search";
  readonly fieldCount: number;
  readonly fieldIndex: number;
  readonly multiline: boolean;
  readonly returnKeyPolicy?: WaflDirectInputReturnKeyPolicy;
}) {
  if (input.returnKeyPolicy === "none" || input.multiline) return null;
  if (input.completionMode === "search") return "search" as const;
  if (input.completionMode === "dismiss") return "done" as const;
  return resolveWaflDirectInputReturnKey(input);
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
