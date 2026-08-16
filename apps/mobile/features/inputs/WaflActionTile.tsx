import { ChevronRight, type LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly accessibilityLabel: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly count?: number;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly showChevron?: boolean;
  readonly testID?: string;
  readonly variant?: "action" | "entry";
  readonly style?: StyleProp<ViewStyle>;
};

function TileContent(props: Props) {
  const Icon = props.icon;
  const entry = props.variant === "entry";
  return <>
    <Icon color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} strokeWidth={2.2} />
    <Text numberOfLines={1} style={[styles.label, entry && styles.entryLabel]}>{props.label}</Text>
    {props.count !== undefined ? <Text accessibilityLabel={`${props.count}개`} style={styles.count}>{props.count}</Text> : null}
    {props.showChevron ? <ChevronRight color={WAFL_THEME.color.readOnly} size={17} /> : null}
  </>;
}

export default function WaflActionTile(props: Props) {
  const style = [
    styles.tile,
    props.variant === "entry" ? styles.entry : styles.action,
    props.disabled && styles.disabled,
    props.style,
  ];
  if (!props.onPress) {
    return <View accessibilityLabel={props.accessibilityLabel} style={style} testID={props.testID}>
      <TileContent {...props} />
    </View>;
  }
  return <Pressable
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled: props.disabled }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={({ pressed }) => [style, pressed && !props.disabled && styles.pressed]}
    testID={props.testID}
  >
    <TileContent {...props} />
  </Pressable>;
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: WAFL_THEME.color.paper,
    borderColor: WAFL_THEME.color.border,
    borderRadius: WAFL_THEME.radius.actionTile,
    borderWidth: WAFL_THEME.border.hairline,
    minHeight: WAFL_THEME.touch.actionTileMinHeight,
    width: "100%",
  },
  action: {
    alignItems: "center",
    gap: WAFL_THEME.layout.tightGap,
    justifyContent: "center",
    paddingHorizontal: 3,
    paddingVertical: 7,
  },
  entry: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  label: {
    color: WAFL_THEME.color.navyInk,
    fontFamily: WAFL_FONTS.bold,
    fontSize: WAFL_THEME.typography.actionLabel.fontSize,
    lineHeight: WAFL_THEME.typography.actionLabel.lineHeight,
  },
  entryLabel: { flex: 1, fontSize: 11, minWidth: 0 },
  count: {
    backgroundColor: WAFL_THEME.color.paperMuted,
    borderRadius: WAFL_THEME.radius.pill,
    color: WAFL_THEME.color.deepNavy,
    fontFamily: WAFL_FONTS.bold,
    fontSize: 10,
    minWidth: 24,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textAlign: "center",
  },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
