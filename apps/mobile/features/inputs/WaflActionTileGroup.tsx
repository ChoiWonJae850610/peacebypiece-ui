import { Children, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly children: ReactNode;
  readonly testID?: string;
};

export default function WaflActionTileGroup({ children, testID }: Props) {
  const items = Children.toArray(children);
  const [availableWidth, setAvailableWidth] = useState(0);
  const gap = WAFL_THEME.layout.actionTileGap;
  const availableColumns = availableWidth > 0
    ? Math.max(1, Math.floor((availableWidth + gap) / (WAFL_THEME.layout.actionTileMinWidth + gap)))
    : Math.max(1, Math.min(items.length, 4));
  const columns = Math.max(1, Math.min(items.length, availableColumns));
  const fluidWidth = availableWidth > 0
    ? (availableWidth - gap * (columns - 1)) / columns
    : WAFL_THEME.layout.actionTilePreferredWidth;
  const tileWidth = Math.min(WAFL_THEME.layout.actionTileMaxWidth, Math.max(WAFL_THEME.layout.actionTileMinWidth, fluidWidth));

  return (
    <View
      onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}
      style={styles.group}
      testID={testID}
    >
      {items.map((item, index) => <View key={index} style={{ width: tileWidth }}>{item}</View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WAFL_THEME.layout.actionTileGap,
  },
});
