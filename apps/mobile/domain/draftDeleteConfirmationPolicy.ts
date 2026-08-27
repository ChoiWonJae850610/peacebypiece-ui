export type DraftDeleteConfirmationAction = {
  readonly text: string;
  readonly style: "cancel" | "destructive";
  readonly onPress?: () => void;
};

export function createDraftDeleteConfirmationActions(onConfirm: () => void): DraftDeleteConfirmationAction[] {
  return [
    { text: "취소", style: "cancel" },
    { text: "삭제", style: "destructive", onPress: onConfirm },
  ];
}
