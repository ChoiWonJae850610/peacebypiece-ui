import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, type TextInput } from "react-native";

import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import WorkOrderCharacterChoice from "@/features/work-orders/identity/WorkOrderCharacterChoice";
import { WAFL_THEME } from "@/constants/theme";
import { WAFL_TEXT_ENTRY_FORM_SIZING } from "@/domain/waflSheetDetentPolicy";
import { WORK_ORDER_PRODUCT_NAME_MAX_LENGTH } from "@/domain/workOrderValidation";
import { consumeCreateRecipeEntranceFocus, openCreateRecipeKeyboardFocus, type CreateRecipeKeyboardFocusState } from "./createRecipeKeyboardFocusPolicy";

type Props = {
  readonly visible: boolean;
  readonly productName: string;
  readonly error: string | null;
  readonly pending: boolean;
  readonly isSample: boolean;
  readonly onChangeSample: (value: boolean) => void;
  readonly onChangeProductName: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
};

export default function WorkOrderCreateSheet(props: Props) {
  const productNameInputRef = useRef<TextInput>(null);
  const keyboardFocusStateRef = useRef<CreateRecipeKeyboardFocusState>("closed");
  useEffect(() => {
    keyboardFocusStateRef.current = props.visible ? openCreateRecipeKeyboardFocus() : "closed";
  }, [props.visible]);
  const focusProductNameOnce = useCallback(() => {
    const transition = consumeCreateRecipeEntranceFocus(keyboardFocusStateRef.current);
    keyboardFocusStateRef.current = transition.state;
    if (transition.shouldFocus) productNameInputRef.current?.focus();
  }, []);
  return <WaflInputSheet cancelAccessibilityLabel="새 레시피 만들기 취소" confirmAccessibilityLabel="새 레시피 만들기" confirmDisabled={!props.productName.trim()} keyboardAutoExpand keyboardFocusRevealContext={WAFL_THEME.sheet.textEntryFocusRevealClearance} keyboardMode="directInput" onAfterOpen={focusProductNameOnce} onCancel={props.onCancel} onConfirm={props.onConfirm} pending={props.pending} processingHelper={props.pending ? "잠시만 기다려 주세요." : null} processingMessage={props.pending ? "새 레시피를 생성 중입니다." : null} processingPresentation="replaceSheet" processingTestID="work-order-creation-blocker" sizing={WAFL_TEXT_ENTRY_FORM_SIZING} title="새 레시피" visible={props.visible}>
    <View style={styles.content}>
      <WaflSheetValueField
        editable={!props.pending}
        errorMessage={props.error}
        helpText="이후 상세 화면에서 나머지 정보를 입력할 수 있습니다."
        inputRef={productNameInputRef}
        label="제품명"
        maxLength={WORK_ORDER_PRODUCT_NAME_MAX_LENGTH}
        onChange={props.onChangeProductName}
        placeholder="제품명을 입력하세요"
        submitBehavior="submit"
        value={props.productName}
      />
      <WorkOrderCharacterChoice
        disabled={props.pending}
        isSample={props.isSample}
        onChange={props.onChangeSample}
      />
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  content: { gap: WAFL_THEME.spacing.xs, paddingTop: WAFL_THEME.spacing.md },
});
