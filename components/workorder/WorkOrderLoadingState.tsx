import { WaflWorkspaceLoadingPanel } from "@/components/common/ui";

export type WorkOrderLoadingStateVariant = "detail" | "side";

type WorkOrderLoadingStateProps = {
  variant?: WorkOrderLoadingStateVariant;
  title: string;
  description?: string;
  withContentShell?: boolean;
};

export default function WorkOrderLoadingState({
  variant = "detail",
  title,
  description,
  withContentShell,
}: WorkOrderLoadingStateProps) {
  return (
    <WaflWorkspaceLoadingPanel
      variant={variant}
      title={title}
      description={description}
      withContentShell={withContentShell}
    />
  );
}
