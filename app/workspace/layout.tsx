import type { ReactNode } from "react";

import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("worker");
  return children;
}
