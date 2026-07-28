import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";

export type WaflToastMessage = {
  readonly id: number;
  readonly tone: "success" | "warning" | "error";
  readonly message: string;
};

type Props = {
  readonly toast: WaflToastMessage | null;
  readonly onDismiss: (id: number) => void;
  readonly durationMs?: number;
};

const TONE = {
  success: { background: "#e8f2e5", border: "#91ad86", color: "#35512f", Icon: CircleCheck },
  warning: { background: "#fff1d3", border: "#d5ae62", color: "#734d20", Icon: TriangleAlert },
  error: { background: "#fbe7e4", border: "#d99a91", color: "#7f2f2b", Icon: CircleAlert },
} as const;

export default function WaflToastHost({ toast, onDismiss, durationMs = 3200 }: Props) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss, toast]);

  if (!toast) return null;
  const tone = TONE[toast.tone];
  const Icon = tone.Icon;
  return (
    <View pointerEvents="none" style={styles.host} testID="wafl-toast-host">
      <View style={[styles.toast, { backgroundColor: tone.background, borderColor: tone.border }]}>
        <Icon color={tone.color} size={18} />
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.message, { color: tone.color }]}
        >
          {toast.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    left: 12,
    position: "absolute",
    right: 12,
    top: 68,
    zIndex: 100,
  },
  toast: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    flexDirection: "row",
    gap: 8,
    maxWidth: 560,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#17263d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    width: "100%",
  },
  message: {
    flex: 1,
    fontFamily: WAFL_FONTS.semibold,
    fontSize: 12,
    lineHeight: 18,
  },
});
