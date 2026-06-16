import { WaflButton, WaflWorkspaceStatePanel } from "@/components/common/ui";

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

  return (
    <WaflWorkspaceStatePanel
      title={title}
      description={description}
      action={action}
      kind={kind}
      layout={variant === "inline-section" ? "inline" : "panel"}
    />
  );
}
