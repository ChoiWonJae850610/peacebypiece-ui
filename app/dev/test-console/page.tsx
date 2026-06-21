import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { canAccessIdControl } from "@/lib/runtime/runtimePolicy";

export const dynamic = "force-dynamic";

export default async function DevTestConsolePage() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  const isSystemAdmin = await isActiveSystemAdminSession(actualSession);
  if (!canAccessIdControl({ isSystemAdmin })) {
    notFound();
  }

  redirect("/id-control");
}
