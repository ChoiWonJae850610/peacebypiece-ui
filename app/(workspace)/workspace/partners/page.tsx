import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default async function AdminPartnersPage() {
  const session = await requireWorkspacePagePermission("partner.read");

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/partners")}
      title={pageText.title}
      contentMode="fixed-md"
    >
      <PartnerMasterSection />
    </WorkspaceShell>
  );
}
