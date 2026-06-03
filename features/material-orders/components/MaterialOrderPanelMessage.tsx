import { AppButton, WaflErrorState, WaflLoadingState, WaflStateBlock } from "@/components/common/ui";

export type MaterialOrderPanelMessageKind = "empty" | "loading" | "error" | "search";

type MaterialOrderPanelMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  kind?: MaterialOrderPanelMessageKind;
};

export default function MaterialOrderPanelMessage({
  title,
  description,
  actionLabel,
  onAction,
  kind = "empty",
}: MaterialOrderPanelMessageProps) {
  const action = actionLabel && onAction ? (
    <AppButton size="sm" variant={kind === "error" ? "danger" : "ghost"} onClick={onAction}>
      {actionLabel}
    </AppButton>
  ) : null;

  if (kind === "loading") {
    return (
      <WaflLoadingState
        title={title}
        description={description}
        action={action}
        size="sm"
        minHeightClassName="min-h-[132px]"
        className="rounded-2xl bg-[var(--pbp-surface-soft)]"
      />
    );
  }

  if (kind === "error") {
    return (
      <WaflErrorState
        title={title}
        description={description}
        action={action}
        size="sm"
        minHeightClassName="min-h-[132px]"
        className="rounded-2xl"
      />
    );
  }

  return (
    <WaflStateBlock
      kind={kind}
      title={title}
      description={description}
      action={action}
      size="sm"
      minHeightClassName="min-h-[132px]"
      className="rounded-2xl bg-[var(--pbp-surface-soft)]"
    />
  );
}
