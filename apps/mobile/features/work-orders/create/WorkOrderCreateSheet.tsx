import { useRef } from "react";
import { StyleSheet, View, type TextInput } from "react-native";

import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { WAFL_THEME } from "@/constants/theme";
import { WAFL_TEXT_ENTRY_FORM_SIZING } from "@/domain/waflSheetDetentPolicy";
import { WORK_ORDER_PRODUCT_NAME_MAX_LENGTH } from "@/domain/workOrderValidation";

type Props = {
  readonly visible: boolean;
  readonly productName: string;
  readonly error: string | null;
  readonly pending: boolean;
  readonly onChangeProductName: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
};

export default function WorkOrderCreateSheet(props: Props) {
  const productNameInputRef = useRef<TextInput>(null);

  return <WaflInputSheet cancelAccessibilityLabel="새 작업지시서 만들기 취소" confirmAccessibilityLabel="새 작업지시서 만들기" confirmDisabled={!props.productName.trim()} onAfterOpen={() => productNameInputRef.current?.focus()} onCancel={props.onCancel} onConfirm={props.onConfirm} pending={props.pending} sizing={WAFL_TEXT_ENTRY_FORM_SIZING} title="새 작업지시서" visible={props.visible}>
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
        returnKeyType="done"
        value={props.productName}
      />
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  content: { gap: WAFL_THEME.spacing.xs, paddingTop: WAFL_THEME.spacing.md },
});
