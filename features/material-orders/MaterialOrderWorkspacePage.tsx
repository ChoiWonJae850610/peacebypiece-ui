import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";

type MaterialOrderWorkspacePageProps = {
  companyName: string;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
};

export default function MaterialOrderWorkspacePage({
  companyName,
  canRequestMaterialOrder,
  canPlaceMaterialOrder,
}: MaterialOrderWorkspacePageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <MaterialOrderDraftEditor
        companyName={companyName}
        canRequestMaterialOrder={canRequestMaterialOrder}
        canPlaceMaterialOrder={canPlaceMaterialOrder}
      />
    </div>
  );
}
