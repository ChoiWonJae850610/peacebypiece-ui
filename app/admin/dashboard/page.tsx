import { redirect } from "next/navigation";

type AdminDashboardRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildAdminStatsRedirectUrl(params: Record<string, string | string[] | undefined> | undefined) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
      return;
    }
    if (typeof value === "string") search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `/admin/stats?${queryString}` : "/admin/stats";
}

export default async function AdminDashboardRedirectPage({ searchParams }: AdminDashboardRedirectPageProps) {
  const resolvedSearchParams = await searchParams;
  redirect(buildAdminStatsRedirectUrl(resolvedSearchParams));
}
