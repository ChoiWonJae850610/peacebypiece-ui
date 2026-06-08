import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";

type MaterialOrderWorkspacePageProps = {
  companyName: string;
};

export default function MaterialOrderWorkspacePage({ companyName }: MaterialOrderWorkspacePageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <MaterialOrderDraftEditor companyName={companyName} />
    </div>
  );
}
