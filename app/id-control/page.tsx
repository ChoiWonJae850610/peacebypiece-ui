import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  getDevTestContextDisabledReason,
  isDevTestContextEnabled,
} from "@/lib/dev/testContext/config";
import DevTestConsoleClient from "../dev/test-console/DevTestConsoleClient";

export const dynamic = "force-dynamic";

export default async function IdControlPage() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  if (!(await isActiveSystemAdminSession(actualSession))) {
    notFound();
  }

  const runtimeMode = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "unknown";
  const devTestContextEnabled = isDevTestContextEnabled();

  return (
    <DevTestConsoleClient
      runtimeMode={runtimeMode}
      devTestContextEnabled={devTestContextEnabled}
      devTestContextDisabledReason={getDevTestContextDisabledReason()}
    />
  );
}
