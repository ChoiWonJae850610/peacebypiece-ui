import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { formatQuantityParts } from "@/lib/mobileDisplay";

type Props = {
  readonly value: string | null | undefined;
  readonly unitCode: string | null | undefined;
  readonly accessibilityLabel?: string;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
  readonly testID?: string;
};

export default function MaterialQuantityValue({
  value,
  unitCode,
  accessibilityLabel,
  containerStyle,
  textStyle,
  testID,
}: Props) {
  const display = formatQuantityParts(value, unitCode);
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? display.combined}
      accessible
      style={[styles.row, containerStyle]}
      testID={testID}
    >
      <Text numberOfLines={1} style={[textStyle, styles.value]}>{display.value}</Text>
      {display.unit ? <Text numberOfLines={1} style={[textStyle, styles.unit]}>{display.unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "nowrap",
    minWidth: 0,
  },
  value: {
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    flexShrink: 0,
    fontFamily: WAFL_FONTS.medium,
    fontSize: 9,
    lineHeight: 13,
    marginLeft: 3,
  },
});
