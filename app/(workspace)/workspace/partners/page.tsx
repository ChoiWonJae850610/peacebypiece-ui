import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";
import { hasWorkspaceApiPermission } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { isCompanyAdminSessionRole } from "@/lib/constants/sessionRoles";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default async function AdminPartnersPage() {
  const session = await requireWorkspacePagePermission("partner.read");
  const [canCreatePartner, canUpdatePartner] = await Promise.all([
    hasWorkspaceApiPermission(session, MEMBER_PERMISSION_CODE.partnerCreate),
    hasWorkspaceApiPermission(session, MEMBER_PERMISSION_CODE.partnerUpdate),
  ]);

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/partners"
      title={pageText.title}
      contentMode="scroll"
    >
      <PartnerMasterSection
        capabilities={{
          canCreate: canCreatePartner,
          canUpdate: canUpdatePartner,
        }}
        isAdmin={isCompanyAdminSessionRole(session.role)}
      />
    </WorkspacePageShell>
  );
}
