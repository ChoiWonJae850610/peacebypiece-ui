import { redirect } from "next/navigation";

import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";

export default async function AdminInvitesPage() {
  await requireWorkspacePagePermission("member.invite");
  redirect("/workspace/members?section=invitations");
}
