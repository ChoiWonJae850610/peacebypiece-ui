import AdminAuditSummarySection from "@/components/admin/dashboard/AdminAuditSummarySection";
import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";
import { getAdminCompletionAuditSummary } from "@/lib/admin/completionAudit";
import { getAdminDbCompletionSummary } from "@/lib/admin/dbCompletionAudit";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

export default async function AdminPage() {
  const snapshots = await getAdminOperationalDashboardSnapshots();
  const dbCompletionSummary = getAdminDbCompletionSummary();
  const completionAuditSummary = getAdminCompletionAuditSummary();
  const pageText = getI18n().admin.navigation;

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title={pageText.dashboard}
    >
      <AdminOperationsDashboard snapshots={snapshots} />
      <AdminAuditSummarySection dbCompletionSummary={dbCompletionSummary} completionAuditSummary={completionAuditSummary} />
    </AdminShell>
  );
}
