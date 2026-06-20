import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import DevTestConsoleClient from "../dev/test-console/DevTestConsoleClient";

export const dynamic = "force-dynamic";

export default async function IdControlPage() {
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
