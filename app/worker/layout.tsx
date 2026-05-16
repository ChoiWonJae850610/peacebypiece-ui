import type { ReactNode } from "react";

import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("worker");
  return children;
}
