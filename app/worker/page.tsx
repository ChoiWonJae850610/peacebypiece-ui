import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { ROLE } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";
import {
  normalizeWorkOrderListSort,
  normalizeWorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";

type WorkerPageProps = {
  searchParams?: Promise<{
    workOrderId?: string | string[];
    status?: string | string[];
    sort?: string | string[];
    q?: string | string[];
  }>;
};


function resolveSessionHomeRole(sessionRole: string | null | undefined): RoleType | null {
  if (sessionRole === "company_admin" || sessionRole === "system_admin") return ROLE.admin;
  return null;
}

function readQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

export default async function WorkerPage({ searchParams }: WorkerPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialWorkOrderId = readQueryValue(resolvedSearchParams?.workOrderId);
  const initialListStatusFilter = resolvedSearchParams?.status
    ? normalizeWorkOrderListStatusFilter(readQueryValue(resolvedSearchParams.status))
    : initialWorkOrderId
      ? "all"
      : normalizeWorkOrderListStatusFilter(null);
  const initialListSort = normalizeWorkOrderListSort(readQueryValue(resolvedSearchParams?.sort));
  const initialSearchQuery = readQueryValue(resolvedSearchParams?.q) ?? "";
  const session = await getCurrentWaflSession();
  const initialHomeRole = resolveSessionHomeRole(session?.role);

  return (
    <WorkOrderWorkspace
      initialHomeRole={initialHomeRole}
      initialWorkOrderId={initialWorkOrderId}
      initialListStatusFilter={initialListStatusFilter}
      initialListSort={initialListSort}
      initialSearchQuery={initialSearchQuery}
    />
  );
}
