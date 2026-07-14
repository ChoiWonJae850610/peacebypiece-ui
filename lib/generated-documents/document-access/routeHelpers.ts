import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  DOCUMENT_VIEWER_COOKIE,
  DOCUMENT_VIEWER_COOKIE_PATH,
} from "./constants";
import {
  createDocumentShare,
  DocumentAccessServiceError,
  getDocumentShares,
  getPublicDocumentSession,
  readPublicDocumentPdf,
  redeemPublicDocumentToken,
  revokeDocumentShare,
  rotateDocumentShare,
} from "./service";
import { createDocumentViewerSession, verifyDocumentViewerSession } from "./session";

const PUBLIC_HEADERS = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
} as const;

function jsonError(code: string, message: string, status: number, correlationId: string) {
  return NextResponse.json({ ok: false, error: { code, message, retryable: false, correlationId } }, {
    status,
    headers: { ...PUBLIC_HEADERS, "X-WAFL-Correlation-Id": correlationId },
  });
}

function genericPublicNotFound(correlationId: string) {
  return jsonError("NOT_FOUND", "공유 링크를 사용할 수 없습니다.", 404, correlationId);
}

async function readBoundedObject(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) throw new Error("BODY_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new Error("BODY_TOO_LARGE");
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("BODY_INVALID");
  return parsed as Record<string, unknown>;
}

function internalError(error: unknown, correlationId: string) {
  if (error instanceof DocumentAccessServiceError) {
    return jsonError(error.code, error.message, error.status, correlationId);
  }
  if (error instanceof SyntaxError || (error instanceof Error && /^BODY_/.test(error.message))) {
    return jsonError("VALIDATION_ERROR", "요청 형식이 올바르지 않습니다.", 400, correlationId);
  }
  console.error("[DOCUMENT_ACCESS_REQUEST_FAILED]", {
    correlationId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return jsonError("INTERNAL_ERROR", "문서 공유 요청을 처리하지 못했습니다.", 500, correlationId);
}

export async function handleListDocumentAccessTokens(generatedDocumentId: string) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;
  try {
    const items = await getDocumentShares({
      generatedDocumentId,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return NextResponse.json({ ok: true, data: { items } }, {
      headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
    });
  } catch (error) {
    return internalError(error, correlationId);
  }
}

export async function handleCreateDocumentAccessToken(request: Request, generatedDocumentId: string) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  try {
    const body = await readBoundedObject(request, 1024);
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    const created = await createDocumentShare({
      generatedDocumentId,
      idempotencyKey,
      expiresInDays: body.expiresInDays === undefined ? undefined : Number(body.expiresInDays),
      origin: new URL(request.url).origin,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return NextResponse.json({ ok: true, data: created }, {
      status: created.idempotentReplay ? 200 : 201,
      headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
    });
  } catch (error) {
    return internalError(error, correlationId);
  }
}

export async function handleRevokeDocumentAccessToken(generatedDocumentId: string, tokenId: string) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  try {
    const data = await revokeDocumentShare({
      generatedDocumentId,
      tokenId,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  } catch (error) {
    return internalError(error, correlationId);
  }
}

export async function handleRotateDocumentAccessToken(request: Request, generatedDocumentId: string, tokenId: string) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  try {
    const body = await readBoundedObject(request, 1024);
    const created = await rotateDocumentShare({
      generatedDocumentId,
      tokenId,
      idempotencyKey: request.headers.get("idempotency-key") ?? "",
      expiresInDays: body.expiresInDays === undefined ? undefined : Number(body.expiresInDays),
      origin: new URL(request.url).origin,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return NextResponse.json({ ok: true, data: created }, {
      headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
    });
  } catch (error) {
    return internalError(error, correlationId);
  }
}

export async function handlePublicDocumentViewerSession(request: Request) {
  const correlationId = randomUUID();
  try {
    const body = await readBoundedObject(request, 512);
    const token = typeof body.token === "string" ? body.token : "";
    const redeemed = await redeemPublicDocumentToken(token, correlationId);
    if (!redeemed) return genericPublicNotFound(correlationId);
    const session = createDocumentViewerSession({
      tokenId: redeemed.tokenId,
      generatedDocumentId: redeemed.generatedDocumentId,
      tokenExpiresAt: redeemed.expiresAt,
    });
    const response = NextResponse.json({
      ok: true,
      data: {
        title: "작업지시서",
        displayDocumentNumber: redeemed.displayDocumentNumber,
        expiresAt: redeemed.expiresAt,
        accessCount: redeemed.accessCount,
      },
    }, { headers: { ...PUBLIC_HEADERS, "X-WAFL-Correlation-Id": correlationId } });
    response.cookies.set(DOCUMENT_VIEWER_COOKIE, session.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: DOCUMENT_VIEWER_COOKIE_PATH,
      maxAge: session.maxAgeSeconds,
    });
    return response;
  } catch {
    return genericPublicNotFound(correlationId);
  }
}

function readCookie(request: Request, name: string): string | null {
  const prefix = `${name}=`;
  const part = request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : null;
}

export async function handlePublicDocumentFile(request: Request, disposition: "inline" | "attachment") {
  const correlationId = randomUUID();
  try {
    const session = verifyDocumentViewerSession(readCookie(request, DOCUMENT_VIEWER_COOKIE));
    if (!session) return genericPublicNotFound(correlationId);
    const metadata = await getPublicDocumentSession({
      tokenId: session.tokenId,
      generatedDocumentId: session.generatedDocumentId,
    });
    if (!metadata) return genericPublicNotFound(correlationId);
    const body = await readPublicDocumentPdf(metadata);
    if (!body) return genericPublicNotFound(correlationId);
    const filename = `${metadata.displayDocumentNumber.replace(/[^A-Za-z0-9._-]/g, "_") || "work-instruction"}.pdf`;
    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        ...PUBLIC_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "X-WAFL-Correlation-Id": correlationId,
      },
    });
  } catch {
    return genericPublicNotFound(correlationId);
  }
}
