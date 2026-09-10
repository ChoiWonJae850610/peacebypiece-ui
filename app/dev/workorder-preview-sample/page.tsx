import SampleIssuedWorkOrderPreview from "@/components/workorder/preview/SampleIssuedWorkOrderPreview";
import { createAlpha37SamplePdfFoundation } from "@/lib/generated-documents/work-order-pdf/sampleFoundation";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";

export default async function WorkOrderPreviewSamplePage({ searchParams }: { readonly searchParams: Promise<{ readonly pomRows?: string; readonly processScenario?: string; readonly redesignScenario?: string; readonly sketchScenario?: string }> }) {
  await assertLocalOnlyRouteHost();
  const params = await searchParams;
  const processScenario = params.processScenario === "basic-only" || params.processScenario === "basic-additional" ? params.processScenario : null;
  const redesignScenario = params.redesignScenario === "rich" || params.redesignScenario === "sparse" ? params.redesignScenario : "normal";
  const sketchScenario = params.sketchScenario === "alpha78" ? "alpha78" as const : null;
  const foundation = await createAlpha37SamplePdfFoundation({ pomRowCount: params.pomRows, processScenario, redesignScenario, sketchScenario });
  return (
    <SampleIssuedWorkOrderPreview
      data={foundation.snapshot.preview}
      includedAttachmentImages={foundation.includedAttachmentImages}
      drawingScene={foundation.snapshot.drawingScene}
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
