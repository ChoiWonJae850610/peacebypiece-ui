import AdminShell from "@/components/admin/layout/AdminShell";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default async function AdminPartnersPage() {
  const session = await requireWaflSessionForArea("workspace");

  return (
    <AdminShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/workspace/partners")}
      title={pageText.title}
      contentMode="fixed-md"
    >
      <PartnerMasterSection />
    </AdminShell>
  );
}
