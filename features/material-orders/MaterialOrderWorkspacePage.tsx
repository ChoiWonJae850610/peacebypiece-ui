import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { buildMaterialOrderWorkspaceViewModel } from "@/lib/material-orders/materialOrderWorkspaceViewModel";
import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";

export default function MaterialOrderWorkspacePage() {
  const viewModel = buildMaterialOrderWorkspaceViewModel();

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header className="flex flex-col gap-3 rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material ordering</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight pbp-text-primary">원단·부자재 발주</h1>
          <p className="mt-1 text-sm leading-6 pbp-text-muted">
            발주서 목록, 선택 발주서 상세, 작업지시서 연결/배분을 3패널로 나누어 관리합니다.
          </p>
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
