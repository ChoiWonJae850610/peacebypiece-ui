import type { ReactNode } from "react";

import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("admin");
  return children;
}
