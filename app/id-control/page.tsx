import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  getDevTestContextDisabledReason,
  isDevTestContextEnabled,
} from "@/lib/dev/testContext/config";
import { canAccessIdControl } from "@/lib/runtime/runtimePolicy";
import DevTestConsoleClient from "../dev/test-console/DevTestConsoleClient";

export const dynamic = "force-dynamic";

export default async function IdControlPage() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  const isSystemAdmin = await isActiveSystemAdminSession(actualSession);
  if (!canAccessIdControl({ isSystemAdmin })) {
    notFound();
  }

  const devTestContextEnabled = isDevTestContextEnabled();

  return (
    <DevTestConsoleClient
      devTestContextEnabled={devTestContextEnabled}
      devTestContextDisabledReason={getDevTestContextDisabledReason()}
    />
  );
}
