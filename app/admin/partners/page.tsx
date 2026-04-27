import AdminShell from "@/components/admin/layout/AdminShell";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default function AdminPartnersPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/partners")}
      title={pageText.title}
    >
      <PartnerMasterSection />
    </AdminShell>
  );
}
