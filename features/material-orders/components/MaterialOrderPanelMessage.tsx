import { WaflButton, WaflEmptyWorkspaceState, WaflErrorState, WaflLoadingState } from "@/components/common/ui";

export type MaterialOrderPanelMessageKind = "empty" | "loading" | "error" | "search";

type MaterialOrderPanelMessageProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  kind?: MaterialOrderPanelMessageKind;
  variant?: "center-panel" | "side-panel" | "inline-section";
};

export default function MaterialOrderPanelMessage({
  title,
  description,
  actionLabel,
  onAction,
  kind = "empty",
  variant = "side-panel",
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
        minHeightClassName={variant === "inline-section" ? "min-h-[96px]" : "min-h-[132px]"}
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
        minHeightClassName={variant === "inline-section" ? "min-h-[96px]" : "min-h-[132px]"}
        className="wafl-shape-control"
      />
    );
  }

  return (
    <WaflEmptyWorkspaceState
      kind={kind}
      title={title}
      description={description}
      action={action}
      variant={variant}
      className="wafl-shape-control"
    />
  );
}
