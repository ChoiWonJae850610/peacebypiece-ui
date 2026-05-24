import WorkordersWorkspacePage from "@/features/workorders/page/WorkordersWorkspacePage";

type WorkspaceWorkordersRouteProps = {
  searchParams?: Promise<{
    workOrderId?: string | string[];
    status?: string | string[];
    sort?: string | string[];
    q?: string | string[];
  }>;
};

export default function WorkspaceWorkordersRoute(props: WorkspaceWorkordersRouteProps) {
  return <WorkordersWorkspacePage {...props} />;
}
