import type { ReactNode } from "react";

import AdminCompanyOnboardingGate from "@/components/admin/companies/AdminCompanyOnboardingGate";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireWaflSessionForArea("admin");
  return <AdminCompanyOnboardingGate>{children}</AdminCompanyOnboardingGate>;
}
