import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import MaterialOrderWorkspacePage from "@/features/material-orders/MaterialOrderWorkspacePage";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";

export default async function WorkspaceMaterialOrdersPageRoute() {
  const session = await requireWorkspacePagePermission("material.order.request");

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/material-orders"
      title="원단·부자재"
      description="작업지시서와 연결해 자재 발주 요청, 발주 확정, 배분, 재고 예정 수량을 관리합니다."
      contentMode="fixed-md"
    >
      <MaterialOrderWorkspacePage />
    </WorkspacePageShell>
  );
}
