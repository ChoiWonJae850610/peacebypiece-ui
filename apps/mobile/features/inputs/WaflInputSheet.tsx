import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  AppState,
  Easing,
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type AppStateStatus,
  type GestureResponderEvent,
  type KeyboardEvent,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  resolveWaflDirectInputAccessoryNativeID,
  resolveWaflDirectInputMinimalAccessoryAction,
  resolveWaflDirectInputAccessoryState,
  resolveWaflDirectInputKeyboardVisibilityFloor,
  resolveWaflDirectInputMergedKeyboardTarget,
  resolveWaflDirectInputFinalReconciliation,
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflPreparedModeFocusTransaction,
  resolveWaflCoordinatedDirectInputEntrance,
  resolveWaflDirectInputReconciliationSheetRise,
  resolveWaflDirectInputNavigation,
  resolveWaflDirectInputRevealMotion,
  resolveWaflRootFirstMeasuredReveal,
  resolveWaflDirectInputReturnKey,
  resolveWaflDirectInputReturnKeyPolicy,
  resolveWaflDirectInputTapPersistence,
  resolveWaflRegisteredInputBodyTouch,
  resolveWaflInputSheetPresentation,
  resolveWaflSheetClosePlan,
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardAppearanceRootScheduling,
  resolveWaflKeyboardRootMotionDecision,
  resolveWaflCurrentRootPlanningOffset,
  resolveWaflPreparedGeometryFreshness,
  resolveWaflKeyboardTransitionTrust,
  resolveWaflPendingPreFocusKeyboardTransitionConsumption,
  resolveWaflKeyboardFrameRevealIdentity,
  resolveWaflKeyboardFrameRootRevealClaim,
  resolveWaflSheetKeyboardClassTransition,
  resolveWaflKeyboardTransitionDuration,
  canRunWaflSheetSettlingAnimation,
  shouldRestoreDirectInputKeyboard,
  shouldSuppressWaflSheetKeyboardHideGeometry,
  type WaflDirectInputNavigationAction,
  type WaflDirectInputRevealOrder,
  type WaflDirectInputSessionState,
  type WaflPreparedDirectInputLocalGeometry,
  type WaflInputSheetFooterPolicy,
  type WaflKeyboardAppearanceRootRevealState,
  type WaflKeyboardAppearanceRootResolution,
  type WaflKeyboardFrameRootRevealState,
  type WaflSheetRootMotionOwner,
  type WaflSheetRootMotionState,
  type WaflSheetSemanticKeyboardClass,
  type WaflSheetKeyboardMode,
} from "@/domain/waflDirectInputKeyboardPolicy";
import {
  beginWaflSheetFocusRevealCycle,
  applyWaflSheetSystemRevealBodyDelta,
  markWaflSheetFocusRevealCycleActive,
  markWaflSheetFocusRevealCycleDismissing,
  markWaflSheetFocusRevealCycleTerminated,
  observeWaflSheetUserBodyOffset,
  resolveWaflSheetFocusRevealCycleTransfer,
  resolveWaflSheetFocusRevealRestore,
  resolveWaflSheetBodyMeasurements,
  resolveWaflSheetKeyboardRestoreOffset,
  resolveWaflSheetSystemKeyboardTarget,
  type WaflSheetFocusRevealCycle,
} from "@/domain/waflSheetKeyboardRestorePolicy";
import { resolveWaflDecisionOpeningValue, type WaflDecisionOption } from "@/domain/waflDecisionPolicy";
import {
  resolveWaflPreparedGeometryRecaptureDecision,
  resolveWaflPreparedGeometryRevision,
} from "@/domain/waflPreparedGeometryRevisionPolicy";
import WaflActionProcessingBlocker from "@/features/feedback/WaflActionProcessingBlocker";
import WaflDecisionChoiceBody, { type WaflDecisionChoiceState } from "@/features/feedback/WaflDecisionChoiceBody";
import WaflDirectInputKeyboardAccessory from "@/features/inputs/WaflDirectInputKeyboardAccessory";
import WaflSheetActionButtons from "@/features/inputs/WaflSheetActionButtons";
import {
  isWaflInputSheetGeometryEvidenceEnabled,
  persistWaflInputSheetGeometryEvidence,
  type WaflInputSheetGeometryEvidenceSurface,
} from "@/lib/waflInputSheetGeometryEvidence";
import { createWaflInputCommitGuard } from "./waflInputCommitGuard";
import { waflInputSheetKeyboardOwnerRegistry } from "./waflInputSheetKeyboardOwnerRegistry";
import {
  WaflSheetFocusProvider,
  type WaflSheetBodyCoordinateOwner,
  type WaflSheetDirectInputController,
  type WaflSheetEditableInputTarget,
  type WaflSheetFocusTarget,
} from "./WaflSheetTextInput";
import {
  resolveWaflAdaptiveBodyHeight,
  resolveWaflAdaptiveInitialHeight,
  resolveWaflExpandableInitialHeight,
  resolveWaflContentFitHeight,
  resolveWaflSheetEntranceReadiness,
  resolveWaflSheetKeyboardLayout,
  resolveWaflSheetMeasurementIdentity,
  resolveWaflSheetOpeningOffset,
  resolveWaflStaticSheetRestingOffset,
  resolveWaflSheetBodyScrollEnabled,
  resolveWaflSheetVisualRevealPlan,
  isValidWaflSheetWindowMeasurement,
  type WaflSheetWindowMeasurement,
  type WaflSheetSizing,
} from "@/domain/waflSheetDetentPolicy";

type ActiveWaflSheetFocusTarget = WaflSheetFocusTarget & {
  readonly focusGeneration: number;
  readonly layoutGeneration: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
};

type WaflMountedMeasureTarget = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

type WaflKeyboardWindowFrame = {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

function measureWaflDiagnosticTarget(target: WaflMountedMeasureTarget | null) {
  return new Promise<WaflSheetWindowMeasurement | null>((resolve) => {
    if (target === null) {
      resolve(null);
      return;
    }
    try {
      target.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    } catch {
      resolve(null);
    }
  });
}

type WaflRevealMeasurementSet = {
  readonly field: WaflSheetWindowMeasurement;
  readonly footer: WaflSheetWindowMeasurement | null;
  readonly owner: "ref" | "fallback";
  readonly sheet: WaflSheetWindowMeasurement;
  readonly viewport: WaflSheetWindowMeasurement;
};

type WaflSheetCloseOperation = {
  readonly id: number;
  finalized: boolean;
};

type WaflKeyboardTransition = {
  readonly durationMs: number;
  readonly easing: KeyboardEvent["easing"];
  readonly startedAt: number;
};

type WaflPendingPreFocusKeyboardTransition = {
  readonly frame: WaflKeyboardWindowFrame;
  readonly inset: number;
  readonly identity: {
    readonly layoutGeneration: number;
    readonly measurementIdentity: string;
    readonly openGeneration: number;
    readonly sheetInstanceId: number;
  };
  readonly nativeEvent: "willShow" | "willChangeFrame";
  readonly transition: WaflKeyboardTransition;
};

type WaflSheetRootAnimationOptions = {
  readonly completion?: () => void;
  readonly keyboardTransition?: WaflKeyboardTransition | null;
  readonly owner: Extract<WaflSheetRootMotionOwner, "staticRest" | "systemKeyboard">;
};

type WaflRevealOptions = {
  readonly allowRootAuthor?: boolean;
  readonly finalReconciliation?: boolean;
  readonly keyboardAppearanceIdentity?: string | null;
  readonly keyboardFrameIdentity?: string | null;
  readonly keyboardInsetOverride?: number;
  readonly keyboardTransition?: WaflKeyboardTransition | null;
};

type WaflCoordinatedEntrancePhase = "inactive" | "prepared" | "keyboardTransition" | "ordinaryFallback" | "opened";

type WaflPendingDidShowReconciliation = {
  readonly appearanceIdentity: string;
  readonly frameIdentity: string;
  readonly identity: string;
  readonly inset: number;
  readonly target: ActiveWaflSheetFocusTarget;
};

type WaflRegisteredInputHandoff = {
  readonly destinationRegistrationKey: string;
  readonly sourceRegistrationKey: string;
};

type WaflDidShowReconciliationEvidence = {
  readonly animationOwner: "none" | "sheet-spring";
  readonly bodyCorrection: number;
  readonly classification: "CLEAR" | "MICRO_SETTLING" | "REAL_OCCLUSION";
  readonly compactCompositionGap: number | null;
  readonly fieldBottom: number;
  readonly firstAnimationCompletionOffset: number;
  readonly firstTargetMiss: boolean;
  readonly firstTargetOffset: number | null;
  readonly keyboardTop: number;
  readonly measurementOwner: WaflRevealMeasurementSet["owner"];
  readonly rawLayoutDelta: number;
  readonly semanticFieldGap: number;
  readonly semanticGap: number;
  readonly sheetCorrection: number;
};

type WaflPreparedDirectInputGeometrySnapshot = {
  readonly bodyHeight: number;
  readonly capturedAtMs: number;
  readonly fields: ReadonlyMap<string, WaflPreparedDirectInputLocalGeometry>;
  readonly footerHeight: number;
  readonly generation: number;
  readonly geometryRevision: number;
  readonly headerHeight: number;
  readonly layoutGeneration: number;
  readonly measurementIdentity: string;
  readonly registryRevision: number;
  readonly requiredMeasurementsComplete: boolean;
};

type WaflKeyboardGeometryEvidence = {
  readonly bodyCoordinateRevision: number | null;
  readonly bodyContentHeight: number | null;
  readonly bodyHeightCapture: number | null;
  readonly bodyHeightCurrent: number;
  readonly bodyLocalTop: number | null;
  readonly bodyOffset: number | null;
  readonly bodyOffsetCaptured: number | null;
  readonly bodyScrollTargetOffset: number | null;
  readonly bodyScrollDesired: number | null;
  readonly bodyViewportHeight: number | null;
  readonly compactComposition: boolean | null;
  readonly compactCompositionBottom: number | null;
  readonly compactCompositionRequired: boolean | null;
  readonly currentGeometryRevision: number;
  readonly currentRootPlanningOffset: number;
  readonly currentRegistryRevision: number;
  readonly currentSystemKeyboardTargetOffset: number | null;
  readonly currentSemanticLayoutAtMs: number | null;
  readonly currentSemanticLayoutRevision: number | null;
  readonly currentSemanticScopeRect: { readonly height: number; readonly width: number; readonly x: number; readonly y: number } | null;
  readonly entrancePhase: WaflCoordinatedEntrancePhase;
  readonly expandedHeight: number | null;
  readonly explicitSemanticRegion: boolean | null;
  readonly finalKeyboardClearance: number | null;
  readonly finalRootTranslateY: number | null;
  readonly focusedFieldBottom: number | null;
  readonly focusedFieldTop: number | null;
  readonly focusedRequirementBottom: number | null;
  readonly footerHeightCapture: number | null;
  readonly footerHeightCurrent: number;
  readonly headerHeightCapture: number | null;
  readonly headerHeightCurrent: number;
  readonly openReady: boolean;
  readonly focusCycleBodyBaselineOffset: number | null;
  readonly focusCycleLifecycle: WaflSheetFocusRevealCycle["lifecycle"] | null;
  readonly focusCycleSystemBodyDelta: number | null;
  readonly focusCycleUserBodyDelta: number | null;
  readonly preparedCapturedAtMs: number | null;
  readonly preparedGeometryRevision: number | null;
  readonly preparedRegistryRevision: number | null;
  readonly preparedFocusRequestGeneration: number;
  readonly preparedSemanticLayoutAtMs: number | null;
  readonly preparedSemanticLayoutRevision: number | null;
  readonly preparedSemanticScopeRect: { readonly height: number; readonly width: number; readonly x: number; readonly y: number } | null;
  readonly registrySemanticScopeRect: { readonly height: number; readonly width: number; readonly x: number; readonly y: number } | null;
  readonly rawParentLocalScopeRect: { readonly height: number; readonly width: number; readonly x: number; readonly y: number } | null;
  readonly requiredBottom: number | null;
  readonly resultingSemanticBottomInWindow: number | null;
  readonly safeBottom: number | null;
  readonly semanticGap: number | null;
  readonly semanticScopeBottom: number | null;
  readonly semanticGeometryCurrent: boolean;
  readonly staticRestingOffset: number | null;
  readonly visibilityFloorTargetOffset: number | null;
  readonly measuredTargetOffset: number | null;
  readonly requiredMeasurementsComplete: boolean;
  readonly inputAccessoryNativeIdAttached: boolean;
  readonly accessoryMode: WaflSheetEditableInputTarget["accessoryMode"] | null;
  readonly bottomKeyboardGapRequirement: number | null;
  readonly effectiveReturnKeyType: string | null;
  readonly keyboardType: string | null;
  readonly returnKeyPolicy: WaflSheetEditableInputTarget["returnKeyPolicy"] | null;
  readonly rootMotionActive: boolean;
  readonly rootMotionCurrentOwner: WaflSheetRootMotionOwner | null;
  readonly rootMotionCurrentTargetOffset: number | null;
  readonly topClippingRequirement: number | null;
  readonly visibleBottomAfterRootAllocation: number | null;
  readonly visibleTopAfterRootAllocation: number | null;
  readonly windowHeight: number;
};

type WaflKeyboardRevealEvidence = {
  readonly appearanceGeneration: number;
  readonly appearanceIdentity: string | null;
  readonly bodyScrollApplied: number;
  readonly bodyScrollRequested: number;
  readonly elapsedMs: number;
  readonly event: string;
  readonly focusGeneration: number;
  readonly frame: { readonly height: number; readonly width: number; readonly x: number; readonly y: number } | null;
  readonly geometry: WaflKeyboardGeometryEvidence;
  readonly keyboardClass: WaflSheetSemanticKeyboardClass | null;
  readonly keyboardInset: number;
  readonly layoutGeneration: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
  readonly preparedAvailable: boolean;
  readonly preparedFresh: boolean;
  readonly reason: string;
  readonly rootClaim: "denied" | "granted" | "not-requested";
  readonly rootMotion?: {
    readonly nextOwner: WaflSheetRootMotionOwner | null;
    readonly nextTarget: number | null;
    readonly previousActive: boolean;
    readonly previousAnimationSuperseded: boolean;
    readonly previousOwner: WaflSheetRootMotionOwner | null;
    readonly previousTarget: number | null;
    readonly resolution: WaflKeyboardAppearanceRootResolution;
    readonly translatedCompletionOffset: number;
  };
  readonly rootTarget: number | null;
  readonly sheetInstanceId: number;
  readonly thisSheetOwnsKeyboardEvent: boolean;
  readonly topmostKeyboardOwnerId: number | null;
  readonly timestampMs: number;
};

function resolveKeyboardTransitionEasing(easing: KeyboardEvent["easing"]) {
  if (easing === "linear") return Easing.linear;
  if (easing === "easeIn") return Easing.in(Easing.ease);
  if (easing === "easeOut") return Easing.out(Easing.ease);
  return Easing.inOut(Easing.ease);
}

type WaflSheetLocalLayout = { readonly height: number; readonly width: number; readonly x: number; readonly y: number };

function areWaflSheetLocalLayoutsEqual(left: WaflSheetLocalLayout | null, right: WaflSheetLocalLayout | null) {
  return left?.x === right?.x
    && left?.y === right?.y
    && left?.width === right?.width
    && left?.height === right?.height;
}

const WAFL_MEASUREMENT_TIMEOUT_MS = 120;

type Props = {
  readonly visible: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly pending?: boolean;
  readonly processingMessage?: string | null;
  readonly processingHelper?: string | null;
  readonly processingTestID?: string;
  readonly processingPresentation?: "overlay" | "replaceSheet";
  readonly decision?: WaflDecisionChoiceState | null;
  readonly confirmDisabled?: boolean;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly cancelAccessibilityLabel?: string;
  readonly confirmAccessibilityLabel?: string;
  readonly cancelActionLabel?: string;
  readonly confirmActionLabel?: string;
  readonly showCancelAction?: boolean;
  readonly footerPolicy?: WaflInputSheetFooterPolicy;
  readonly bodyScrollable?: boolean;
  readonly keyboardAutoExpand?: boolean;
  readonly keyboardMode?: WaflSheetKeyboardMode;
  readonly keyboardFocusRevealContext?: number;
  readonly keyboardRevealOrder?: WaflDirectInputRevealOrder;
  readonly sizing?: WaflSheetSizing;
  readonly adaptiveMinimumBodyHeight?: number;
  readonly measurementVariant?: string;
  readonly presentationGeneration?: number;
  readonly diagnosticSurfaceId?: WaflInputSheetGeometryEvidenceSurface;
  readonly diagnosticRequiredRegionRef?: { readonly current: WaflMountedMeasureTarget | null };
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onAfterOpen?: () => void;
  readonly onPreparedForAutoFocus?: () => void;
  readonly preparedFocusRequestGeneration?: number;
  readonly onKeyboardHide?: () => void;
  readonly onBodyScrollMetrics?: (metrics: WaflSheetBodyScrollMetrics) => void;
  readonly onConfirm?: () => Promise<unknown> | unknown;
};

export type WaflSheetBodyScrollMetrics = {
  readonly canScrollFurther: boolean;
  readonly contentHeight: number;
  readonly offsetY: number;
  readonly viewportHeight: number;
};

export default function WaflInputSheet({
  visible,
  title,
  children,
  pending = false,
  processingMessage = null,
  processingHelper = null,
  processingTestID,
  processingPresentation = "overlay",
  decision = null,
  confirmDisabled = false,
  contentStyle,
  cancelAccessibilityLabel = "변경 취소",
  confirmAccessibilityLabel = "변경 저장",
  cancelActionLabel,
  confirmActionLabel,
  showCancelAction = true,
  footerPolicy = "auto",
  bodyScrollable = true,
  keyboardAutoExpand = false,
  keyboardMode = "default",
  keyboardFocusRevealContext = WAFL_THEME.sheet.focusRevealContext,
  keyboardRevealOrder = "bodyFirst",
  sizing = "expandable",
  adaptiveMinimumBodyHeight = 0,
  measurementVariant,
  presentationGeneration,
  diagnosticSurfaceId,
  diagnosticRequiredRegionRef,
  onCancel,
  onAfterClose,
  onAfterOpen,
  onPreparedForAutoFocus,
  preparedFocusRequestGeneration = 0,
  onKeyboardHide,
  onBodyScrollMetrics,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const targetGeometryRevisionRef = useRef(1);
  const layoutGenerationRef = useRef({ generation: 1, identity: `${Math.round(window.width)}:${Math.round(window.height)}` });
  const currentLayoutIdentity = `${Math.round(window.width)}:${Math.round(window.height)}`;
  useLayoutEffect(() => {
    if (layoutGenerationRef.current.identity === currentLayoutIdentity) return;
    layoutGenerationRef.current = {
      generation: layoutGenerationRef.current.generation + 1,
      identity: currentLayoutIdentity,
    };
    targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
      targetGeometryRevisionRef.current,
      "windowLayout",
    );
  }, [currentLayoutIdentity]);
  const hasConfirmOwner = Boolean(onConfirm);
  const sheetPresentation = resolveWaflInputSheetPresentation({
    footerPolicy,
    hasConfirmOwner,
    keyboardMode,
    processingMessagePresent: processingMessage !== null,
    processingPresentation,
  });
  const hasActions = sheetPresentation.renderFooterActions;
  const showFooterCancelAction = sheetPresentation.renderCancelAction;
  const showFooterConfirmAction = sheetPresentation.renderConfirmAction;
  const [openSessionGeneration, setOpenSessionGeneration] = useState(0);
  const [directInputInstanceId] = useState(nextWaflDirectInputSheetInstanceId);
  const directInputAccessoryNativeID = resolveWaflDirectInputAccessoryNativeID({
    instanceId: directInputInstanceId,
    sessionGeneration: openSessionGeneration,
  });
  const measurementIdentity = resolveWaflSheetMeasurementIdentity({
    hasActions,
    openSessionGeneration,
    presentationGeneration,
    measurementVariant,
    sizing,
    title,
  });
  const guardRef = useRef(createWaflInputCommitGuard());
  const mountedRef = useRef(true);
  const bodyOffsetRef = useRef(0);
  const bodyMeasuredHeightRef = useRef(0);
  const bodyMeasurementCompleteRef = useRef(false);
  const bodyContentHeightRef = useRef(0);
  const intrinsicBodyContentHeightRef = useRef(0);
  const bodyViewportHeightRef = useRef(0);
  const bodyScrollRef = useRef<ScrollView>(null);
  const bodyContentRef = useRef<View>(null);
  const bodyContentCoordinateLayoutRef = useRef<LayoutRectangle | null>(null);
  const bodyContentCoordinateRevisionRef = useRef(0);
  const bodyContentCoordinateListenersRef = useRef(new Set<() => void>());
  const bodyViewportRef = useRef<View>(null);
  const footerRef = useRef<View>(null);
  const footerMeasuredHeightRef = useRef(0);
  const footerMeasurementCompleteRef = useRef(false);
  const headerMeasuredHeightRef = useRef(0);
  const headerMeasurementCompleteRef = useRef(false);
  const sheetRef = useRef<View>(null);
  const [bodyCoordinateOwner] = useState<WaflSheetBodyCoordinateOwner>(() => ({
    resolveRef: () => bodyContentRef.current,
    resolveRevision: () => bodyContentCoordinateRevisionRef.current,
    subscribeLayout: (listener) => {
      bodyContentCoordinateListenersRef.current.add(listener);
      return () => bodyContentCoordinateListenersRef.current.delete(listener);
    },
  }));
  const focusedTargetRef = useRef<ActiveWaflSheetFocusTarget | null>(null);
  const directInputFieldsRef = useRef<readonly WaflSheetEditableInputTarget[]>([]);
  const directInputRegistryRevisionRef = useRef(0);
  const directInputFormConfirmRef = useRef<(() => Promise<unknown> | unknown) | null>(null);
  const directInputConfirmRef = useRef<() => void>(() => undefined);
  const directInputSessionStateRef = useRef<WaflDirectInputSessionState>("closing");
  const directInputLastFocusedKeyRef = useRef<string | null>(null);
  const registeredInputHandoffRef = useRef<WaflRegisteredInputHandoff | null>(null);
  const directInputRestoreAttemptedRef = useRef(false);
  const directInputRestoringKeyboardRef = useRef(false);
  const systemKeyboardTargetOffsetRef = useRef<number | null>(null);
  const decisionVisibleRef = useRef(false);
  const replaceSheetActiveRef = useRef(false);
  const visibleRef = useRef(visible);
  const pendingRef = useRef(pending);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const focusedMeasurementIdentityRef = useRef(measurementIdentity);
  const focusGenerationRef = useRef(0);
  const revealRunGenerationRef = useRef(0);
  const dismissingRef = useRef(false);
  const closeOperationSequenceRef = useRef(0);
  const closeOperationRef = useRef<WaflSheetCloseOperation | null>(null);
  const entranceStartedRef = useRef(false);
  const translatedRef = useRef(0);
  const focusRevealCycleRef = useRef<WaflSheetFocusRevealCycle | null>(null);
  const bodyScrollUserOwnedRef = useRef(false);
  const previousKeyboardInsetRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const keyboardHidingRef = useRef(false);
  const keyboardFrameClassRef = useRef<WaflSheetSemanticKeyboardClass | null>(null);
  const pendingKeyboardClassRef = useRef<WaflSheetSemanticKeyboardClass | null>(null);
  const keyboardClassRevealIdentityRef = useRef<string | null>(null);
  const keyboardAppearanceGenerationRef = useRef(0);
  const keyboardAppearanceVisibleAtStartRef = useRef(false);
  const keyboardRevealEvidenceStartedAtRef = useRef(0);
  const diagnosticCaptureIdRef = useRef<string | null>(null);
  const diagnosticSequenceRef = useRef(0);
  const lastKeyboardWindowFrameRef = useRef<WaflKeyboardWindowFrame | null>(null);
  const keyboardAppearanceRootRevealStateRef = useRef<WaflKeyboardAppearanceRootRevealState>({
    appearanceIdentity: null,
    rootAuthorCount: 0,
  });
  const keyboardFrameRootRevealStateRef = useRef<WaflKeyboardFrameRootRevealState>({
    frameIdentity: null,
    rootAuthorCount: 0,
  });
  const keyboardAppearanceRootResolutionRef = useRef<{
    readonly appearanceIdentity: string | null;
    readonly resolution: WaflKeyboardAppearanceRootResolution;
  }>({ appearanceIdentity: null, resolution: "unresolved" });
  const blurTerminationFrameRef = useRef<number | null>(null);
  const keyboardTransitionRef = useRef<WaflKeyboardTransition | null>(null);
  const pendingPreFocusKeyboardTransitionRef = useRef<WaflPendingPreFocusKeyboardTransition | null>(null);
  const keyboardInsetRef = useRef(0);
  const didShowReconciliationIdentityRef = useRef<string | null>(null);
  const didShowReconciliationFrameRef = useRef<number | null>(null);
  const didShowReconciliationEvidenceRef = useRef<WaflDidShowReconciliationEvidence | null>(null);
  const pendingDidShowReconciliationRef = useRef<WaflPendingDidShowReconciliation | null>(null);
  const coordinatedEntrancePhaseRef = useRef<WaflCoordinatedEntrancePhase>("inactive");
  const coordinatedEntranceGenerationRef = useRef(0);
  const coordinatedFallbackFrameRef = useRef<number | null>(null);
  const coordinatedFallbackSecondFrameRef = useRef<number | null>(null);
  const preparedDirectInputGeometryRef = useRef<WaflPreparedDirectInputGeometrySnapshot | null>(null);
  const coordinatedFirstTargetIdentityRef = useRef<string | null>(null);
  const animateToOwnerRef = useRef<(offset: number, options: WaflSheetRootAnimationOptions) => void>(() => undefined);
  const finishVisibleEntranceOwnerRef = useRef<(generation: number) => void>(() => undefined);
  const revealFocusedTargetOwnerRef = useRef<(
    target?: ActiveWaflSheetFocusTarget | null,
    options?: WaflRevealOptions,
  ) => void>(() => undefined);
  const openGenerationRef = useRef(0);
  const openReadyRef = useRef(false);
  const entranceFrameRef = useRef<number | null>(null);
  const entranceReadinessFrameRef = useRef<number | null>(null);
  const entranceReadinessSecondFrameRef = useRef<number | null>(null);
  const entranceReadyTargetRef = useRef<string | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rootMotionStateRef = useRef<WaflSheetRootMotionState>({
    active: false,
    generation: 0,
    owner: null,
    targetOffset: null,
  });
  const [translateY] = useState(() => new Animated.Value(window.height));
  const [layoutOffset] = useState(() => new Animated.Value(window.height));
  const [submitting, setSubmitting] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [openReady, setOpenReady] = useState(false);
  const [entranceMeasurementReady, setEntranceMeasurementReady] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [headerMeasured, setHeaderMeasured] = useState(false);
  const [bodyMeasurement, setBodyMeasurement] = useState(() => ({ identity: measurementIdentity, height: 0, measured: false }));
  const [footerHeight, setFooterHeight] = useState(0);
  const [footerMeasured, setFooterMeasured] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [directInputRegistryVersion, setDirectInputRegistryVersion] = useState(0);
  const [directInputFieldKeys, setDirectInputFieldKeys] = useState<readonly string[]>([]);
  const [directInputPreparedGeometryCount, setDirectInputPreparedGeometryCount] = useState(0);
  const [directInputMinimalAccessoryFieldKeys, setDirectInputMinimalAccessoryFieldKeys] = useState<readonly string[]>([]);
  const [directInputCompletionModes, setDirectInputCompletionModes] = useState<Readonly<Record<string, WaflSheetEditableInputTarget["completionMode"]>>>({});
  const [directInputFocusedKey, setDirectInputFocusedKey] = useState<string | null>(null);
  const [directInputFormConfirmAvailable, setDirectInputFormConfirmAvailable] = useState(false);
  const [directInputFormConfirmDisabled, setDirectInputFormConfirmDisabled] = useState(false);
  const [handledPreparedFocusRequestGeneration, setHandledPreparedFocusRequestGeneration] = useState(0);
  const [preparedFocusTransitionActive, setPreparedFocusTransitionActive] = useState(false);
  const [decisionSelected, setDecisionSelected] = useState<WaflDecisionOption>(resolveWaflDecisionOpeningValue);
  const actionPending = pending || submitting;
  const replacesSheetDuringProcessing = sheetPresentation.replaceSheetDuringProcessing;
  const effectiveFocusRevealContext = keyboardFocusRevealContext;
  const effectiveTitle = decision ? "WAFL INPUT" : title;
  const renderedChildren = decision ? <WaflDecisionChoiceBody decision={decision} onSelect={setDecisionSelected} selected={decisionSelected} /> : children;
  const effectiveBodyScrollable = resolveWaflSheetBodyScrollEnabled({
    bodyScrollable,
    decisionVisible: decision !== null,
  });

  useLayoutEffect(() => {
    waflInputSheetKeyboardOwnerRegistry.register(directInputInstanceId);
    return () => waflInputSheetKeyboardOwnerRegistry.unregister(directInputInstanceId);
  }, [directInputInstanceId]);

  useLayoutEffect(() => {
    waflInputSheetKeyboardOwnerRegistry.update({
      instanceId: directInputInstanceId,
      keyboardCapable: keyboardMode === "directInput",
      openGeneration: openSessionGeneration,
      preparedFocusReady: directInputPreparedGeometryCount > 0,
      presented: rendered,
    });
  }, [directInputInstanceId, directInputPreparedGeometryCount, keyboardMode, openSessionGeneration, rendered]);
  const bodyContentHeight = bodyMeasurement.identity === measurementIdentity ? bodyMeasurement.height : 0;
  const currentGenerationBodyMeasured = bodyMeasurement.identity === measurementIdentity && bodyMeasurement.measured;
  const adaptiveBodyHeight = sizing === "reelAdaptive"
    ? Math.max(0, Math.ceil(adaptiveMinimumBodyHeight))
    : resolveWaflAdaptiveBodyHeight(bodyContentHeight, adaptiveMinimumBodyHeight);
  const adaptiveSizing = sizing === "adaptiveExpandable" || sizing === "reelAdaptive";
  const safeBottom = Math.max(insets.bottom, WAFL_THEME.spacing.md);
  const effectiveFooterHeight = hasActions ? footerHeight : 0;
  const contentFit = resolveWaflContentFitHeight({
    bodyHeight: bodyContentHeight,
    footerHeight: effectiveFooterHeight,
    headerHeight,
    maxRatio: WAFL_THEME.sheet.contentFitMaxRatio,
    minHeight: WAFL_THEME.sheet.contentFitMinHeight,
    safeBottom,
    verticalChrome: WAFL_THEME.spacing.sm * 2,
    windowHeight: window.height,
  });
  const keyboardContentFitHeight = Math.min(
    Math.round(window.height * WAFL_THEME.sheet.maximumStaticExtentRatio),
    Math.max(
      contentFit.height,
      headerHeight
        + effectiveFooterHeight
        + safeBottom
        + WAFL_THEME.sheet.initialBodyViewportMinHeight
        + (WAFL_THEME.spacing.sm * 2),
    ),
  );
  const expandedHeight = sizing === "contentFit"
    ? (keyboardInset > 0 ? keyboardContentFitHeight : contentFit.height)
    : Math.max(320, Math.round(window.height * (sizing === "fullView" ? WAFL_THEME.sheet.fullViewStaticExtentRatio : WAFL_THEME.sheet.maximumStaticExtentRatio)));
  const mediumHeight = Math.min(expandedHeight, adaptiveSizing
    ? resolveWaflAdaptiveInitialHeight({
      bodyHeight: adaptiveBodyHeight,
      footerHeight: effectiveFooterHeight,
      headerHeight,
      maxRatio: WAFL_THEME.sheet.defaultStaticExtentRatio,
      minHeight: WAFL_THEME.sheet.contentFitMinHeight,
      safeBottom,
      verticalChrome: WAFL_THEME.spacing.sm * 2,
      windowHeight: window.height,
    })
    : resolveWaflExpandableInitialHeight({
      staticExtentRatio: WAFL_THEME.sheet.defaultStaticExtentRatio,
      footerHeight: effectiveFooterHeight,
      headerHeight,
      minimumBodyViewport: WAFL_THEME.sheet.initialBodyViewportMinHeight,
      safeBottom,
      verticalChrome: WAFL_THEME.spacing.sm * 2,
      windowHeight: window.height,
    }));
  const mediumOffset = sizing === "expandable" || adaptiveSizing
    ? resolveWaflStaticSheetRestingOffset({ expandedHeight, visibleHeight: mediumHeight })
    : 0;
  const entranceReadiness = resolveWaflSheetEntranceReadiness({
    currentGenerationBodyMeasured,
    deterministicBodyHeight: adaptiveMinimumBodyHeight,
    footerMeasured,
    hasActions,
    headerMeasured,
    sizing,
  });
  const coordinatedEntrance = resolveWaflCoordinatedDirectInputEntrance({
    directInputTargetCount: directInputFieldKeys.length,
    hasPreparedAutoFocusOwner: onPreparedForAutoFocus !== undefined,
    keyboardMode,
    preparedLocalGeometryCount: directInputPreparedGeometryCount,
  });
  const preparedModeFocusTransaction = resolveWaflPreparedModeFocusTransaction({
    directInputTargetCount: directInputFieldKeys.length,
    handledRequestGeneration: handledPreparedFocusRequestGeneration,
    hasPreparedFocusOwner: keyboardMode === "directInput" && onPreparedForAutoFocus !== undefined,
    openReady,
    preparedLocalGeometryCount: directInputPreparedGeometryCount,
    requestGeneration: preparedFocusRequestGeneration,
    requiredMeasurementsComplete: entranceReadiness.ready,
    visible: visible && rendered,
  });
  const keyboardLayout = resolveWaflSheetKeyboardLayout({
    expandedHeight,
    footerHeight: effectiveFooterHeight,
    headerHeight,
    keyboardInset,
    restingSafeBottom: safeBottom,
    sheetOffset: 0,
    verticalChrome: WAFL_THEME.spacing.sm * 2,
  });
  const structuralKeyboardLayout = resolveWaflSheetKeyboardLayout({
    expandedHeight,
    footerHeight: effectiveFooterHeight,
    headerHeight,
    keyboardInset: 0,
    restingSafeBottom: safeBottom,
    sheetOffset: 0,
    verticalChrome: WAFL_THEME.spacing.sm * 2,
  });
  const expandedBodyViewportHeight = keyboardLayout.expandedBodyViewportHeight;
  const animatedBodyViewportHeight = layoutOffset.interpolate({
    inputRange: [0, Math.max(1, expandedBodyViewportHeight)],
    outputRange: [expandedBodyViewportHeight, 0],
    extrapolate: "clamp",
  });

  const persistDiagnosticEvidence = useCallback((event: string, payload: Readonly<Record<string, unknown>>) => {
    if (!diagnosticSurfaceId || !isWaflInputSheetGeometryEvidenceEnabled()) return;
    diagnosticSequenceRef.current += 1;
    persistWaflInputSheetGeometryEvidence({
      captureId: diagnosticCaptureIdRef.current
        ?? `${diagnosticSurfaceId}:${directInputInstanceId}:${Math.max(0, openGenerationRef.current)}`,
      clientTimestampEpochMs: Date.now(),
      event,
      sequence: diagnosticSequenceRef.current,
      surface: diagnosticSurfaceId,
      ...payload,
    });
  }, [diagnosticSurfaceId, directInputInstanceId]);

  const scheduleActualDeviceGeometryObservation = useCallback((trigger: string, requestedRootTarget: number | null) => {
    if (!diagnosticSurfaceId || !isWaflInputSheetGeometryEvidenceEnabled()) return;
    const scheduledOpenGeneration = openGenerationRef.current;
    const scheduledFocusGeneration = focusedTargetRef.current?.focusGeneration ?? 0;
    requestAnimationFrame(() => {
      const target = focusedTargetRef.current;
      const keyboardFrame = lastKeyboardWindowFrameRef.current;
      void Promise.all([
        measureWaflDiagnosticTarget(sheetRef.current),
        measureWaflDiagnosticTarget(bodyScrollRef.current?.getNativeScrollRef() ?? bodyViewportRef.current),
        measureWaflDiagnosticTarget(target?.inputRef ?? null),
        measureWaflDiagnosticTarget(target?.revealRef ?? null),
        measureWaflDiagnosticTarget(diagnosticRequiredRegionRef?.current ?? null),
      ]).then(([sheetWindowRect, bodyViewportWindowRect, inputWindowRect, semanticWindowRect, requiredRegionWindowRect]) => {
        const keyboardTop = keyboardFrame?.y ?? (keyboardInsetRef.current > 0 ? window.height - keyboardInsetRef.current : null);
        const staticSheetWindowY = window.height - expandedHeight;
        const actualAppliedRootTranslateY = sheetWindowRect === null
          ? null
          : sheetWindowRect.y - staticSheetWindowY;
        const bottomClearance = (rect: WaflSheetWindowMeasurement | null) => (
          keyboardTop === null || rect === null ? null : keyboardTop - (rect.y + rect.height)
        );
        persistDiagnosticEvidence(`${trigger}ActualGeometry`, {
          actualAppliedRootTranslateY,
          bodyScroll: {
            contentHeight: bodyContentHeightRef.current,
            offsetY: bodyOffsetRef.current,
            viewportHeight: bodyViewportHeightRef.current,
          },
          bodyViewportWindowRect,
          currentFocusGeneration: focusedTargetRef.current?.focusGeneration ?? 0,
          currentOpenGeneration: openGenerationRef.current,
          expandedHeight,
          inputKeyboardClearance: bottomClearance(inputWindowRect),
          inputWindowRect,
          keyboardFrame,
          keyboardInset: keyboardInsetRef.current,
          keyboardTop,
          nativeWindow: { height: window.height, width: window.width },
          requestedRootTarget,
          requiredRegionKeyboardClearance: bottomClearance(requiredRegionWindowRect),
          requiredRegionWindowRect,
          rootMotion: rootMotionStateRef.current,
          rootResolution: keyboardAppearanceRootResolutionRef.current,
          scheduledFocusGeneration,
          scheduledOpenGeneration,
          semanticKeyboardClearance: bottomClearance(semanticWindowRect),
          semanticWindowRect,
          sheetWindowRect,
          staticRestingOffset: mediumOffset,
          staticSheetWindowY,
          translatedCompletionRef: translatedRef.current,
        });
      }).catch(() => undefined);
    });
  }, [diagnosticRequiredRegionRef, diagnosticSurfaceId, expandedHeight, mediumOffset, persistDiagnosticEvidence, window.height, window.width]);

  const capturePreparedDirectInputGeometry = useCallback((generation: number, reason = "structural-refresh") => {
    if (keyboardMode !== "directInput" || generation <= 0) return null;
    const preparedBodyViewportHeight = Math.max(0, structuralKeyboardLayout.expandedBodyViewportHeight - mediumOffset);
    const compactComposition = (sizing === "contentFit" || adaptiveSizing)
      && bodyContentHeight <= preparedBodyViewportHeight + 1;
    const fields = new Map(directInputFieldsRef.current.flatMap((target) => {
      const field = target.sheetLocalLayout;
      const currentSemanticLayout = target.resolveSheetLocalLayout();
      const semanticGeometryCurrent = areWaflSheetLocalLayoutsEqual(field, currentSemanticLayout);
      if (field === null || !semanticGeometryCurrent) return [];
      return [[target.registrationKey, {
        bodyContentHeight,
        bodyOffset: bodyOffsetRef.current,
        bodyViewportHeight: preparedBodyViewportHeight,
        compactComposition,
        expandedHeight,
        explicitSemanticRegion: target.semanticScope,
        fieldHeight: field.height,
        fieldTop: field.y,
        fieldWidth: field.width,
        fieldX: field.x,
        footerHeight: effectiveFooterHeight,
        headerHeight,
        maximumOffset: mediumOffset,
        minimumBodyViewportHeight: WAFL_THEME.sheet.initialBodyViewportMinHeight,
        revealOrder: keyboardRevealOrder,
        staticRestingOffset: mediumOffset,
        safeBottom,
        semanticGap: target.semanticScope
          ? WAFL_THEME.sheet.focusRevealGap
          : effectiveFocusRevealContext,
        semanticLayoutAtMs: target.semanticLayoutAtMs,
        semanticLayoutRevision: target.semanticLayoutRevision,
        semanticScopeComplete: field.width > 0 && field.height > 0
          && (!target.semanticScope || currentSemanticLayout !== null),
        verticalChrome: WAFL_THEME.spacing.sm * 2,
      } satisfies WaflPreparedDirectInputLocalGeometry] as const];
    }));
    const snapshot: WaflPreparedDirectInputGeometrySnapshot = {
      bodyHeight: bodyMeasuredHeightRef.current,
      capturedAtMs: globalThis.performance.now(),
      fields,
      footerHeight: footerMeasuredHeightRef.current,
      generation,
      geometryRevision: targetGeometryRevisionRef.current,
      headerHeight: headerMeasuredHeightRef.current,
      layoutGeneration: layoutGenerationRef.current.generation,
      measurementIdentity,
      registryRevision: directInputRegistryRevisionRef.current,
      requiredMeasurementsComplete: headerMeasurementCompleteRef.current
        && bodyMeasurementCompleteRef.current
        && (!hasActions || footerMeasurementCompleteRef.current)
        && fields.size > 0
        && fields.size === directInputFieldsRef.current.length,
    };
    preparedDirectInputGeometryRef.current = snapshot;
    if (__DEV__ && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
      const recapture = {
        bodyMutation: 0,
        keyboardInset: keyboardInsetRef.current,
        keyboardVisibleRecapture: keyboardInsetRef.current > 0,
        preparedGeometryRevision: snapshot.geometryRevision,
        preparedRegistryRevision: snapshot.registryRevision,
        reason,
        rootMutation: 0,
        runtimeContentHeight: bodyContentHeightRef.current,
        runtimeViewportHeight: bodyViewportHeightRef.current,
        structuralGeometryRevision: targetGeometryRevisionRef.current,
        timestampMs: globalThis.performance.now(),
      };
      console.info("[WAFL_PREPARED_GEOMETRY_RECAPTURE_EVIDENCE]", JSON.stringify(recapture));
      persistDiagnosticEvidence("preparedGeometryRecapture", recapture);
    }
    return snapshot;
  }, [adaptiveSizing, bodyContentHeight, effectiveFocusRevealContext, effectiveFooterHeight, expandedHeight, hasActions, headerHeight, keyboardMode, keyboardRevealOrder, measurementIdentity, mediumOffset, persistDiagnosticEvidence, safeBottom, sizing, structuralKeyboardLayout.expandedBodyViewportHeight]);

  const recordKeyboardRevealEvidence = useCallback((entry: Omit<WaflKeyboardRevealEvidence,
    "elapsedMs" | "geometry" | "sheetInstanceId" | "thisSheetOwnsKeyboardEvent" | "timestampMs" | "topmostKeyboardOwnerId"
  >) => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() !== "true") return;
    const timestampMs = globalThis.performance.now();
    if (entry.event === "focus" || keyboardRevealEvidenceStartedAtRef.current <= 0) {
      keyboardRevealEvidenceStartedAtRef.current = timestampMs;
    }
    const prepared = preparedDirectInputGeometryRef.current;
    const focused = focusedTargetRef.current;
    const currentRegistered = focused === null
      ? null
      : directInputFieldsRef.current.find((target) => target.registrationKey === focused.registrationKey) ?? null;
    const preparedField = focused === null ? null : prepared?.fields.get(focused.registrationKey) ?? null;
    const registryRect = currentRegistered?.sheetLocalLayout ?? focused?.sheetLocalLayout ?? null;
    const currentRect = currentRegistered?.resolveSheetLocalLayout() ?? registryRect;
    const preparedRect = preparedField === null ? null : {
      height: preparedField.fieldHeight,
      width: preparedField.fieldWidth,
      x: preparedField.fieldX,
      y: preparedField.fieldTop,
    };
    const currentRootPlanningOffset = resolveWaflCurrentRootPlanningOffset({
      currentMotion: rootMotionStateRef.current,
      staticRestingOffset: mediumOffset,
      systemKeyboardTargetOffset: systemKeyboardTargetOffsetRef.current,
    });
    const numericPlan = preparedField === null || entry.keyboardInset <= 0
      ? null
      : resolveWaflPreparedDirectInputKeyboardTarget({
        geometry: preparedField,
        keyboardInset: entry.keyboardInset,
        currentRootOffset: currentRootPlanningOffset,
        liveBodyOffset: bodyOffsetRef.current,
      });
    const effectiveReturnKeyType = currentRegistered?.returnKeyPolicy === "none"
      ? null
      : currentRegistered?.completionMode === "search"
        ? "search"
        : currentRegistered?.completionMode === "dismiss"
          ? "done"
          : currentRegistered == null
            ? null
            : resolveWaflDirectInputReturnKey({
              fieldCount: directInputFieldsRef.current.length,
              fieldIndex: directInputFieldsRef.current.findIndex((item) => item.registrationKey === currentRegistered.registrationKey),
              multiline: currentRegistered.multiline,
            });
    const focusedRequirementBottom = numericPlan?.focusedRequirementBottom ?? null;
    const finalRootTranslateY = entry.rootTarget ?? numericPlan?.targetOffset ?? null;
    const semanticContentBottom = numericPlan?.semanticContentBottom ?? null;
    const resultingSemanticBottomInWindow = finalRootTranslateY === null || semanticContentBottom === null
      ? null
      : window.height - preparedField!.expandedHeight + finalRootTranslateY + semanticContentBottom;
    const keyboardTop = window.height - entry.keyboardInset;
    const evidence: WaflKeyboardRevealEvidence = {
      ...entry,
      elapsedMs: Math.max(0, timestampMs - keyboardRevealEvidenceStartedAtRef.current),
      geometry: {
        bodyCoordinateRevision: currentRegistered?.bodyCoordinateRevision ?? focused?.bodyCoordinateRevision ?? null,
        bodyContentHeight: preparedField?.bodyContentHeight ?? null,
        bodyHeightCapture: prepared?.bodyHeight ?? null,
        bodyHeightCurrent: bodyMeasuredHeightRef.current,
        bodyLocalTop: numericPlan?.bodyLocalTop ?? null,
        bodyOffset: numericPlan?.liveBodyOffset ?? bodyOffsetRef.current,
        bodyOffsetCaptured: preparedField?.bodyOffset ?? null,
        bodyScrollTargetOffset: numericPlan?.bodyScrollTargetOffset ?? null,
        bodyScrollDesired: numericPlan?.desiredBodyScroll ?? null,
        bodyViewportHeight: preparedField?.bodyViewportHeight ?? null,
        compactComposition: preparedField?.compactComposition ?? null,
        compactCompositionBottom: numericPlan?.compactCompositionBottom ?? null,
        compactCompositionRequired: numericPlan?.compactCompositionRequired ?? null,
        currentGeometryRevision: targetGeometryRevisionRef.current,
        currentRootPlanningOffset,
        currentRegistryRevision: directInputRegistryRevisionRef.current,
        currentSystemKeyboardTargetOffset: systemKeyboardTargetOffsetRef.current,
        currentSemanticLayoutAtMs: currentRegistered?.semanticLayoutAtMs ?? null,
        currentSemanticLayoutRevision: currentRegistered?.semanticLayoutRevision ?? null,
        currentSemanticScopeRect: currentRect,
        entrancePhase: coordinatedEntrancePhaseRef.current,
        expandedHeight: preparedField?.expandedHeight ?? null,
        explicitSemanticRegion: preparedField?.explicitSemanticRegion ?? null,
        finalKeyboardClearance: resultingSemanticBottomInWindow === null ? null : keyboardTop - resultingSemanticBottomInWindow,
        finalRootTranslateY,
        focusedFieldBottom: numericPlan?.fieldBottom ?? null,
        focusedFieldTop: numericPlan?.fieldTop ?? null,
        focusedRequirementBottom,
        footerHeightCapture: prepared?.footerHeight ?? null,
        footerHeightCurrent: footerMeasuredHeightRef.current,
        headerHeightCapture: prepared?.headerHeight ?? null,
        headerHeightCurrent: headerMeasuredHeightRef.current,
        openReady: openReadyRef.current,
        focusCycleBodyBaselineOffset: focusRevealCycleRef.current?.bodyBaselineOffset ?? null,
        focusCycleLifecycle: focusRevealCycleRef.current?.lifecycle ?? null,
        focusCycleSystemBodyDelta: focusRevealCycleRef.current?.systemBodyDelta ?? null,
        focusCycleUserBodyDelta: focusRevealCycleRef.current?.userBodyDelta ?? null,
        preparedCapturedAtMs: prepared?.capturedAtMs ?? null,
        preparedGeometryRevision: prepared?.geometryRevision ?? null,
        preparedRegistryRevision: prepared?.registryRevision ?? null,
        preparedFocusRequestGeneration,
        preparedSemanticLayoutAtMs: preparedField?.semanticLayoutAtMs ?? null,
        preparedSemanticLayoutRevision: preparedField?.semanticLayoutRevision ?? null,
        preparedSemanticScopeRect: preparedRect,
        registrySemanticScopeRect: registryRect,
        rawParentLocalScopeRect: currentRegistered?.rawParentLocalLayout ?? focused?.rawParentLocalLayout ?? null,
        requiredBottom: numericPlan?.requiredBottom ?? null,
        resultingSemanticBottomInWindow,
        safeBottom: preparedField?.safeBottom ?? null,
        semanticGap: preparedField?.semanticGap ?? null,
        semanticScopeBottom: preparedField === null ? null : preparedField.fieldTop + preparedField.fieldHeight,
        semanticGeometryCurrent: areWaflSheetLocalLayoutsEqual(registryRect, currentRect),
        staticRestingOffset: preparedField?.staticRestingOffset ?? null,
        visibilityFloorTargetOffset: numericPlan?.visibilityFloorTargetOffset ?? null,
        measuredTargetOffset: numericPlan?.measuredTargetOffset ?? null,
        requiredMeasurementsComplete: prepared?.requiredMeasurementsComplete ?? false,
        inputAccessoryNativeIdAttached: currentRegistered?.accessoryMode === "singleAction",
        accessoryMode: currentRegistered?.accessoryMode ?? null,
        bottomKeyboardGapRequirement: numericPlan?.bottomKeyboardGapRequirement ?? null,
        effectiveReturnKeyType,
        keyboardType: currentRegistered?.keyboardType ?? null,
        returnKeyPolicy: currentRegistered?.returnKeyPolicy ?? null,
        rootMotionActive: rootMotionStateRef.current.active,
        rootMotionCurrentOwner: rootMotionStateRef.current.owner,
        rootMotionCurrentTargetOffset: rootMotionStateRef.current.targetOffset,
        topClippingRequirement: numericPlan?.topClippingRequirement ?? null,
        visibleBottomAfterRootAllocation: numericPlan?.rootFirstVisibleBottom ?? null,
        visibleTopAfterRootAllocation: numericPlan?.rootFirstVisibleTop ?? null,
        windowHeight: window.height,
      },
      sheetInstanceId: directInputInstanceId,
      thisSheetOwnsKeyboardEvent: waflInputSheetKeyboardOwnerRegistry.resolve(directInputInstanceId).thisSheetOwnsKeyboardEvent,
      timestampMs,
      topmostKeyboardOwnerId: waflInputSheetKeyboardOwnerRegistry.resolve(directInputInstanceId).ownerInstanceId,
    };
    console.info("[WAFL_KEYBOARD_REVEAL_EVIDENCE]", JSON.stringify(evidence));
    persistDiagnosticEvidence(evidence.event, { keyboardReveal: evidence });
    scheduleActualDeviceGeometryObservation(evidence.event, evidence.rootTarget);
  }, [directInputInstanceId, mediumOffset, persistDiagnosticEvidence, preparedFocusRequestGeneration, scheduleActualDeviceGeometryObservation, window.height]);

  const registerDirectInputTarget = useCallback((target: WaflSheetEditableInputTarget) => {
    const current = directInputFieldsRef.current;
    const existingIndex = current.findIndex((item) => item.registrationKey === target.registrationKey);
    if (existingIndex < 0) {
      const next = [...current, target];
      directInputFieldsRef.current = next;
      directInputRegistryRevisionRef.current += 1;
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "semanticRegistry",
      );
      setDirectInputFieldKeys(next.map((item) => item.registrationKey));
      setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
      setDirectInputCompletionModes(Object.fromEntries(next.map((item) => [item.registrationKey, item.completionMode])));
      setDirectInputPreparedGeometryCount(next.filter((item) => item.sheetLocalLayout !== null).length);
      setDirectInputRegistryVersion((version) => version + 1);
      if (__DEV__ && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
        console.info("[WAFL_SEMANTIC_SCOPE_REGISTRATION_EVIDENCE]", JSON.stringify({
          event: "direct-input-registry-registration",
          bodyCoordinateRevision: target.bodyCoordinateRevision,
          geometryRevision: targetGeometryRevisionRef.current,
          layout: target.sheetLocalLayout,
          rawParentLocalLayout: target.rawParentLocalLayout,
          registrationReason: target.registrationReason,
          registryRevision: directInputRegistryRevisionRef.current,
          registryRevisionChanged: true,
          replayAtMs: target.semanticReplayAtMs,
          semanticLayoutAtMs: target.semanticLayoutAtMs,
          semanticLayoutRevision: target.semanticLayoutRevision,
          semanticScope: target.semanticScope,
          subscriptionAtMs: target.semanticSubscriptionAtMs,
          timestampMs: globalThis.performance.now(),
        }));
      }
      return;
    }
    const existing = current[existingIndex]!;
    if (
      existing.inputRef === target.inputRef
      && existing.inputTarget === target.inputTarget
      && existing.multiline === target.multiline
      && existing.accessoryMode === target.accessoryMode
      && existing.completionMode === target.completionMode
      && existing.keyboardClass === target.keyboardClass
      && existing.keyboardType === target.keyboardType
      && existing.returnKeyPolicy === target.returnKeyPolicy
      && existing.semanticScope === target.semanticScope
      && existing.sheetLocalLayout?.x === target.sheetLocalLayout?.x
      && existing.sheetLocalLayout?.y === target.sheetLocalLayout?.y
      && existing.sheetLocalLayout?.width === target.sheetLocalLayout?.width
      && existing.sheetLocalLayout?.height === target.sheetLocalLayout?.height
    ) {
      if (__DEV__ && target.registrationReason === "subscription-replay" && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
        console.info("[WAFL_SEMANTIC_SCOPE_REGISTRATION_EVIDENCE]", JSON.stringify({
          event: "direct-input-registry-replay-noop",
          bodyCoordinateRevision: target.bodyCoordinateRevision,
          geometryRevision: targetGeometryRevisionRef.current,
          layout: target.sheetLocalLayout,
          rawParentLocalLayout: target.rawParentLocalLayout,
          registrationReason: target.registrationReason,
          registryRevision: directInputRegistryRevisionRef.current,
          registryRevisionChanged: false,
          replayAtMs: target.semanticReplayAtMs,
          semanticLayoutAtMs: target.semanticLayoutAtMs,
          semanticLayoutRevision: target.semanticLayoutRevision,
          semanticScope: target.semanticScope,
          subscriptionAtMs: target.semanticSubscriptionAtMs,
          timestampMs: globalThis.performance.now(),
        }));
      }
      return;
    }
    const next = [...current];
    next[existingIndex] = target;
    directInputFieldsRef.current = next;
    directInputRegistryRevisionRef.current += 1;
    targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
      targetGeometryRevisionRef.current,
      "semanticRegistry",
    );
    setDirectInputFieldKeys(next.map((item) => item.registrationKey));
    setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
    setDirectInputCompletionModes(Object.fromEntries(next.map((item) => [item.registrationKey, item.completionMode])));
    setDirectInputPreparedGeometryCount(next.filter((item) => item.sheetLocalLayout !== null).length);
    setDirectInputRegistryVersion((version) => version + 1);
    if (__DEV__ && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
      console.info("[WAFL_SEMANTIC_SCOPE_REGISTRATION_EVIDENCE]", JSON.stringify({
        event: "direct-input-registry-update",
        bodyCoordinateRevision: target.bodyCoordinateRevision,
        geometryRevision: targetGeometryRevisionRef.current,
        layout: target.sheetLocalLayout,
        rawParentLocalLayout: target.rawParentLocalLayout,
        registrationReason: target.registrationReason,
        registryRevision: directInputRegistryRevisionRef.current,
        registryRevisionChanged: true,
        replayAtMs: target.semanticReplayAtMs,
        semanticLayoutAtMs: target.semanticLayoutAtMs,
        semanticLayoutRevision: target.semanticLayoutRevision,
        semanticScope: target.semanticScope,
        subscriptionAtMs: target.semanticSubscriptionAtMs,
        timestampMs: globalThis.performance.now(),
      }));
    }
  }, [setDirectInputCompletionModes, setDirectInputFieldKeys, setDirectInputMinimalAccessoryFieldKeys, setDirectInputPreparedGeometryCount, setDirectInputRegistryVersion]);

  const registerDirectInputFormConfirm = useCallback((action: () => Promise<unknown> | unknown) => {
    directInputFormConfirmRef.current = action;
    setDirectInputFormConfirmAvailable(true);
    return () => {
      if (directInputFormConfirmRef.current !== action) return;
      directInputFormConfirmRef.current = null;
      setDirectInputFormConfirmAvailable(false);
      setDirectInputFormConfirmDisabled(false);
    };
  }, [setDirectInputFormConfirmAvailable, setDirectInputFormConfirmDisabled]);

  const unregisterDirectInputTarget = useCallback((registrationKey: string) => {
    const current = directInputFieldsRef.current;
    const next = current.filter((item) => item.registrationKey !== registrationKey);
    if (next.length === current.length) return;
    directInputFieldsRef.current = next;
    directInputRegistryRevisionRef.current += 1;
    targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
      targetGeometryRevisionRef.current,
      "semanticRegistry",
    );
    setDirectInputFieldKeys(next.map((item) => item.registrationKey));
    setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
    setDirectInputCompletionModes(Object.fromEntries(next.map((item) => [item.registrationKey, item.completionMode])));
    setDirectInputPreparedGeometryCount(next.filter((item) => item.sheetLocalLayout !== null).length);
    setDirectInputRegistryVersion((version) => version + 1);
    setDirectInputFocusedKey((focusedKey) => focusedKey === registrationKey ? null : focusedKey);
  }, [setDirectInputCompletionModes, setDirectInputFieldKeys, setDirectInputFocusedKey, setDirectInputMinimalAccessoryFieldKeys, setDirectInputPreparedGeometryCount, setDirectInputRegistryVersion]);

  const resolvePreparedGeometryForTarget = useCallback((target: ActiveWaflSheetFocusTarget) => {
    const snapshot = preparedDirectInputGeometryRef.current;
    const preparedField = snapshot?.fields.get(target.registrationKey);
    const currentTarget = directInputFieldsRef.current.find((item) => item.registrationKey === target.registrationKey);
    const registrySemanticLayout = currentTarget?.sheetLocalLayout ?? null;
    const currentSemanticLayout = currentTarget?.resolveSheetLocalLayout() ?? null;
    const preparedSemanticLayout = preparedField === undefined ? null : {
      height: preparedField.fieldHeight,
      width: preparedField.fieldWidth,
      x: preparedField.fieldX,
      y: preparedField.fieldTop,
    };
    const semanticTargetGeometryCurrent = currentTarget !== undefined
      && areWaflSheetLocalLayoutsEqual(registrySemanticLayout, currentSemanticLayout)
      && areWaflSheetLocalLayoutsEqual(preparedSemanticLayout, registrySemanticLayout);
    const freshness = resolveWaflPreparedGeometryFreshness({
      currentGeometryRevision: targetGeometryRevisionRef.current,
      currentLayoutGeneration: layoutGenerationRef.current.generation,
      currentRegistryRevision: directInputRegistryRevisionRef.current,
      currentSemanticTargetPresent: currentTarget?.sheetLocalLayout !== null && currentTarget?.sheetLocalLayout !== undefined,
      openReady: openReadyRef.current,
      presentationIdentityCurrent: snapshot !== null
        && snapshot.generation === target.openGeneration
        && snapshot.measurementIdentity === target.measurementIdentity,
      requiredMeasurementsComplete: snapshot?.requiredMeasurementsComplete ?? false,
      semanticTargetGeometryCurrent,
      snapshotGeometryRevision: snapshot?.geometryRevision ?? -1,
      snapshotLayoutGeneration: snapshot?.layoutGeneration ?? -1,
      snapshotRegistryRevision: snapshot?.registryRevision ?? -1,
      snapshotSemanticScopeComplete: preparedField?.semanticScopeComplete ?? false,
      snapshotSemanticTargetPresent: preparedField !== undefined,
    });
    return { freshness, preparedField, snapshot } as const;
  }, []);

  const focusDirectInputTarget = useCallback((registrationKey: string) => {
    directInputFieldsRef.current
      .find((item) => item.registrationKey === registrationKey)
      ?.inputRef.focus();
  }, []);

  const dismissDirectInputEditing = useCallback(() => {
    if (keyboardMode !== "directInput") return;
    const focusedKey = directInputLastFocusedKeyRef.current;
    const target = directInputFieldsRef.current.find((item) => item.registrationKey === focusedKey);
    if (target?.inputRef.isFocused()) target.inputRef.blur();
    Keyboard.dismiss();
    focusedTargetRef.current = null;
    directInputLastFocusedKeyRef.current = null;
    directInputRestoringKeyboardRef.current = false;
    directInputRestoreAttemptedRef.current = true;
    registeredInputHandoffRef.current = null;
    setDirectInputFocusedKey(null);
  }, [keyboardMode, setDirectInputFocusedKey]);

  const recordRegisteredInputHandoffEvidence = useCallback((entry: Readonly<Record<string, unknown>>) => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() !== "true") return;
    console.info("[WAFL_REGISTERED_INPUT_HANDOFF_EVIDENCE]", JSON.stringify({
      ...entry,
      rootMotionOwner: rootMotionStateRef.current.owner,
      timestampMs: globalThis.performance.now(),
    }));
  }, []);

  const runDirectInputNavigation = useCallback((action: WaflDirectInputNavigationAction) => {
    const fields = directInputFieldsRef.current;
    const navigation = resolveWaflDirectInputNavigation({
      action,
      fieldKeys: fields.map((item) => item.registrationKey),
      focusedKey: directInputFocusedKey,
    });
    if (navigation.targetKey !== null) {
      focusDirectInputTarget(navigation.targetKey);
      return;
    }
    if (navigation.confirm) directInputConfirmRef.current();
  }, [directInputFocusedKey, focusDirectInputTarget]);

  const resolveDirectInputReturnKeyType = useCallback((registrationKey: string, multiline: boolean) => {
    const fields = directInputFieldsRef.current;
    const target = fields.find((item) => item.registrationKey === registrationKey);
    if (target === undefined) return undefined;
    return resolveWaflDirectInputReturnKeyPolicy({
      completionMode: target.completionMode,
      fieldCount: fields.length,
      fieldIndex: fields.findIndex((item) => item.registrationKey === registrationKey),
      multiline,
      returnKeyPolicy: target.returnKeyPolicy,
    }) ?? undefined;
  }, []);

  const submitDirectInput = useCallback((registrationKey: string) => {
    const fields = directInputFieldsRef.current;
    const fieldIndex = fields.findIndex((item) => item.registrationKey === registrationKey);
    const target = fieldIndex >= 0 ? fields[fieldIndex]! : null;
    if (target?.returnKeyPolicy === "none") return;
    if (target?.completionMode === "search") return;
    if (target?.completionMode === "dismiss") {
      target.inputRef.blur();
      Keyboard.dismiss();
      return;
    }
    const returnKey = resolveWaflDirectInputReturnKey({
      fieldCount: fields.length,
      fieldIndex,
      multiline: fieldIndex >= 0 ? fields[fieldIndex]!.multiline : false,
    });
    if (returnKey === "next" && fieldIndex >= 0) {
      fields[fieldIndex + 1]?.inputRef.focus();
      return;
    }
    directInputConfirmRef.current();
  }, []);

  const directInputController: WaflSheetDirectInputController | null = keyboardMode === "directInput"
    ? {
      accessoryNativeID: directInputAccessoryNativeID,
      registerEditableTarget: registerDirectInputTarget,
      registerFormConfirm: registerDirectInputFormConfirm,
      registryVersion: directInputRegistryVersion,
      resolveReturnKeyType: resolveDirectInputReturnKeyType,
      setFormConfirmDisabled: setDirectInputFormConfirmDisabled,
      submitInput: submitDirectInput,
      unregisterEditableTarget: unregisterDirectInputTarget,
    }
    : null;
  const directInputAccessoryState = resolveWaflDirectInputAccessoryState({
    confirmDisabled: actionPending
      || confirmDisabled
      || directInputFormConfirmDisabled
      || (!onConfirm && !directInputFormConfirmAvailable),
    fieldKeys: directInputFieldKeys,
    focusedKey: directInputFocusedKey,
  });
  const directInputTapPersistence = resolveWaflDirectInputTapPersistence(keyboardMode);
  const directInputMinimalAccessoryFocusedKey = directInputFocusedKey !== null
    && directInputMinimalAccessoryFieldKeys.includes(directInputFocusedKey)
    ? directInputFocusedKey
    : directInputMinimalAccessoryFieldKeys[0] ?? null;
  const directInputMinimalAccessoryAction = directInputMinimalAccessoryFocusedKey === null
    ? null
    : directInputCompletionModes[directInputMinimalAccessoryFocusedKey] === "dismiss"
      ? "done"
      : resolveWaflDirectInputMinimalAccessoryAction({
        fieldKeys: directInputFieldKeys,
        focusedKey: directInputMinimalAccessoryFocusedKey,
      });
  const directInputAccessoryDoneDisabled = directInputMinimalAccessoryFocusedKey === null
    ? true
    : directInputCompletionModes[directInputMinimalAccessoryFocusedKey] === "dismiss"
      ? false
      : directInputAccessoryState.doneDisabled;

  useEffect(() => {
    visibleRef.current = visible;
    pendingRef.current = pending;
  }, [pending, visible]);

  useEffect(() => {
    openReadyRef.current = openReady;
  }, [openReady]);

  useEffect(() => {
    const wasReplacingSheet = replaceSheetActiveRef.current;
    replaceSheetActiveRef.current = replacesSheetDuringProcessing;
    if (
      !wasReplacingSheet
      || replacesSheetDuringProcessing
      || keyboardMode !== "directInput"
      || !visible
      || !rendered
      || dismissingRef.current
      || directInputSessionStateRef.current !== "confirming"
    ) return;
    directInputSessionStateRef.current = "editing";
  }, [keyboardMode, rendered, replacesSheetDuringProcessing, visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const listener = translateY.addListener(({ value }) => { translatedRef.current = value; });
    return () => translateY.removeListener(listener);
  }, [translateY]);

  const applySystemBodyScrollDelta = useCallback((requestedDelta: number, animated: boolean) => {
    const cycle = focusRevealCycleRef.current;
    if (cycle === null) return 0;
    const currentOffset = bodyOffsetRef.current;
    const nextOffset = Math.max(0, currentOffset + (Number.isFinite(requestedDelta) ? requestedDelta : 0));
    const appliedDelta = nextOffset - currentOffset;
    focusRevealCycleRef.current = applyWaflSheetSystemRevealBodyDelta(cycle, appliedDelta);
    if (Math.abs(appliedDelta) < 1) return 0;
    bodyOffsetRef.current = nextOffset;
    bodyScrollRef.current?.scrollTo({ animated, y: nextOffset });
    return appliedDelta;
  }, []);

  const resolveCurrentKeyboardAppearanceIdentity = useCallback((target: ActiveWaflSheetFocusTarget) => {
    const appearanceIdentity = resolveWaflKeyboardAppearanceRevealIdentity({
      appearanceGeneration: keyboardAppearanceGenerationRef.current,
      focusGeneration: target.focusGeneration,
      keyboardClass: target.keyboardClass,
      layoutGeneration: target.layoutGeneration,
      measurementIdentity: target.measurementIdentity,
      openGeneration: target.openGeneration,
    });
    return keyboardAppearanceRootRevealStateRef.current.appearanceIdentity === appearanceIdentity
      ? appearanceIdentity
      : null;
  }, []);

  const claimKeyboardRootReveal = useCallback((input: {
    readonly appearanceIdentity: string;
    readonly frameIdentity?: string | null;
    readonly requestsRoot?: boolean;
    readonly targetOffset: number;
  }) => {
    const existingResolution = keyboardAppearanceRootResolutionRef.current;
    if (
      existingResolution.appearanceIdentity === input.appearanceIdentity
      && existingResolution.resolution !== "unresolved"
    ) return false;
    const requestsRoot = input.requestsRoot ?? input.targetOffset < translatedRef.current - 1;
    const appearanceClaim = resolveWaflKeyboardAppearanceRootRevealClaim({
      appearanceIdentity: input.appearanceIdentity,
      current: keyboardAppearanceRootRevealStateRef.current,
      requestsRoot,
    });
    if (!appearanceClaim.allowRootAuthor) return false;
    if (input.frameIdentity !== null && input.frameIdentity !== undefined) {
      const frameClaim = resolveWaflKeyboardFrameRootRevealClaim({
        current: keyboardFrameRootRevealStateRef.current,
        frameIdentity: input.frameIdentity,
        requestsRoot,
      });
      if (!frameClaim.allowRootAuthor) return false;
      keyboardFrameRootRevealStateRef.current = frameClaim.state;
    }
    keyboardAppearanceRootRevealStateRef.current = appearanceClaim.state;
    keyboardAppearanceRootResolutionRef.current = {
      appearanceIdentity: input.appearanceIdentity,
      resolution: "animation",
    };
    return true;
  }, []);

  const resolveKeyboardRootMotion = useCallback((requestedTargetOffset: number) => (
    resolveWaflKeyboardRootMotionDecision({
      currentMotion: rootMotionStateRef.current,
      requestedTargetOffset,
      translatedCompletionOffset: translatedRef.current,
    })
  ), []);

  const resolveKeyboardRootNoop = useCallback((input: {
    readonly appearanceIdentity: string;
    readonly frame: WaflKeyboardWindowFrame | null;
    readonly frameIdentity?: string | null;
    readonly reason: string;
    readonly target: ActiveWaflSheetFocusTarget;
    readonly targetOffset: number;
  }) => {
    const existingResolution = keyboardAppearanceRootResolutionRef.current;
    if (existingResolution.appearanceIdentity === input.appearanceIdentity) {
      if (existingResolution.resolution === "trueNoop") return true;
      if (existingResolution.resolution === "animation") return false;
    }
    const decision = resolveKeyboardRootMotion(input.targetOffset);
    if (decision.resolution !== "trueNoop") return false;
    const previous = rootMotionStateRef.current;
    if (decision.previousAnimationMustBeSuperseded) {
      animationRef.current?.stop();
      animationRef.current = null;
    }
    rootMotionStateRef.current = {
      active: false,
      generation: previous.generation + 1,
      owner: "systemKeyboard",
      targetOffset: input.targetOffset,
    };
    systemKeyboardTargetOffsetRef.current = input.targetOffset;
    keyboardAppearanceRootResolutionRef.current = {
      appearanceIdentity: input.appearanceIdentity,
      resolution: "trueNoop",
    };
    if (input.frameIdentity !== null && input.frameIdentity !== undefined) {
      keyboardFrameRootRevealStateRef.current = {
        frameIdentity: input.frameIdentity,
        rootAuthorCount: 0,
      };
    }
    recordKeyboardRevealEvidence({
      appearanceGeneration: keyboardAppearanceGenerationRef.current,
      appearanceIdentity: input.appearanceIdentity,
      bodyScrollApplied: 0,
      bodyScrollRequested: 0,
      event: "rootOwnershipResolvedNoop",
      focusGeneration: input.target.focusGeneration,
      frame: input.frame,
      keyboardClass: input.target.keyboardClass,
      keyboardInset: keyboardInsetRef.current,
      layoutGeneration: input.target.layoutGeneration,
      measurementIdentity: input.target.measurementIdentity,
      openGeneration: input.target.openGeneration,
      preparedAvailable: preparedDirectInputGeometryRef.current !== null,
      preparedFresh: resolvePreparedGeometryForTarget(input.target).freshness.current,
      reason: `${input.reason}:${decision.reason}`,
      rootClaim: "not-requested",
      rootMotion: {
        nextOwner: "systemKeyboard",
        nextTarget: input.targetOffset,
        previousActive: previous.active,
        previousAnimationSuperseded: decision.previousAnimationMustBeSuperseded,
        previousOwner: previous.owner,
        previousTarget: previous.targetOffset,
        resolution: "trueNoop",
        translatedCompletionOffset: translatedRef.current,
      },
      rootTarget: input.targetOffset,
    });
    return true;
  }, [recordKeyboardRevealEvidence, resolveKeyboardRootMotion, resolvePreparedGeometryForTarget]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      directInputSessionStateRef.current = "closing";
      pendingPreFocusKeyboardTransitionRef.current = null;
      if (entranceFrameRef.current !== null) cancelAnimationFrame(entranceFrameRef.current);
      if (entranceReadinessFrameRef.current !== null) cancelAnimationFrame(entranceReadinessFrameRef.current);
      if (entranceReadinessSecondFrameRef.current !== null) cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
      if (coordinatedFallbackFrameRef.current !== null) cancelAnimationFrame(coordinatedFallbackFrameRef.current);
      if (coordinatedFallbackSecondFrameRef.current !== null) cancelAnimationFrame(coordinatedFallbackSecondFrameRef.current);
      if (blurTerminationFrameRef.current !== null) cancelAnimationFrame(blurTerminationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const targetIdentity = `${measurementIdentity}:${mediumOffset}`;
    const coordinatedGeometryPending = coordinatedEntrance.eligible && !coordinatedEntrance.prepared;
    if (
      !visible
      || !rendered
      || entranceStartedRef.current
      || !entranceReadiness.ready
    ) {
      entranceReadyTargetRef.current = null;
      if (!entranceStartedRef.current) setEntranceMeasurementReady(false);
      return undefined;
    }
    entranceReadyTargetRef.current = null;
    setEntranceMeasurementReady(false);
    entranceReadinessFrameRef.current = requestAnimationFrame(() => {
      entranceReadinessFrameRef.current = null;
      entranceReadinessSecondFrameRef.current = requestAnimationFrame(() => {
        entranceReadinessSecondFrameRef.current = null;
        if (!mountedRef.current || entranceStartedRef.current) return;
        if (coordinatedGeometryPending) {
          // A lifecycle-bounded ordinary entrance is safer than an invisible sheet
          // when an exceptional host never supplies usable local field geometry.
          entranceReadyTargetRef.current = targetIdentity;
          setEntranceMeasurementReady(true);
          return;
        }
        entranceReadyTargetRef.current = targetIdentity;
        setEntranceMeasurementReady(true);
      });
    });
    return () => {
      if (entranceReadinessFrameRef.current !== null) {
        cancelAnimationFrame(entranceReadinessFrameRef.current);
        entranceReadinessFrameRef.current = null;
      }
      if (entranceReadinessSecondFrameRef.current !== null) {
        cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
        entranceReadinessSecondFrameRef.current = null;
      }
    };
  }, [coordinatedEntrance.eligible, coordinatedEntrance.prepared, entranceReadiness.ready, measurementIdentity, mediumOffset, rendered, visible]);

  useEffect(() => {
    const platform = Platform.OS === "ios" ? "ios" as const : Platform.OS === "android" ? "android" as const : "other" as const;
    const update = (
      event: KeyboardEvent,
      captureTransition: boolean,
      nativeEvent: "willShow" | "willChangeFrame" | "didShow",
    ) => {
      const nextInset = Math.max(0, Math.round(window.height - event.endCoordinates.screenY));
      const keyboardOwnership = waflInputSheetKeyboardOwnerRegistry.resolve(directInputInstanceId);
      if (keyboardMode === "directInput" && !keyboardOwnership.thisSheetOwnsKeyboardEvent) {
        persistDiagnosticEvidence("foreignKeyboardEventSuppressed", {
          foreignKeyboardMutationSuppressed: true,
          keyboardInsetAfter: keyboardInsetRef.current,
          keyboardInsetBefore: keyboardInsetRef.current,
          nativeEvent,
          openGeneration: openGenerationRef.current,
          sheetInstanceId: directInputInstanceId,
          thisSheetOwnsKeyboardEvent: false,
          topmostKeyboardOwnerId: keyboardOwnership.ownerInstanceId,
        });
        return 0;
      }
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "runtimeKeyboardInset",
      );
      lastKeyboardWindowFrameRef.current = {
        height: event.endCoordinates.height,
        width: event.endCoordinates.width,
        x: event.endCoordinates.screenX,
        y: event.endCoordinates.screenY,
      };
      keyboardInsetRef.current = nextInset;
      if (nextInset > 0) setPreparedFocusTransitionActive(false);
      keyboardVisibleRef.current = nextInset > 0;
      if (nextInset > 0) {
        keyboardHidingRef.current = false;
        directInputRestoreAttemptedRef.current = false;
        if (captureTransition) {
          const keyboardTransition = {
            durationMs: Math.max(0, event.duration),
            easing: event.easing,
            startedAt: Date.now(),
          };
          keyboardTransitionRef.current = keyboardTransition;
          if (coordinatedEntrancePhaseRef.current === "prepared" || coordinatedEntrancePhaseRef.current === "ordinaryFallback") {
            coordinatedEntrancePhaseRef.current = "keyboardTransition";
          }
          const focusedTarget = focusedTargetRef.current;
          if (
            focusedTarget === null
            && keyboardMode === "directInput"
            && platform === "ios"
            && visibleRef.current
            && !dismissingRef.current
            && (nativeEvent === "willShow" || nativeEvent === "willChangeFrame")
          ) {
            pendingPreFocusKeyboardTransitionRef.current = {
              frame: {
                height: event.endCoordinates.height,
                width: event.endCoordinates.width,
                x: event.endCoordinates.screenX,
                y: event.endCoordinates.screenY,
              },
              identity: {
                layoutGeneration: layoutGenerationRef.current.generation,
                measurementIdentity,
                openGeneration: openGenerationRef.current,
                sheetInstanceId: directInputInstanceId,
              },
              inset: nextInset,
              nativeEvent,
              transition: keyboardTransition,
            };
            recordKeyboardRevealEvidence({
              appearanceGeneration: keyboardAppearanceGenerationRef.current,
              appearanceIdentity: null,
              bodyScrollApplied: 0,
              bodyScrollRequested: 0,
              event: "pendingPreFocusTransition",
              focusGeneration: 0,
              frame: {
                height: event.endCoordinates.height,
                width: event.endCoordinates.width,
                x: event.endCoordinates.screenX,
                y: event.endCoordinates.screenY,
              },
              keyboardClass: null,
              keyboardInset: nextInset,
              layoutGeneration: layoutGenerationRef.current.generation,
              measurementIdentity,
              openGeneration: openGenerationRef.current,
              preparedAvailable: preparedDirectInputGeometryRef.current !== null,
              preparedFresh: false,
              reason: "NATIVE_WILL_EVENT_AWAITING_FOCUS_OWNER",
              rootClaim: "not-requested",
              rootTarget: null,
            });
          }
          if (focusedTarget !== null) {
            pendingPreFocusKeyboardTransitionRef.current = null;
            const pendingClass = pendingKeyboardClassRef.current;
            if (pendingClass === null || pendingClass === focusedTarget.keyboardClass) {
              keyboardFrameClassRef.current = focusedTarget.keyboardClass;
            }
          }
          const preparedResult = focusedTarget === null ? null : resolvePreparedGeometryForTarget(focusedTarget);
          const preparedGeometry = preparedResult?.snapshot ?? null;
          const preparedFresh = preparedResult?.freshness.current ?? false;
          const keyboardClassCurrent = focusedTarget !== null
            && (pendingKeyboardClassRef.current === null || pendingKeyboardClassRef.current === focusedTarget.keyboardClass);
          const transitionTrust = resolveWaflKeyboardTransitionTrust({
            event: nativeEvent,
            frameHeight: event.endCoordinates.height,
            frameWidth: event.endCoordinates.width,
            frameY: event.endCoordinates.screenY,
            keyboardClassCurrent,
            keyboardInset: nextInset,
            layoutGenerationCurrent: focusedTarget?.layoutGeneration === layoutGenerationRef.current.generation,
            platform,
            preparedGeometryCurrent: preparedFresh,
            windowHeight: window.height,
          });
          recordKeyboardRevealEvidence({
            appearanceGeneration: keyboardAppearanceGenerationRef.current,
            appearanceIdentity: focusedTarget === null ? null : resolveCurrentKeyboardAppearanceIdentity(focusedTarget),
            bodyScrollApplied: 0,
            bodyScrollRequested: 0,
            event: nativeEvent,
            focusGeneration: focusedTarget?.focusGeneration ?? 0,
            frame: {
              height: event.endCoordinates.height,
              width: event.endCoordinates.width,
              x: event.endCoordinates.screenX,
              y: event.endCoordinates.screenY,
            },
            keyboardClass: focusedTarget?.keyboardClass ?? null,
            keyboardInset: nextInset,
            layoutGeneration: layoutGenerationRef.current.generation,
            measurementIdentity: focusedTarget?.measurementIdentity ?? measurementIdentity,
            openGeneration: focusedTarget?.openGeneration ?? openGenerationRef.current,
            preparedAvailable: preparedGeometry !== null,
            preparedFresh,
            reason: preparedResult !== null && !preparedFresh
              ? preparedResult.freshness.reason
              : transitionTrust.reason,
            rootClaim: "not-requested",
            rootTarget: null,
          });
          if (
            keyboardMode === "directInput"
            && focusedTarget !== null
            && preparedFresh
          ) {
            const localGeometry = preparedResult?.preparedField;
            if (localGeometry !== undefined) {
              const plan = resolveWaflPreparedDirectInputKeyboardTarget({
                geometry: localGeometry,
                keyboardInset: nextInset,
                currentRootOffset: resolveWaflCurrentRootPlanningOffset({
                  currentMotion: rootMotionStateRef.current,
                  staticRestingOffset: mediumOffset,
                  systemKeyboardTargetOffset: systemKeyboardTargetOffsetRef.current,
                }),
                liveBodyOffset: bodyOffsetRef.current,
              });
              const targetIdentity = `${focusedTarget.openGeneration}:${focusedTarget.focusGeneration}:${focusedTarget.measurementIdentity}`;
              const frameIdentity = resolveWaflKeyboardFrameRevealIdentity({
                focusGeneration: focusedTarget.focusGeneration,
                frameHeight: event.endCoordinates.height,
                frameWidth: event.endCoordinates.width,
                frameX: event.endCoordinates.screenX,
                frameY: event.endCoordinates.screenY,
                keyboardClass: focusedTarget.keyboardClass,
                keyboardInset: nextInset,
                layoutGeneration: focusedTarget.layoutGeneration,
                measurementIdentity: focusedTarget.measurementIdentity,
                openGeneration: focusedTarget.openGeneration,
              });
              const appearanceIdentity = resolveCurrentKeyboardAppearanceIdentity(focusedTarget);
              const frameChanged = keyboardClassRevealIdentityRef.current !== frameIdentity;
              const coordinatedOpening = coordinatedEntranceGenerationRef.current === focusedTarget.openGeneration
                && coordinatedEntrancePhaseRef.current !== "opened"
                && coordinatedEntrancePhaseRef.current !== "inactive";
              const canScheduleRoot = appearanceIdentity !== null && resolveWaflKeyboardAppearanceRootScheduling({
                event: nativeEvent,
                keyboardVisibleAtAppearanceStart: keyboardAppearanceVisibleAtStartRef.current,
                platform,
                trustworthyNativeTransition: transitionTrust.trustworthy,
              });
              const rootMotionDecision = resolveKeyboardRootMotion(plan.targetOffset);
              const rootRequested = rootMotionDecision.requestsRootAnimation;
              const rootClaimGranted = canScheduleRoot && rootRequested && claimKeyboardRootReveal({
                appearanceIdentity,
                frameIdentity,
                requestsRoot: rootRequested,
                targetOffset: plan.targetOffset,
              });
              const noOpResolved = canScheduleRoot && !rootRequested && appearanceIdentity !== null
                ? resolveKeyboardRootNoop({
                  appearanceIdentity,
                  frame: {
                    height: event.endCoordinates.height,
                    width: event.endCoordinates.width,
                    x: event.endCoordinates.screenX,
                    y: event.endCoordinates.screenY,
                  },
                  frameIdentity,
                  reason: nativeEvent,
                  target: focusedTarget,
                  targetOffset: plan.targetOffset,
                })
                : false;
              const adoptFastPath = canScheduleRoot && (rootClaimGranted || noOpResolved);
              const appliedBodyScroll = adoptFastPath && frameChanged
                ? applySystemBodyScrollDelta(plan.appliedBodyScroll, false)
                : 0;
              if (adoptFastPath && frameChanged) {
                keyboardClassRevealIdentityRef.current = frameIdentity;
                focusRevealCycleRef.current = markWaflSheetFocusRevealCycleActive(focusRevealCycleRef.current);
              }
              recordKeyboardRevealEvidence({
                appearanceGeneration: keyboardAppearanceGenerationRef.current,
                appearanceIdentity,
                bodyScrollApplied: appliedBodyScroll,
                bodyScrollRequested: plan.appliedBodyScroll,
                event: "fastPathDecision",
                focusGeneration: focusedTarget.focusGeneration,
                frame: {
                  height: event.endCoordinates.height,
                  width: event.endCoordinates.width,
                  x: event.endCoordinates.screenX,
                  y: event.endCoordinates.screenY,
                },
                keyboardClass: focusedTarget.keyboardClass,
                keyboardInset: nextInset,
                layoutGeneration: layoutGenerationRef.current.generation,
                measurementIdentity: focusedTarget.measurementIdentity,
                openGeneration: focusedTarget.openGeneration,
                preparedAvailable: preparedGeometry !== null,
                preparedFresh,
                reason: adoptFastPath
                  ? `EARLIEST_TRUSTWORTHY_ROOT_SCHEDULE:${rootMotionDecision.reason}`
                  : preparedResult !== null && !preparedFresh
                    ? preparedResult.freshness.reason
                    : transitionTrust.reason,
                rootClaim: rootRequested ? (rootClaimGranted ? "granted" : "denied") : "not-requested",
                rootTarget: plan.targetOffset,
              });
              if (adoptFastPath) coordinatedFirstTargetIdentityRef.current = targetIdentity;
              if (rootClaimGranted) {
                systemKeyboardTargetOffsetRef.current = plan.targetOffset;
                recordKeyboardRevealEvidence({
                  appearanceGeneration: keyboardAppearanceGenerationRef.current,
                  appearanceIdentity,
                  bodyScrollApplied: appliedBodyScroll,
                  bodyScrollRequested: plan.appliedBodyScroll,
                  event: "rootAnimationScheduled",
                  focusGeneration: focusedTarget.focusGeneration,
                  frame: {
                    height: event.endCoordinates.height,
                    width: event.endCoordinates.width,
                    x: event.endCoordinates.screenX,
                    y: event.endCoordinates.screenY,
                  },
                  keyboardClass: focusedTarget.keyboardClass,
                  keyboardInset: nextInset,
                  layoutGeneration: layoutGenerationRef.current.generation,
                  measurementIdentity: focusedTarget.measurementIdentity,
                  openGeneration: focusedTarget.openGeneration,
                  preparedAvailable: true,
                  preparedFresh: true,
                  reason: nativeEvent,
                  rootClaim: "granted",
                  rootTarget: plan.targetOffset,
                });
                animateToOwnerRef.current(plan.targetOffset, {
                  owner: "systemKeyboard",
                  keyboardTransition,
                  completion: coordinatedOpening
                    ? () => finishVisibleEntranceOwnerRef.current(focusedTarget.openGeneration)
                    : undefined,
                });
                recordKeyboardRevealEvidence({
                  appearanceGeneration: keyboardAppearanceGenerationRef.current,
                  appearanceIdentity,
                  bodyScrollApplied: appliedBodyScroll,
                  bodyScrollRequested: plan.appliedBodyScroll,
                  event: "rootAnimationStarted",
                  focusGeneration: focusedTarget.focusGeneration,
                  frame: {
                    height: event.endCoordinates.height,
                    width: event.endCoordinates.width,
                    x: event.endCoordinates.screenX,
                    y: event.endCoordinates.screenY,
                  },
                  keyboardClass: focusedTarget.keyboardClass,
                  keyboardInset: nextInset,
                  layoutGeneration: layoutGenerationRef.current.generation,
                  measurementIdentity: focusedTarget.measurementIdentity,
                  openGeneration: focusedTarget.openGeneration,
                  preparedAvailable: true,
                  preparedFresh: true,
                  reason: "ANIMATED_START_CALLED_SYNCHRONOUSLY",
                  rootClaim: "granted",
                  rootTarget: plan.targetOffset,
                });
              } else if (coordinatedOpening && noOpResolved) {
                finishVisibleEntranceOwnerRef.current(focusedTarget.openGeneration);
              }
            }
          }
        }
      }
      setKeyboardInset(nextInset);
      return nextInset;
    };
    const hide = (nativeEvent: "willHide" | "didHide") => {
      const keyboardOwnership = waflInputSheetKeyboardOwnerRegistry.resolve(directInputInstanceId);
      if (keyboardMode === "directInput" && !keyboardOwnership.thisSheetOwnsKeyboardEvent) {
        persistDiagnosticEvidence("foreignKeyboardEventSuppressed", {
          foreignKeyboardMutationSuppressed: true,
          keyboardInsetAfter: keyboardInsetRef.current,
          keyboardInsetBefore: keyboardInsetRef.current,
          nativeEvent,
          openGeneration: openGenerationRef.current,
          sheetInstanceId: directInputInstanceId,
          thisSheetOwnsKeyboardEvent: false,
          topmostKeyboardOwnerId: keyboardOwnership.ownerInstanceId,
        });
        return;
      }
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "runtimeKeyboardInset",
      );
      pendingPreFocusKeyboardTransitionRef.current = null;
      const transitioningTarget = focusedTargetRef.current;
      recordKeyboardRevealEvidence({
        appearanceGeneration: keyboardAppearanceGenerationRef.current,
        appearanceIdentity: transitioningTarget === null ? null : resolveCurrentKeyboardAppearanceIdentity(transitioningTarget),
        bodyScrollApplied: 0,
        bodyScrollRequested: 0,
        event: nativeEvent,
        focusGeneration: transitioningTarget?.focusGeneration ?? focusGenerationRef.current,
        frame: null,
        keyboardClass: transitioningTarget?.keyboardClass ?? keyboardFrameClassRef.current,
        keyboardInset: keyboardInsetRef.current,
        layoutGeneration: layoutGenerationRef.current.generation,
        measurementIdentity: transitioningTarget?.measurementIdentity ?? measurementIdentity,
        openGeneration: transitioningTarget?.openGeneration ?? openGenerationRef.current,
        preparedAvailable: preparedDirectInputGeometryRef.current !== null,
        preparedFresh: false,
        reason: "FAST_PATH_HIDE_RESTORE",
        rootClaim: "not-requested",
        rootTarget: mediumOffset,
      });
      const keyboardClassTransitionActive = pendingKeyboardClassRef.current !== null
        && transitioningTarget?.keyboardClass === pendingKeyboardClassRef.current;
      if (keyboardClassTransitionActive) {
        keyboardVisibleRef.current = false;
        keyboardHidingRef.current = true;
        keyboardInsetRef.current = 0;
        keyboardTransitionRef.current = null;
        setKeyboardInset(0);
        return;
      }
      const restoreExpected = shouldRestoreDirectInputKeyboard({
        appActive: appStateRef.current === "active",
        hasEditableTarget: directInputLastFocusedKeyRef.current !== null,
        keyboardMode,
        mounted: mountedRef.current,
        restoreAlreadyAttempted: directInputRestoreAttemptedRef.current,
        sessionState: directInputSessionStateRef.current,
        visible: visibleRef.current,
      });
      if (keyboardVisibleRef.current && !restoreExpected) onKeyboardHide?.();
      keyboardVisibleRef.current = false;
      keyboardHidingRef.current = true;
      keyboardInsetRef.current = 0;
      lastKeyboardWindowFrameRef.current = null;
      keyboardTransitionRef.current = null;
      keyboardFrameClassRef.current = null;
      pendingKeyboardClassRef.current = null;
      keyboardClassRevealIdentityRef.current = null;
      keyboardAppearanceGenerationRef.current += 1;
      keyboardAppearanceVisibleAtStartRef.current = false;
      keyboardAppearanceRootRevealStateRef.current = { appearanceIdentity: null, rootAuthorCount: 0 };
      keyboardAppearanceRootResolutionRef.current = { appearanceIdentity: null, resolution: "unresolved" };
      keyboardFrameRootRevealStateRef.current = { frameIdentity: null, rootAuthorCount: 0 };
      pendingPreFocusKeyboardTransitionRef.current = null;
      didShowReconciliationIdentityRef.current = null;
      pendingDidShowReconciliationRef.current = null;
      if (didShowReconciliationFrameRef.current !== null) {
        cancelAnimationFrame(didShowReconciliationFrameRef.current);
        didShowReconciliationFrameRef.current = null;
      }
      setKeyboardInset(0);
    };
    const willShow = Keyboard.addListener("keyboardWillShow", (event) => update(event, true, "willShow"));
    const change = Keyboard.addListener("keyboardWillChangeFrame", (event) => update(event, true, "willChangeFrame"));
    const didShow = Keyboard.addListener("keyboardDidShow", (event) => {
      const finalInset = update(event, false, "didShow");
      if (keyboardMode !== "directInput" || finalInset <= 0) return;
      const target = focusedTargetRef.current;
      if (target === null) {
        pendingPreFocusKeyboardTransitionRef.current = null;
        return;
      }
      keyboardFrameClassRef.current = target.keyboardClass;
      pendingKeyboardClassRef.current = null;
      const frameIdentity = resolveWaflKeyboardFrameRevealIdentity({
        focusGeneration: target.focusGeneration,
        frameHeight: event.endCoordinates.height,
        frameWidth: event.endCoordinates.width,
        frameX: event.endCoordinates.screenX,
        frameY: event.endCoordinates.screenY,
        keyboardClass: target.keyboardClass,
        keyboardInset: finalInset,
        layoutGeneration: target.layoutGeneration,
        measurementIdentity: target.measurementIdentity,
        openGeneration: target.openGeneration,
      });
      const appearanceIdentity = resolveCurrentKeyboardAppearanceIdentity(target);
      if (appearanceIdentity === null) return;
      const preparedResult = resolvePreparedGeometryForTarget(target);
      const preparedGeometry = preparedResult.snapshot;
      const preparedFresh = preparedResult.freshness.current;
      const rootResolution = keyboardAppearanceRootResolutionRef.current.appearanceIdentity === appearanceIdentity
        ? keyboardAppearanceRootResolutionRef.current.resolution
        : "unresolved";
      recordKeyboardRevealEvidence({
        appearanceGeneration: keyboardAppearanceGenerationRef.current,
        appearanceIdentity,
        bodyScrollApplied: 0,
        bodyScrollRequested: 0,
        event: "didShow",
        focusGeneration: target.focusGeneration,
        frame: {
          height: event.endCoordinates.height,
          width: event.endCoordinates.width,
          x: event.endCoordinates.screenX,
          y: event.endCoordinates.screenY,
        },
        keyboardClass: target.keyboardClass,
        keyboardInset: finalInset,
        layoutGeneration: layoutGenerationRef.current.generation,
        measurementIdentity: target.measurementIdentity,
        openGeneration: target.openGeneration,
        preparedAvailable: preparedGeometry !== null,
        preparedFresh,
        reason: rootResolution === "animation"
          ? "NO_LATE_SECOND_STAGE_AFTER_FAST_PATH"
          : rootResolution === "trueNoop"
            ? "RESOLVED_TRUE_NOOP_NO_LATE_WRITER"
          : preparedFresh
            ? "DID_SHOW_FINAL_FALLBACK"
            : `DID_SHOW_FINAL_FALLBACK:${preparedResult.freshness.reason}`,
        rootClaim: rootResolution === "unresolved" ? "not-requested" : "denied",
        rootTarget: systemKeyboardTargetOffsetRef.current,
      });
      const reconciliationIdentity = `${appearanceIdentity}:didShow`;
      if (didShowReconciliationIdentityRef.current === reconciliationIdentity) return;
      didShowReconciliationIdentityRef.current = reconciliationIdentity;
      if (
        coordinatedEntranceGenerationRef.current === target.openGeneration
        && coordinatedEntrancePhaseRef.current !== "opened"
        && coordinatedEntrancePhaseRef.current !== "inactive"
      ) {
        pendingDidShowReconciliationRef.current = {
          appearanceIdentity,
          frameIdentity,
          identity: reconciliationIdentity,
          inset: finalInset,
          target,
        };
        return;
      }
      if (didShowReconciliationFrameRef.current !== null) {
        cancelAnimationFrame(didShowReconciliationFrameRef.current);
      }
      didShowReconciliationFrameRef.current = requestAnimationFrame(() => {
        didShowReconciliationFrameRef.current = null;
        if (!mountedRef.current || !visibleRef.current || dismissingRef.current || !keyboardVisibleRef.current) return;
        revealFocusedTargetOwnerRef.current(target, {
          finalReconciliation: true,
          keyboardAppearanceIdentity: appearanceIdentity,
          keyboardFrameIdentity: frameIdentity,
          keyboardInsetOverride: finalInset,
        });
      });
    });
    const willHide = Keyboard.addListener("keyboardWillHide", () => hide("willHide"));
    const didHide = Keyboard.addListener("keyboardDidHide", () => hide("didHide"));
    return () => {
      if (didShowReconciliationFrameRef.current !== null) {
        cancelAnimationFrame(didShowReconciliationFrameRef.current);
        didShowReconciliationFrameRef.current = null;
      }
      willShow.remove();
      change.remove();
      didShow.remove();
      willHide.remove();
      didHide.remove();
    };
  }, [applySystemBodyScrollDelta, claimKeyboardRootReveal, directInputInstanceId, keyboardMode, measurementIdentity, mediumOffset, onKeyboardHide, persistDiagnosticEvidence, recordKeyboardRevealEvidence, resolveCurrentKeyboardAppearanceIdentity, resolveKeyboardRootMotion, resolveKeyboardRootNoop, resolvePreparedGeometryForTarget, window.height, window.width]);

  const startAnimation = useCallback((
    animation: Animated.CompositeAnimation,
    generation: number,
    options: {
      readonly completion?: () => void;
      readonly owner: WaflSheetRootMotionOwner;
      readonly targetOffset: number;
    },
  ) => {
    const previous = rootMotionStateRef.current;
    const motionGeneration = previous.generation + 1;
    const previousAnimationSuperseded = previous.active;
    animationRef.current?.stop();
    animationRef.current = animation;
    rootMotionStateRef.current = {
      active: true,
      generation: motionGeneration,
      owner: options.owner,
      targetOffset: options.targetOffset,
    };
    const target = focusedTargetRef.current;
    recordKeyboardRevealEvidence({
      appearanceGeneration: keyboardAppearanceGenerationRef.current,
      appearanceIdentity: target === null ? null : resolveCurrentKeyboardAppearanceIdentity(target),
      bodyScrollApplied: 0,
      bodyScrollRequested: 0,
      event: "rootOwnershipTransition",
      focusGeneration: target?.focusGeneration ?? focusGenerationRef.current,
      frame: lastKeyboardWindowFrameRef.current,
      keyboardClass: target?.keyboardClass ?? keyboardFrameClassRef.current,
      keyboardInset: keyboardInsetRef.current,
      layoutGeneration: layoutGenerationRef.current.generation,
      measurementIdentity: target?.measurementIdentity ?? measurementIdentity,
      openGeneration: target?.openGeneration ?? openGenerationRef.current,
      preparedAvailable: preparedDirectInputGeometryRef.current !== null,
      preparedFresh: target === null ? false : resolvePreparedGeometryForTarget(target).freshness.current,
      reason: `${previous.owner ?? "none"}->${options.owner}`,
      rootClaim: options.owner === "systemKeyboard" ? "granted" : "not-requested",
      rootMotion: {
        nextOwner: options.owner,
        nextTarget: options.targetOffset,
        previousActive: previous.active,
        previousAnimationSuperseded,
        previousOwner: previous.owner,
        previousTarget: previous.targetOffset,
        resolution: options.owner === "systemKeyboard" ? "animation" : "unresolved",
        translatedCompletionOffset: translatedRef.current,
      },
      rootTarget: options.targetOffset,
    });
    animation.start(({ finished }) => {
      if (animationRef.current === animation) animationRef.current = null;
      if (rootMotionStateRef.current.generation === motionGeneration) {
        rootMotionStateRef.current = {
          ...rootMotionStateRef.current,
          active: false,
        };
      }
      if (finished && generation === openGenerationRef.current) options.completion?.();
    });
  }, [measurementIdentity, recordKeyboardRevealEvidence, resolveCurrentKeyboardAppearanceIdentity, resolvePreparedGeometryForTarget]);

  const animateTo = useCallback((offset: number, options: WaflSheetRootAnimationOptions) => {
    if (!canRunWaflSheetSettlingAnimation({
      dismissing: dismissingRef.current,
      keyboardMode,
      sessionState: directInputSessionStateRef.current,
    })) return;
    const boundedOffset = options.owner === "staticRest"
      ? resolveWaflSheetKeyboardRestoreOffset(mediumOffset)
      : resolveWaflSheetSystemKeyboardTarget({
        requestedOffset: offset,
        staticRestingOffset: mediumOffset,
      });
    const generation = openGenerationRef.current;
    const keyboardTransition = options.keyboardTransition ?? null;
    const remainingKeyboardDuration = keyboardTransition
      ? resolveWaflKeyboardTransitionDuration({
        durationMs: keyboardTransition.durationMs,
        elapsedMs: Date.now() - keyboardTransition.startedAt,
      })
      : 0;
    const createAnimation = (value: Animated.Value, useNativeDriver: boolean) => keyboardTransition !== null
      ? Animated.timing(value, {
        duration: remainingKeyboardDuration,
        easing: resolveKeyboardTransitionEasing(keyboardTransition.easing),
        toValue: boundedOffset,
        useNativeDriver,
      })
      : Animated.spring(value, {
        damping: 26,
        mass: 0.8,
        stiffness: 260,
        toValue: boundedOffset,
        useNativeDriver,
      });
    const animation = Animated.parallel([
      createAnimation(translateY, true),
      createAnimation(layoutOffset, false),
    ]);
    startAnimation(animation, generation, {
      completion: () => {
      translatedRef.current = boundedOffset;
      translateY.setValue(boundedOffset);
      layoutOffset.setValue(boundedOffset);
      if (options.owner === "systemKeyboard") systemKeyboardTargetOffsetRef.current = boundedOffset;
      if (options.owner === "systemKeyboard") {
        const target = focusedTargetRef.current;
        recordKeyboardRevealEvidence({
          appearanceGeneration: keyboardAppearanceGenerationRef.current,
          appearanceIdentity: target === null ? null : resolveCurrentKeyboardAppearanceIdentity(target),
          bodyScrollApplied: 0,
          bodyScrollRequested: 0,
          event: "rootAnimationCompleted",
          focusGeneration: target?.focusGeneration ?? focusGenerationRef.current,
          frame: lastKeyboardWindowFrameRef.current,
          keyboardClass: target?.keyboardClass ?? keyboardFrameClassRef.current,
          keyboardInset: keyboardInsetRef.current,
          layoutGeneration: layoutGenerationRef.current.generation,
          measurementIdentity: target?.measurementIdentity ?? measurementIdentity,
          openGeneration: target?.openGeneration ?? openGenerationRef.current,
          preparedAvailable: preparedDirectInputGeometryRef.current !== null,
          preparedFresh: target === null ? false : resolvePreparedGeometryForTarget(target).freshness.current,
          reason: "ACTUAL_ROOT_ANIMATION_COMPLETION",
          rootClaim: "granted",
          rootTarget: boundedOffset,
        });
      }
      options.completion?.();
      },
      owner: options.owner,
      targetOffset: boundedOffset,
    });
  }, [keyboardMode, layoutOffset, measurementIdentity, mediumOffset, recordKeyboardRevealEvidence, resolveCurrentKeyboardAppearanceIdentity, resolvePreparedGeometryForTarget, startAnimation, translateY]);

  const finishVisibleEntrance = useCallback((generation: number) => {
    if (
      !mountedRef.current
      || generation !== openGenerationRef.current
      || dismissingRef.current
    ) return;
    coordinatedEntrancePhaseRef.current = coordinatedEntrance.eligible ? "opened" : "inactive";
    openReadyRef.current = true;
    setOpenReady(true);
    onAfterOpen?.();
    const pendingReconciliation = pendingDidShowReconciliationRef.current;
    pendingDidShowReconciliationRef.current = null;
    if (pendingReconciliation === null) return;
    if (didShowReconciliationFrameRef.current !== null) {
      cancelAnimationFrame(didShowReconciliationFrameRef.current);
    }
    didShowReconciliationFrameRef.current = requestAnimationFrame(() => {
      didShowReconciliationFrameRef.current = null;
      if (
        !mountedRef.current
        || generation !== openGenerationRef.current
        || dismissingRef.current
        || !visibleRef.current
        || !keyboardVisibleRef.current
      ) return;
      revealFocusedTargetOwnerRef.current(pendingReconciliation.target, {
        finalReconciliation: true,
        keyboardAppearanceIdentity: pendingReconciliation.appearanceIdentity,
        keyboardFrameIdentity: pendingReconciliation.frameIdentity,
        keyboardInsetOverride: pendingReconciliation.inset,
      });
    });
  }, [coordinatedEntrance.eligible, onAfterOpen, setOpenReady]);

  useEffect(() => {
    animateToOwnerRef.current = animateTo;
    finishVisibleEntranceOwnerRef.current = finishVisibleEntrance;
  }, [animateTo, finishVisibleEntrance]);

  const runOrdinaryEntrance = useCallback((generation: number) => {
    if (
      !mountedRef.current
      || generation !== openGenerationRef.current
      || dismissingRef.current
    ) return;
    coordinatedEntrancePhaseRef.current = coordinatedEntrance.eligible ? "ordinaryFallback" : "inactive";
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        duration: WAFL_THEME.sheet.entranceDurationMs,
        toValue: mediumOffset,
        useNativeDriver: true,
      }),
      Animated.timing(layoutOffset, {
        duration: WAFL_THEME.sheet.entranceDurationMs,
        toValue: mediumOffset,
        useNativeDriver: false,
      }),
    ]);
    startAnimation(animation, generation, {
      completion: () => {
      translatedRef.current = mediumOffset;
      translateY.setValue(mediumOffset);
      layoutOffset.setValue(mediumOffset);
      finishVisibleEntrance(generation);
      },
      owner: "entrance",
      targetOffset: mediumOffset,
    });
  }, [coordinatedEntrance.eligible, finishVisibleEntrance, layoutOffset, mediumOffset, startAnimation, translateY]);

  const revealFocusedTarget = useCallback((
    target = focusedTargetRef.current,
    options?: WaflRevealOptions,
  ) => {
    if (
      target === null
      || focusedMeasurementIdentityRef.current !== measurementIdentity
      || target.measurementIdentity !== measurementIdentity
      || target.openGeneration !== openGenerationRef.current
    ) return;
    const targetSemanticGap = target.semanticScope
      ? WAFL_THEME.sheet.focusRevealGap
      : effectiveFocusRevealContext;
    const runGeneration = revealRunGenerationRef.current + 1;
    revealRunGenerationRef.current = runGeneration;
    const keyboardAppearanceIdentity = options?.keyboardAppearanceIdentity
      ?? resolveCurrentKeyboardAppearanceIdentity(target);
    const isCurrent = () => mountedRef.current
      && revealRunGenerationRef.current === runGeneration
      && focusedTargetRef.current?.focusGeneration === target.focusGeneration
      && target.layoutGeneration === layoutGenerationRef.current.generation
      && target.measurementIdentity === measurementIdentity
      && target.openGeneration === openGenerationRef.current
      && (
        keyboardAppearanceIdentity === null
        || keyboardAppearanceRootRevealStateRef.current.appearanceIdentity === keyboardAppearanceIdentity
      );
    const canAuthorRootTarget = (targetOffset: number) => {
      if (keyboardMode !== "directInput" || keyboardInsetRef.current <= 0) return true;
      if (options?.allowRootAuthor === false || keyboardAppearanceIdentity === null) return false;
      const rootMotionDecision = resolveKeyboardRootMotion(targetOffset);
      return claimKeyboardRootReveal({
        appearanceIdentity: keyboardAppearanceIdentity,
        frameIdentity: options?.keyboardFrameIdentity,
        requestsRoot: rootMotionDecision.requestsRootAnimation,
        targetOffset,
      });
    };
    const measureMountedTarget = (mountedTarget: WaflMountedMeasureTarget | null) => new Promise<WaflSheetWindowMeasurement | null>((resolve) => {
      if (mountedTarget === null) {
        resolve(null);
        return;
      }
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, WAFL_MEASUREMENT_TIMEOUT_MS);
      const finish = (measurement: WaflSheetWindowMeasurement | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(measurement);
      };
      try {
        mountedTarget.measureInWindow((x, y, width, height) => finish({ x, y, width, height }));
      } catch {
        finish(null);
      }
    });
    const measureHandleTarget = (nativeTarget: number | null) => new Promise<WaflSheetWindowMeasurement | null>((resolve) => {
      if (nativeTarget === null) {
        resolve(null);
        return;
      }
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, WAFL_MEASUREMENT_TIMEOUT_MS);
      const finish = (measurement: WaflSheetWindowMeasurement | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(measurement);
      };
      try {
        UIManager.measureInWindow(nativeTarget, (x, y, width, height) => finish({ x, y, width, height }));
      } catch {
        finish(null);
      }
    });
    const isValidSet = (
      field: WaflSheetWindowMeasurement | null,
      viewport: WaflSheetWindowMeasurement | null,
      sheet: WaflSheetWindowMeasurement | null,
    ) => {
      const preparedOffscreenHeight = coordinatedEntranceGenerationRef.current === openGenerationRef.current
        && coordinatedEntrancePhaseRef.current !== "opened"
        && coordinatedEntrancePhaseRef.current !== "inactive"
        ? expandedHeight
        : 0;
      return isValidWaflSheetWindowMeasurement({ measurement: field, target: "field", windowHeight: window.height, windowWidth: window.width })
        && isValidWaflSheetWindowMeasurement({ measurement: viewport, preparedOffscreenHeight, target: "viewport", windowHeight: window.height, windowWidth: window.width })
        && isValidWaflSheetWindowMeasurement({ measurement: sheet, preparedOffscreenHeight, target: "sheet", windowHeight: window.height, windowWidth: window.width });
    };
    const resolveBodyViewportMeasureRef = (): WaflMountedMeasureTarget | null => (
      bodyScrollRef.current?.getNativeScrollRef() ?? bodyViewportRef.current
    );
    const measureFromRefs = async (): Promise<WaflRevealMeasurementSet | null> => {
      const [field, viewport, sheet, footer] = await Promise.all([
        measureMountedTarget(target.revealRef),
        measureMountedTarget(resolveBodyViewportMeasureRef()),
        measureMountedTarget(sheetRef.current),
        hasActions ? measureMountedTarget(footerRef.current) : Promise.resolve(null),
      ]);
      const validFooter = footer !== null && isValidWaflSheetWindowMeasurement({
        measurement: footer,
        target: "field",
        windowHeight: window.height,
        windowWidth: window.width,
      }) ? footer : null;
      return isValidSet(field, viewport, sheet)
        ? { field: field!, footer: validFooter, owner: "ref", sheet: sheet!, viewport: viewport! }
        : null;
    };
    const measureFromHandles = async (): Promise<WaflRevealMeasurementSet | null> => {
      const viewportTarget = findNodeHandle(bodyScrollRef.current ?? bodyViewportRef.current);
      const sheetTarget = findNodeHandle(sheetRef.current);
      const footerTarget = hasActions ? findNodeHandle(footerRef.current) : null;
      const [field, viewport, sheet, footer] = await Promise.all([
        measureHandleTarget(target.revealTarget),
        measureHandleTarget(viewportTarget),
        measureHandleTarget(sheetTarget),
        measureHandleTarget(footerTarget),
      ]);
      const validFooter = footer !== null && isValidWaflSheetWindowMeasurement({
        measurement: footer,
        target: "field",
        windowHeight: window.height,
        windowWidth: window.width,
      }) ? footer : null;
      return isValidSet(field, viewport, sheet)
        ? { field: field!, footer: validFooter, owner: "fallback", sheet: sheet!, viewport: viewport! }
        : null;
    };
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const resolveMeasurements = async () => {
      const primary = await measureFromRefs();
      if (primary !== null || !isCurrent()) return primary;
      const preparedFreshness = resolvePreparedGeometryForTarget(target).freshness;
      recordKeyboardRevealEvidence({
        appearanceGeneration: keyboardAppearanceGenerationRef.current,
        appearanceIdentity: keyboardAppearanceIdentity,
        bodyScrollApplied: 0,
        bodyScrollRequested: 0,
        event: "measurementRetry",
        focusGeneration: target.focusGeneration,
        frame: null,
        keyboardClass: target.keyboardClass,
        keyboardInset: options?.keyboardInsetOverride ?? keyboardInsetRef.current,
        layoutGeneration: layoutGenerationRef.current.generation,
        measurementIdentity: target.measurementIdentity,
        openGeneration: target.openGeneration,
        preparedAvailable: preparedDirectInputGeometryRef.current !== null,
        preparedFresh: preparedFreshness.current,
        reason: "PRIMARY_MEASURE_INVALID",
        rootClaim: "not-requested",
        rootTarget: null,
      });
      await nextFrame();
      if (!isCurrent()) return null;
      const retry = await measureFromRefs();
      if (retry !== null || !isCurrent()) return retry;
      return measureFromHandles();
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fallbackToInputTarget = () => {
        if (keyboardMode === "directInput") return;
        const inputTarget = target.inputTarget ?? findNodeHandle(target.inputRef);
        if (inputTarget !== null) {
          bodyScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(inputTarget, targetSemanticGap, true);
        }
      };
      const measureAndScrollFieldBlock = async (allowExpansion: boolean) => {
        const measurements = await resolveMeasurements();
        if (!isCurrent()) return;
        const effectiveKeyboardInset = options?.keyboardInsetOverride ?? keyboardInset;
        const currentOffset = translatedRef.current;
        const visibilityFloor = keyboardMode === "directInput" && effectiveKeyboardInset > 0
          ? resolveWaflDirectInputKeyboardVisibilityFloor({
            currentOffset,
            expandedHeight,
            headerHeight,
            keyboardInset: effectiveKeyboardInset,
            maximumOffset: mediumOffset,
            minimumBodyViewportHeight: WAFL_THEME.sheet.initialBodyViewportMinHeight,
            verticalChrome: WAFL_THEME.spacing.sm * 2,
          })
          : null;
        if (measurements === null) {
          const preparedFreshness = resolvePreparedGeometryForTarget(target).freshness;
          recordKeyboardRevealEvidence({
            appearanceGeneration: keyboardAppearanceGenerationRef.current,
            appearanceIdentity: keyboardAppearanceIdentity,
            bodyScrollApplied: 0,
            bodyScrollRequested: 0,
            event: "measurementFallback",
            focusGeneration: target.focusGeneration,
            frame: null,
            keyboardClass: target.keyboardClass,
            keyboardInset: effectiveKeyboardInset,
            layoutGeneration: layoutGenerationRef.current.generation,
            measurementIdentity: target.measurementIdentity,
            openGeneration: target.openGeneration,
            preparedAvailable: preparedDirectInputGeometryRef.current !== null,
            preparedFresh: preparedFreshness.current,
            reason: "FINAL_MEASUREMENT_UNAVAILABLE",
            rootClaim: "not-requested",
            rootTarget: visibilityFloor?.targetOffset ?? null,
          });
          fallbackToInputTarget();
          if (
            visibilityFloor !== null
            && visibilityFloor.targetOffset < currentOffset
            && canAuthorRootTarget(visibilityFloor.targetOffset)
          ) {
            const coordinatedOpening = coordinatedEntranceGenerationRef.current === openGenerationRef.current
              && coordinatedEntrancePhaseRef.current !== "opened"
              && coordinatedEntrancePhaseRef.current !== "inactive";
            systemKeyboardTargetOffsetRef.current = visibilityFloor.targetOffset;
            animateTo(visibilityFloor.targetOffset, {
              owner: "systemKeyboard",
              keyboardTransition: options?.keyboardTransition,
              completion: coordinatedOpening
                ? () => finishVisibleEntrance(openGenerationRef.current)
                : undefined,
            });
          }
          return;
        }
        const { field, footer, sheet, viewport } = measurements;
        const availableForwardScroll = Math.max(
          0,
          intrinsicBodyContentHeightRef.current - viewport.height - bodyOffsetRef.current,
        );
        const reveal = resolveWaflSheetVisualRevealPlan({
          availableForwardScroll,
          bodyOffset: bodyOffsetRef.current,
          expectedVisualSheetTop: window.height - expandedHeight + translatedRef.current,
          fieldHeight: field.height,
          intrinsicBodyContentHeight: intrinsicBodyContentHeightRef.current,
          keyboardInset: effectiveKeyboardInset,
          keyboardTop: effectiveKeyboardInset > 0 ? window.height - effectiveKeyboardInset : window.height,
          measuredFieldTop: field.y,
          measuredSheetTop: sheet.y,
          measuredViewportTop: viewport.y,
          semanticGap: targetSemanticGap,
          staticRestingOffset: mediumOffset,
          translatedOffset: translatedRef.current,
          viewportHeight: viewport.height,
        });
        const allowSheetExpansion = allowExpansion
          && effectiveKeyboardInset > 0
          && (keyboardAutoExpand || keyboardMode === "directInput");
        const coordinatedTargetIdentity = `${target.openGeneration}:${target.focusGeneration}:${target.measurementIdentity}`;
        const preparedResult = resolvePreparedGeometryForTarget(target);
        const preparedGeometry = preparedResult.snapshot;
        const preparedFieldGeometry = preparedResult.preparedField;
        const explicitSemanticPlan = effectiveKeyboardInset > 0
          && preparedResult.freshness.current
          && preparedFieldGeometry?.compactComposition === true
          && preparedFieldGeometry.explicitSemanticRegion
          ? resolveWaflPreparedDirectInputKeyboardTarget({
            geometry: preparedFieldGeometry,
            keyboardInset: effectiveKeyboardInset,
            currentRootOffset: resolveWaflCurrentRootPlanningOffset({
              currentMotion: rootMotionStateRef.current,
              staticRestingOffset: mediumOffset,
              systemKeyboardTargetOffset: systemKeyboardTargetOffsetRef.current,
            }),
            liveBodyOffset: bodyOffsetRef.current,
          })
          : null;
        const rootFirstMeasured = keyboardMode === "directInput"
          && keyboardRevealOrder === "rootFirst"
          && effectiveKeyboardInset > 0
          ? resolveWaflRootFirstMeasuredReveal({
            availableForwardScroll,
            currentOffset,
            fieldBottom: reveal.visualFieldBottom,
            fieldTop: reveal.visualFieldTop,
            keyboardTop: reveal.keyboardTop,
            requiredTargetOffset: Math.min(
              currentOffset,
              visibilityFloor?.targetOffset ?? currentOffset,
              explicitSemanticPlan?.targetOffset ?? currentOffset,
            ),
            semanticGap: targetSemanticGap,
            viewportBottom: reveal.visualViewportBottom,
            viewportTop: reveal.visualViewportTop,
          })
          : null;
        const motion = rootFirstMeasured === null
          ? resolveWaflDirectInputRevealMotion({
            availableForwardScroll,
            allowSheetExpansion,
            bodyOffset: bodyOffsetRef.current,
            keyboardMode,
            requiredRise: reveal.requiredRise,
            scrollDelta: reveal.scrollDelta,
            targetOffset: reveal.targetOffset,
          })
          : {
            scrollDelta: rootFirstMeasured.appliedBodyScroll,
            sheetRise: allowSheetExpansion ? rootFirstMeasured.sheetRise : 0,
            targetOffset: allowSheetExpansion ? rootFirstMeasured.targetOffset : currentOffset,
          };
        const semanticFieldGap = rootFirstMeasured?.semanticFieldGap
          ?? (reveal.currentGap + Math.max(0, motion.scrollDelta));
        const compactCompositionGap = options?.finalReconciliation === true
          && preparedFieldGeometry?.compactComposition === true
          && footer !== null
          ? reveal.keyboardTop - (
            footer.y + reveal.sheetCoordinateCorrection + footer.height + safeBottom
          )
          : null;
        const reconciliation = options?.finalReconciliation === true
          ? resolveWaflDirectInputFinalReconciliation({
            compactCompositionGap,
            coordinatedFirstTarget: coordinatedFirstTargetIdentityRef.current === coordinatedTargetIdentity,
            microSettlingTolerance: WAFL_THEME.spacing.sm,
            minimumVisibleFieldGap: 0,
            rawSheetRise: motion.sheetRise,
            semanticFieldGap,
          })
          : null;
        const reconciliationSheetRise = reconciliation?.sheetRise ?? resolveWaflDirectInputReconciliationSheetRise({
          currentGap: reveal.currentGap + Math.max(0, motion.scrollDelta),
          finalReconciliation: false,
          requiredRise: motion.sheetRise,
          tolerance: WAFL_THEME.spacing.xs,
        });
        if (Math.abs(motion.scrollDelta) >= 1) {
          applySystemBodyScrollDelta(
            motion.scrollDelta,
            keyboardMode !== "directInput" && options?.finalReconciliation !== true,
          );
        }
        const measuredTargetOffset = rootFirstMeasured !== null && allowSheetExpansion
          ? rootFirstMeasured.targetOffset
          : allowSheetExpansion && reconciliationSheetRise > 0
            ? Math.max(0, currentOffset - reconciliationSheetRise)
            : currentOffset;
        const measuredMergedTargetOffset = options?.finalReconciliation === true
          && reconciliation !== null
          && reconciliation.sheetRise === 0
          ? currentOffset
          : visibilityFloor === null
          ? measuredTargetOffset
          : resolveWaflDirectInputMergedKeyboardTarget({
            currentOffset,
            floorTargetOffset: visibilityFloor.targetOffset,
            measuredTargetOffset,
          });
        // A current explicit semantic region is a stricter prepared
        // requirement, not advisory compact-body evidence. Preserve it
        // through the measured/floor merge so the appearance's single root
        // author lands on the correct target instead of requiring a later
        // visible correction.
        const mergedTargetOffset = explicitSemanticPlan === null
          ? measuredMergedTargetOffset
          : resolveWaflDirectInputMergedKeyboardTarget({
            currentOffset,
            floorTargetOffset: measuredMergedTargetOffset,
            measuredTargetOffset: explicitSemanticPlan.targetOffset,
          });
        const coordinatedOpening = coordinatedEntranceGenerationRef.current === openGenerationRef.current
          && coordinatedEntrancePhaseRef.current !== "opened"
          && coordinatedEntrancePhaseRef.current !== "inactive";
        const rootTargetRequested = allowSheetExpansion && mergedTargetOffset < currentOffset;
        const rootAuthorAllowed = rootTargetRequested && canAuthorRootTarget(mergedTargetOffset);
        if (options?.finalReconciliation === true && reconciliation !== null) {
          didShowReconciliationEvidenceRef.current = {
            animationOwner: rootAuthorAllowed ? "sheet-spring" : "none",
            bodyCorrection: motion.scrollDelta,
            classification: reconciliation.classification,
            compactCompositionGap,
            fieldBottom: reveal.visualFieldBottom - Math.max(0, motion.scrollDelta),
            firstAnimationCompletionOffset: currentOffset,
            firstTargetMiss: reconciliation.firstTargetMiss,
            firstTargetOffset: systemKeyboardTargetOffsetRef.current,
            keyboardTop: reveal.keyboardTop,
            measurementOwner: measurements.owner,
            rawLayoutDelta: motion.sheetRise,
            semanticFieldGap,
            semanticGap: targetSemanticGap,
            sheetCorrection: rootAuthorAllowed ? reconciliationSheetRise : 0,
          };
          recordKeyboardRevealEvidence({
            appearanceGeneration: keyboardAppearanceGenerationRef.current,
            appearanceIdentity: keyboardAppearanceIdentity,
            bodyScrollApplied: motion.scrollDelta,
            bodyScrollRequested: motion.scrollDelta,
            event: "finalVisibilityReconciliation",
            focusGeneration: target.focusGeneration,
            frame: null,
            keyboardClass: target.keyboardClass,
            keyboardInset: effectiveKeyboardInset,
            layoutGeneration: layoutGenerationRef.current.generation,
            measurementIdentity: target.measurementIdentity,
            openGeneration: target.openGeneration,
            preparedAvailable: preparedGeometry !== null,
            preparedFresh: preparedResult.freshness.current,
            reason: reconciliation.classification,
            rootClaim: rootTargetRequested ? (rootAuthorAllowed ? "granted" : "denied") : "not-requested",
            rootTarget: mergedTargetOffset,
          });
        }
        if (rootAuthorAllowed) {
          if (keyboardMode === "directInput") systemKeyboardTargetOffsetRef.current = mergedTargetOffset;
          animateTo(mergedTargetOffset, {
            owner: "systemKeyboard",
            keyboardTransition: options?.keyboardTransition,
            completion: coordinatedOpening
              ? () => finishVisibleEntrance(openGenerationRef.current)
              : keyboardMode === "directInput"
                ? undefined
              : () => requestAnimationFrame(() => requestAnimationFrame(() => { void measureAndScrollFieldBlock(false); })),
          });
        } else if (coordinatedOpening) {
          finishVisibleEntrance(openGenerationRef.current);
        }
      };
      void measureAndScrollFieldBlock(true);
    }));
  }, [animateTo, applySystemBodyScrollDelta, claimKeyboardRootReveal, effectiveFocusRevealContext, expandedHeight, finishVisibleEntrance, hasActions, headerHeight, keyboardAutoExpand, keyboardInset, keyboardMode, keyboardRevealOrder, measurementIdentity, mediumOffset, recordKeyboardRevealEvidence, resolveCurrentKeyboardAppearanceIdentity, resolveKeyboardRootMotion, resolvePreparedGeometryForTarget, safeBottom, window.height, window.width]);

  useEffect(() => {
    revealFocusedTargetOwnerRef.current = revealFocusedTarget;
  }, [revealFocusedTarget]);

  useEffect(() => {
    if (!preparedModeFocusTransaction.pending) return;
    if (!preparedModeFocusTransaction.ready || onPreparedForAutoFocus === undefined) return;
    if (dismissingRef.current) return;
    const snapshot = capturePreparedDirectInputGeometry(openGenerationRef.current);
    if (snapshot === null || !snapshot.requiredMeasurementsComplete) return;
    setPreparedFocusTransitionActive(true);
    setHandledPreparedFocusRequestGeneration(preparedModeFocusTransaction.requestGeneration);
    if (__DEV__ && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
      console.info("[WAFL_PREPARED_MODE_FOCUS_EVIDENCE]", JSON.stringify({
        event: "prepared-mode-focus-request",
        measurementIdentity,
        preparedFocusRequestGeneration: preparedModeFocusTransaction.requestGeneration,
        preparedGeometryRevision: snapshot.geometryRevision,
        preparedRegistryRevision: snapshot.registryRevision,
        timestampMs: globalThis.performance.now(),
      }));
    }
    onPreparedForAutoFocus();
  }, [capturePreparedDirectInputGeometry, measurementIdentity, onPreparedForAutoFocus, preparedModeFocusTransaction.pending, preparedModeFocusTransaction.ready, preparedModeFocusTransaction.requestGeneration]);

  useEffect(() => {
    if (
      !adaptiveSizing
      || !visible
      || !rendered
      || !openReady
      || !entranceStartedRef.current
      || dismissingRef.current
      || preparedModeFocusTransaction.suppressStaticRest
      || (onPreparedForAutoFocus !== undefined && preparedFocusTransitionActive)
      || (keyboardMode === "directInput" && keyboardInset > 0)
    ) return;
    const currentOffset = translatedRef.current;
    if (Math.abs(currentOffset - mediumOffset) < 1) return;
    animateTo(mediumOffset, { owner: "staticRest" });
  }, [adaptiveBodyHeight, adaptiveSizing, animateTo, keyboardInset, keyboardMode, mediumOffset, onPreparedForAutoFocus, openReady, preparedFocusTransitionActive, preparedModeFocusTransaction.suppressStaticRest, rendered, visible]);

  useEffect(() => {
    const previousInset = previousKeyboardInsetRef.current;
    previousKeyboardInsetRef.current = keyboardInset;
    if (keyboardInset > 0 && previousInset <= 0) {
      const restoringKeyboard = directInputRestoringKeyboardRef.current;
      if (directInputRestoringKeyboardRef.current) {
        directInputRestoringKeyboardRef.current = false;
      }
      if (keyboardMode === "directInput") {
        const focusedTarget = focusedTargetRef.current;
        const focusedIdentity = focusedTarget === null
          ? null
          : `${focusedTarget.openGeneration}:${focusedTarget.focusGeneration}:${focusedTarget.measurementIdentity}`;
        if (focusedIdentity !== null && coordinatedFirstTargetIdentityRef.current === focusedIdentity) return;
        systemKeyboardTargetOffsetRef.current = translatedRef.current;
        revealFocusedTarget(undefined, {
          allowRootAuthor: resolveWaflKeyboardAppearanceRootScheduling({
            event: "stateEffect",
            keyboardVisibleAtAppearanceStart: keyboardAppearanceVisibleAtStartRef.current,
            platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "other",
          }),
          keyboardAppearanceIdentity: focusedTarget === null
            ? null
            : resolveCurrentKeyboardAppearanceIdentity(focusedTarget),
          keyboardTransition: restoringKeyboard ? null : keyboardTransitionRef.current,
        });
      } else {
        revealFocusedTarget();
      }
      return;
    }
    if (keyboardInset > 0) return;
    if (previousInset > 0) {
      if (
        pendingKeyboardClassRef.current !== null
        && focusedTargetRef.current?.keyboardClass === pendingKeyboardClassRef.current
      ) return;
      if (shouldSuppressWaflSheetKeyboardHideGeometry({
        dismissing: dismissingRef.current,
        keyboardMode,
        sessionState: directInputSessionStateRef.current,
        visible: visibleRef.current,
      })) return;
      const shouldRestoreKeyboard = shouldRestoreDirectInputKeyboard({
        appActive: appStateRef.current === "active",
        hasEditableTarget: directInputLastFocusedKeyRef.current !== null,
        keyboardMode,
        mounted: mountedRef.current,
        restoreAlreadyAttempted: directInputRestoreAttemptedRef.current,
        sessionState: directInputSessionStateRef.current,
        visible: visibleRef.current,
      });
      if (shouldRestoreKeyboard) {
        directInputRestoreAttemptedRef.current = true;
        directInputRestoringKeyboardRef.current = true;
        const targetKey = directInputLastFocusedKeyRef.current;
        requestAnimationFrame(() => {
          if (!mountedRef.current || targetKey === null) return;
          if (directInputSessionStateRef.current !== "editing" || !visibleRef.current || appStateRef.current !== "active") return;
          focusDirectInputTarget(targetKey);
        });
        return;
      }
      const cycleRestore = resolveWaflSheetFocusRevealRestore({
        cycle: focusRevealCycleRef.current,
      });
      if (cycleRestore.bodyOffset !== null && Math.abs(bodyOffsetRef.current - cycleRestore.bodyOffset) >= 1) {
        bodyOffsetRef.current = cycleRestore.bodyOffset;
        bodyScrollRef.current?.scrollTo({ animated: false, y: cycleRestore.bodyOffset });
      }
      const restoreOffset = resolveWaflSheetKeyboardRestoreOffset(mediumOffset);
      animateTo(restoreOffset, { owner: "staticRest" });
      focusedTargetRef.current = null;
      setDirectInputFocusedKey(null);
      systemKeyboardTargetOffsetRef.current = null;
      focusRevealCycleRef.current = null;
      bodyScrollUserOwnedRef.current = false;
    }
  }, [animateTo, focusDirectInputTarget, keyboardInset, keyboardMode, mediumOffset, resolveCurrentKeyboardAppearanceIdentity, revealFocusedTarget]);

  const animateDown = useCallback((completion: () => void) => {
    const generation = openGenerationRef.current;
    const openingOffset = resolveWaflSheetOpeningOffset(expandedHeight);
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        duration: WAFL_THEME.sheet.exitDurationMs,
        toValue: openingOffset,
        useNativeDriver: true,
      }),
      Animated.timing(layoutOffset, {
        duration: WAFL_THEME.sheet.exitDurationMs,
        toValue: openingOffset,
        useNativeDriver: false,
      }),
    ]);
    startAnimation(animation, generation, {
      completion: () => {
        translatedRef.current = openingOffset;
        completion();
      },
      owner: "exit",
      targetOffset: openingOffset,
    });
  }, [expandedHeight, layoutOffset, startAnimation, translateY]);

  const prepareSheetClose = useCallback((sessionState: "cancelling" | "closing", closeKeyboard: boolean) => {
    directInputSessionStateRef.current = sessionState;
    directInputRestoringKeyboardRef.current = false;
    directInputRestoreAttemptedRef.current = true;
    if (closeKeyboard) {
      directInputFieldsRef.current.find((item) => item.registrationKey === directInputLastFocusedKeyRef.current)?.inputRef.blur();
      Keyboard.dismiss();
    }
    openGenerationRef.current += 1;
    revealRunGenerationRef.current += 1;
    if (entranceFrameRef.current !== null) {
      cancelAnimationFrame(entranceFrameRef.current);
      entranceFrameRef.current = null;
    }
    if (entranceReadinessFrameRef.current !== null) {
      cancelAnimationFrame(entranceReadinessFrameRef.current);
      entranceReadinessFrameRef.current = null;
    }
    if (entranceReadinessSecondFrameRef.current !== null) {
      cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
      entranceReadinessSecondFrameRef.current = null;
    }
    if (coordinatedFallbackFrameRef.current !== null) {
      cancelAnimationFrame(coordinatedFallbackFrameRef.current);
      coordinatedFallbackFrameRef.current = null;
    }
    if (coordinatedFallbackSecondFrameRef.current !== null) {
      cancelAnimationFrame(coordinatedFallbackSecondFrameRef.current);
      coordinatedFallbackSecondFrameRef.current = null;
    }
    coordinatedEntrancePhaseRef.current = "inactive";
    coordinatedEntranceGenerationRef.current = 0;
    coordinatedFirstTargetIdentityRef.current = null;
    preparedDirectInputGeometryRef.current = null;
    focusRevealCycleRef.current = null;
    keyboardFrameClassRef.current = null;
    pendingKeyboardClassRef.current = null;
    keyboardClassRevealIdentityRef.current = null;
    keyboardAppearanceGenerationRef.current += 1;
    keyboardAppearanceVisibleAtStartRef.current = false;
    keyboardAppearanceRootRevealStateRef.current = { appearanceIdentity: null, rootAuthorCount: 0 };
    keyboardAppearanceRootResolutionRef.current = { appearanceIdentity: null, resolution: "unresolved" };
    keyboardFrameRootRevealStateRef.current = { frameIdentity: null, rootAuthorCount: 0 };
    pendingPreFocusKeyboardTransitionRef.current = null;
    keyboardHidingRef.current = false;
    if (blurTerminationFrameRef.current !== null) {
      cancelAnimationFrame(blurTerminationFrameRef.current);
      blurTerminationFrameRef.current = null;
    }
    bodyScrollUserOwnedRef.current = false;
    pendingDidShowReconciliationRef.current = null;
    if (didShowReconciliationFrameRef.current !== null) {
      cancelAnimationFrame(didShowReconciliationFrameRef.current);
      didShowReconciliationFrameRef.current = null;
    }
  }, []);

  const beginSheetClose = useCallback((reason: "programmatic" | "userCancel") => {
    const plan = resolveWaflSheetClosePlan({
      actionPending,
      alreadyClosing: dismissingRef.current,
      keyboardMode,
      reason,
    });
    if (!plan.accepted) return false;
    dismissingRef.current = true;
    directInputSessionStateRef.current = plan.sessionState;
    const closeOperation: WaflSheetCloseOperation = {
      finalized: false,
      id: closeOperationSequenceRef.current + 1,
    };
    closeOperationSequenceRef.current = closeOperation.id;
    closeOperationRef.current = closeOperation;
    prepareSheetClose(plan.sessionState, plan.blurAndDismissKeyboard);
    animateDown(() => {
      if (
        !mountedRef.current
        || closeOperationRef.current?.id !== closeOperation.id
        || closeOperation.finalized
      ) return;
      closeOperation.finalized = true;
      setRendered(false);
      directInputSessionStateRef.current = "closing";
      directInputLastFocusedKeyRef.current = null;
      setDirectInputFocusedKey(null);
      openReadyRef.current = false;
      setOpenReady(false);
      setEntranceMeasurementReady(false);
      entranceReadyTargetRef.current = null;
      if (plan.invokeCancel) onCancel();
      dismissingRef.current = false;
      closeOperationRef.current = null;
      entranceStartedRef.current = false;
      requestAnimationFrame(() => {
        if (mountedRef.current) onAfterClose?.();
      });
    });
    return true;
  }, [actionPending, animateDown, keyboardMode, onAfterClose, onCancel, prepareSheetClose, setDirectInputFocusedKey, setEntranceMeasurementReady, setOpenReady, setRendered]);

  const cancel = useCallback(() => {
    if (decision && !actionPending) {
      setDecisionSelected(resolveWaflDecisionOpeningValue());
      decision.onCancel();
      return;
    }
    beginSheetClose("userCancel");
  }, [actionPending, beginSheetClose, decision, setDecisionSelected]);

  useEffect(() => {
    if (decision) {
      decisionVisibleRef.current = true;
      if (keyboardMode !== "directInput") return;
      directInputSessionStateRef.current = "cancelling";
      directInputRestoringKeyboardRef.current = false;
      directInputRestoreAttemptedRef.current = true;
      directInputFieldsRef.current.find((item) => item.registrationKey === directInputLastFocusedKeyRef.current)?.inputRef.blur();
      Keyboard.dismiss();
      return;
    }
    if (!decisionVisibleRef.current) return;
    decisionVisibleRef.current = false;
    if (keyboardMode !== "directInput" || !visibleRef.current || dismissingRef.current) return;
    directInputSessionStateRef.current = "editing";
  }, [decision, keyboardMode]);

  useEffect(() => {
    if (visible) {
      if (keyboardMode === "directInput" && directInputSessionStateRef.current === "closing") {
        directInputSessionStateRef.current = "editing";
        directInputRestoreAttemptedRef.current = false;
      }
      if (!rendered) {
        const frame = requestAnimationFrame(() => {
          if (!mountedRef.current) return;
          entranceReadyTargetRef.current = null;
          setEntranceMeasurementReady(false);
          headerMeasurementCompleteRef.current = false;
          footerMeasurementCompleteRef.current = false;
          bodyMeasurementCompleteRef.current = false;
          setHeaderMeasured(false);
          setFooterMeasured(false);
          setOpenSessionGeneration((current) => current + 1);
          setRendered(true);
        });
        return () => cancelAnimationFrame(frame);
      }
      if (!entranceMeasurementReady || entranceReadyTargetRef.current !== `${measurementIdentity}:${mediumOffset}`) return;
      if (entranceStartedRef.current) return;
      const generation = openGenerationRef.current + 1;
      openGenerationRef.current = generation;
      if (diagnosticSurfaceId && isWaflInputSheetGeometryEvidenceEnabled()) {
        diagnosticCaptureIdRef.current = `${diagnosticSurfaceId}:${directInputInstanceId}:${generation}`;
        diagnosticSequenceRef.current = 0;
        persistDiagnosticEvidence("sheetOpenSession", {
          expandedHeight,
          measurementIdentity,
          staticRestingOffset: mediumOffset,
          window: { height: window.height, width: window.width },
        });
        scheduleActualDeviceGeometryObservation("sheetOpenSession", null);
      }
      animationRef.current?.stop();
      animationRef.current = null;
      if (entranceFrameRef.current !== null) cancelAnimationFrame(entranceFrameRef.current);
      entranceFrameRef.current = null;
      if (entranceReadinessFrameRef.current !== null) cancelAnimationFrame(entranceReadinessFrameRef.current);
      entranceReadinessFrameRef.current = null;
      if (entranceReadinessSecondFrameRef.current !== null) cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
      entranceReadinessSecondFrameRef.current = null;
      if (coordinatedFallbackFrameRef.current !== null) cancelAnimationFrame(coordinatedFallbackFrameRef.current);
      coordinatedFallbackFrameRef.current = null;
      if (coordinatedFallbackSecondFrameRef.current !== null) cancelAnimationFrame(coordinatedFallbackSecondFrameRef.current);
      coordinatedFallbackSecondFrameRef.current = null;
      if (didShowReconciliationFrameRef.current !== null) cancelAnimationFrame(didShowReconciliationFrameRef.current);
      didShowReconciliationFrameRef.current = null;
      didShowReconciliationEvidenceRef.current = null;
      translateY.stopAnimation();
      layoutOffset.stopAnimation();
      openReadyRef.current = false;
      setOpenReady(false);
      entranceStartedRef.current = true;
      dismissingRef.current = false;
      coordinatedEntrancePhaseRef.current = "inactive";
      coordinatedEntranceGenerationRef.current = 0;
      coordinatedFirstTargetIdentityRef.current = null;
      preparedDirectInputGeometryRef.current = null;
      pendingDidShowReconciliationRef.current = null;
      keyboardFrameClassRef.current = null;
      pendingKeyboardClassRef.current = null;
      keyboardClassRevealIdentityRef.current = null;
      keyboardAppearanceGenerationRef.current += 1;
      keyboardAppearanceVisibleAtStartRef.current = false;
      keyboardAppearanceRootRevealStateRef.current = { appearanceIdentity: null, rootAuthorCount: 0 };
      keyboardAppearanceRootResolutionRef.current = { appearanceIdentity: null, resolution: "unresolved" };
      keyboardFrameRootRevealStateRef.current = { frameIdentity: null, rootAuthorCount: 0 };
      pendingPreFocusKeyboardTransitionRef.current = null;
      keyboardHidingRef.current = false;
      if (blurTerminationFrameRef.current !== null) {
        cancelAnimationFrame(blurTerminationFrameRef.current);
        blurTerminationFrameRef.current = null;
      }
      systemKeyboardTargetOffsetRef.current = null;
      bodyOffsetRef.current = 0;
      focusRevealCycleRef.current = null;
      bodyScrollUserOwnedRef.current = false;
      const openingOffset = resolveWaflSheetOpeningOffset(expandedHeight);
      rootMotionStateRef.current = {
        active: false,
        generation: rootMotionStateRef.current.generation + 1,
        owner: "entrance",
        targetOffset: openingOffset,
      };
      translatedRef.current = openingOffset;
      translateY.setValue(openingOffset);
      layoutOffset.setValue(openingOffset);
      entranceFrameRef.current = requestAnimationFrame(() => {
        entranceFrameRef.current = null;
        if (!mountedRef.current || generation !== openGenerationRef.current || dismissingRef.current) return;
        capturePreparedDirectInputGeometry(generation);
        if (!coordinatedEntrance.prepared) {
          runOrdinaryEntrance(generation);
          return;
        }
        coordinatedEntranceGenerationRef.current = generation;
        coordinatedEntrancePhaseRef.current = "prepared";
        layoutOffset.setValue(mediumOffset);
        onPreparedForAutoFocus?.();
        coordinatedFallbackFrameRef.current = requestAnimationFrame(() => {
          coordinatedFallbackFrameRef.current = null;
          coordinatedFallbackSecondFrameRef.current = requestAnimationFrame(() => {
            coordinatedFallbackSecondFrameRef.current = null;
            if (
              !mountedRef.current
              || generation !== openGenerationRef.current
              || dismissingRef.current
              || coordinatedEntrancePhaseRef.current === "opened"
              || coordinatedEntrancePhaseRef.current === "keyboardTransition"
              || keyboardInsetRef.current > 0
            ) return;
            runOrdinaryEntrance(generation);
          });
        });
      });
      return;
    }
    if (!rendered || dismissingRef.current) return;
    beginSheetClose("programmatic");
  }, [beginSheetClose, capturePreparedDirectInputGeometry, coordinatedEntrance.prepared, diagnosticSurfaceId, directInputInstanceId, entranceMeasurementReady, expandedHeight, keyboardMode, layoutOffset, measurementIdentity, mediumOffset, onPreparedForAutoFocus, persistDiagnosticEvidence, rendered, runOrdinaryEntrance, scheduleActualDeviceGeometryObservation, translateY, visible, window.height, window.width]);

  useEffect(() => {
    const recapture = resolveWaflPreparedGeometryRecaptureDecision({
      currentGeometryRevision: targetGeometryRevisionRef.current,
      currentRegistryRevision: directInputRegistryRevisionRef.current,
      dismissing: dismissingRef.current,
      keyboardMode,
      openGeneration: openGenerationRef.current,
      openReady,
      rendered,
      snapshot: preparedDirectInputGeometryRef.current,
      visible,
    });
    if (!recapture.capture) return;
    capturePreparedDirectInputGeometry(
      openGenerationRef.current,
      keyboardInsetRef.current > 0 ? "keyboard-visible-structural-refresh" : "structural-refresh",
    );
  }, [capturePreparedDirectInputGeometry, directInputPreparedGeometryCount, directInputRegistryVersion, keyboardMode, openReady, rendered, visible]);

  const publishBodyScrollMetrics = useCallback((offsetY = bodyOffsetRef.current) => {
    if (!onBodyScrollMetrics) return;
    const contentHeight = bodyContentHeightRef.current;
    const viewportHeight = bodyViewportHeightRef.current;
    onBodyScrollMetrics({
      canScrollFurther: contentHeight > viewportHeight + 1
        && offsetY + viewportHeight < contentHeight - WAFL_THEME.spacing.lg,
      contentHeight,
      offsetY,
      viewportHeight,
    });
  }, [onBodyScrollMetrics]);

  function onBodyScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
      targetGeometryRevisionRef.current,
      "runtimeScrollMetrics",
    );
    bodyOffsetRef.current = event.nativeEvent.contentOffset.y;
    if (bodyScrollUserOwnedRef.current && focusRevealCycleRef.current !== null) {
      focusRevealCycleRef.current = observeWaflSheetUserBodyOffset(
        focusRevealCycleRef.current,
        bodyOffsetRef.current,
      );
    }
    bodyContentHeightRef.current = event.nativeEvent.contentSize.height;
    bodyViewportHeightRef.current = event.nativeEvent.layoutMeasurement.height;
    publishBodyScrollMetrics(bodyOffsetRef.current);
  }

  const measureHeader = useCallback((height: number) => {
    if (!headerMeasurementCompleteRef.current || Math.abs(headerMeasuredHeightRef.current - height) >= 1) {
      headerMeasuredHeightRef.current = height;
      headerMeasurementCompleteRef.current = true;
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "headerMeasurement",
      );
    }
    setHeaderMeasured(true);
    setHeaderHeight((current) => Math.abs(current - height) >= 1 ? height : current);
  }, [setHeaderHeight, setHeaderMeasured]);
  const measureBody = useCallback((height: number) => {
    if (!bodyMeasurementCompleteRef.current || Math.abs(bodyMeasuredHeightRef.current - height) >= 1) {
      bodyMeasuredHeightRef.current = height;
      bodyMeasurementCompleteRef.current = true;
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "intrinsicBodyMeasurement",
      );
    }
    intrinsicBodyContentHeightRef.current = height;
    setBodyMeasurement((current) => current.identity !== measurementIdentity || !current.measured || Math.abs(current.height - height) >= 1
      ? { identity: measurementIdentity, height, measured: true }
      : current);
    if (
      coordinatedFirstTargetIdentityRef.current !== null
      && coordinatedEntranceGenerationRef.current === openGenerationRef.current
      && coordinatedEntrancePhaseRef.current === "keyboardTransition"
    ) return;
    if (keyboardMode === "directInput" && keyboardInsetRef.current > 0) return;
    revealFocusedTarget();
  }, [keyboardMode, measurementIdentity, revealFocusedTarget, setBodyMeasurement]);
  const publishBodyContentCoordinateLayout = useCallback((layout: LayoutRectangle) => {
    const current = bodyContentCoordinateLayoutRef.current;
    const changed = current === null
      || current.x !== layout.x
      || current.y !== layout.y
      || current.width !== layout.width
      || current.height !== layout.height;
    if (!changed) return;
    bodyContentCoordinateLayoutRef.current = layout;
    bodyContentCoordinateRevisionRef.current += 1;
    targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
      targetGeometryRevisionRef.current,
      "bodyCoordinate",
    );
    for (const listener of bodyContentCoordinateListenersRef.current) listener();
  }, []);
  const measureFooter = useCallback((height: number) => {
    if (!footerMeasurementCompleteRef.current || Math.abs(footerMeasuredHeightRef.current - height) >= 1) {
      footerMeasuredHeightRef.current = height;
      footerMeasurementCompleteRef.current = true;
      targetGeometryRevisionRef.current = resolveWaflPreparedGeometryRevision(
        targetGeometryRevisionRef.current,
        "footerMeasurement",
      );
    }
    setFooterMeasured(true);
    setFooterHeight((current) => Math.abs(current - height) >= 1 ? height : current);
  }, [setFooterHeight, setFooterMeasured]);

  async function confirm() {
    const registeredOwner = directInputFormConfirmRef.current;
    const canonicalConfirm = decision
      ? (decisionSelected === "action" ? decision.onConfirm : decision.onCancel)
      : registeredOwner ?? onConfirm;
    const disabled = actionPending || (!decision && (confirmDisabled || directInputFormConfirmDisabled));
    if (disabled || !canonicalConfirm) {
      if (keyboardMode === "directInput") directInputSessionStateRef.current = "editing";
      return;
    }
    if (decision) setDecisionSelected(resolveWaflDecisionOpeningValue());
    if (keyboardMode === "directInput") {
      directInputSessionStateRef.current = "confirming";
      directInputRestoringKeyboardRef.current = false;
      directInputRestoreAttemptedRef.current = true;
      directInputFieldsRef.current.find((item) => item.registrationKey === directInputLastFocusedKeyRef.current)?.inputRef.blur();
      Keyboard.dismiss();
    }
    try {
      const submitted = await guardRef.current.submit(async () => {
        if (mountedRef.current) setSubmitting(true);
        try {
          return await canonicalConfirm();
        } finally {
          if (mountedRef.current) setSubmitting(false);
        }
      });
      if (!submitted.accepted && mountedRef.current) setSubmitting(guardRef.current.isActive());
    } finally {
      if (keyboardMode === "directInput") {
        if (mountedRef.current && visibleRef.current && !dismissingRef.current) {
          directInputSessionStateRef.current = "editing";
        }
      }
    }
  }
  useEffect(() => {
    directInputConfirmRef.current = () => { void confirm(); };
  });

  const handleBodyFocus = useCallback((target: WaflSheetFocusTarget) => {
    if (blurTerminationFrameRef.current !== null) {
      cancelAnimationFrame(blurTerminationFrameRef.current);
      blurTerminationFrameRef.current = null;
    }
    if (keyboardMode === "directInput" && target.semanticScope && target.sheetLocalLayout === null) {
      recordKeyboardRevealEvidence({
        appearanceGeneration: keyboardAppearanceGenerationRef.current,
        appearanceIdentity: null,
        bodyScrollApplied: 0,
        bodyScrollRequested: 0,
        event: "focusSemanticTargetPending",
        focusGeneration: focusGenerationRef.current,
        frame: null,
        keyboardClass: target.keyboardClass,
        keyboardInset: keyboardInsetRef.current,
        layoutGeneration: layoutGenerationRef.current.generation,
        measurementIdentity,
        openGeneration: openGenerationRef.current,
        preparedAvailable: preparedDirectInputGeometryRef.current !== null,
        preparedFresh: false,
        reason: "CANONICAL_SEMANTIC_RECT_PENDING",
        rootClaim: "not-requested",
        rootTarget: null,
      });
      return;
    }
    const pendingRegisteredHandoff = registeredInputHandoffRef.current;
    const registeredHandoffMatched = pendingRegisteredHandoff?.destinationRegistrationKey === target.registrationKey;
    if (pendingRegisteredHandoff !== null) {
      registeredInputHandoffRef.current = null;
      recordRegisteredInputHandoffEvidence({
        destinationKeyboardClass: target.keyboardClass,
        destinationRegistrationKey: target.registrationKey,
        event: "registered-input-handoff-focus",
        matchedDestination: pendingRegisteredHandoff.destinationRegistrationKey === target.registrationKey,
        sourceRegistrationKey: pendingRegisteredHandoff.sourceRegistrationKey,
      });
    }
    const currentTarget = focusedTargetRef.current;
    const refreshesCurrentFocus = currentTarget !== null
      && currentTarget.registrationKey === target.registrationKey
      && currentTarget.keyboardClass === target.keyboardClass
      && currentTarget.layoutGeneration === layoutGenerationRef.current.generation
      && currentTarget.measurementIdentity === measurementIdentity
      && currentTarget.openGeneration === openGenerationRef.current;
    if (refreshesCurrentFocus) {
      const refreshedTarget: ActiveWaflSheetFocusTarget = {
        ...target,
        focusGeneration: currentTarget.focusGeneration,
        layoutGeneration: currentTarget.layoutGeneration,
        measurementIdentity: currentTarget.measurementIdentity,
        openGeneration: currentTarget.openGeneration,
      };
      focusedTargetRef.current = refreshedTarget;
      if (keyboardMode === "directInput") {
        directInputLastFocusedKeyRef.current = target.registrationKey;
        setDirectInputFocusedKey(target.registrationKey);
      }
      if (keyboardInsetRef.current > 0 && !keyboardHidingRef.current) {
        revealFocusedTarget(refreshedTarget, {
          allowRootAuthor: false,
          keyboardAppearanceIdentity: resolveCurrentKeyboardAppearanceIdentity(refreshedTarget),
        });
      }
      return;
    }
    focusGenerationRef.current += 1;
    const previousCycle = focusRevealCycleRef.current;
    const transferPrevious = resolveWaflSheetFocusRevealCycleTransfer({
      keyboardHiding: keyboardHidingRef.current,
      keyboardVisible: keyboardVisibleRef.current,
      previous: previousCycle,
      registeredHandoffMatched,
    });
    const keyboardClassTransition = resolveWaflSheetKeyboardClassTransition({
      currentFrameClass: keyboardFrameClassRef.current,
      keyboardVisible: keyboardVisibleRef.current,
      nextClass: target.keyboardClass,
    }).requiresFreshFrame;
    focusRevealCycleRef.current = beginWaflSheetFocusRevealCycle({
      bodyOffset: bodyOffsetRef.current,
      focusGeneration: focusGenerationRef.current,
      previous: previousCycle,
      transferPrevious,
    });
    bodyScrollUserOwnedRef.current = false;
    focusedMeasurementIdentityRef.current = measurementIdentity;
      const activeTarget: ActiveWaflSheetFocusTarget = {
        ...target,
        focusGeneration: focusGenerationRef.current,
        layoutGeneration: layoutGenerationRef.current.generation,
        measurementIdentity,
      openGeneration: openGenerationRef.current,
    };
    focusedTargetRef.current = activeTarget;
    keyboardAppearanceGenerationRef.current += 1;
    const appearanceIdentity = resolveWaflKeyboardAppearanceRevealIdentity({
      appearanceGeneration: keyboardAppearanceGenerationRef.current,
      focusGeneration: activeTarget.focusGeneration,
      keyboardClass: activeTarget.keyboardClass,
      layoutGeneration: activeTarget.layoutGeneration,
      measurementIdentity: activeTarget.measurementIdentity,
      openGeneration: activeTarget.openGeneration,
    });
    keyboardAppearanceVisibleAtStartRef.current = keyboardVisibleRef.current && !keyboardHidingRef.current;
    keyboardAppearanceRootRevealStateRef.current = { appearanceIdentity, rootAuthorCount: 0 };
    keyboardAppearanceRootResolutionRef.current = { appearanceIdentity, resolution: "unresolved" };
    keyboardFrameRootRevealStateRef.current = { frameIdentity: null, rootAuthorCount: 0 };
    didShowReconciliationIdentityRef.current = null;
    pendingDidShowReconciliationRef.current = null;
    if (didShowReconciliationFrameRef.current !== null) {
      cancelAnimationFrame(didShowReconciliationFrameRef.current);
      didShowReconciliationFrameRef.current = null;
    }
    pendingKeyboardClassRef.current = keyboardClassTransition ? target.keyboardClass : null;
    keyboardClassRevealIdentityRef.current = null;
    const preparedResult = resolvePreparedGeometryForTarget(activeTarget);
    const preparedFreshness = preparedResult.freshness;
    recordKeyboardRevealEvidence({
      appearanceGeneration: keyboardAppearanceGenerationRef.current,
      appearanceIdentity,
      bodyScrollApplied: 0,
      bodyScrollRequested: 0,
      event: "focus",
      focusGeneration: activeTarget.focusGeneration,
      frame: null,
      keyboardClass: activeTarget.keyboardClass,
      keyboardInset: keyboardInsetRef.current,
      layoutGeneration: activeTarget.layoutGeneration,
      measurementIdentity: activeTarget.measurementIdentity,
      openGeneration: activeTarget.openGeneration,
      preparedAvailable: preparedDirectInputGeometryRef.current !== null,
      preparedFresh: preparedFreshness.current,
      reason: "FOCUS_APPEARANCE_STARTED",
      rootClaim: "not-requested",
      rootTarget: null,
    });
    if (keyboardMode === "directInput") {
      directInputSessionStateRef.current = "editing";
      directInputLastFocusedKeyRef.current = target.registrationKey;
      directInputRestoreAttemptedRef.current = false;
      setDirectInputFocusedKey(target.registrationKey);
    }
    const pendingTransition = pendingPreFocusKeyboardTransitionRef.current;
    pendingPreFocusKeyboardTransitionRef.current = null;
    let consumedPendingTransition = false;
    if (keyboardMode === "directInput" && pendingTransition !== null) {
      const consumption = resolveWaflPendingPreFocusKeyboardTransitionConsumption({
        candidate: pendingTransition.identity,
        current: {
          layoutGeneration: activeTarget.layoutGeneration,
          measurementIdentity: activeTarget.measurementIdentity,
          openGeneration: activeTarget.openGeneration,
          sheetInstanceId: directInputInstanceId,
        },
        dismissing: dismissingRef.current,
        keyboardClassTransition,
        visible: visibleRef.current,
      });
      const preparedField = preparedResult.preparedField;
      const platform = Platform.OS === "ios" ? "ios" as const : Platform.OS === "android" ? "android" as const : "other" as const;
      const transitionTrust = resolveWaflKeyboardTransitionTrust({
        event: pendingTransition.nativeEvent,
        frameHeight: pendingTransition.frame.height,
        frameWidth: pendingTransition.frame.width,
        frameY: pendingTransition.frame.y,
        keyboardClassCurrent: !keyboardClassTransition,
        keyboardInset: pendingTransition.inset,
        layoutGenerationCurrent: activeTarget.layoutGeneration === layoutGenerationRef.current.generation,
        platform,
        preparedGeometryCurrent: preparedFreshness.current,
        windowHeight: window.height,
      });
      if (consumption.consume && preparedField !== undefined && transitionTrust.trustworthy) {
        keyboardFrameClassRef.current = activeTarget.keyboardClass;
        pendingKeyboardClassRef.current = null;
        const plan = resolveWaflPreparedDirectInputKeyboardTarget({
          geometry: preparedField,
          keyboardInset: pendingTransition.inset,
          currentRootOffset: resolveWaflCurrentRootPlanningOffset({
            currentMotion: rootMotionStateRef.current,
            staticRestingOffset: mediumOffset,
            systemKeyboardTargetOffset: systemKeyboardTargetOffsetRef.current,
          }),
          liveBodyOffset: bodyOffsetRef.current,
        });
        const frameIdentity = resolveWaflKeyboardFrameRevealIdentity({
          focusGeneration: activeTarget.focusGeneration,
          frameHeight: pendingTransition.frame.height,
          frameWidth: pendingTransition.frame.width,
          frameX: pendingTransition.frame.x,
          frameY: pendingTransition.frame.y,
          keyboardClass: activeTarget.keyboardClass,
          keyboardInset: pendingTransition.inset,
          layoutGeneration: activeTarget.layoutGeneration,
          measurementIdentity: activeTarget.measurementIdentity,
          openGeneration: activeTarget.openGeneration,
        });
        const rootMotionDecision = resolveKeyboardRootMotion(plan.targetOffset);
        const rootRequested = rootMotionDecision.requestsRootAnimation;
        const canScheduleRoot = resolveWaflKeyboardAppearanceRootScheduling({
          event: pendingTransition.nativeEvent,
          keyboardVisibleAtAppearanceStart: keyboardAppearanceVisibleAtStartRef.current,
          platform,
          trustworthyNativeTransition: true,
        });
        const rootClaimGranted = canScheduleRoot && rootRequested && claimKeyboardRootReveal({
          appearanceIdentity,
          frameIdentity,
          requestsRoot: rootRequested,
          targetOffset: plan.targetOffset,
        });
        const noOpResolved = canScheduleRoot && !rootRequested
          ? resolveKeyboardRootNoop({
            appearanceIdentity,
            frame: pendingTransition.frame,
            frameIdentity,
            reason: pendingTransition.nativeEvent,
            target: activeTarget,
            targetOffset: plan.targetOffset,
          })
          : false;
        const adoptTransition = canScheduleRoot && (rootClaimGranted || noOpResolved);
        const frameChanged = keyboardClassRevealIdentityRef.current !== frameIdentity;
        const appliedBodyScroll = adoptTransition && frameChanged
          ? applySystemBodyScrollDelta(plan.appliedBodyScroll, false)
          : 0;
        consumedPendingTransition = adoptTransition;
        if (adoptTransition && frameChanged) {
          keyboardClassRevealIdentityRef.current = frameIdentity;
          focusRevealCycleRef.current = markWaflSheetFocusRevealCycleActive(focusRevealCycleRef.current);
          coordinatedFirstTargetIdentityRef.current = `${activeTarget.openGeneration}:${activeTarget.focusGeneration}:${activeTarget.measurementIdentity}`;
        }
        recordKeyboardRevealEvidence({
          appearanceGeneration: keyboardAppearanceGenerationRef.current,
          appearanceIdentity,
          bodyScrollApplied: appliedBodyScroll,
          bodyScrollRequested: plan.appliedBodyScroll,
          event: "pendingPreFocusTransitionConsumed",
          focusGeneration: activeTarget.focusGeneration,
          frame: pendingTransition.frame,
          keyboardClass: activeTarget.keyboardClass,
          keyboardInset: pendingTransition.inset,
          layoutGeneration: activeTarget.layoutGeneration,
          measurementIdentity: activeTarget.measurementIdentity,
          openGeneration: activeTarget.openGeneration,
          preparedAvailable: preparedResult.snapshot !== null,
          preparedFresh: preparedFreshness.current,
          reason: adoptTransition
            ? `FOCUS_OWNER_CONSUMED_NATIVE_WILL_EVENT:${rootMotionDecision.reason}`
            : "ROOT_CLAIM_NOT_AVAILABLE",
          rootClaim: rootRequested ? (rootClaimGranted ? "granted" : "denied") : "not-requested",
          rootTarget: plan.targetOffset,
        });
        if (rootClaimGranted) {
          systemKeyboardTargetOffsetRef.current = plan.targetOffset;
          animateToOwnerRef.current(plan.targetOffset, {
            owner: "systemKeyboard",
            keyboardTransition: pendingTransition.transition,
          });
        }
      } else {
        recordKeyboardRevealEvidence({
          appearanceGeneration: keyboardAppearanceGenerationRef.current,
          appearanceIdentity,
          bodyScrollApplied: 0,
          bodyScrollRequested: 0,
          event: "pendingPreFocusTransitionRejected",
          focusGeneration: activeTarget.focusGeneration,
          frame: pendingTransition.frame,
          keyboardClass: activeTarget.keyboardClass,
          keyboardInset: pendingTransition.inset,
          layoutGeneration: activeTarget.layoutGeneration,
          measurementIdentity: activeTarget.measurementIdentity,
          openGeneration: activeTarget.openGeneration,
          preparedAvailable: preparedResult.snapshot !== null,
          preparedFresh: preparedFreshness.current,
          reason: !consumption.consume ? consumption.reason : transitionTrust.reason,
          rootClaim: "not-requested",
          rootTarget: null,
        });
      }
    }
    const coordinatedOpening = coordinatedEntranceGenerationRef.current === activeTarget.openGeneration
      && (coordinatedEntrancePhaseRef.current === "prepared" || coordinatedEntrancePhaseRef.current === "keyboardTransition");
    if (
      !consumedPendingTransition
      && !keyboardClassTransition
      && !coordinatedOpening
      && (keyboardMode !== "directInput" || keyboardInsetRef.current > 0)
    ) {
      revealFocusedTarget(activeTarget, { keyboardAppearanceIdentity: appearanceIdentity });
    }
  }, [applySystemBodyScrollDelta, claimKeyboardRootReveal, directInputInstanceId, keyboardMode, measurementIdentity, mediumOffset, recordKeyboardRevealEvidence, recordRegisteredInputHandoffEvidence, resolveCurrentKeyboardAppearanceIdentity, resolveKeyboardRootMotion, resolveKeyboardRootNoop, resolvePreparedGeometryForTarget, revealFocusedTarget, window.height]);

  const handleBodyBlur = useCallback((registrationKey: string) => {
    if (focusedTargetRef.current?.registrationKey !== registrationKey) return;
    const pendingRegisteredHandoff = registeredInputHandoffRef.current;
    if (pendingRegisteredHandoff?.sourceRegistrationKey === registrationKey) {
      if (blurTerminationFrameRef.current !== null) cancelAnimationFrame(blurTerminationFrameRef.current);
      const blurGeneration = focusGenerationRef.current;
      blurTerminationFrameRef.current = requestAnimationFrame(() => {
        blurTerminationFrameRef.current = null;
        if (focusedTargetRef.current?.registrationKey !== registrationKey || focusGenerationRef.current !== blurGeneration) return;
        registeredInputHandoffRef.current = null;
        pendingPreFocusKeyboardTransitionRef.current = null;
        focusedTargetRef.current = null;
        focusRevealCycleRef.current = markWaflSheetFocusRevealCycleTerminated(focusRevealCycleRef.current);
        if (directInputLastFocusedKeyRef.current === registrationKey) {
          directInputLastFocusedKeyRef.current = null;
          setDirectInputFocusedKey(null);
        }
        recordRegisteredInputHandoffEvidence({
          destinationRegistrationKey: pendingRegisteredHandoff.destinationRegistrationKey,
          event: "registered-input-handoff-unresolved",
          sourceRegistrationKey: registrationKey,
        });
      });
      return;
    }
    pendingPreFocusKeyboardTransitionRef.current = null;
    focusedTargetRef.current = null;
    focusRevealCycleRef.current = markWaflSheetFocusRevealCycleDismissing(focusRevealCycleRef.current);
    if (blurTerminationFrameRef.current !== null) cancelAnimationFrame(blurTerminationFrameRef.current);
    const blurGeneration = focusGenerationRef.current;
    blurTerminationFrameRef.current = requestAnimationFrame(() => {
      blurTerminationFrameRef.current = null;
      if (focusedTargetRef.current !== null || focusGenerationRef.current !== blurGeneration) return;
      focusRevealCycleRef.current = markWaflSheetFocusRevealCycleTerminated(focusRevealCycleRef.current);
    });
    if (directInputLastFocusedKeyRef.current === registrationKey) {
      directInputLastFocusedKeyRef.current = null;
      setDirectInputFocusedKey(null);
    }
  }, [recordRegisteredInputHandoffEvidence, setDirectInputFocusedKey]);

  const handleBodyTouchStart = useCallback((event: GestureResponderEvent) => {
    if (keyboardMode !== "directInput") return;
    const focused = focusedTargetRef.current;
    const disposition = resolveWaflRegisteredInputBodyTouch({
      focusedRegistrationKey: focused?.registrationKey ?? null,
      registeredTargets: directInputFieldsRef.current.map((target) => ({
        inputTarget: target.inputTarget,
        registrationKey: target.registrationKey,
      })),
      touchTarget: typeof event.nativeEvent.target === "number" ? event.nativeEvent.target : null,
    });
    if (disposition.action === "handoff" && focused !== null && disposition.destinationRegistrationKey !== null) {
      registeredInputHandoffRef.current = {
        destinationRegistrationKey: disposition.destinationRegistrationKey,
        sourceRegistrationKey: focused.registrationKey,
      };
      const destination = directInputFieldsRef.current.find((target) => target.registrationKey === disposition.destinationRegistrationKey);
      recordRegisteredInputHandoffEvidence({
        destinationKeyboardClass: destination?.keyboardClass ?? null,
        destinationRegistrationKey: disposition.destinationRegistrationKey,
        dismissDirectInputEditing: false,
        event: "registered-input-handoff-touch",
        sourceKeyboardClass: focused.keyboardClass,
        sourceRegistrationKey: focused.registrationKey,
      });
      return;
    }
    if (disposition.action === "preserve") return;
    dismissDirectInputEditing();
  }, [dismissDirectInputEditing, keyboardMode, recordRegisteredInputHandoffEvidence]);

  const handleBodyScrollBeginDrag = useCallback(() => {
    bodyScrollUserOwnedRef.current = true;
    dismissDirectInputEditing();
  }, [dismissDirectInputEditing]);

  return (
    <Modal animationType="none" onRequestClose={cancel} presentationStyle="overFullScreen" transparent visible={rendered}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="입력창 닫기"
          disabled={actionPending}
          onPress={cancel}
          onPressIn={keyboardMode === "directInput" ? cancel : undefined}
          style={styles.backdrop}
        />
        <Animated.View
          accessibilityElementsHidden={replacesSheetDuringProcessing}
          collapsable={false}
          importantForAccessibility={replacesSheetDuringProcessing ? "no-hide-descendants" : "auto"}
          pointerEvents={replacesSheetDuringProcessing ? "none" : "auto"}
          ref={sheetRef}
          style={[styles.sheet, { height: expandedHeight, transform: [{ translateY }] }, replacesSheetDuringProcessing && styles.processingReplacedSheet]}
          testID="wafl-input-sheet-v2"
        >
          <View
            accessibilityLabel="입력창"
            accessibilityRole="header"
            collapsable={false}
            onLayout={(event) => measureHeader(event.nativeEvent.layout.height)}
            style={styles.header}
            testID="wafl-sheet-fixed-header"
          >
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>WAFL INPUT</Text>
              <Text style={styles.title}>{effectiveTitle}</Text>
            </View>
          </View>
          <WaflSheetFocusProvider bodyCoordinate={bodyCoordinateOwner} directInput={directInputController} onBlurTarget={handleBodyBlur} onDismissEditing={dismissDirectInputEditing} onFocusTarget={handleBodyFocus}>
          {sizing === "contentFit" && (decision || (!contentFit.overflow && keyboardInset === 0)) ? (
            <View
              collapsable={false}
              onLayout={(event) => {
                publishBodyContentCoordinateLayout(event.nativeEvent.layout);
                measureBody(event.nativeEvent.layout.height);
              }}
              onTouchStart={handleBodyTouchStart}
              ref={bodyContentRef}
              style={[styles.contentFitBody, contentStyle]}
            >{renderedChildren}</View>
          ) : sizing === "contentFit" ? <ScrollView
              contentContainerStyle={[styles.contentFitScrollBody, { paddingBottom: keyboardInset }]}
              keyboardDismissMode={directInputTapPersistence.keyboardDismissMode ?? undefined}
              keyboardShouldPersistTaps={directInputTapPersistence.keyboardShouldPersistTaps}
              nestedScrollEnabled
              onContentSizeChange={(_width, height) => measureBody(height)}
              onScroll={onBodyScroll}
              onScrollBeginDrag={handleBodyScrollBeginDrag}
              onTouchStart={handleBodyTouchStart}
              ref={bodyScrollRef}
              scrollEnabled={contentFit.overflow || keyboardInset > 0}
              scrollEventThrottle={16}
              style={[styles.contentFitBody, { height: Math.max(0, expandedBodyViewportHeight) }]}
            ><View
              collapsable={false}
              onLayout={(event) => publishBodyContentCoordinateLayout(event.nativeEvent.layout)}
              ref={bodyContentRef}
              style={contentStyle}
            >{renderedChildren}</View></ScrollView> : <Animated.View
              collapsable={false}
              onTouchStart={handleBodyTouchStart}
              ref={bodyViewportRef}
              style={[styles.bodyViewport, { height: animatedBodyViewportHeight }]}
              testID="wafl-sheet-body-viewport"
            >
              {effectiveBodyScrollable ? <ScrollView
                contentContainerStyle={[styles.scrollBodyContent, { paddingBottom: WAFL_THEME.sheet.bodyEndGap + keyboardInset }]}
                keyboardDismissMode={directInputTapPersistence.keyboardDismissMode ?? undefined}
                keyboardShouldPersistTaps={directInputTapPersistence.keyboardShouldPersistTaps}
                nestedScrollEnabled
                onContentSizeChange={(_width, height) => {
                  bodyContentHeightRef.current = height;
                  publishBodyScrollMetrics();
                }}
                onLayout={(event) => {
                  bodyViewportHeightRef.current = event.nativeEvent.layout.height;
                  publishBodyScrollMetrics();
                }}
                onScroll={onBodyScroll}
                onScrollBeginDrag={handleBodyScrollBeginDrag}
                ref={bodyScrollRef}
                scrollEnabled
                scrollEventThrottle={16}
                style={styles.content}
              ><View
                collapsable={false}
                onLayout={(event) => {
                  publishBodyContentCoordinateLayout(event.nativeEvent.layout);
                  const measurement = resolveWaflSheetBodyMeasurements({
                    intrinsicContentHeight: event.nativeEvent.layout.height,
                    reportedScrollContentHeight: bodyContentHeightRef.current,
                    staticEndGap: WAFL_THEME.sheet.bodyEndGap,
                  });
                  measureBody(measurement.adaptiveBodyHeight);
                }}
                ref={bodyContentRef}
                style={[styles.intrinsicScrollableContent, contentStyle]}
              >{renderedChildren}</View></ScrollView> : <View
                collapsable={false}
                onLayout={(event) => {
                  publishBodyContentCoordinateLayout(event.nativeEvent.layout);
                  measureBody(event.nativeEvent.layout.height);
                }}
                ref={bodyContentRef}
                style={[sizing === "reelAdaptive" ? styles.intrinsicBody : styles.content, contentStyle]}
              >{renderedChildren}</View>}
            </Animated.View>}
          </WaflSheetFocusProvider>
          {hasActions && !cancelActionLabel && !confirmActionLabel ? <View
            onLayout={(event) => measureFooter(event.nativeEvent.layout.height)}
            ref={footerRef}
            style={styles.actions}
            testID="wafl-sheet-actions"
          >
            <WaflSheetActionButtons
              cancelAccessibilityLabel={cancelAccessibilityLabel}
              confirmAccessibilityLabel={confirmAccessibilityLabel}
              cancelDisabled={actionPending}
              confirmDisabled={actionPending || (!decision && confirmDisabled)}
              showCancel={showFooterCancelAction && (decision ? false : showCancelAction)}
              showConfirm={showFooterConfirmAction}
              onCancel={cancel}
              onConfirm={() => void confirm()}
            />
          </View> : hasActions ? <View
            onLayout={(event) => measureFooter(event.nativeEvent.layout.height)}
            ref={footerRef}
            style={styles.actions}
            testID="wafl-sheet-actions"
          >
            {showFooterCancelAction ? <Pressable
              accessibilityLabel={decision ? decision.safeLabel : cancelAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: actionPending }}
              disabled={actionPending}
              onPress={cancel}
              style={[styles.cancelButton, actionPending && styles.disabled]}
            >
              <Text style={styles.cancelActionLabel}>{cancelActionLabel}</Text>
            </Pressable> : null}
            {showFooterConfirmAction ? <Pressable
              accessibilityLabel={decision ? `${decision.actionLabel} 선택 적용` : confirmAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ busy: actionPending, disabled: actionPending || (!decision && confirmDisabled) }}
              disabled={actionPending || (!decision && confirmDisabled)}
              onPress={() => void confirm()}
              style={[styles.applyButton, (actionPending || (!decision && confirmDisabled)) && styles.disabled]}
            >
              <Text style={styles.confirmActionLabel}>{confirmActionLabel}</Text>
            </Pressable> : null}
          </View> : null}
          <View style={{ height: keyboardLayout.bottomInset }} testID="wafl-sheet-bottom-inset" />
        </Animated.View>
        {keyboardMode === "directInput" && rendered && !replacesSheetDuringProcessing && directInputMinimalAccessoryAction !== null ? <WaflDirectInputKeyboardAccessory
          action={directInputMinimalAccessoryAction}
          disabled={directInputMinimalAccessoryAction === "done" && directInputAccessoryDoneDisabled}
          nativeID={directInputAccessoryNativeID}
          onPress={() => {
            if (directInputMinimalAccessoryAction === "done" && directInputMinimalAccessoryFocusedKey !== null) {
              submitDirectInput(directInputMinimalAccessoryFocusedKey);
              return;
            }
            runDirectInputNavigation(directInputMinimalAccessoryAction);
          }}
        /> : null}
        <WaflActionProcessingBlocker
          helper={processingHelper}
          message={processingMessage}
          testID={processingTestID}
        />
      </View>
    </Modal>
  );
}

let waflDirectInputSheetInstanceSequence = 0;

function nextWaflDirectInputSheetInstanceId() {
  waflDirectInputSheetInstanceSequence += 1;
  return waflDirectInputSheetInstanceSequence;
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 29, 43, 0.36)" },
  sheet: {
    alignSelf: "center",
    backgroundColor: WAFL_THEME.color.paper,
    borderColor: WAFL_THEME.color.fabricBeige,
    borderTopLeftRadius: WAFL_THEME.radius.sheet,
    borderTopRightRadius: WAFL_THEME.radius.sheet,
    borderWidth: WAFL_THEME.border.hairline,
    maxWidth: WAFL_THEME.layout.sheetMaxWidth,
    paddingHorizontal: WAFL_THEME.spacing.lg,
    paddingTop: WAFL_THEME.spacing.sm,
    width: "100%",
  },
  processingReplacedSheet: { opacity: 0 },
  header: { justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, paddingBottom: WAFL_THEME.spacing.sm },
  headerText: { minWidth: 0 },
  eyebrow: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 9, letterSpacing: 1.2 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black, fontSize: 19, marginTop: 2 },
  content: { flex: 1, minHeight: 0 },
  intrinsicScrollableContent: { flexGrow: 0, flexShrink: 0, minHeight: 0 },
  intrinsicBody: { flexGrow: 0, flexShrink: 0, minHeight: 0 },
  bodyViewport: { flexGrow: 0, flexShrink: 0, minHeight: 0, overflow: "hidden" },
  contentFitBody: { flexGrow: 0, flexShrink: 0, minHeight: 0 },
  contentFitScrollBody: { flexGrow: 1 },
  scrollBodyContent: { flexGrow: 1, paddingBottom: WAFL_THEME.sheet.bodyEndGap },
  actions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm, justifyContent: "flex-end", marginTop: WAFL_THEME.spacing.sm },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 10, borderWidth: 1, height: 48, justifyContent: "center", minWidth: 48, paddingHorizontal: WAFL_THEME.spacing.md },
  applyButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: 10, height: 48, justifyContent: "center", minWidth: 48, paddingHorizontal: WAFL_THEME.spacing.md },
  cancelActionLabel: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  confirmActionLabel: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  disabled: { opacity: 0.4 },
});
