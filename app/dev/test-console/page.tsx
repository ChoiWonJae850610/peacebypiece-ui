import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import DevTestConsoleClient from "./DevTestConsoleClient";

export const dynamic = "force-dynamic";

export default async function DevTestConsolePage() {
  if (!isDevTestContextEnabled()) {
    notFound();
  }

  const session = await getCurrentWaflAuthSession();
  if (!session) {
    redirect("/?error=SESSION_REQUIRED");
  }
  if (session.role === "system_admin") {
    notFound();
  }

  return <DevTestConsoleClient />;
}
