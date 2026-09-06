import { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ForwardedRef, type ReactNode } from "react";
import {
  findNodeHandle,
  TextInput,
  View,
  type LayoutRectangle,
  type TextInputProps,
  type ViewProps,
} from "react-native";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflDirectInputSubmitBehavior,
  resolveWaflSheetSemanticKeyboardClass,
  type WaflDirectInputAccessoryMode,
  type WaflDirectInputAccessoryPolicy,
  type WaflDirectInputReturnKeyPolicy,
  type WaflSheetSemanticKeyboardClass,
} from "@/domain/waflDirectInputKeyboardPolicy";

export type WaflSheetFocusTarget = {
  readonly bodyCoordinateRevision: number;
  readonly registrationKey: string;
  readonly inputRef: TextInput;
  readonly revealRef: View | TextInput;
  readonly inputTarget: number | null;
  readonly keyboardClass: WaflSheetSemanticKeyboardClass;
  readonly revealTarget: number | null;
  readonly semanticScope: boolean;
  readonly sheetLocalLayout: LayoutRectangle | null;
  readonly rawParentLocalLayout: LayoutRectangle | null;
};

export type WaflSheetEditableInputTarget = {
  readonly accessoryMode: WaflDirectInputAccessoryMode;
  readonly completionMode: WaflSheetCompletionMode;
  readonly bodyCoordinateRevision: number;
  readonly registrationKey: string;
  readonly registrationReason: WaflSheetLayoutRegistrationReason;
  readonly resolveSheetLocalLayout: () => LayoutRectangle | null;
  readonly semanticScope: boolean;
  readonly semanticLayoutAtMs: number | null;
  readonly semanticLayoutRevision: number;
  readonly semanticReplayAtMs: number | null;
  readonly semanticSubscriptionAtMs: number | null;
  readonly inputRef: TextInput;
  readonly inputTarget: number | null;
  readonly keyboardClass: WaflSheetSemanticKeyboardClass;
  readonly multiline: boolean;
  readonly keyboardType: string | null;
  readonly returnKeyPolicy: WaflDirectInputReturnKeyPolicy;
  readonly sheetLocalLayout: LayoutRectangle | null;
  readonly rawParentLocalLayout: LayoutRectangle | null;
};

export type WaflSheetLayoutRegistrationReason = "input-ref-bind" | "layout-notification" | "subscription-replay";

export type WaflSheetCompletionMode = "form" | "dismiss" | "search";

export type WaflSheetDirectInputController = {
  readonly accessoryNativeID: string;
  readonly registryVersion: number;
  readonly registerEditableTarget: (target: WaflSheetEditableInputTarget) => void;
  readonly registerFormConfirm: (action: () => Promise<unknown> | unknown) => () => void;
  readonly setFormConfirmDisabled: (disabled: boolean) => void;
  readonly unregisterEditableTarget: (registrationKey: string) => void;
  readonly resolveReturnKeyType: (registrationKey: string, multiline: boolean) => TextInputProps["returnKeyType"];
  readonly submitInput: (registrationKey: string) => void;
};

type FocusTargetRegistrar = (target: WaflSheetFocusTarget) => void;
type FocusTargetBlurRegistrar = (registrationKey: string) => void;

export type WaflSheetBodyCoordinateOwner = {
  readonly resolveRef: () => View | null;
  readonly resolveRevision: () => number;
  readonly subscribeLayout: (listener: () => void) => () => void;
};

const WaflSheetFocusContext = createContext<FocusTargetRegistrar | null>(null);
const WaflSheetBlurContext = createContext<FocusTargetBlurRegistrar | null>(null);
const WaflSheetFocusLifecycleContext = createContext<{ readonly dismissEditing: () => void } | null>(null);
const WaflSheetDirectInputContext = createContext<WaflSheetDirectInputController | null>(null);
const WaflSheetBodyCoordinateContext = createContext<WaflSheetBodyCoordinateOwner | null>(null);
type WaflSheetFocusBlockOwner = {
  readonly resolveBodyCoordinateRevision: () => number;
  readonly resolveLayout: () => LayoutRectangle | null;
  readonly resolveRawParentLocalLayout: () => LayoutRectangle | null;
  readonly resolveLayoutRevision: () => number;
  readonly resolveLayoutUpdatedAtMs: () => number | null;
  readonly resolveRef: () => View | null;
  readonly subscribeLayout: (listener: () => void) => () => void;
};
const WaflSheetFocusBlockContext = createContext<WaflSheetFocusBlockOwner | null>(null);
const WaflSheetSemanticFocusScopeContext = createContext<WaflSheetFocusBlockOwner | null>(null);

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) ref.current = value;
}

function recordSemanticScopeRegistrationEvidence(entry: Readonly<Record<string, unknown>>) {
  if (!__DEV__ || process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() !== "true") return;
  console.info("[WAFL_SEMANTIC_SCOPE_REGISTRATION_EVIDENCE]", JSON.stringify({
    ...entry,
    timestampMs: globalThis.performance.now(),
  }));
}

export function WaflSheetFocusProvider(props: {
  readonly bodyCoordinate?: WaflSheetBodyCoordinateOwner | null;
  readonly children: ReactNode;
  readonly directInput?: WaflSheetDirectInputController | null;
  readonly onDismissEditing?: () => void;
  readonly onBlurTarget?: FocusTargetBlurRegistrar;
  readonly onFocusTarget: FocusTargetRegistrar;
}) {
  return <WaflSheetFocusContext.Provider value={props.onFocusTarget}>
    <WaflSheetBlurContext.Provider value={props.onBlurTarget ?? null}>
      <WaflSheetFocusLifecycleContext.Provider value={props.onDismissEditing ? { dismissEditing: props.onDismissEditing } : null}>
        <WaflSheetDirectInputContext.Provider value={props.directInput ?? null}>
          <WaflSheetBodyCoordinateContext.Provider value={props.bodyCoordinate ?? null}>{props.children}</WaflSheetBodyCoordinateContext.Provider>
        </WaflSheetDirectInputContext.Provider>
      </WaflSheetFocusLifecycleContext.Provider>
    </WaflSheetBlurContext.Provider>
  </WaflSheetFocusContext.Provider>;
}

export function useWaflSheetFocusLifecycle() {
  return useContext(WaflSheetFocusLifecycleContext);
}

function useWaflSheetFocusBlockLayout(semanticScope: boolean) {
  const bodyCoordinate = useContext(WaflSheetBodyCoordinateContext);
  const blockRef = useRef<View>(null);
  const rawParentLocalLayoutRef = useRef<LayoutRectangle | null>(null);
  const layoutRef = useRef<LayoutRectangle | null>(null);
  const layoutRevisionRef = useRef(0);
  const layoutUpdatedAtMsRef = useRef<number | null>(null);
  const layoutListenersRef = useRef(new Set<() => void>());
  const normalizeRequestRef = useRef(0);

  const publishLayout = useCallback((nextLayout: LayoutRectangle | null, reason: string) => {
    const currentLayout = layoutRef.current;
    const changed = currentLayout?.x !== nextLayout?.x
      || currentLayout?.y !== nextLayout?.y
      || currentLayout?.width !== nextLayout?.width
      || currentLayout?.height !== nextLayout?.height;
    if (!changed) return;
    layoutRef.current = nextLayout;
    layoutRevisionRef.current += 1;
    layoutUpdatedAtMsRef.current = globalThis.performance.now();
    if (semanticScope) {
      recordSemanticScopeRegistrationEvidence({
        bodyCoordinateRevision: bodyCoordinate?.resolveRevision() ?? 0,
        event: "semantic-scope-coordinate-normalized",
        normalizedBodyContentLayout: nextLayout,
        rawParentLocalLayout: rawParentLocalLayoutRef.current,
        reason,
      });
    }
    for (const listener of layoutListenersRef.current) listener();
  }, [bodyCoordinate, semanticScope]);

  const normalizeCurrentLayout = useCallback((reason: string) => {
    const request = ++normalizeRequestRef.current;
    const rawLayout = rawParentLocalLayoutRef.current;
    if (rawLayout === null) {
      publishLayout(null, `${reason}:raw-missing`);
      return;
    }
    if (bodyCoordinate === null) {
      // Raw onLayout coordinates are immediate-parent-local and never a
      // canonical Sheet reveal authority. Outside a Sheet there is no reveal
      // owner; inside one, wait for the body-content coordinate owner.
      publishLayout(null, `${reason}:body-owner-absent`);
      return;
    }
    const block = blockRef.current;
    const bodyContent = bodyCoordinate.resolveRef();
    if (block === null || bodyContent === null) {
      publishLayout(null, `${reason}:body-owner-unready`);
      return;
    }
    // onLayout is immediate-parent-local. measureLayout against the canonical
    // body-content ancestor before publishing geometry to the reveal registry.
    // Missing/stale normalized geometry stays null and therefore cannot claim
    // a keyboard appearance's single root writer.
    try {
      block.measureLayout(
        bodyContent,
        (x, y, width, height) => {
          if (request !== normalizeRequestRef.current) return;
          publishLayout({ x, y, width, height }, reason);
        },
        () => {
          if (request !== normalizeRequestRef.current) return;
          publishLayout(null, `${reason}:measure-failed`);
        },
      );
    } catch {
      if (request === normalizeRequestRef.current) publishLayout(null, `${reason}:measure-threw`);
    }
  }, [bodyCoordinate, publishLayout]);

  const [owner] = useState<WaflSheetFocusBlockOwner>(() => ({
    resolveBodyCoordinateRevision: () => bodyCoordinate?.resolveRevision() ?? 0,
    resolveLayout: () => layoutRef.current,
    resolveRawParentLocalLayout: () => rawParentLocalLayoutRef.current,
    resolveLayoutRevision: () => layoutRevisionRef.current,
    resolveLayoutUpdatedAtMs: () => layoutUpdatedAtMsRef.current,
    resolveRef: () => blockRef.current,
    subscribeLayout: (listener) => {
      layoutListenersRef.current.add(listener);
      return () => layoutListenersRef.current.delete(listener);
    },
  }));
  useLayoutEffect(() => {
    if (bodyCoordinate === null) return undefined;
    const unsubscribe = bodyCoordinate.subscribeLayout(() => normalizeCurrentLayout("body-content-layout"));
    normalizeCurrentLayout("body-content-subscription-replay");
    return unsubscribe;
  }, [bodyCoordinate, normalizeCurrentLayout]);
  return {
    blockRef,
    handleLayout: (nextLayout: LayoutRectangle) => {
      const currentRawLayout = rawParentLocalLayoutRef.current;
      const changed = currentRawLayout?.x !== nextLayout.x
        || currentRawLayout?.y !== nextLayout.y
        || currentRawLayout?.width !== nextLayout.width
        || currentRawLayout?.height !== nextLayout.height;
      rawParentLocalLayoutRef.current = nextLayout;
      if (!changed) return;
      if (bodyCoordinate !== null && layoutRef.current !== null) {
        publishLayout(null, "parent-layout-invalidated");
      }
      normalizeCurrentLayout("parent-layout");
    },
    owner,
    rawParentLocalLayoutRef,
  };
}

export function WaflSheetFocusBlock(props: ViewProps & { readonly children: ReactNode }) {
  const { blockRef, handleLayout, owner } = useWaflSheetFocusBlockLayout(false);
  const { children, onLayout, ...viewProps } = props;
  return <WaflSheetFocusBlockContext.Provider value={owner}>
    <View
      {...viewProps}
      collapsable={false}
      onLayout={(event) => {
        handleLayout(event.nativeEvent.layout);
        onLayout?.(event);
      }}
      ref={blockRef}
    >{children}</View>
  </WaflSheetFocusBlockContext.Provider>;
}

/** Selectively expands one field's reveal target to a measured semantic region. */
export function WaflSheetSemanticFocusScope(props: ViewProps & { readonly children: ReactNode }) {
  const { blockRef, handleLayout, owner, rawParentLocalLayoutRef } = useWaflSheetFocusBlockLayout(true);
  const { children, onLayout, ...viewProps } = props;
  return <WaflSheetSemanticFocusScopeContext.Provider value={owner}>
    <View
      {...viewProps}
      collapsable={false}
      onLayout={(event) => {
        const initialLayout = rawParentLocalLayoutRef.current === null;
        handleLayout(event.nativeEvent.layout);
        onLayout?.(event);
        recordSemanticScopeRegistrationEvidence({
          event: "semantic-scope-parent-layout",
          initialLayout,
          rawParentLocalLayout: event.nativeEvent.layout,
        });
      }}
      ref={blockRef}
    >{children}</View>
  </WaflSheetSemanticFocusScopeContext.Provider>;
}

export function useWaflSheetDirectInputConfirm(action: () => Promise<unknown> | unknown, disabled = false) {
  const directInput = useContext(WaflSheetDirectInputContext);
  const actionRef = useRef(action);
  const registerFormConfirm = directInput?.registerFormConfirm;
  const setFormConfirmDisabled = directInput?.setFormConfirmDisabled;
  useEffect(() => { actionRef.current = action; }, [action]);
  useEffect(() => registerFormConfirm?.(() => actionRef.current()), [registerFormConfirm]);
  useEffect(() => { setFormConfirmDisabled?.(disabled); }, [disabled, setFormConfirmDisabled]);
}

type WaflSheetTextInputProps = TextInputProps & {
  readonly waflCompletionMode?: WaflSheetCompletionMode;
  readonly waflKeyboardAccessory?: WaflDirectInputAccessoryPolicy;
  readonly waflReturnKeyPolicy?: WaflDirectInputReturnKeyPolicy;
};

const WaflSheetTextInput = forwardRef<TextInput, WaflSheetTextInputProps>(function WaflSheetTextInput(props, ref) {
  const {
    waflCompletionMode = "form",
    waflKeyboardAccessory = "auto",
    waflReturnKeyPolicy = "auto",
    ...nativeProps
  } = props;
  const onFocusTarget = useContext(WaflSheetFocusContext);
  const onBlurTarget = useContext(WaflSheetBlurContext);
  const directInput = useContext(WaflSheetDirectInputContext);
  const focusBlock = useContext(WaflSheetFocusBlockContext);
  const semanticFocusScope = useContext(WaflSheetSemanticFocusScopeContext);
  const revealBlock = semanticFocusScope ?? focusBlock;
  const focusedRef = useRef(false);
  const targetRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const semanticReplayAtMsRef = useRef<number | null>(null);
  const semanticSubscriptionAtMsRef = useRef<number | null>(null);
  const [registrationKey] = useState(() => `wafl-sheet-input-${nextWaflSheetInputRegistrationId()}`);
  const registerEditableTarget = directInput?.registerEditableTarget;
  const unregisterEditableTarget = directInput?.unregisterEditableTarget;
  const accessoryMode = resolveWaflDirectInputAccessoryMode({
    accessoryPolicy: waflKeyboardAccessory,
    keyboardType: props.keyboardType,
    multiline: Boolean(props.multiline),
  });
  const keyboardClass = resolveWaflSheetSemanticKeyboardClass({
    completionMode: waflCompletionMode,
    keyboardType: props.keyboardType,
    multiline: Boolean(props.multiline),
  });

  const registerMountedEditableTarget = useCallback((registrationReason: WaflSheetLayoutRegistrationReason = "input-ref-bind") => {
    const mountedInput = inputRef.current;
    if (mountedInput === null || props.editable === false) return;
    const sheetLocalLayout = revealBlock?.resolveLayout() ?? null;
    registerEditableTarget?.({
      accessoryMode,
      bodyCoordinateRevision: revealBlock?.resolveBodyCoordinateRevision() ?? 0,
      completionMode: waflCompletionMode,
      inputRef: mountedInput,
      inputTarget: findNodeHandle(mountedInput),
      keyboardClass,
      keyboardType: props.keyboardType ?? null,
      multiline: Boolean(props.multiline),
      registrationKey,
      registrationReason,
      resolveSheetLocalLayout: () => revealBlock?.resolveLayout() ?? null,
      semanticScope: semanticFocusScope !== null,
      semanticLayoutAtMs: revealBlock?.resolveLayoutUpdatedAtMs() ?? null,
      semanticLayoutRevision: revealBlock?.resolveLayoutRevision() ?? 0,
      semanticReplayAtMs: semanticReplayAtMsRef.current,
      semanticSubscriptionAtMs: semanticSubscriptionAtMsRef.current,
      sheetLocalLayout,
      rawParentLocalLayout: revealBlock?.resolveRawParentLocalLayout() ?? null,
      returnKeyPolicy: waflReturnKeyPolicy,
    });
  }, [accessoryMode, keyboardClass, props.editable, props.keyboardType, props.multiline, registerEditableTarget, registrationKey, revealBlock, semanticFocusScope, waflCompletionMode, waflReturnKeyPolicy]);

  const registerFocusedTarget = useCallback((target: number | null) => {
    const mountedInput = inputRef.current;
    if (mountedInput === null) return;
    const sheetLocalLayout = revealBlock?.resolveLayout() ?? null;
    // Explicit semantic scopes are not allowed to start a keyboard appearance
    // from incomplete parent-local geometry. The layout subscription below
    // replays this focus intent as soon as canonical body coordinates exist.
    if (semanticFocusScope !== null && sheetLocalLayout === null) return;
    const mountedReveal = revealBlock?.resolveRef() ?? mountedInput;
    onFocusTarget?.({
      bodyCoordinateRevision: revealBlock?.resolveBodyCoordinateRevision() ?? 0,
      registrationKey,
      inputRef: mountedInput,
      revealRef: mountedReveal,
      inputTarget: target,
      keyboardClass,
      revealTarget: findNodeHandle(mountedReveal),
      semanticScope: semanticFocusScope !== null,
      sheetLocalLayout,
      rawParentLocalLayout: revealBlock?.resolveRawParentLocalLayout() ?? null,
    });
  }, [keyboardClass, onFocusTarget, registrationKey, revealBlock, semanticFocusScope]);

  const bindInputRef = useCallback((value: TextInput | null) => {
    if (inputRef.current !== null && inputRef.current !== value) {
      unregisterEditableTarget?.(registrationKey);
    }
    inputRef.current = value;
    setForwardedRef(ref, value);
    if (value !== null) registerMountedEditableTarget("input-ref-bind");
  }, [ref, registerMountedEditableTarget, registrationKey, unregisterEditableTarget]);

  // Subscribe first, then replay the latest stored layout synchronously with
  // commit. This closes both sides of the cold-start race: a native layout
  // that already happened is replayed, while one that follows subscription is
  // delivered by the listener without waiting for another layout change.
  useLayoutEffect(() => {
    if (revealBlock === null) return undefined;
    const handleLayoutNotification = () => {
      registerMountedEditableTarget("layout-notification");
      if (focusedRef.current) registerFocusedTarget(targetRef.current);
    };
    const unsubscribe = revealBlock.subscribeLayout(handleLayoutNotification);
    semanticSubscriptionAtMsRef.current = globalThis.performance.now();
    recordSemanticScopeRegistrationEvidence({
      currentLayout: revealBlock.resolveLayout(),
      event: "semantic-scope-subscriber-installed",
      layoutRevision: revealBlock.resolveLayoutRevision(),
      semanticScope: semanticFocusScope !== null,
    });
    semanticReplayAtMsRef.current = globalThis.performance.now();
    registerMountedEditableTarget("subscription-replay");
    recordSemanticScopeRegistrationEvidence({
      currentLayout: revealBlock.resolveLayout(),
      event: "semantic-scope-immediate-replay",
      layoutRevision: revealBlock.resolveLayoutRevision(),
      replayExecuted: true,
      semanticScope: semanticFocusScope !== null,
    });
    return unsubscribe;
  }, [registerFocusedTarget, registerMountedEditableTarget, revealBlock, semanticFocusScope]);

  useEffect(() => () => {
    unregisterEditableTarget?.(registrationKey);
  }, [registrationKey, unregisterEditableTarget]);

  function handleSubmitEditing(event: Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0]) {
    props.onSubmitEditing?.(event);
    if (directInput !== null && !props.multiline && waflReturnKeyPolicy !== "none") {
      directInput.submitInput(registrationKey);
    }
  }

  function handleFocus(event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) {
    focusedRef.current = true;
    targetRef.current = event.nativeEvent.target;
    registerFocusedTarget(targetRef.current);
    props.onFocus?.(event);
  }

  function handleBlur(event: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) {
    focusedRef.current = false;
    onBlurTarget?.(registrationKey);
    props.onBlur?.(event);
  }

  function handleContentSizeChange(event: Parameters<NonNullable<TextInputProps["onContentSizeChange"]>>[0]) {
    props.onContentSizeChange?.(event);
    if (focusedRef.current) registerFocusedTarget(targetRef.current);
  }

  function handleSelectionChange(event: Parameters<NonNullable<TextInputProps["onSelectionChange"]>>[0]) {
    props.onSelectionChange?.(event);
    if (focusedRef.current && props.multiline) registerFocusedTarget(targetRef.current);
  }

  const directReturnKeyType = directInput?.resolveReturnKeyType(
    registrationKey,
    Boolean(props.multiline),
  );
  const effectiveReturnKeyType = waflReturnKeyPolicy === "none"
    ? undefined
    : directInput !== null && !props.multiline
    ? waflCompletionMode === "search" ? "search" : directReturnKeyType
    : props.returnKeyType;
  const effectiveSubmitBehavior = waflReturnKeyPolicy === "none" ? props.submitBehavior : resolveWaflDirectInputSubmitBehavior({
    directInput: directInput !== null,
    multiline: Boolean(props.multiline),
  }) ?? props.submitBehavior;

  return <TextInput
    {...nativeProps}
    inputAccessoryViewID={props.inputAccessoryViewID ?? (
      directInput !== null && accessoryMode === "singleAction"
        ? directInput.accessoryNativeID
        : undefined
    )}
    onBlur={handleBlur}
    onContentSizeChange={handleContentSizeChange}
    onFocus={handleFocus}
    onSelectionChange={handleSelectionChange}
    onSubmitEditing={handleSubmitEditing}
    ref={bindInputRef}
    returnKeyType={effectiveReturnKeyType}
    submitBehavior={effectiveSubmitBehavior}
  />;
});

let waflSheetInputRegistrationSequence = 0;

function nextWaflSheetInputRegistrationId() {
  waflSheetInputRegistrationSequence += 1;
  return waflSheetInputRegistrationSequence;
}

export default WaflSheetTextInput;
