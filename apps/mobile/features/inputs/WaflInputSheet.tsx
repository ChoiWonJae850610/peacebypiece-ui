import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
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
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { createWaflInputCommitGuard } from "./waflInputCommitGuard";
import { WaflSheetFocusProvider, type WaflSheetFocusTarget } from "./WaflSheetTextInput";
import {
  resolveWaflSheetDragOffset,
  resolveWaflAdaptiveBodyHeight,
  resolveWaflAdaptiveInitialHeight,
  resolveWaflExpandableInitialHeight,
  resolveWaflContentFitHeight,
  resolveWaflSheetDragStartOffset,
  resolveWaflSheetFieldReveal,
  resolveWaflSheetEntranceReadiness,
  resolveWaflSheetKeyboardLayout,
  resolveWaflSheetMeasurementIdentity,
  resolveWaflSheetOpeningOffset,
  resolveWaflSheetRelease,
  type WaflSheetSizing,
} from "@/domain/waflSheetDetentPolicy";

type Props = {
  readonly visible: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly pending?: boolean;
  readonly confirmDisabled?: boolean;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly cancelAccessibilityLabel?: string;
  readonly confirmAccessibilityLabel?: string;
  readonly cancelActionLabel?: string;
  readonly confirmActionLabel?: string;
  readonly bodyScrollable?: boolean;
  readonly keyboardAutoExpand?: boolean;
  readonly keyboardFocusRevealContext?: number;
  readonly sizing?: WaflSheetSizing;
  readonly adaptiveMinimumBodyHeight?: number;
  readonly measurementVariant?: string;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onAfterOpen?: () => void;
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
  confirmDisabled = false,
  contentStyle,
  cancelAccessibilityLabel = "변경 취소",
  confirmAccessibilityLabel = "변경 저장",
  cancelActionLabel,
  confirmActionLabel,
  bodyScrollable = true,
  keyboardAutoExpand = false,
  keyboardFocusRevealContext = WAFL_THEME.sheet.focusRevealContext,
  sizing = "expandable",
  adaptiveMinimumBodyHeight = 0,
  measurementVariant,
  presentationGeneration,
  onCancel,
  onAfterClose,
  onAfterOpen,
  onBodyScrollMetrics,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const hasActions = Boolean(onConfirm);
  const [openSessionGeneration, setOpenSessionGeneration] = useState(0);
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
  const bodyViewportHeightRef = useRef(0);
  const bodyScrollRef = useRef<ScrollView>(null);
  const focusedTargetRef = useRef<WaflSheetFocusTarget | null>(null);
  const focusedMeasurementIdentityRef = useRef(measurementIdentity);
  const dragStartRef = useRef(0);
  const dragStartPageYRef = useRef(0);
  const dragLastPageYRef = useRef(0);
  const dragLastAtRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const dragReadyRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dismissingRef = useRef(false);
  const entranceStartedRef = useRef(false);
  const translatedRef = useRef(0);
  const settledOffsetRef = useRef(0);
  const preKeyboardSettledOffsetRef = useRef<number | null>(null);
  const keyboardSystemExpandedRef = useRef(false);
  const userDraggedDuringKeyboardRef = useRef(false);
  const previousKeyboardInsetRef = useRef(0);
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
  const actionPending = pending || submitting;
  const effectiveFocusRevealContext = keyboardAutoExpand
    ? Math.max(keyboardFocusRevealContext, WAFL_THEME.sheet.numericFocusRevealContext)
    : keyboardFocusRevealContext;
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

  useEffect(() => {
    const listener = translateY.addListener(({ value }) => { translatedRef.current = value; });
    return () => translateY.removeListener(listener);
  }, [translateY]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
      setKeyboardInset(Math.max(0, Math.round(window.height - event.endCoordinates.screenY)));
    };
    const hide = () => setKeyboardInset(0);
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
  }, [window.height]);

  const resetDragState = useCallback(() => {
    dragReadyRef.current = false;
    dragMovedRef.current = false;
    dragStartRef.current = 0;
    dragStartPageYRef.current = 0;
    dragLastPageYRef.current = 0;
    dragLastAtRef.current = 0;
    dragVelocityRef.current = 0;
    setDragging(false);
  }, []);

  const startAnimation = useCallback((animation: Animated.CompositeAnimation, generation: number, completion?: () => void) => {
    animationRef.current?.stop();
    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (animationRef.current === animation) animationRef.current = null;
      if (finished && generation === openGenerationRef.current) completion?.();
    });
  }, []);

  const animateTo = useCallback((offset: number, options?: { readonly commitSettled?: boolean; readonly completion?: () => void }) => {
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
  }, [layoutOffset, mediumOffset, startAnimation, translateY]);

  const revealFocusedTarget = useCallback((target = focusedTargetRef.current) => {
    if (target === null || focusedMeasurementIdentityRef.current !== measurementIdentity) return;
    focusedTargetRef.current = target;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fallbackToInputTarget = () => bodyScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        target.inputTarget,
        effectiveFocusRevealContext,
        true,
      );
      const viewportTarget = findNodeHandle(bodyScrollRef.current);
      if (viewportTarget === null) {
        fallbackToInputTarget();
        return;
      }
      const measureAndScrollFieldBlock = (allowExpansion: boolean) => {
        UIManager.measure(target.revealTarget, (_fieldX, _fieldY, _fieldWidth, fieldHeight, _fieldPageX, fieldPageY) => {
          if (!mountedRef.current) return;
          UIManager.measure(viewportTarget, (_viewportX, _viewportY, _viewportWidth, viewportHeight, _viewportPageX, viewportPageY) => {
            if (!mountedRef.current) return;
            const reveal = resolveWaflSheetFieldReveal({
              fieldBottom: fieldPageY + fieldHeight,
              fieldTop: fieldPageY,
              keyboardTop: keyboardInset > 0 ? window.height - keyboardInset : window.height,
              semanticGap: effectiveFocusRevealContext,
              availableForwardScroll: Math.max(0, bodyContentHeight - viewportHeight - bodyOffsetRef.current),
              viewportBottom: viewportPageY + viewportHeight,
              viewportTop: viewportPageY,
            });
            if (allowExpansion && keyboardInset > 0 && draggable && reveal.requiredRise > 0 && translatedRef.current > 0) {
              const targetOffset = Math.max(0, translatedRef.current - reveal.requiredRise);
              if (targetOffset < translatedRef.current) {
                keyboardSystemExpandedRef.current = true;
                animateTo(targetOffset, {
                  commitSettled: false,
                  completion: () => requestAnimationFrame(() => measureAndScrollFieldBlock(false)),
                });
                return;
              }
            }
            if (Math.abs(reveal.scrollDelta) >= 1) {
              bodyScrollRef.current?.scrollTo({
                animated: true,
                y: Math.max(0, bodyOffsetRef.current + reveal.scrollDelta),
              });
            }
          });
        });
      };
      measureAndScrollFieldBlock(true);
    }));
  }, [animateTo, bodyContentHeight, draggable, effectiveFocusRevealContext, keyboardInset, measurementIdentity, window.height]);

  useEffect(() => {
    if (
      !adaptiveSizing
      || !visible
      || !rendered
      || !openReady
      || !entranceStartedRef.current
      || dismissingRef.current
      || dragging
    ) return;
    const currentOffset = translatedRef.current;
    if (currentOffset <= mediumOffset) return;
    animateTo(mediumOffset);
  }, [adaptiveBodyHeight, adaptiveSizing, animateTo, dragging, mediumOffset, openReady, rendered, visible]);

  useEffect(() => {
    const previousInset = previousKeyboardInsetRef.current;
    previousKeyboardInsetRef.current = keyboardInset;
    if (keyboardInset > 0 && previousInset <= 0) {
      preKeyboardSettledOffsetRef.current = settledOffsetRef.current;
      keyboardSystemExpandedRef.current = false;
      userDraggedDuringKeyboardRef.current = false;
      revealFocusedTarget();
      return;
    }
    if (keyboardInset > 0) {
      revealFocusedTarget();
      return;
    }
    if (previousInset > 0) {
      const restoreOffset = preKeyboardSettledOffsetRef.current;
      if (keyboardSystemExpandedRef.current && !userDraggedDuringKeyboardRef.current && restoreOffset !== null) {
        animateTo(restoreOffset, { commitSettled: false });
      }
      preKeyboardSettledOffsetRef.current = null;
      keyboardSystemExpandedRef.current = false;
      userDraggedDuringKeyboardRef.current = false;
    }
  }, [animateTo, keyboardInset, revealFocusedTarget]);

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

  const cancel = useCallback(() => {
    if (actionPending || dismissingRef.current) return;
    openGenerationRef.current += 1;
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
    dismissingRef.current = true;
    animateDown(() => {
      if (!mountedRef.current) return;
      setRendered(false);
      setOpenReady(false);
      setEntranceMeasurementReady(false);
      entranceReadyTargetRef.current = null;
      onCancel();
      dismissingRef.current = false;
      entranceStartedRef.current = false;
      requestAnimationFrame(() => {
        if (mountedRef.current) onAfterClose?.();
      });
    });
  }, [actionPending, animateDown, onAfterClose, onCancel, resetDragState]);

  useEffect(() => {
    if (visible) {
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
      keyboardSystemExpandedRef.current = false;
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
    openGenerationRef.current += 1;
    if (entranceFrameRef.current !== null) {
      cancelAnimationFrame(entranceFrameRef.current);
      entranceFrameRef.current = null;
    }
    resetDragState();
    dismissingRef.current = true;
    animateDown(() => {
      if (!mountedRef.current) return;
      setRendered(false);
      setOpenReady(false);
      setEntranceMeasurementReady(false);
      entranceReadyTargetRef.current = null;
      dismissingRef.current = false;
      entranceStartedRef.current = false;
      requestAnimationFrame(() => {
        if (mountedRef.current) onAfterClose?.();
      });
    });
  }, [animateDown, entranceMeasurementReady, expandedHeight, layoutOffset, measurementIdentity, mediumOffset, onAfterClose, onAfterOpen, rendered, resetDragState, startAnimation, translateY, visible]);

  const finishDrag = useCallback((dy: number, vy: number) => {
    setDragging(false);
    const release = resolveWaflSheetRelease({
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
    if (release.kind === "dismiss") {
      cancel();
      return;
    }
    animateTo(release.offset);
  }, [animateTo, cancel, mediumOffset]);

  const startDrag = useCallback((event: GestureResponderEvent) => {
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
    if (keyboardInset > 0) {
      userDraggedDuringKeyboardRef.current = true;
      keyboardSystemExpandedRef.current = false;
    }
    setDragging(true);
  }, [expandedHeight, keyboardInset, layoutOffset, translateY]);
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
      setDragging(false);
      return;
    }
    const dy = event.nativeEvent.pageY - dragStartPageYRef.current;
    dragReadyRef.current = false;
    finishDrag(dy, dragVelocityRef.current / 1000);
  }, [finishDrag]);

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
  }, []);
  const measureBody = useCallback((height: number) => {
    setBodyMeasurement((current) => current.identity !== measurementIdentity || !current.measured || Math.abs(current.height - height) >= 1
      ? { identity: measurementIdentity, height, measured: true }
      : current);
    revealFocusedTarget();
  }, [measurementIdentity, revealFocusedTarget]);
  const measureFooter = useCallback((height: number) => {
    setFooterMeasured(true);
    setFooterHeight((current) => Math.abs(current - height) >= 1 ? height : current);
  }, []);

  async function confirm() {
    if (actionPending || confirmDisabled || !onConfirm) return;
    const submitted = await guardRef.current.submit(async () => {
      if (mountedRef.current) setSubmitting(true);
      try {
        await onConfirm();
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    });
    if (!submitted.accepted && mountedRef.current) setSubmitting(guardRef.current.isActive());
  }

  const handleBodyFocus = useCallback((target: WaflSheetFocusTarget) => {
    focusedMeasurementIdentityRef.current = measurementIdentity;
    revealFocusedTarget(target);
  }, [measurementIdentity, revealFocusedTarget]);

  return (
    <Modal animationType="none" onRequestClose={cancel} presentationStyle="overFullScreen" transparent visible={rendered}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="입력창 닫기" disabled={actionPending} onPress={cancel} style={styles.backdrop} />
        <Animated.View
          style={[styles.sheet, { height: expandedHeight, transform: [{ translateY }] }]}
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
            onStartShouldSetResponderCapture={() => draggable && openReady && !actionPending}
            style={styles.dragRegion}
            testID={draggable ? "wafl-sheet-header-drag-zone" : "wafl-sheet-fixed-header"}
          >
            {draggable ? <View style={styles.handle} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>WAFL INPUT</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
          <WaflSheetFocusProvider onFocusTarget={handleBodyFocus}>
          {sizing === "contentFit" && !contentFit.overflow && keyboardInset === 0 ? (
            <View onLayout={(event) => measureBody(event.nativeEvent.layout.height)} style={[styles.contentFitBody, contentStyle]}>{children}</View>
          ) : sizing === "contentFit" ? <ScrollView
              contentContainerStyle={[styles.contentFitScrollBody, { paddingBottom: keyboardInset }]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onContentSizeChange={(_width, height) => measureBody(height)}
              ref={bodyScrollRef}
              scrollEnabled={!dragging && (contentFit.overflow || keyboardInset > 0)}
              style={[styles.contentFitBody, { height: Math.max(0, expandedBodyViewportHeight) }]}
            ><View style={contentStyle}>{children}</View></ScrollView> : <Animated.View
              style={[styles.bodyViewport, { height: animatedBodyViewportHeight }]}
              testID="wafl-sheet-body-viewport"
            >
              {bodyScrollable ? <ScrollView
                contentContainerStyle={[styles.scrollBodyContent, { paddingBottom: WAFL_THEME.sheet.bodyEndGap + keyboardInset }]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                onContentSizeChange={(_width, height) => {
                  bodyContentHeightRef.current = height;
                  measureBody(height);
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
              ><View style={contentStyle}>{children}</View></ScrollView> : <View
                onLayout={(event) => measureBody(event.nativeEvent.layout.height)}
                style={[sizing === "reelAdaptive" ? styles.intrinsicBody : styles.content, contentStyle]}
              >{children}</View>}
            </Animated.View>}
          </WaflSheetFocusProvider>
          {hasActions ? <View
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
              {cancelActionLabel ? <Text style={styles.cancelActionLabel}>{cancelActionLabel}</Text> : <X color={WAFL_THEME.color.deepNavy} size={21} strokeWidth={2.4} />}
            </Pressable>
            <Pressable
              accessibilityLabel={confirmAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ busy: actionPending, disabled: actionPending || confirmDisabled }}
              disabled={actionPending || confirmDisabled}
              onPress={() => void confirm()}
              style={[styles.applyButton, (actionPending || confirmDisabled) && styles.disabled]}
            >
              {confirmActionLabel ? <Text style={styles.confirmActionLabel}>{confirmActionLabel}</Text> : <Check color="#fff" size={21} strokeWidth={2.5} />}
            </Pressable>
          </View> : null}
          <View style={{ height: keyboardLayout.bottomInset }} testID="wafl-sheet-bottom-inset" />
        </Animated.View>
      </View>
    </Modal>
  );
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
