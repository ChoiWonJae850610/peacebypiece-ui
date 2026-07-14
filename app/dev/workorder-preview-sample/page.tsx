import SampleIssuedWorkOrderPreview from "@/components/workorder/preview/SampleIssuedWorkOrderPreview";
import { createAlpha37SamplePdfFoundation } from "@/lib/generated-documents/work-order-pdf/sampleFoundation";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";

export default async function WorkOrderPreviewSamplePage() {
  await assertLocalOnlyRouteHost();
  const foundation = await createAlpha37SamplePdfFoundation();
  return (
    <SampleIssuedWorkOrderPreview
      data={foundation.snapshot.preview}
      representativeImageSrc={foundation.representativeImage?.dataUrl}
      pdfFoundationMetadata={{
        snapshotSha256: foundation.snapshotSha256,
        rendererVersion: foundation.snapshot.rendererVersion,
        dtoSchemaVersion: foundation.snapshot.dtoSchemaVersion,
        objectKeyPlan: foundation.objectKeyPlan,
        canonicalSnapshotJson: foundation.canonicalSnapshotJson,
      }}
    />
  );
}
