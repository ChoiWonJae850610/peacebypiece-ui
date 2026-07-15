import "server-only";

import type { WorkOrderIssuedPdfSnapshot } from "@/lib/generated-documents/work-order-pdf/snapshot";
import type { EmbeddedQrRenderContext } from "./embeddedQrRenderContext.mjs";
import type { PdfPageOrientationEvidence } from "./pdfPageOrientation.mjs";

export type IssuedWorkOrderPdfRenderOptions = {
  readonly printBackground: true;
  readonly preferCssPageSize: true;
  readonly maxFileSizeBytes: number;
};

export type IssuedWorkOrderPdfRenderInput = {
  readonly snapshot: WorkOrderIssuedPdfSnapshot;
  readonly canonicalSnapshotJson: string;
  readonly snapshotSha256: string;
  readonly renderUrl: string;
  readonly outputFileName: string;
  readonly embeddedQrContext?: EmbeddedQrRenderContext;
  readonly options: IssuedWorkOrderPdfRenderOptions;
};

export type IssuedWorkOrderPdfRenderResult = {
  readonly pdf: Buffer;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
  readonly pageCount: number;
  readonly pageOrientations: readonly ("landscape" | "portrait")[];
  readonly pageOrientationEvidence: readonly PdfPageOrientationEvidence[];
  readonly rendererVersion: string;
  readonly dtoSchemaVersion: number;
  readonly provider: "local-chromium" | "external-worker";
  readonly renderDurationMs: number;
  readonly renderRouteStatus: number;
  readonly renderRoutePathname: string;
  readonly renderRouteContentType: string;
  readonly renderRouteRedirected: boolean;
  readonly extractedText: string;
  readonly pageTextLengths: readonly number[];
  readonly blankPageCount: number;
  readonly clippingViolationCount: number;
  readonly coverFragmentationOverflowPx: number;
  readonly coverFragmentationViolationCount: number;
  readonly rowSplitViolationCount: number;
  readonly consoleErrorCount: number;
  readonly failedRequestCount: number;
  readonly representativeImageVisible: boolean;
  readonly embeddedQrVisible: boolean;
};

export interface IssuedWorkOrderPdfRenderer {
  render(input: IssuedWorkOrderPdfRenderInput): Promise<IssuedWorkOrderPdfRenderResult>;
}
