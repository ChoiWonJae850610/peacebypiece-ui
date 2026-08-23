import { NextResponse } from "next/server";

import {
  WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES,
} from "@/lib/generated-documents/work-order-pdf/constants";
// @ts-expect-error The existing renderer is an ESM .mts module loaded by the Node.js route runtime.
import { LocalChromiumIssuedWorkOrderPdfRenderer } from "@/lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import { createAlpha37SamplePdfFoundation } from "@/lib/generated-documents/work-order-pdf/sampleFoundation";
import { isLocalOnlyRouteHostAllowed } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!isLocalOnlyRouteHostAllowed(host)) return new NextResponse(null, { status: 404 });

  const pomRows = new URL(request.url).searchParams.get("pomRows");
  const requestedProcessScenario = new URL(request.url).searchParams.get("processScenario");
  const processScenario = requestedProcessScenario === "basic-only" || requestedProcessScenario === "basic-additional" ? requestedProcessScenario : null;
  const requestedRedesignScenario = new URL(request.url).searchParams.get("redesignScenario");
  const redesignScenario = requestedRedesignScenario === "rich" || requestedRedesignScenario === "sparse" ? requestedRedesignScenario : "normal";
  const foundation = await createAlpha37SamplePdfFoundation({ pomRowCount: pomRows, processScenario, redesignScenario });
  const renderUrl = new URL("/dev/workorder-preview-sample", request.url);
  if (pomRows) renderUrl.searchParams.set("pomRows", pomRows);
  if (processScenario) renderUrl.searchParams.set("processScenario", processScenario);
  renderUrl.searchParams.set("redesignScenario", redesignScenario);
  const result = await new LocalChromiumIssuedWorkOrderPdfRenderer().render({
    snapshot: foundation.snapshot,
    canonicalSnapshotJson: foundation.canonicalSnapshotJson,
    snapshotSha256: foundation.snapshotSha256,
    renderUrl: renderUrl.toString(),
    outputFileName: `${foundation.snapshot.documentIdentity.displayDocumentNumber}.pdf`,
    options: {
      printBackground: true,
      preferCssPageSize: true,
      maxFileSizeBytes: WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES,
    },
  });
  const filename = `${foundation.snapshot.documentIdentity.displayDocumentNumber.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`;
  return new Response(new Uint8Array(result.pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Length": String(result.fileSizeBytes),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "X-WAFL-PDF-Page-Count": String(result.pageCount),
      "X-WAFL-PDF-SHA-256": result.contentSha256,
    },
  });
}
