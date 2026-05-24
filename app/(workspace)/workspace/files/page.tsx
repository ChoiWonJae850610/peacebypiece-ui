import AdminFilesWorkspaceClient from "@/components/admin/files/AdminFilesWorkspaceClient";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";

export default async function AdminFilesPage() {
  const session = await requireWorkspacePagePermission("storage.read");
  return <AdminFilesWorkspaceClient navigationItems={getWorkspaceNavigationItems("/workspace/files", { role: session.role })} />;
}
