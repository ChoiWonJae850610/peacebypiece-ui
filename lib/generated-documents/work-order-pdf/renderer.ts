import "server-only";

import type { WorkOrderIssuedPdfSnapshot } from "@/lib/generated-documents/work-order-pdf/snapshot";

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
  readonly options: IssuedWorkOrderPdfRenderOptions;
};

export type IssuedWorkOrderPdfRenderResult = {
  readonly pdf: Buffer;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
  readonly pageCount: number;
  readonly pageOrientations: readonly ("landscape" | "portrait")[];
  readonly rendererVersion: string;
  readonly dtoSchemaVersion: number;
  readonly provider: "local-chromium" | "external-worker";
  readonly renderDurationMs: number;
  readonly extractedText: string;
  readonly pageTextLengths: readonly number[];
  readonly blankPageCount: number;
  readonly clippingViolationCount: number;
  readonly consoleErrorCount: number;
  readonly failedRequestCount: number;
  readonly representativeImageVisible: boolean;
};

export interface IssuedWorkOrderPdfRenderer {
  render(input: IssuedWorkOrderPdfRenderInput): Promise<IssuedWorkOrderPdfRenderResult>;
}
