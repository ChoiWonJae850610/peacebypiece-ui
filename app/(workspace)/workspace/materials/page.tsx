import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import MaterialsWorkspacePage from "@/features/materials/MaterialsWorkspacePage";

export default async function WorkspaceMaterialsPageRoute() {
  const session = await requireWaflSessionForArea("workspace");

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/materials")}
      title="원단·부자재"
      description="원단과 부자재 기준 정보를 작업지시서 연결 전 단계에서 검토합니다."
    >
      <MaterialsWorkspacePage />
    </WorkspaceShell>
  );
}
