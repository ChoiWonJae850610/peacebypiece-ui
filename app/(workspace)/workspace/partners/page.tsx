import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default async function AdminPartnersPage() {
  const session = await requireWorkspacePagePermission("partner.read");

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/partners"
      title={pageText.title}
      contentMode="scroll"
    >
      <PartnerMasterSection />
    </WorkspacePageShell>
  );
}
