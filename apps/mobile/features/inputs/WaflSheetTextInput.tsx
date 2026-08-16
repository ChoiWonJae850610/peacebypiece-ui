import { createContext, forwardRef, useContext, useRef, type ReactNode } from "react";
import {
  findNodeHandle,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";

export type WaflSheetFocusTarget = {
  readonly inputTarget: number;
  readonly revealTarget: number;
};

type FocusTargetRegistrar = (target: WaflSheetFocusTarget) => void;

const WaflSheetFocusContext = createContext<FocusTargetRegistrar | null>(null);
const WaflSheetFocusBlockContext = createContext<(() => number | null) | null>(null);

export function WaflSheetFocusProvider(props: {
  readonly children: ReactNode;
  readonly onFocusTarget: FocusTargetRegistrar;
}) {
  return <WaflSheetFocusContext.Provider value={props.onFocusTarget}>{props.children}</WaflSheetFocusContext.Provider>;
}

export function WaflSheetFocusBlock(props: ViewProps & { readonly children: ReactNode }) {
  const blockRef = useRef<View>(null);
  return <WaflSheetFocusBlockContext.Provider value={() => findNodeHandle(blockRef.current)}>
    <View {...props} collapsable={false} ref={blockRef}>{props.children}</View>
  </WaflSheetFocusBlockContext.Provider>;
}

const WaflSheetTextInput = forwardRef<TextInput, TextInputProps>(function WaflSheetTextInput(props, ref) {
  const registerFocusTarget = useContext(WaflSheetFocusContext);
  const resolveFocusBlockTarget = useContext(WaflSheetFocusBlockContext);
  const focusedRef = useRef(false);
  const targetRef = useRef<number | null>(null);

  function register(target: number | null) {
    if (target === null) return;
    registerFocusTarget?.({
      inputTarget: target,
      revealTarget: resolveFocusBlockTarget?.() ?? target,
    });
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

  return <TextInput
    {...props}
    onBlur={handleBlur}
    onContentSizeChange={handleContentSizeChange}
    onFocus={handleFocus}
    onSelectionChange={handleSelectionChange}
    ref={ref}
  />;
});

export default WaflSheetTextInput;
