import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import DevTestConsoleClient from "./DevTestConsoleClient";

export const dynamic = "force-dynamic";

export default async function DevTestConsolePage() {
  if (!isDevTestContextEnabled()) {
    notFound();
  }

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  if (!(await isActiveSystemAdminSession(actualSession))) {
    notFound();
  }

  return <DevTestConsoleClient />;
}
