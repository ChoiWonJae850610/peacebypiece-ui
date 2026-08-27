import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  AppState,
  findNodeHandle,
  Keyboard,
  Modal,
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
  resolveWaflDirectInputDragRelease,
  resolveWaflDirectInputKeyboardDetent,
  resolveWaflDirectInputNavigation,
  resolveWaflDirectInputRevealMotion,
  resolveWaflDirectInputReturnKey,
  resolveWaflDirectInputTapPersistence,
  resolveWaflInputSheetPresentation,
  resolveWaflSheetClosePlan,
  canRunWaflSheetSettlingAnimation,
  shouldRestoreDirectInputKeyboard,
  shouldSuppressWaflSheetKeyboardHideGeometry,
  type WaflDirectInputNavigationAction,
  type WaflDirectInputSessionState,
  type WaflSheetKeyboardMode,
} from "@/domain/waflDirectInputKeyboardPolicy";
import {
  resolveWaflSheetBodyMeasurements,
  resolveWaflSheetKeyboardRestoreOffset,
} from "@/domain/waflSheetKeyboardRestorePolicy";
import WaflActionProcessingBlocker from "@/features/feedback/WaflActionProcessingBlocker";
import WaflDirectInputKeyboardAccessory from "@/features/inputs/WaflDirectInputKeyboardAccessory";
import WaflSheetActionButtons from "@/features/inputs/WaflSheetActionButtons";
import { createWaflInputCommitGuard } from "./waflInputCommitGuard";
import {
  WaflSheetFocusProvider,
  type WaflSheetDirectInputController,
  type WaflSheetEditableInputTarget,
  type WaflSheetFocusTarget,
} from "./WaflSheetTextInput";
import {
  resolveWaflSheetDragOffset,
  resolveWaflAdaptiveBodyHeight,
  resolveWaflAdaptiveInitialHeight,
  resolveWaflExpandableInitialHeight,
  resolveWaflContentFitHeight,
  resolveWaflSheetDragStartOffset,
  resolveWaflSheetEntranceReadiness,
  resolveWaflSheetKeyboardLayout,
  resolveWaflSheetMeasurementIdentity,
  resolveWaflSheetOpeningOffset,
  resolveWaflSheetRelease,
  resolveWaflSheetVisualRevealPlan,
  isValidWaflSheetWindowMeasurement,
  type WaflSheetWindowMeasurement,
  type WaflSheetSizing,
} from "@/domain/waflSheetDetentPolicy";

type ActiveWaflSheetFocusTarget = WaflSheetFocusTarget & {
  readonly focusGeneration: number;
  readonly measurementIdentity: string;
  readonly openGeneration: number;
};

type WaflMountedMeasureTarget = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

type WaflRevealMeasurementSet = {
  readonly field: WaflSheetWindowMeasurement;
  readonly owner: "ref" | "fallback";
  readonly sheet: WaflSheetWindowMeasurement;
  readonly viewport: WaflSheetWindowMeasurement;
};

type WaflSheetCloseOperation = {
  readonly id: number;
  finalized: boolean;
};

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
  readonly confirmDisabled?: boolean;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly cancelAccessibilityLabel?: string;
  readonly confirmAccessibilityLabel?: string;
  readonly cancelActionLabel?: string;
  readonly confirmActionLabel?: string;
  readonly showCancelAction?: boolean;
  readonly bodyScrollable?: boolean;
  readonly keyboardAutoExpand?: boolean;
  readonly keyboardMode?: WaflSheetKeyboardMode;
  readonly keyboardFocusRevealContext?: number;
  readonly sizing?: WaflSheetSizing;
  readonly adaptiveMinimumBodyHeight?: number;
  readonly measurementVariant?: string;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onAfterOpen?: () => void;
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
  confirmDisabled = false,
  contentStyle,
  cancelAccessibilityLabel = "변경 취소",
  confirmAccessibilityLabel = "변경 저장",
  cancelActionLabel,
  confirmActionLabel,
  showCancelAction = true,
  bodyScrollable = true,
  keyboardAutoExpand = false,
  keyboardMode = "default",
  keyboardFocusRevealContext = WAFL_THEME.sheet.focusRevealContext,
  sizing = "expandable",
  adaptiveMinimumBodyHeight = 0,
  measurementVariant,
  presentationGeneration,
  onCancel,
  onAfterClose,
  onAfterOpen,
  onKeyboardHide,
  onBodyScrollMetrics,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const hasConfirmOwner = Boolean(onConfirm);
  const sheetPresentation = resolveWaflInputSheetPresentation({
    hasConfirmOwner,
    keyboardMode,
    processingMessagePresent: processingMessage !== null,
    processingPresentation,
  });
  const hasActions = sheetPresentation.renderFooterActions;
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
  const bodyContentHeightRef = useRef(0);
  const intrinsicBodyContentHeightRef = useRef(0);
  const bodyViewportHeightRef = useRef(0);
  const bodyScrollRef = useRef<ScrollView>(null);
  const bodyViewportRef = useRef<View>(null);
  const sheetRef = useRef<View>(null);
  const focusedTargetRef = useRef<ActiveWaflSheetFocusTarget | null>(null);
  const directInputFieldsRef = useRef<readonly WaflSheetEditableInputTarget[]>([]);
  const directInputFormConfirmRef = useRef<(() => Promise<unknown> | unknown) | null>(null);
  const directInputConfirmRef = useRef<() => void>(() => undefined);
  const directInputSessionStateRef = useRef<WaflDirectInputSessionState>("closing");
  const directInputLastFocusedKeyRef = useRef<string | null>(null);
  const directInputRestoreAttemptedRef = useRef(false);
  const directInputRestoringKeyboardRef = useRef(false);
  const directInputGestureActiveRef = useRef(false);
  const directInputKeyboardDetentRef = useRef<number | null>(null);
  const replaceSheetActiveRef = useRef(false);
  const visibleRef = useRef(visible);
  const pendingRef = useRef(pending);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const focusedMeasurementIdentityRef = useRef(measurementIdentity);
  const focusGenerationRef = useRef(0);
  const revealRunGenerationRef = useRef(0);
  const dragStartRef = useRef(0);
  const dragStartPageYRef = useRef(0);
  const dragLastPageYRef = useRef(0);
  const dragLastAtRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const dragReadyRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dismissingRef = useRef(false);
  const closeOperationSequenceRef = useRef(0);
  const closeOperationRef = useRef<WaflSheetCloseOperation | null>(null);
  const entranceStartedRef = useRef(false);
  const translatedRef = useRef(0);
  const settledOffsetRef = useRef(0);
  const preKeyboardSettledOffsetRef = useRef<number | null>(null);
  const userDraggedDuringKeyboardRef = useRef(false);
  const previousKeyboardInsetRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const openGenerationRef = useRef(0);
  const entranceFrameRef = useRef<number | null>(null);
  const entranceReadinessFrameRef = useRef<number | null>(null);
  const entranceReadinessSecondFrameRef = useRef<number | null>(null);
  const entranceReadyTargetRef = useRef<string | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [translateY] = useState(() => new Animated.Value(window.height));
  const [layoutOffset] = useState(() => new Animated.Value(window.height));
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
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
  const [directInputMinimalAccessoryFieldKeys, setDirectInputMinimalAccessoryFieldKeys] = useState<readonly string[]>([]);
  const [directInputFocusedKey, setDirectInputFocusedKey] = useState<string | null>(null);
  const [directInputFormConfirmAvailable, setDirectInputFormConfirmAvailable] = useState(false);
  const [directInputFormConfirmDisabled, setDirectInputFormConfirmDisabled] = useState(false);
  const actionPending = pending || submitting;
  const replacesSheetDuringProcessing = sheetPresentation.replaceSheetDuringProcessing;
  const effectiveFocusRevealContext = keyboardFocusRevealContext;
  const bodyContentHeight = bodyMeasurement.identity === measurementIdentity ? bodyMeasurement.height : 0;
  const currentGenerationBodyMeasured = bodyMeasurement.identity === measurementIdentity && bodyMeasurement.measured;
  const adaptiveBodyHeight = sizing === "reelAdaptive"
    ? Math.max(0, Math.ceil(adaptiveMinimumBodyHeight))
    : resolveWaflAdaptiveBodyHeight(bodyContentHeight, adaptiveMinimumBodyHeight);
  const adaptiveSizing = sizing === "adaptiveExpandable" || sizing === "reelAdaptive";
  const draggable = sizing !== "contentFit";
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
    Math.round(window.height * WAFL_THEME.sheet.expandedDetentRatio),
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
    : Math.max(320, Math.round(window.height * (sizing === "fullView" ? WAFL_THEME.sheet.fullViewDetentRatio : WAFL_THEME.sheet.expandedDetentRatio)));
  const mediumHeight = Math.min(expandedHeight, adaptiveSizing
    ? resolveWaflAdaptiveInitialHeight({
      bodyHeight: adaptiveBodyHeight,
      footerHeight: effectiveFooterHeight,
      headerHeight,
      maxRatio: WAFL_THEME.sheet.mediumDetentRatio,
      minHeight: WAFL_THEME.sheet.contentFitMinHeight,
      safeBottom,
      verticalChrome: WAFL_THEME.spacing.sm * 2,
      windowHeight: window.height,
    })
    : resolveWaflExpandableInitialHeight({
      detentRatio: WAFL_THEME.sheet.mediumDetentRatio,
      footerHeight: effectiveFooterHeight,
      headerHeight,
      minimumBodyViewport: WAFL_THEME.sheet.initialBodyViewportMinHeight,
      safeBottom,
      verticalChrome: WAFL_THEME.spacing.sm * 2,
      windowHeight: window.height,
    }));
  const mediumOffset = sizing === "expandable" || adaptiveSizing ? Math.max(0, expandedHeight - mediumHeight) : 0;
  const entranceReadiness = resolveWaflSheetEntranceReadiness({
    currentGenerationBodyMeasured,
    deterministicBodyHeight: adaptiveMinimumBodyHeight,
    footerMeasured,
    hasActions,
    headerMeasured,
    sizing,
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
  const expandedBodyViewportHeight = keyboardLayout.expandedBodyViewportHeight;
  const animatedBodyViewportHeight = layoutOffset.interpolate({
    inputRange: [0, Math.max(1, expandedBodyViewportHeight)],
    outputRange: [expandedBodyViewportHeight, 0],
    extrapolate: "clamp",
  });

  const registerDirectInputTarget = useCallback((target: WaflSheetEditableInputTarget) => {
    const current = directInputFieldsRef.current;
    const existingIndex = current.findIndex((item) => item.registrationKey === target.registrationKey);
    if (existingIndex < 0) {
      const next = [...current, target];
      directInputFieldsRef.current = next;
      setDirectInputFieldKeys(next.map((item) => item.registrationKey));
      setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
      setDirectInputRegistryVersion((version) => version + 1);
      return;
    }
    const existing = current[existingIndex]!;
    if (
      existing.inputRef === target.inputRef
      && existing.multiline === target.multiline
      && existing.accessoryMode === target.accessoryMode
    ) return;
    const next = [...current];
    next[existingIndex] = target;
    directInputFieldsRef.current = next;
    setDirectInputFieldKeys(next.map((item) => item.registrationKey));
    setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
    setDirectInputRegistryVersion((version) => version + 1);
  }, [setDirectInputFieldKeys, setDirectInputMinimalAccessoryFieldKeys, setDirectInputRegistryVersion]);

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
    setDirectInputFieldKeys(next.map((item) => item.registrationKey));
    setDirectInputMinimalAccessoryFieldKeys(next.filter((item) => item.accessoryMode === "singleAction").map((item) => item.registrationKey));
    setDirectInputRegistryVersion((version) => version + 1);
    setDirectInputFocusedKey((focusedKey) => focusedKey === registrationKey ? null : focusedKey);
  }, [setDirectInputFieldKeys, setDirectInputFocusedKey, setDirectInputMinimalAccessoryFieldKeys, setDirectInputRegistryVersion]);

  const focusDirectInputTarget = useCallback((registrationKey: string) => {
    directInputFieldsRef.current
      .find((item) => item.registrationKey === registrationKey)
      ?.inputRef.focus();
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
    return resolveWaflDirectInputReturnKey({
      fieldCount: fields.length,
      fieldIndex: fields.findIndex((item) => item.registrationKey === registrationKey),
      multiline,
    }) ?? undefined;
  }, []);

  const submitDirectInput = useCallback((registrationKey: string) => {
    const fields = directInputFieldsRef.current;
    const fieldIndex = fields.findIndex((item) => item.registrationKey === registrationKey);
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
  const directInputMinimalAccessoryAction = directInputFocusedKey !== null
    && directInputMinimalAccessoryFieldKeys.includes(directInputFocusedKey)
    ? resolveWaflDirectInputMinimalAccessoryAction({
      fieldKeys: directInputFieldKeys,
      focusedKey: directInputFocusedKey,
    })
    : null;

  useEffect(() => {
    visibleRef.current = visible;
    pendingRef.current = pending;
  }, [pending, visible]);

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
    directInputRestoreAttemptedRef.current = false;
    const targetKey = directInputLastFocusedKeyRef.current;
    if (targetKey !== null) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!mountedRef.current || !visibleRef.current || dismissingRef.current) return;
        focusDirectInputTarget(targetKey);
      }));
    }
  }, [focusDirectInputTarget, keyboardMode, rendered, replacesSheetDuringProcessing, visible]);

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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      directInputSessionStateRef.current = "closing";
      if (entranceFrameRef.current !== null) cancelAnimationFrame(entranceFrameRef.current);
      if (entranceReadinessFrameRef.current !== null) cancelAnimationFrame(entranceReadinessFrameRef.current);
      if (entranceReadinessSecondFrameRef.current !== null) cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const targetIdentity = `${measurementIdentity}:${mediumOffset}`;
    if (!visible || !rendered || entranceStartedRef.current || !entranceReadiness.ready) {
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
  }, [entranceReadiness.ready, measurementIdentity, mediumOffset, rendered, visible]);

  useEffect(() => {
    const update = (event: { endCoordinates: { screenY: number } }) => {
      const nextInset = Math.max(0, Math.round(window.height - event.endCoordinates.screenY));
      keyboardVisibleRef.current = nextInset > 0;
      if (nextInset > 0) directInputRestoreAttemptedRef.current = false;
      setKeyboardInset(nextInset);
    };
    const hide = () => {
      const restoreExpected = shouldRestoreDirectInputKeyboard({
        appActive: appStateRef.current === "active",
        gestureActive: directInputGestureActiveRef.current,
        hasEditableTarget: directInputLastFocusedKeyRef.current !== null,
        keyboardMode,
        mounted: mountedRef.current,
        restoreAlreadyAttempted: directInputRestoreAttemptedRef.current,
        sessionState: directInputSessionStateRef.current,
        visible: visibleRef.current,
      });
      if (keyboardVisibleRef.current && !restoreExpected) onKeyboardHide?.();
      keyboardVisibleRef.current = false;
      setKeyboardInset(0);
    };
    const change = Keyboard.addListener("keyboardWillChangeFrame", update);
    const didShow = Keyboard.addListener("keyboardDidShow", update);
    const willHide = Keyboard.addListener("keyboardWillHide", hide);
    const didHide = Keyboard.addListener("keyboardDidHide", hide);
    return () => {
      change.remove();
      didShow.remove();
      willHide.remove();
      didHide.remove();
    };
  }, [keyboardMode, onKeyboardHide, window.height]);

  const resetDragState = useCallback(() => {
    directInputGestureActiveRef.current = false;
    dragReadyRef.current = false;
    dragMovedRef.current = false;
    dragStartRef.current = 0;
    dragStartPageYRef.current = 0;
    dragLastPageYRef.current = 0;
    dragLastAtRef.current = 0;
    dragVelocityRef.current = 0;
    setDragging(false);
  }, [setDragging]);

  const startAnimation = useCallback((animation: Animated.CompositeAnimation, generation: number, completion?: () => void) => {
    animationRef.current?.stop();
    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (animationRef.current === animation) animationRef.current = null;
      if (finished && generation === openGenerationRef.current) completion?.();
    });
  }, []);

  const animateTo = useCallback((offset: number, options?: { readonly commitSettled?: boolean; readonly completion?: () => void }) => {
    if (!canRunWaflSheetSettlingAnimation({
      dismissing: dismissingRef.current,
      keyboardMode,
      sessionState: directInputSessionStateRef.current,
    })) return;
    const boundedOffset = Math.max(0, Math.min(mediumOffset, offset));
    const generation = openGenerationRef.current;
    const animation = Animated.parallel([
      Animated.spring(translateY, {
        damping: 26,
        mass: 0.8,
        stiffness: 260,
        toValue: boundedOffset,
        useNativeDriver: true,
      }),
      Animated.spring(layoutOffset, {
        damping: 26,
        mass: 0.8,
        stiffness: 260,
        toValue: boundedOffset,
        useNativeDriver: false,
      }),
    ]);
    startAnimation(animation, generation, () => {
      translatedRef.current = boundedOffset;
      translateY.setValue(boundedOffset);
      layoutOffset.setValue(boundedOffset);
      if (options?.commitSettled !== false) settledOffsetRef.current = boundedOffset;
      options?.completion?.();
    });
  }, [keyboardMode, layoutOffset, mediumOffset, startAnimation, translateY]);

  const revealFocusedTarget = useCallback((target = focusedTargetRef.current) => {
    if (
      target === null
      || focusedMeasurementIdentityRef.current !== measurementIdentity
      || target.measurementIdentity !== measurementIdentity
      || target.openGeneration !== openGenerationRef.current
    ) return;
    const runGeneration = revealRunGenerationRef.current + 1;
    revealRunGenerationRef.current = runGeneration;
    const isCurrent = () => mountedRef.current
      && revealRunGenerationRef.current === runGeneration
      && focusedTargetRef.current?.focusGeneration === target.focusGeneration
      && target.measurementIdentity === measurementIdentity
      && target.openGeneration === openGenerationRef.current;
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
    ) => isValidWaflSheetWindowMeasurement({ measurement: field, target: "field", windowHeight: window.height, windowWidth: window.width })
      && isValidWaflSheetWindowMeasurement({ measurement: viewport, target: "viewport", windowHeight: window.height, windowWidth: window.width })
      && isValidWaflSheetWindowMeasurement({ measurement: sheet, target: "sheet", windowHeight: window.height, windowWidth: window.width });
    const resolveBodyViewportMeasureRef = (): WaflMountedMeasureTarget | null => (
      bodyScrollRef.current?.getNativeScrollRef() ?? bodyViewportRef.current
    );
    const measureFromRefs = async (): Promise<WaflRevealMeasurementSet | null> => {
      const [field, viewport, sheet] = await Promise.all([
        measureMountedTarget(target.revealRef),
        measureMountedTarget(resolveBodyViewportMeasureRef()),
        measureMountedTarget(sheetRef.current),
      ]);
      return isValidSet(field, viewport, sheet)
        ? { field: field!, owner: "ref", sheet: sheet!, viewport: viewport! }
        : null;
    };
    const measureFromHandles = async (): Promise<WaflRevealMeasurementSet | null> => {
      const viewportTarget = findNodeHandle(bodyScrollRef.current ?? bodyViewportRef.current);
      const sheetTarget = findNodeHandle(sheetRef.current);
      const [field, viewport, sheet] = await Promise.all([
        measureHandleTarget(target.revealTarget),
        measureHandleTarget(viewportTarget),
        measureHandleTarget(sheetTarget),
      ]);
      return isValidSet(field, viewport, sheet)
        ? { field: field!, owner: "fallback", sheet: sheet!, viewport: viewport! }
        : null;
    };
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const resolveMeasurements = async () => {
      const primary = await measureFromRefs();
      if (primary !== null || !isCurrent()) return primary;
      await nextFrame();
      if (!isCurrent()) return null;
      const retry = await measureFromRefs();
      if (retry !== null || !isCurrent()) return retry;
      return measureFromHandles();
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fallbackToInputTarget = () => {
        const inputTarget = target.inputTarget ?? findNodeHandle(target.inputRef);
        if (inputTarget !== null) {
          bodyScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(inputTarget, effectiveFocusRevealContext, true);
        }
      };
      const measureAndScrollFieldBlock = async (allowExpansion: boolean) => {
        const measurements = await resolveMeasurements();
        if (!isCurrent()) return;
        if (measurements === null) {
          fallbackToInputTarget();
          return;
        }
        const { field, sheet, viewport } = measurements;
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
          keyboardInset,
          keyboardTop: keyboardInset > 0 ? window.height - keyboardInset : window.height,
          measuredFieldTop: field.y,
          measuredSheetTop: sheet.y,
          measuredViewportTop: viewport.y,
          semanticGap: effectiveFocusRevealContext,
          settledOffset: settledOffsetRef.current,
          translatedOffset: translatedRef.current,
          viewportHeight: viewport.height,
        });
        const motion = resolveWaflDirectInputRevealMotion({
          keyboardMode,
          requiredRise: reveal.requiredRise,
          scrollDelta: reveal.scrollDelta,
          targetOffset: reveal.targetOffset,
        });
        if (allowExpansion && keyboardAutoExpand && keyboardInset > 0 && draggable && motion.sheetRise > 0 && translatedRef.current > 0) {
          if (reveal.targetOffset < translatedRef.current) {
            animateTo(motion.targetOffset, {
              commitSettled: false,
              completion: () => requestAnimationFrame(() => requestAnimationFrame(() => { void measureAndScrollFieldBlock(false); })),
            });
            return;
          }
        }
        if (Math.abs(motion.scrollDelta) >= 1) {
          bodyScrollRef.current?.scrollTo({
            animated: true,
            y: Math.max(0, bodyOffsetRef.current + motion.scrollDelta),
          });
        }
      };
      void measureAndScrollFieldBlock(true);
    }));
  }, [animateTo, draggable, effectiveFocusRevealContext, expandedHeight, keyboardAutoExpand, keyboardInset, keyboardMode, measurementIdentity, window.height, window.width]);

  useEffect(() => {
    if (
      !adaptiveSizing
      || !visible
      || !rendered
      || !openReady
      || !entranceStartedRef.current
      || dismissingRef.current
      || dragging
      || (keyboardMode === "directInput" && keyboardInset > 0)
    ) return;
    const currentOffset = translatedRef.current;
    if (currentOffset <= mediumOffset) return;
    animateTo(mediumOffset);
  }, [adaptiveBodyHeight, adaptiveSizing, animateTo, dragging, keyboardInset, keyboardMode, mediumOffset, openReady, rendered, visible]);

  useEffect(() => {
    const previousInset = previousKeyboardInsetRef.current;
    previousKeyboardInsetRef.current = keyboardInset;
    if (keyboardInset > 0 && previousInset <= 0) {
      const restoringKeyboard = directInputRestoringKeyboardRef.current;
      if (directInputRestoringKeyboardRef.current) {
        directInputRestoringKeyboardRef.current = false;
      } else {
        preKeyboardSettledOffsetRef.current = settledOffsetRef.current;
        userDraggedDuringKeyboardRef.current = false;
      }
      if (keyboardMode === "directInput") {
        const directInputDetent = resolveWaflDirectInputKeyboardDetent({
          currentOffset: translatedRef.current,
          expandedHeight,
          headerHeight,
          intrinsicBodyHeight: intrinsicBodyContentHeightRef.current,
          keyboardInset,
          keyboardMode,
          keyboardVisible: true,
          minimumBodyViewport: WAFL_THEME.sheet.initialBodyViewportMinHeight,
          restingOffset: mediumOffset,
          safeBottom,
          semanticGap: WAFL_THEME.sheet.bodyEndGap,
        });
        directInputKeyboardDetentRef.current = directInputDetent;
        if (restoringKeyboard && Math.abs(translatedRef.current - directInputDetent) < 1) {
          revealFocusedTarget();
        } else {
          animateTo(directInputDetent, {
            commitSettled: false,
            completion: () => revealFocusedTarget(),
          });
        }
      } else {
        revealFocusedTarget();
      }
      return;
    }
    if (keyboardInset > 0) {
      revealFocusedTarget();
      return;
    }
    if (previousInset > 0) {
      if (shouldSuppressWaflSheetKeyboardHideGeometry({
        dismissing: dismissingRef.current,
        keyboardMode,
        sessionState: directInputSessionStateRef.current,
        visible: visibleRef.current,
      })) return;
      const shouldRestoreKeyboard = shouldRestoreDirectInputKeyboard({
        appActive: appStateRef.current === "active",
        gestureActive: directInputGestureActiveRef.current,
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
      if (directInputGestureActiveRef.current) return;
      const restoreOffset = resolveWaflSheetKeyboardRestoreOffset(preKeyboardSettledOffsetRef.current === null
        ? null
        : {
          settledOffset: preKeyboardSettledOffsetRef.current,
          userDragged: userDraggedDuringKeyboardRef.current,
        });
      if (restoreOffset !== null) {
        animateTo(restoreOffset, { commitSettled: false });
      }
      focusedTargetRef.current = null;
      setDirectInputFocusedKey(null);
      preKeyboardSettledOffsetRef.current = null;
      userDraggedDuringKeyboardRef.current = false;
      directInputKeyboardDetentRef.current = null;
    }
  }, [animateTo, expandedHeight, focusDirectInputTarget, headerHeight, keyboardInset, keyboardMode, mediumOffset, revealFocusedTarget, safeBottom]);

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
    startAnimation(animation, generation, () => {
      translatedRef.current = openingOffset;
      completion();
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
    resetDragState();
  }, [resetDragState]);

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
    beginSheetClose("userCancel");
  }, [beginSheetClose]);

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
      animationRef.current?.stop();
      animationRef.current = null;
      if (entranceFrameRef.current !== null) cancelAnimationFrame(entranceFrameRef.current);
      entranceFrameRef.current = null;
      if (entranceReadinessFrameRef.current !== null) cancelAnimationFrame(entranceReadinessFrameRef.current);
      entranceReadinessFrameRef.current = null;
      if (entranceReadinessSecondFrameRef.current !== null) cancelAnimationFrame(entranceReadinessSecondFrameRef.current);
      entranceReadinessSecondFrameRef.current = null;
      translateY.stopAnimation();
      layoutOffset.stopAnimation();
      resetDragState();
      setOpenReady(false);
      entranceStartedRef.current = true;
      dismissingRef.current = false;
      settledOffsetRef.current = mediumOffset;
      preKeyboardSettledOffsetRef.current = null;
      userDraggedDuringKeyboardRef.current = false;
      bodyOffsetRef.current = 0;
      const openingOffset = resolveWaflSheetOpeningOffset(expandedHeight);
      translatedRef.current = openingOffset;
      translateY.setValue(openingOffset);
      layoutOffset.setValue(openingOffset);
      entranceFrameRef.current = requestAnimationFrame(() => {
        entranceFrameRef.current = null;
        if (!mountedRef.current || generation !== openGenerationRef.current || dismissingRef.current) return;
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
        startAnimation(animation, generation, () => {
          translatedRef.current = mediumOffset;
          settledOffsetRef.current = mediumOffset;
          translateY.setValue(mediumOffset);
          layoutOffset.setValue(mediumOffset);
          setOpenReady(true);
          onAfterOpen?.();
        });
      });
      return;
    }
    if (!rendered || dismissingRef.current) return;
    beginSheetClose("programmatic");
  }, [beginSheetClose, entranceMeasurementReady, expandedHeight, keyboardMode, layoutOffset, measurementIdentity, mediumOffset, onAfterOpen, rendered, resetDragState, startAnimation, translateY, visible]);

  const finishDrag = useCallback((dy: number, vy: number) => {
    setDragging(false);
    const directInputKeyboardVisible = directInputGestureActiveRef.current;
    directInputGestureActiveRef.current = false;
    const genericRelease = resolveWaflSheetRelease({
      dragStartOffset: dragStartRef.current,
      dy,
      vy,
      maxSettleOffset: mediumOffset,
      dismissDistance: WAFL_THEME.sheet.dismissDistance,
      dismissVelocity: WAFL_THEME.sheet.dismissVelocity,
      flickVelocity: WAFL_THEME.sheet.flickVelocity,
      velocityProjectionMs: WAFL_THEME.sheet.velocityProjectionMs,
      maxVelocityProjection: WAFL_THEME.sheet.maxVelocityProjection,
    });
    const release = resolveWaflDirectInputDragRelease({
      directInputKeyboardVisible,
      genericRelease,
      keyboardDetent: directInputKeyboardDetentRef.current ?? dragStartRef.current,
    });
    if (release.kind === "dismiss") {
      cancel();
      return;
    }
    animateTo(release.offset, {
      commitSettled: release.commitSettled,
      completion: () => {
        if (
          directInputKeyboardVisible
          && !keyboardVisibleRef.current
          && directInputSessionStateRef.current === "editing"
          && visibleRef.current
          && appStateRef.current === "active"
        ) {
          const targetKey = directInputLastFocusedKeyRef.current;
          directInputRestoreAttemptedRef.current = false;
          directInputRestoringKeyboardRef.current = true;
          if (targetKey !== null) requestAnimationFrame(() => focusDirectInputTarget(targetKey));
        }
      },
    });
  }, [animateTo, cancel, focusDirectInputTarget, mediumOffset, setDragging]);

  const startDrag = useCallback((event: GestureResponderEvent) => {
    if (dismissingRef.current) return;
    animationRef.current?.stop();
    animationRef.current = null;
    translateY.stopAnimation();
    layoutOffset.stopAnimation();
    const stableOffset = resolveWaflSheetDragStartOffset(translatedRef.current, expandedHeight);
    translatedRef.current = stableOffset;
    settledOffsetRef.current = stableOffset;
    dragStartRef.current = stableOffset;
    dragMovedRef.current = false;
    dragStartPageYRef.current = event.nativeEvent.pageY;
    dragLastPageYRef.current = event.nativeEvent.pageY;
    dragLastAtRef.current = Date.now();
    dragVelocityRef.current = 0;
    translateY.setValue(stableOffset);
    layoutOffset.setValue(stableOffset);
    // Native iOS can deliver the first MOVE before stopAnimation's callback.
    // The mounted responder must therefore be ready synchronously at GRANT.
    dragReadyRef.current = true;
    directInputGestureActiveRef.current = keyboardMode === "directInput"
      && keyboardInset > 0
      && keyboardVisibleRef.current;
    if (keyboardInset > 0) {
      userDraggedDuringKeyboardRef.current = true;
    }
    setDragging(true);
  }, [expandedHeight, keyboardInset, keyboardMode, layoutOffset, setDragging, translateY]);
  const moveDrag = useCallback((event: GestureResponderEvent) => {
    if (!dragReadyRef.current) return;
    const pageY = event.nativeEvent.pageY;
    const now = Date.now();
    const elapsed = Math.max(1, now - dragLastAtRef.current);
    dragVelocityRef.current = ((pageY - dragLastPageYRef.current) / elapsed) * 1000;
    dragLastPageYRef.current = pageY;
    dragLastAtRef.current = now;
    const dy = pageY - dragStartPageYRef.current;
    dragMovedRef.current = dragMovedRef.current || Math.abs(dy) > 0;
    const offset = resolveWaflSheetDragOffset({ dragStartOffset: dragStartRef.current, dy, expandedHeight });
    translateY.setValue(offset);
    layoutOffset.setValue(offset);
  }, [expandedHeight, layoutOffset, translateY]);
  const releaseDrag = useCallback((event: GestureResponderEvent) => {
    if (!dragReadyRef.current || !dragMovedRef.current) {
      dragReadyRef.current = false;
      directInputGestureActiveRef.current = false;
      setDragging(false);
      return;
    }
    const dy = event.nativeEvent.pageY - dragStartPageYRef.current;
    dragReadyRef.current = false;
    finishDrag(dy, dragVelocityRef.current / 1000);
  }, [finishDrag, setDragging]);

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
    bodyOffsetRef.current = event.nativeEvent.contentOffset.y;
    bodyContentHeightRef.current = event.nativeEvent.contentSize.height;
    bodyViewportHeightRef.current = event.nativeEvent.layoutMeasurement.height;
    publishBodyScrollMetrics(bodyOffsetRef.current);
  }

  const measureHeader = useCallback((height: number) => {
    setHeaderMeasured(true);
    setHeaderHeight((current) => Math.abs(current - height) >= 1 ? height : current);
  }, [setHeaderHeight, setHeaderMeasured]);
  const measureBody = useCallback((height: number) => {
    intrinsicBodyContentHeightRef.current = height;
    setBodyMeasurement((current) => current.identity !== measurementIdentity || !current.measured || Math.abs(current.height - height) >= 1
      ? { identity: measurementIdentity, height, measured: true }
      : current);
    revealFocusedTarget();
  }, [measurementIdentity, revealFocusedTarget, setBodyMeasurement]);
  const measureFooter = useCallback((height: number) => {
    setFooterMeasured(true);
    setFooterHeight((current) => Math.abs(current - height) >= 1 ? height : current);
  }, [setFooterHeight, setFooterMeasured]);

  async function confirm() {
    const registeredOwner = directInputFormConfirmRef.current;
    const canonicalConfirm = registeredOwner ?? onConfirm;
    const disabled = actionPending || confirmDisabled || directInputFormConfirmDisabled;
    if (disabled || !canonicalConfirm) {
      if (keyboardMode === "directInput") {
        directInputSessionStateRef.current = "editing";
        const targetKey = directInputLastFocusedKeyRef.current;
        const target = directInputFieldsRef.current.find((item) => item.registrationKey === targetKey);
        if (targetKey !== null && !target?.inputRef.isFocused()) {
          requestAnimationFrame(() => focusDirectInputTarget(targetKey));
        }
      }
      return;
    }
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
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!mountedRef.current || !visibleRef.current || dismissingRef.current || pendingRef.current) return;
          directInputSessionStateRef.current = "editing";
          directInputRestoreAttemptedRef.current = false;
          const targetKey = directInputLastFocusedKeyRef.current;
          if (targetKey !== null) focusDirectInputTarget(targetKey);
        }));
      }
    }
  }
  useEffect(() => {
    directInputConfirmRef.current = () => { void confirm(); };
  });

  const handleBodyFocus = useCallback((target: WaflSheetFocusTarget) => {
    focusGenerationRef.current += 1;
    focusedMeasurementIdentityRef.current = measurementIdentity;
    const activeTarget: ActiveWaflSheetFocusTarget = {
      ...target,
      focusGeneration: focusGenerationRef.current,
      measurementIdentity,
      openGeneration: openGenerationRef.current,
    };
    focusedTargetRef.current = activeTarget;
    if (keyboardMode === "directInput") {
      directInputLastFocusedKeyRef.current = target.registrationKey;
      directInputRestoreAttemptedRef.current = false;
      setDirectInputFocusedKey(target.registrationKey);
    }
    revealFocusedTarget(activeTarget);
  }, [keyboardMode, measurementIdentity, revealFocusedTarget]);

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
            accessibilityLabel="입력창 높이 조절"
            accessibilityRole={draggable ? "adjustable" : "header"}
            collapsable={false}
            onLayout={(event) => measureHeader(event.nativeEvent.layout.height)}
            onMoveShouldSetResponderCapture={() => draggable && openReady && !actionPending}
            onResponderGrant={draggable && openReady ? startDrag : undefined}
            onResponderMove={draggable && openReady ? moveDrag : undefined}
            onResponderRelease={draggable && openReady ? releaseDrag : undefined}
            onResponderTerminate={draggable && openReady ? releaseDrag : undefined}
            onResponderTerminationRequest={() => false}
            onStartShouldSetResponderCapture={() => draggable && openReady && !actionPending && !dismissingRef.current}
            style={styles.dragRegion}
            testID={draggable ? "wafl-sheet-header-drag-zone" : "wafl-sheet-fixed-header"}
          >
            {draggable ? <View style={styles.handle} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>WAFL INPUT</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
          <WaflSheetFocusProvider directInput={directInputController} onFocusTarget={handleBodyFocus}>
          {sizing === "contentFit" && !contentFit.overflow && keyboardInset === 0 ? (
            <View onLayout={(event) => measureBody(event.nativeEvent.layout.height)} style={[styles.contentFitBody, contentStyle]}>{children}</View>
          ) : sizing === "contentFit" ? <ScrollView
              contentContainerStyle={[styles.contentFitScrollBody, { paddingBottom: keyboardInset }]}
              keyboardDismissMode={directInputTapPersistence.keyboardDismissMode ?? undefined}
              keyboardShouldPersistTaps={directInputTapPersistence.keyboardShouldPersistTaps}
              nestedScrollEnabled
              onContentSizeChange={(_width, height) => measureBody(height)}
              ref={bodyScrollRef}
              scrollEnabled={!dragging && (contentFit.overflow || keyboardInset > 0)}
              style={[styles.contentFitBody, { height: Math.max(0, expandedBodyViewportHeight) }]}
            ><View style={contentStyle}>{children}</View></ScrollView> : <Animated.View
              collapsable={false}
              ref={bodyViewportRef}
              style={[styles.bodyViewport, { height: animatedBodyViewportHeight }]}
              testID="wafl-sheet-body-viewport"
            >
              {bodyScrollable ? <ScrollView
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
                ref={bodyScrollRef}
                scrollEnabled={!dragging}
                scrollEventThrottle={16}
                style={styles.content}
              ><View
                onLayout={(event) => {
                  const measurement = resolveWaflSheetBodyMeasurements({
                    intrinsicContentHeight: event.nativeEvent.layout.height,
                    reportedScrollContentHeight: bodyContentHeightRef.current,
                    staticEndGap: WAFL_THEME.sheet.bodyEndGap,
                  });
                  measureBody(measurement.adaptiveBodyHeight);
                }}
                style={[styles.intrinsicScrollableContent, contentStyle]}
              >{children}</View></ScrollView> : <View
                onLayout={(event) => measureBody(event.nativeEvent.layout.height)}
                style={[sizing === "reelAdaptive" ? styles.intrinsicBody : styles.content, contentStyle]}
              >{children}</View>}
            </Animated.View>}
          </WaflSheetFocusProvider>
          {hasActions && !cancelActionLabel && !confirmActionLabel ? <View
            onLayout={(event) => measureFooter(event.nativeEvent.layout.height)}
            style={styles.actions}
            testID="wafl-sheet-actions"
          >
            <WaflSheetActionButtons
              cancelAccessibilityLabel={cancelAccessibilityLabel}
              confirmAccessibilityLabel={confirmAccessibilityLabel}
              cancelDisabled={actionPending}
              confirmDisabled={actionPending || confirmDisabled}
              showCancel={showCancelAction}
              onCancel={cancel}
              onConfirm={() => void confirm()}
            />
          </View> : hasActions ? <View
            onLayout={(event) => measureFooter(event.nativeEvent.layout.height)}
            style={styles.actions}
            testID="wafl-sheet-actions"
          >
            <Pressable
              accessibilityLabel={cancelAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: actionPending }}
              disabled={actionPending}
              onPress={cancel}
              style={[styles.cancelButton, actionPending && styles.disabled]}
            >
              <Text style={styles.cancelActionLabel}>{cancelActionLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={confirmAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ busy: actionPending, disabled: actionPending || confirmDisabled }}
              disabled={actionPending || confirmDisabled}
              onPress={() => void confirm()}
              style={[styles.applyButton, (actionPending || confirmDisabled) && styles.disabled]}
            >
              <Text style={styles.confirmActionLabel}>{confirmActionLabel}</Text>
            </Pressable>
          </View> : null}
          <View style={{ height: keyboardLayout.bottomInset }} testID="wafl-sheet-bottom-inset" />
        </Animated.View>
        {keyboardMode === "directInput" && rendered && !replacesSheetDuringProcessing && directInputMinimalAccessoryAction !== null ? <WaflDirectInputKeyboardAccessory
          action={directInputMinimalAccessoryAction}
          disabled={directInputMinimalAccessoryAction === "done" && directInputAccessoryState.doneDisabled}
          nativeID={directInputAccessoryNativeID}
          onPress={() => runDirectInputNavigation(directInputMinimalAccessoryAction)}
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
  dragRegion: { justifyContent: "center", minHeight: WAFL_THEME.sheet.dragZoneMinHeight, paddingBottom: WAFL_THEME.spacing.sm },
  handle: {
    alignSelf: "center",
    backgroundColor: "#c8b7a3",
    borderRadius: WAFL_THEME.radius.pill,
    height: WAFL_THEME.sheet.dragHandleHeight,
    marginBottom: WAFL_THEME.spacing.md,
    width: WAFL_THEME.sheet.dragHandleWidth,
  },
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
