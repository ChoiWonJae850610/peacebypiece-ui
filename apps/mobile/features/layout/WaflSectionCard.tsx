import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly headerAction?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export default function WaflSectionCard({ children, title, headerAction, style, testID }: Props) {
  return <View style={[styles.card, style]} testID={testID}>
    {title || headerAction ? <View style={styles.header}>
      {title ? <Text style={styles.title}>{title}</Text> : <View />}
      {headerAction}
    </View> : null}
    {children}
  </View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WAFL_THEME.color.paper,
    borderColor: WAFL_THEME.color.border,
    borderRadius: WAFL_THEME.radius.cardMajor,
    borderWidth: WAFL_THEME.border.hairline,
    gap: WAFL_THEME.layout.controlGap,
    padding: WAFL_THEME.layout.cardPadding,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: WAFL_THEME.touch.minimum,
  },
  title: {
    color: WAFL_THEME.color.deepNavy,
    fontFamily: WAFL_FONTS.bold,
    fontSize: WAFL_THEME.typography.sectionTitle.fontSize,
    lineHeight: WAFL_THEME.typography.sectionTitle.lineHeight,
  },
});
