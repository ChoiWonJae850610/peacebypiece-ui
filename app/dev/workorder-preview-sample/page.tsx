import SampleIssuedWorkOrderPreview from "@/components/workorder/preview/SampleIssuedWorkOrderPreview";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";
import { issuedWorkOrderPreviewSample } from "@/lib/internal/samples/issuedWorkOrderPreviewSample";

export const dynamic = "force-dynamic";

export default async function WorkOrderPreviewSamplePage() {
  await assertLocalOnlyRouteHost();
  return <SampleIssuedWorkOrderPreview data={issuedWorkOrderPreviewSample} />;
}
