import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState, type ForwardedRef, type ReactNode } from "react";
import {
  findNodeHandle,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflDirectInputSubmitBehavior,
  type WaflDirectInputAccessoryMode,
} from "@/domain/waflDirectInputKeyboardPolicy";

export type WaflSheetFocusTarget = {
  readonly registrationKey: string;
  readonly inputRef: TextInput;
  readonly revealRef: View | TextInput;
  readonly inputTarget: number | null;
  readonly revealTarget: number | null;
};

export type WaflSheetEditableInputTarget = {
  readonly accessoryMode: WaflDirectInputAccessoryMode;
  readonly registrationKey: string;
  readonly inputRef: TextInput;
  readonly multiline: boolean;
};

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

const WaflSheetFocusContext = createContext<FocusTargetRegistrar | null>(null);
const WaflSheetDirectInputContext = createContext<WaflSheetDirectInputController | null>(null);
const WaflSheetFocusBlockContext = createContext<(() => View | null) | null>(null);

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) ref.current = value;
}

export function WaflSheetFocusProvider(props: {
  readonly children: ReactNode;
  readonly directInput?: WaflSheetDirectInputController | null;
  readonly onFocusTarget: FocusTargetRegistrar;
}) {
  return <WaflSheetFocusContext.Provider value={props.onFocusTarget}>
    <WaflSheetDirectInputContext.Provider value={props.directInput ?? null}>{props.children}</WaflSheetDirectInputContext.Provider>
  </WaflSheetFocusContext.Provider>;
}

export function WaflSheetFocusBlock(props: ViewProps & { readonly children: ReactNode }) {
  const blockRef = useRef<View>(null);
  return <WaflSheetFocusBlockContext.Provider value={() => blockRef.current}>
    <View {...props} collapsable={false} ref={blockRef}>{props.children}</View>
  </WaflSheetFocusBlockContext.Provider>;
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

const WaflSheetTextInput = forwardRef<TextInput, TextInputProps>(function WaflSheetTextInput(props, ref) {
  const onFocusTarget = useContext(WaflSheetFocusContext);
  const directInput = useContext(WaflSheetDirectInputContext);
  const resolveFocusBlockRef = useContext(WaflSheetFocusBlockContext);
  const focusedRef = useRef(false);
  const targetRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const [registrationKey] = useState(() => `wafl-sheet-input-${nextWaflSheetInputRegistrationId()}`);
  const registerEditableTarget = directInput?.registerEditableTarget;
  const unregisterEditableTarget = directInput?.unregisterEditableTarget;
  const accessoryMode = resolveWaflDirectInputAccessoryMode({
    keyboardType: props.keyboardType,
    multiline: Boolean(props.multiline),
  });

  const bindInputRef = useCallback((value: TextInput | null) => {
    if (inputRef.current !== null && inputRef.current !== value) {
      unregisterEditableTarget?.(registrationKey);
    }
    inputRef.current = value;
    setForwardedRef(ref, value);
    if (value !== null && props.editable !== false) {
      registerEditableTarget?.({
        accessoryMode,
        inputRef: value,
        multiline: Boolean(props.multiline),
        registrationKey,
      });
    }
  }, [accessoryMode, props.editable, props.multiline, ref, registerEditableTarget, registrationKey, unregisterEditableTarget]);

  useEffect(() => () => {
    unregisterEditableTarget?.(registrationKey);
  }, [registrationKey, unregisterEditableTarget]);

  function register(target: number | null) {
    const mountedInput = inputRef.current;
    if (mountedInput === null) return;
    const mountedReveal = resolveFocusBlockRef?.() ?? mountedInput;
    onFocusTarget?.({
      registrationKey,
      inputRef: mountedInput,
      revealRef: mountedReveal,
      inputTarget: target,
      revealTarget: findNodeHandle(mountedReveal),
    });
  }

  function handleSubmitEditing(event: Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0]) {
    props.onSubmitEditing?.(event);
    if (directInput !== null && !props.multiline) {
      directInput.submitInput(registrationKey);
    }
  }

  function handleFocus(event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) {
    focusedRef.current = true;
    targetRef.current = event.nativeEvent.target;
    register(targetRef.current);
    props.onFocus?.(event);
  }

  function handleBlur(event: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) {
    focusedRef.current = false;
    props.onBlur?.(event);
  }

  function handleContentSizeChange(event: Parameters<NonNullable<TextInputProps["onContentSizeChange"]>>[0]) {
    props.onContentSizeChange?.(event);
    if (focusedRef.current) register(targetRef.current);
  }

  function handleSelectionChange(event: Parameters<NonNullable<TextInputProps["onSelectionChange"]>>[0]) {
    props.onSelectionChange?.(event);
    if (focusedRef.current && props.multiline) register(targetRef.current);
  }

  const directReturnKeyType = directInput?.resolveReturnKeyType(
    registrationKey,
    Boolean(props.multiline),
  );
  const effectiveReturnKeyType = directInput !== null && !props.multiline
    ? directReturnKeyType
    : props.returnKeyType;
  const effectiveSubmitBehavior = resolveWaflDirectInputSubmitBehavior({
    directInput: directInput !== null,
    multiline: Boolean(props.multiline),
  }) ?? props.submitBehavior;

  return <TextInput
    {...props}
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
