import { requestWaflDecision } from "./waflFeedbackStore";

export function confirmWaflAction(input: {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}) {
  requestWaflDecision({
    title: input.title,
    helper: input.message,
    cancelAccessibilityLabel: `${input.title} 취소`,
    confirmAccessibilityLabel: `${input.title} ${input.confirmLabel}`,
    safeOptionLabel: input.destructive ? "유지" : "취소",
    actionOptionLabel: input.confirmLabel,
    destructive: input.destructive,
    onConfirm: input.onConfirm,
  });
}
