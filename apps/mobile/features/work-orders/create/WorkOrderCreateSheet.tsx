import { StyleSheet, Text, TextInput, View } from "react-native";

import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
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
  return <WaflInputSheet cancelAccessibilityLabel="새 작업지시서 만들기 취소" confirmAccessibilityLabel="새 작업지시서 만들기" confirmDisabled={!props.productName.trim()} onCancel={props.onCancel} onConfirm={props.onConfirm} pending={props.pending} title="새 작업지시서" visible={props.visible}>
    <View style={styles.content}>
      <Text style={styles.label}>제품명</Text>
      <TextInput accessibilityLabel="새 작업지시서 제품명" autoFocus editable={!props.pending} maxLength={WORK_ORDER_PRODUCT_NAME_MAX_LENGTH} onChangeText={props.onChangeProductName} placeholder="제품명을 입력하세요" placeholderTextColor="#8b8176" returnKeyType="done" style={[styles.input, props.error && styles.inputError]} value={props.productName} />
      {props.error ? <Text accessibilityRole="alert" style={styles.error}>{props.error}</Text> : <Text style={styles.help}>이후 상세 화면에서 나머지 정보를 입력할 수 있습니다.</Text>}
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  content: { gap: WAFL_THEME.spacing.xs, paddingTop: WAFL_THEME.spacing.md },
  label: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  input: { backgroundColor: "#fffdf8", borderColor: "#cfc2b4", borderRadius: 10, borderWidth: 1, color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.regular, fontSize: 16, minHeight: 48, paddingHorizontal: WAFL_THEME.spacing.md },
  inputError: { borderColor: "#b14d35" },
  error: { color: "#a63f2d", fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  help: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18 },
});
