import type { ReactNode } from "react";

import AdminCompanyAccessGate from "@/components/admin/billing/AdminCompanyAccessGate";
import AdminCompanyOnboardingGate from "@/components/admin/companies/AdminCompanyOnboardingGate";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await requireWaflSessionForArea("workspace", { allowBlockedCompanyAccess: true });
  const accessState = session.companyId ? await getCompanyAccessState(session.companyId) : null;

  return (
    <AdminCompanyAccessGate accessBlocked={Boolean(accessState?.accessBlocked)} blockedPath={accessState?.onboardingStatus === "rejected" ? "/service-paused" : undefined}>
      <AdminCompanyOnboardingGate
        initialAccessState={accessState ? {
          onboardingStatus: accessState.onboardingStatus,
          trialExpired: accessState.trialExpired,
          accessBlocked: accessState.accessBlocked,
        } : null}
      >
        {children}
      </AdminCompanyOnboardingGate>
    </AdminCompanyAccessGate>
  );
}
