import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import CompanyCatalogSettingsClient from "@/components/catalog/CompanyCatalogSettingsClient";
import { getAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { listCompanyCatalog } from "@/lib/catalog/systemCatalogRepository";
import { redirect } from "next/navigation";

export default async function WorkspaceCatalogSettingsPage() {
  const session = await requireWaflSessionForArea("workspace");
  const companyScope = await getAdminSettingsCompanyScope();
  if (!companyScope || session.role !== "company_admin") {
    redirect("/workspace?error=ADMIN_SETTINGS_REQUIRED");
  }
  const catalog = companyScope ? await listCompanyCatalog(companyScope.companyId) : null;

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/settings"
      companyName={companyScope?.companyName ?? session.companyName}
      title="카탈로그 설정"
      description="회사별 분류 활성화, 사이즈 세트, POM 템플릿을 확인합니다."
    >
      {catalog ? <CompanyCatalogSettingsClient initialCatalog={catalog} /> : null}
    </WorkspacePageShell>
  );
}
