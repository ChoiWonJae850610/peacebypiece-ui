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
      description="작업지시서의 자재 발주 대기 항목을 공급처별 발주서로 묶고, 발주 상태와 잔여 자재를 확인합니다."
      contentMode="fixed-md"
    >
      <MaterialOrderWorkspacePage />
    </WorkspacePageShell>
  );
}
