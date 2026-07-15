import GeneratedIssuedWorkOrderPreview from "@/components/workorder/preview/GeneratedIssuedWorkOrderPreview";
import { createQrSvg } from "@/lib/generated-documents/document-access/qr";
import { decodeEmbeddedQrRenderContext, WORK_ORDER_PDF_EMBEDDED_QR_HEADER } from "@/lib/generated-documents/work-order-pdf/embeddedQrRenderContext.mjs";
import { readLocalIssuedPdfRenderInput } from "@/lib/generated-documents/work-order-pdf/localRenderInput";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function WorkOrderPdfRenderPage({ params }: {
  readonly params: Promise<{ readonly runToken: string }>;
}) {
  await assertLocalOnlyRouteHost();
  const { runToken } = await params;
  const input = await readLocalIssuedPdfRenderInput(runToken);
  const requestHeaders = await headers();
  const embeddedQrContext = decodeEmbeddedQrRenderContext(requestHeaders.get(WORK_ORDER_PDF_EMBEDDED_QR_HEADER));
  return <GeneratedIssuedWorkOrderPreview input={input} embeddedQr={embeddedQrContext ? {
    qrSvg: createQrSvg(embeddedQrContext.viewerUrl),
    expiresAt: embeddedQrContext.expiresAt,
    label: embeddedQrContext.label,
  } : undefined} />;
}
