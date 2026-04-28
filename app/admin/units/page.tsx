import AdminShell from "@/components/admin/layout/AdminShell";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminUnitsPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/units")}
      title="기준 관리"
    >
      <AdminStandardsSection />
    </AdminShell>
  );
}
