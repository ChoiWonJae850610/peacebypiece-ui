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
import { createPdfPaginationEvidencePreview, createPdfProcessEvidencePreview, normalizePdfPaginationEvidencePomCount, type PdfProcessEvidenceScenario } from "./samplePaginationEvidence";
import { createPdfRedesignEvidencePreview, type PdfRedesignEvidenceScenario } from "./sampleRedesignEvidence";

export const ALPHA37_SAMPLE_COMPANY_ID = "wafl-fn-company-a";
export const ALPHA37_SAMPLE_GENERATED_DOCUMENT_ID = "00000000-0000-4000-8000-000000000037";

export async function createAlpha37SamplePdfFoundation(input?: { readonly pomRowCount?: string | number | null; readonly processScenario?: PdfProcessEvidenceScenario | null; readonly redesignScenario?: PdfRedesignEvidenceScenario | null }) {
  const paginationPreview = createPdfPaginationEvidencePreview(
    issuedWorkOrderPreviewSample,
    normalizePdfPaginationEvidencePomCount(input?.pomRowCount),
  );
  const processPreview = input?.processScenario
    ? createPdfProcessEvidencePreview(paginationPreview, input.processScenario)
    : paginationPreview;
  const preview = createPdfRedesignEvidencePreview(processPreview, input?.redesignScenario ?? "normal");
  const asset = await createRepositorySampleAssetDescriptor(ALPHA37_SAMPLE_COMPANY_ID);
  const snapshot = createWorkOrderIssuedPdfSnapshot({
    companyId: ALPHA37_SAMPLE_COMPANY_ID,
    requestedWorkOrderId: preview.header.workOrderId,
    requestedRevisionId: preview.header.revisionId,
    documentType: WORK_ORDER_PDF_DOCUMENT_TYPE,
    preview,
    assetManifest: [asset],
    snapshotCreatedAt: preview.document.issuedAt,
  });
  const resolver = new RepositorySampleGeneratedDocumentAssetResolver();
  const representativeImage = await resolver.resolveRepresentativeImage(snapshot.assetManifest);
  const includedAttachmentImages = input?.redesignScenario === "rich" && representativeImage
    ? ["봉제 디테일.jpg", "마감 기준.jpg", "라벨 위치.jpg"].map((filename) => ({ filename, dataUrl: representativeImage.dataUrl }))
    : [];
  const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);

  return {
    snapshot,
    canonicalSnapshotJson,
    snapshotSha256: hashWorkOrderIssuedPdfSnapshot(snapshot),
    representativeImage,
    includedAttachmentImages,
    objectKeyPlan: createWorkOrderPdfStorageKey({
      companyId: snapshot.companyIdentity.companyId,
      workOrderId: snapshot.workOrderId,
      pdfId: ALPHA37_SAMPLE_GENERATED_DOCUMENT_ID,
    }),
  };
}
