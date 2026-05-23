import "server-only";

import { buildOrderRequestPrintHtml } from "@/lib/workorder/presentation/orderRequestDocumentPrint";
import type { WorkOrder } from "@/types/workorder";

export function buildOrderRequestHtmlDocument(input: {
  workOrder: WorkOrder;
  requestNote?: string | null;
  representativeImageDataUrl?: string | null;
}): string {
  return buildOrderRequestPrintHtml(input.workOrder, {
    requestNote: input.requestNote ?? null,
    representativeImageDataUrl: input.representativeImageDataUrl ?? null,
    autoPrint: false,
    showPrintToolbar: false,
    closeAfterPrint: false,
  });
}
