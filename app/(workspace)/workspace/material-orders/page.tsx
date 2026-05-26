import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import MaterialOrderWorkspacePage from "@/features/material-orders/MaterialOrderWorkspacePage";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { APP_VERSION } from "@/lib/constants/app";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";

export default async function WorkspaceMaterialOrdersPageRoute() {
  const session = await requireWorkspacePagePermission("material.order.request");

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/material-orders", { role: session.role })}
      title="원단·부자재"
      description="작업지시서와 연결해 자재 발주 요청, 발주 확정, 배분, 재고 예정 수량을 관리합니다."
      contentMode="fixed-md"
    >
      <MaterialOrderWorkspacePage />
    </WorkspaceShell>
  );
}
