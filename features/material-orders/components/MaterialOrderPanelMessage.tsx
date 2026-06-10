import { WaflButton, WaflErrorState, WaflLoadingState, WaflStateBlock } from "@/components/common/ui";

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
    <WaflButton size="sm" variant={kind === "error" ? "danger" : "ghost"} onClick={onAction}>
      {actionLabel}
    </WaflButton>
  ) : null;

  if (kind === "loading") {
    return (
      <WaflLoadingState
        title={title}
        description={description}
        action={action}
        size="sm"
        minHeightClassName="min-h-[132px]"
        className="wafl-shape-control bg-[var(--pbp-empty-state-surface)]"
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
        className="wafl-shape-control"
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
      className="wafl-shape-control bg-[var(--pbp-empty-state-surface)]"
    />
  );
}
