import { WaflWorkspaceLoadingPanel } from "@/components/common/ui";

export type WorkOrderLoadingStateVariant = "detail" | "side";

type WorkOrderLoadingStateProps = {
  variant?: WorkOrderLoadingStateVariant;
  title: string;
  description?: string;
};

export default function WorkOrderLoadingState({
  variant = "detail",
  title,
  description,
}: WorkOrderLoadingStateProps) {
  return (
    <WaflWorkspaceLoadingPanel
      variant={variant}
      title={title}
      description={description}
    />
  );
}
