import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SlidersVertical } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly accessibilityLabel: string;
  readonly active: boolean;
  readonly editable: boolean;
  readonly displayValue: string;
  readonly placeholder: string;
  readonly saving: boolean;
  readonly errorMessage?: string | null;
  readonly onActivate: () => void;
  readonly onOpenPicker: () => void;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly displayStyle?: StyleProp<TextStyle>;
  readonly testID?: string;
};

export default function ReelInlineEditValue({
  accessibilityLabel,
  active,
  editable,
  displayValue,
  placeholder,
  saving,
  errorMessage = null,
  onActivate,
  onOpenPicker,
  containerStyle,
  displayStyle,
  testID,
}: Props) {
  if (!active) {
    if (!editable) return <View style={containerStyle} testID={testID}><Text numberOfLines={2} style={displayStyle}>{displayValue || placeholder}</Text></View>;
    return (
      <Pressable
        accessibilityHint="릴 피커에서 같은 값을 수정합니다"
        accessibilityLabel={`${accessibilityLabel}, 릴 피커로 수정 가능`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => {
          onActivate();
          onOpenPicker();
        }}
        style={({ pressed }) => [styles.editable, containerStyle, pressed && styles.pressed]}
        testID={testID}
      >
        <Text numberOfLines={2} style={[displayStyle, !displayValue && styles.placeholder]}>{displayValue || placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={`${accessibilityLabel} 릴 입력 중`} style={[styles.active, containerStyle]} testID={testID}>
      <Pressable accessibilityLabel={`${accessibilityLabel} 릴 피커 다시 열기`} accessibilityRole="button" disabled={saving} onPress={onOpenPicker} style={styles.valueButton}>
        <Text numberOfLines={1} style={[styles.activeValue, displayStyle]}>{displayValue || placeholder}</Text>
        {saving ? <ActivityIndicator color={WAFL_THEME.color.brickOrange} size="small" /> : <SlidersVertical color={WAFL_THEME.color.brickOrange} size={17} />}
      </Pressable>
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editable: { backgroundColor: "#fffaf2", borderBottomColor: "#b98c5a", borderBottomWidth: WAFL_THEME.border.hairline, borderRadius: 5, minHeight: 36, paddingHorizontal: WAFL_THEME.spacing.xs, paddingVertical: 3 },
  pressed: { backgroundColor: "#f7ead9", opacity: 0.82 },
  placeholder: { color: "#9b9288" },
  active: { backgroundColor: "#fff9ed", borderColor: WAFL_THEME.color.editActive, borderRadius: WAFL_THEME.radius.field, borderWidth: WAFL_THEME.border.hairline, minHeight: 54, minWidth: 0, padding: WAFL_THEME.spacing.xs, width: "100%" },
  valueButton: { alignItems: "center", flexDirection: "row", gap: 7, minHeight: 44, minWidth: 0, paddingHorizontal: 6 },
  activeValue: { color: WAFL_THEME.color.deepNavy, flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 14, minWidth: 0 },
  error: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.regular, fontSize: WAFL_THEME.typography.caption, lineHeight: 14 },
});
