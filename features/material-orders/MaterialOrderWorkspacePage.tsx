import { buildMaterialOrderWorkspaceViewModel } from "@/lib/material-orders/materialOrderWorkspaceViewModel";
import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";

export default function MaterialOrderWorkspacePage() {
  const viewModel = buildMaterialOrderWorkspaceViewModel();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MaterialOrderDraftEditor guideItems={viewModel.draftGuideItems} />
    </div>
  );
}
