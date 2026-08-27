export function createWaflActionConfirmationActions(input: {
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}) {
  return [
    { text: "취소", style: "cancel" as const },
    {
      text: input.confirmLabel,
      style: input.destructive ? "destructive" as const : "default" as const,
      onPress: input.onConfirm,
    },
  ];
}
