import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { createWaflInputCommitGuard } from "./waflInputCommitGuard";

type Props = {
  readonly visible: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly pending?: boolean;
  readonly confirmDisabled?: boolean;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly cancelAccessibilityLabel?: string;
  readonly confirmAccessibilityLabel?: string;
  readonly onCancel: () => void;
  readonly onConfirm?: () => Promise<unknown> | unknown;
};

export default function WaflInputSheet({
  visible,
  title,
  children,
  pending = false,
  confirmDisabled = false,
  contentStyle,
  cancelAccessibilityLabel = "변경 취소",
  confirmAccessibilityLabel = "변경 저장",
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const guardRef = useRef(createWaflInputCommitGuard());
  const mountedRef = useRef(true);
  const [submitting, setSubmitting] = useState(false);
  const actionPending = pending || submitting;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function cancel() {
    if (actionPending) return;
    onCancel();
  }

  async function confirm() {
    if (actionPending || confirmDisabled || !onConfirm) return;
    const submitted = await guardRef.current.submit(async () => {
      if (mountedRef.current) setSubmitting(true);
      try {
        await onConfirm();
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    });
    if (!submitted.accepted && mountedRef.current) setSubmitting(guardRef.current.isActive());
  }

  return (
    <Modal animationType="slide" onRequestClose={cancel} presentationStyle="overFullScreen" transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalRoot}>
        <Pressable accessibilityLabel="입력창 닫기" disabled={actionPending} onPress={cancel} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, WAFL_THEME.spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>WAFL INPUT</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={[styles.content, contentStyle]}>{children}</View>
          <View style={styles.actions}>
            {onConfirm ? <Pressable
              accessibilityLabel={cancelAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: actionPending }}
              disabled={actionPending}
              onPress={cancel}
              style={[styles.cancelButton, actionPending && styles.disabled]}
            >
              <X color={WAFL_THEME.color.deepNavy} size={21} strokeWidth={2.4} />
            </Pressable> : null}
            <Pressable
              accessibilityLabel={confirmAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ busy: actionPending, disabled: actionPending || confirmDisabled }}
              disabled={actionPending || confirmDisabled}
              onPress={() => void confirm()}
              style={[styles.applyButton, (actionPending || confirmDisabled) && styles.disabled]}
            >
              <Check color="#fff" size={21} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 29, 43, 0.36)" },
  sheet: {
    alignSelf: "center",
    backgroundColor: WAFL_THEME.color.paper,
    borderColor: WAFL_THEME.color.fabricBeige,
    borderTopLeftRadius: WAFL_THEME.radius.sheet,
    borderTopRightRadius: WAFL_THEME.radius.sheet,
    borderWidth: WAFL_THEME.border.hairline,
    maxHeight: "92%",
    maxWidth: 520,
    paddingHorizontal: WAFL_THEME.spacing.lg,
    paddingTop: WAFL_THEME.spacing.sm,
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#c8b7a3",
    borderRadius: WAFL_THEME.radius.pill,
    height: 4,
    marginBottom: WAFL_THEME.spacing.md,
    width: 42,
  },
  headerText: { minWidth: 0 },
  eyebrow: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 9, letterSpacing: 1.2 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black, fontSize: 19, marginTop: 2 },
  content: { minHeight: 0 },
  actions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm, justifyContent: "flex-end", marginTop: WAFL_THEME.spacing.sm },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 10, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  applyButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: 10, height: 48, justifyContent: "center", width: 48 },
  disabled: { opacity: 0.4 },
});
