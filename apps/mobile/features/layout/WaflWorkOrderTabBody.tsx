import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly children: ReactNode;
  readonly testID?: string;
};

/** One outer start inset for every live Maker WorkOrder tab body. */
export default function WaflWorkOrderTabBody({ children, testID }: Props) {
  return <View style={styles.body} testID={testID}>{children}</View>;
}

const styles = StyleSheet.create({
  body: { paddingTop: WAFL_THEME.layout.tabBodyTopInset },
});
