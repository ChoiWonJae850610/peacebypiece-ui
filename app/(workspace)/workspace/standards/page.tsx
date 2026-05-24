import { redirect } from "next/navigation";

import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { resolveMemberWorkspacePermissionCodes } from "@/lib/admin/members/memberWorkspaceAccess";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { hasSomeMemberPermission } from "@/lib/permissions";

const i18n = getI18n();
const pageText = i18n.common.workspacePages.standards;

export default async function WorkspaceStandardsPage() {
  const session = await requireWaflSessionForArea("workspace");
  const permissionCodes = await resolveMemberWorkspacePermissionCodes(session);
  const permissionInput = { permissionCodes };
  const canRead = hasSomeMemberPermission(permissionInput, ["standards.read"]);

  if (!canRead) redirect("/workspace");

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminStandardsSection
        mode="standards-only"
        capabilities={{
          canManage: hasSomeMemberPermission(permissionInput, ["standards.create", "standards.update", "standards.delete"]),
        }}
      />
    </WorkspaceShell>
  );
}
