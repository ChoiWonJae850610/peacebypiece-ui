import { requestWaflDecision } from "./waflFeedbackStore";

export function confirmWaflDestructiveAction(input: {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly onConfirm: () => void;
}) {
  requestWaflDecision({
    title: input.title,
    helper: input.message,
    cancelAccessibilityLabel: `${input.title} 유지`,
    confirmAccessibilityLabel: `${input.title} ${input.confirmLabel ?? "삭제"}`,
    safeOptionLabel: "유지",
    actionOptionLabel: input.confirmLabel ?? "삭제",
    destructive: true,
    onConfirm: input.onConfirm,
  });
}
