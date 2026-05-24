import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { buildMaterialCapabilityState } from "@/lib/materials/capabilities";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import MaterialsWorkspacePage from "@/features/materials/MaterialsWorkspacePage";
import { listWorkspaceMaterials } from "@/lib/materials/service";
import type { Material, MaterialCapabilityState } from "@/lib/materials/types";

export default async function WorkspaceMaterialsPageRoute() {
  const session = await requireWorkspacePagePermission("standards.read");

  let initialMaterials: Material[] = [];
  let initialError: string | null = null;
  const initialCapabilities: MaterialCapabilityState = await buildMaterialCapabilityState(session);

  try {
    const result = await listWorkspaceMaterials({ companyId: session.companyId ?? "" });
    initialMaterials = result.materials;
  } catch {
    initialError = "원단·부자재 DB 연결을 확인해야 합니다. full_reset.sql 반영 후 다시 확인하세요.";
  }

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/materials")}
      title="원단·부자재"
      description="원단과 부자재 기준 정보를 작업지시서 연결 전 단계에서 검토합니다."
    >
      <MaterialsWorkspacePage initialMaterials={initialMaterials} initialCapabilities={initialCapabilities} initialError={initialError} />
    </WorkspaceShell>
  );
}
