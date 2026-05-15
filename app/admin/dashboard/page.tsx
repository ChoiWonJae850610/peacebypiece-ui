import { redirect } from "next/navigation";

import { buildAdminStatsRedirectUrl } from "@/lib/admin/stats/dashboardPresentation";

type AdminDashboardRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardRedirectPage({ searchParams }: AdminDashboardRedirectPageProps) {
  const resolvedSearchParams = await searchParams;
  redirect(buildAdminStatsRedirectUrl(resolvedSearchParams));
}
