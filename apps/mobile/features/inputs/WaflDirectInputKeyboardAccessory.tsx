import { Check, ChevronDown } from "lucide-react-native";
import {
  InputAccessoryView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly action: "next" | "done";
  readonly disabled: boolean;
  readonly nativeID: string;
  readonly onPress: () => void;
};

function AccessoryAction(props: {
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly icon: "next" | "done";
  readonly label: string;
  readonly onPress: () => void;
}) {
  const Icon = props.icon === "next" ? ChevronDown : Check;
  const emphasized = props.icon === "done";
  return <Pressable
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled: Boolean(props.disabled) }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={({ pressed }) => [
      styles.action,
      emphasized && styles.doneAction,
      props.disabled && styles.disabled,
      pressed && !props.disabled && styles.pressed,
    ]}
  >
    <Icon color={emphasized ? "#fff" : WAFL_THEME.color.deepNavy} size={18} strokeWidth={2.5} />
    <Text style={[styles.actionLabel, emphasized && styles.doneLabel]}>{props.label}</Text>
  </Pressable>;
}

export default function WaflDirectInputKeyboardAccessory(props: Props) {
  if (Platform.OS !== "ios") return null;
  const done = props.action === "done";
  return <InputAccessoryView nativeID={props.nativeID}>
    <View style={styles.root} testID="wafl-direct-input-keyboard-accessory">
      <AccessoryAction
        accessibilityLabel={done ? "입력 완료" : "다음 입력"}
        disabled={props.disabled}
        icon={props.action}
        label={done ? "완료" : "다음"}
        onPress={props.onPress}
      />
    </View>
  </InputAccessoryView>;
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: WAFL_THEME.color.paper,
    borderTopColor: WAFL_THEME.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "flex-end",
    minHeight: 52,
    paddingHorizontal: WAFL_THEME.spacing.md,
    paddingVertical: WAFL_THEME.spacing.xs,
  },
  action: {
    alignItems: "center",
    borderColor: WAFL_THEME.color.border,
    borderRadius: WAFL_THEME.radius.field,
    borderWidth: WAFL_THEME.border.hairline,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: WAFL_THEME.touch.minimum,
    minWidth: 72,
    paddingHorizontal: WAFL_THEME.spacing.sm,
  },
  doneAction: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  actionLabel: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  doneLabel: { color: "#fff" },
  disabled: { opacity: 0.34 },
  pressed: { opacity: 0.72 },
});
