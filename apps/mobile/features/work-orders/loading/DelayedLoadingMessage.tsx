import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  createDelayedLoadingController,
  WORK_ORDER_LOADING_MESSAGES,
} from "./delayedLoadingPolicy";

type LoadingScope = keyof typeof WORK_ORDER_LOADING_MESSAGES;

type Props = {
  readonly identity: string;
  readonly loading: boolean;
  readonly scope: LoadingScope;
};

export default function DelayedLoadingMessage({ identity, loading, scope }: Props) {
  const [visible, setVisible] = useState(false);
  const controller = useMemo(
    () => createDelayedLoadingController({
      onVisibilityChange: setVisible,
    }),
    [],
  );

  useEffect(() => {
    controller.update({ identity, loading });
  }, [controller, identity, loading]);

  useEffect(() => () => controller.dispose(), [controller]);

  if (!loading || !visible) return null;

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <ActivityIndicator color={WAFL_THEME.color.brickOrange} />
      <Text style={styles.message}>{WORK_ORDER_LOADING_MESSAGES[scope]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 9,
    justifyContent: "center",
    minHeight: 160,
    padding: 24,
  },
  message: {
    color: WAFL_THEME.color.deepNavy,
    fontFamily: WAFL_FONTS.bold,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
