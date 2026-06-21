import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { APP_VERSION } from "@/lib/constants/app";
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
    <WorkspaceShell
      companyName={session?.companyName ?? ""}
      appVersion={APP_VERSION}
      title="작업지시서"
      description="작업지시서를 선택하고 진행 상태, 비용, 디자인, 첨부파일과 공장 전달사항을 확인합니다."
      contentMode="fixed-md"
      hideTopbar
    >
      <WorkOrderWorkspace
        initialHomeRole={initialHomeRole}
        initialCompanyName={session?.companyName ?? null}
        initialWorkOrderId={initialWorkOrderId}
        initialListStatusFilter={initialListStatusFilter}
        initialListSort={initialListSort}
        initialSearchQuery={initialSearchQuery}
      />
    </WorkspaceShell>
  );
}
