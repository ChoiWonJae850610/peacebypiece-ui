import type { ReactNode } from "react";

import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function SystemLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("system");
  return children;
}
