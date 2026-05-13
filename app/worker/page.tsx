import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";

type WorkerPageProps = {
  searchParams?: Promise<{ workOrderId?: string | string[] }>;
};

function readWorkOrderId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

export default async function WorkerPage({ searchParams }: WorkerPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialWorkOrderId = readWorkOrderId(resolvedSearchParams?.workOrderId);

  return <WorkOrderWorkspace initialWorkOrderId={initialWorkOrderId} />;
}
