import { NextResponse } from "next/server";

import { createAlpha37SamplePdfFoundation } from "@/lib/generated-documents/work-order-pdf/sampleFoundation";
import { isLocalOnlyRouteHostAllowed } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!isLocalOnlyRouteHostAllowed(forwardedHost)) {
    return new NextResponse(null, { status: 404 });
  }

  const foundation = await createAlpha37SamplePdfFoundation();
  return NextResponse.json({
    snapshot: foundation.snapshot,
    canonicalSnapshotJson: foundation.canonicalSnapshotJson,
    snapshotSha256: foundation.snapshotSha256,
    objectKeyPlan: foundation.objectKeyPlan,
    assetResolution: foundation.representativeImage ? {
      filename: foundation.representativeImage.descriptor.filename,
      mimeType: foundation.representativeImage.descriptor.mimeType,
      byteLength: foundation.representativeImage.byteLength,
      contentSha256: foundation.representativeImage.contentSha256,
    } : null,
  }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
