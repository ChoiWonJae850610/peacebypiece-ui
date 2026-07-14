import "server-only";

import { issuedWorkOrderPreviewSample } from "@/lib/internal/samples/issuedWorkOrderPreviewSample";
import {
  WORK_ORDER_PDF_DOCUMENT_TYPE,
} from "@/lib/generated-documents/work-order-pdf/constants";
import {
  createRepositorySampleAssetDescriptor,
  RepositorySampleGeneratedDocumentAssetResolver,
} from "@/lib/generated-documents/work-order-pdf/assets";
import {
  createWorkOrderIssuedPdfSnapshot,
  hashWorkOrderIssuedPdfSnapshot,
  serializeWorkOrderIssuedPdfSnapshot,
} from "@/lib/generated-documents/work-order-pdf/snapshot";
import { createWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";

export const ALPHA37_SAMPLE_COMPANY_ID = "wafl-fn-company-a";
export const ALPHA37_SAMPLE_GENERATED_DOCUMENT_ID = "00000000-0000-4000-8000-000000000037";

export async function createAlpha37SamplePdfFoundation() {
  const asset = await createRepositorySampleAssetDescriptor(ALPHA37_SAMPLE_COMPANY_ID);
  const snapshot = createWorkOrderIssuedPdfSnapshot({
    companyId: ALPHA37_SAMPLE_COMPANY_ID,
    requestedWorkOrderId: issuedWorkOrderPreviewSample.header.workOrderId,
    requestedRevisionId: issuedWorkOrderPreviewSample.header.revisionId,
    documentType: WORK_ORDER_PDF_DOCUMENT_TYPE,
    preview: issuedWorkOrderPreviewSample,
    assetManifest: [asset],
    snapshotCreatedAt: issuedWorkOrderPreviewSample.document.issuedAt,
  });
  const resolver = new RepositorySampleGeneratedDocumentAssetResolver();
  const representativeImage = await resolver.resolveRepresentativeImage(snapshot.assetManifest);
  const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);

  return {
    snapshot,
    canonicalSnapshotJson,
    snapshotSha256: hashWorkOrderIssuedPdfSnapshot(snapshot),
    representativeImage,
    objectKeyPlan: createWorkOrderPdfStorageKey({
      companyId: snapshot.companyIdentity.companyId,
      workOrderId: snapshot.workOrderId,
      pdfId: ALPHA37_SAMPLE_GENERATED_DOCUMENT_ID,
    }),
  };
}
