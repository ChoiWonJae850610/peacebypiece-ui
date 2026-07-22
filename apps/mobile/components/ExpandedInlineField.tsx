import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";

type Props = {
  readonly label: string;
  readonly children: ReactNode;
  readonly testID?: string;
};

export default function ExpandedInlineField({ label, children, testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.editor}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 0, width: "100%" },
  label: { color: "#8b7e72", fontFamily: WAFL_FONTS.medium, fontSize: 9, lineHeight: 13, marginBottom: 3 },
  editor: { minWidth: 0, width: "100%" },
});
