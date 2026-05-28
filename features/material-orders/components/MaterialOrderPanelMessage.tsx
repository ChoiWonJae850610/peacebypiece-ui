import { AppButton } from "@/components/common/ui";
import { MATERIAL_ORDER_EMPTY_STATE_CLASS } from "@/features/material-orders/materialOrderWorkspaceStyles";

type MaterialOrderPanelMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function MaterialOrderPanelMessage({
  title,
  description,
  actionLabel,
  onAction,
}: MaterialOrderPanelMessageProps) {
  return (
    <div className={MATERIAL_ORDER_EMPTY_STATE_CLASS}>
      <p className="font-semibold pbp-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 pbp-text-muted">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-2">
          <AppButton size="sm" variant="ghost" onClick={onAction}>
            {actionLabel}
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
