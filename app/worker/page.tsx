import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";

type WorkerPageProps = {
  searchParams?: Promise<{
    adminPanel?: string;
  }>;
};

export default async function WorkerPage({ searchParams }: WorkerPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialAdminPanelOpen = resolvedSearchParams?.adminPanel === "open";

  return <WorkOrderWorkspace initialAdminPanelOpen={initialAdminPanelOpen} />;
}
