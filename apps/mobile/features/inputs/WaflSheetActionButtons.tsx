import { Pressable, StyleSheet, View } from "react-native";
import { Check, X } from "lucide-react-native";

import { WAFL_THEME } from "@/constants/theme";

export default function WaflSheetActionButtons(props: {
  readonly cancelAccessibilityLabel: string;
  readonly confirmAccessibilityLabel: string;
  readonly confirmDanger?: boolean;
  readonly showCancel?: boolean;
  readonly cancelDisabled?: boolean;
  readonly confirmDisabled?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly testID?: string;
}) {
  const cancelDisabled = props.cancelDisabled ?? false;
  const confirmDisabled = props.confirmDisabled ?? false;
  const showCancel = props.showCancel ?? true;
  return (
    <View style={styles.actions} testID={props.testID ?? "wafl-sheet-action-buttons"}>
      {showCancel ? <Pressable
        accessibilityLabel={props.cancelAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: cancelDisabled }}
        disabled={cancelDisabled}
        onPress={props.onCancel}
        style={[styles.cancelButton, cancelDisabled && styles.disabled]}
      >
        <X color={WAFL_THEME.color.deepNavy} size={21} strokeWidth={2.4} />
      </Pressable> : null}
      <Pressable
        accessibilityLabel={props.confirmAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: confirmDisabled }}
        disabled={confirmDisabled}
        onPress={props.onConfirm}
        style={[styles.applyButton, props.confirmDanger && styles.dangerButton, confirmDisabled && styles.disabled]}
      >
        <Check color="#fff" size={21} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm, justifyContent: "flex-end" },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 10, borderWidth: 1, height: 48, justifyContent: "center", minWidth: 48, paddingHorizontal: WAFL_THEME.spacing.md },
  applyButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: 10, height: 48, justifyContent: "center", minWidth: 48, paddingHorizontal: WAFL_THEME.spacing.md },
  dangerButton: { backgroundColor: WAFL_THEME.color.error },
  disabled: { opacity: 0.4 },
});
