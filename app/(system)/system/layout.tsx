import type { ReactNode } from "react";

import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export const dynamic = "force-dynamic";

export default async function SystemLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("system");
  return children;
}
