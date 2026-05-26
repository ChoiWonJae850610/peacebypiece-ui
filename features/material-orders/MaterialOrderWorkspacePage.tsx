import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { buildMaterialOrderWorkspaceViewModel } from "@/lib/material-orders/materialOrderWorkspaceViewModel";
import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";

export default function MaterialOrderWorkspacePage() {
  const viewModel = buildMaterialOrderWorkspaceViewModel();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-2 rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material ordering</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight pbp-text-primary">원단·부자재 발주</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="warning">Local draft</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">DB 저장 전</AdminStatusBadge>
        </div>
      </header>

      <MaterialOrderDraftEditor guideItems={viewModel.draftGuideItems} />
    </div>
  );
}
