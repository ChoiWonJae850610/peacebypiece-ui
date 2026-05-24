import AdminFilesWorkspaceClient from "@/components/admin/files/AdminFilesWorkspaceClient";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";

export default async function AdminFilesPage() {
  await requireWorkspacePagePermission("storage.read");
  return <AdminFilesWorkspaceClient />;
}
