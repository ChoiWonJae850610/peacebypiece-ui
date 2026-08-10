import { Alert } from "react-native";
import { createDestructiveConfirmationActions } from "@/domain/destructiveConfirmationPolicy";

export function confirmWaflDestructiveAction(input: {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly onConfirm: () => void;
}) {
  const actions = createDestructiveConfirmationActions(input.onConfirm);
  Alert.alert(input.title, input.message, [
    { text: "취소", style: "cancel", onPress: actions.cancel },
    { text: input.confirmLabel ?? "삭제", style: "destructive", onPress: actions.confirm },
  ]);
}
