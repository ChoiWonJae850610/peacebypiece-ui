import MemberWorkspaceHome from "@/components/workspace/MemberWorkspaceHome";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function WorkspacePage() {
  const session = await requireWaflSessionForArea("worker");

  return <MemberWorkspaceHome companyName={session.companyName} />;
}
