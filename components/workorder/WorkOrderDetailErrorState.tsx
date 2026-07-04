import { RefreshCw } from "lucide-react";

import { WaflButton, WaflErrorState } from "@/components/common/ui";

type WorkOrderDetailErrorStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onRetry: () => void;
  withContentShell?: boolean;
};

export default function WorkOrderDetailErrorState({
  title,
  description,
  actionLabel,
  onRetry,
  withContentShell,
}: WorkOrderDetailErrorStateProps) {
  return (
    <WaflErrorState
      title={title}
      description={description}
      minHeightClassName={withContentShell === false ? "min-h-[180px]" : "min-h-[320px]"}
      action={(
        <WaflButton type="button" variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </WaflButton>
      )}
    />
  );
}
