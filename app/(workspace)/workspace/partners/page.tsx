import { redirect } from "next/navigation";

import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import MemberWorkspaceShell from "@/components/workspace/MemberWorkspaceShell";
import { resolveMemberWorkspacePermissionCodes } from "@/lib/admin/members/memberWorkspaceAccess";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { hasSomeMemberPermission } from "@/lib/permissions";

const i18n = getI18n();
const pageText = i18n.common.workspacePages.partners;

export default async function WorkspacePartnersPage() {
  const session = await requireWaflSessionForArea("worker");
  const permissionCodes = await resolveMemberWorkspacePermissionCodes(session);
  const canRead = hasSomeMemberPermission({ permissionCodes }, ["partner.read"]);

  if (!canRead) redirect("/workspace");

  return (
    <MemberWorkspaceShell
      companyName={session.companyName}
      appVersion={APP_VERSION}
      title={pageText.title}
      description={pageText.description}
      contentMode="fixed-md"
    >
      <PartnerMasterSection
        capabilities={{
          canCreate: hasSomeMemberPermission({ permissionCodes }, ["partner.create"]),
          canUpdate: hasSomeMemberPermission({ permissionCodes }, ["partner.update"]),
        }}
      />
    </MemberWorkspaceShell>
  );
}
