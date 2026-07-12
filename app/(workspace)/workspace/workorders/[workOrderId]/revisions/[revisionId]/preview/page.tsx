import IssuedWorkOrderPreview from "@/components/workorder/preview/IssuedWorkOrderPreview";

export const dynamic = "force-dynamic";

export default async function IssuedWorkOrderPreviewPage({ params }: { readonly params: Promise<{ workOrderId: string; revisionId: string }> }) {
  const { workOrderId, revisionId } = await params;
  return <IssuedWorkOrderPreview workOrderId={workOrderId} revisionId={revisionId}/>;
}
