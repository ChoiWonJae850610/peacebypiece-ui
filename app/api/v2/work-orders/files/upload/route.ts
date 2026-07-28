import { NextRequest, NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  createR2WorkerUploadUrl,
  verifyR2WorkerUploadProxyCapability,
} from "@/lib/storage/r2/r2WorkerUpload";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function PUT(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;

  const key = request.nextUrl.searchParams.get("key") ?? "";
  const contentType = request.nextUrl.searchParams.get("contentType") ?? "";
  const expiresAt = Number(request.nextUrl.searchParams.get("expires") ?? "0");
  const signature = request.nextUrl.searchParams.get("signature") ?? "";
  const capability = verifyR2WorkerUploadProxyCapability({
    key,
    contentType,
    expiresAt,
    signature,
  });
  if (!capability || !capability.key.startsWith(`companies/${guard.scope.companyId}/workorders/`)) {
    return NextResponse.json({ ok: false, error: "UPLOAD_CAPABILITY_INVALID" }, { status: 403 });
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "UPLOAD_SIZE_INVALID" }, { status: 400 });
  }
  const worker = createR2WorkerUploadUrl({
    key: capability.key,
    contentType: capability.contentType,
  });
  const response = await fetch(worker.url, {
    method: worker.method,
    headers: worker.headers,
    body: bytes,
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
      "X-WAFL-Worker-Status": String(response.status),
    },
  });
}
