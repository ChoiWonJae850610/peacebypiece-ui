import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { readExternalQaServerConfig } from "@/lib/external-qa/configCore.mjs";
import { isMakerQaCapabilityEnabled, MAKER_QA_CAPABILITY } from "@/lib/external-qa/makerQaCapabilities.mjs";
import { inspectGeneratedDocumentArtifact, loadCurrentGeneratedDocumentArtifactFixture } from "@/lib/generated-documents/work-order-pdf/artifactHealth";
import { R2WorkerGeneratedDocumentObjectStore } from "@/lib/generated-documents/work-order-pdf/objectStore";
import { R2WorkerGeneratedDocumentTransport } from "@/lib/generated-documents/work-order-pdf/r2WorkerTransport";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIXTURE_NAMES = new Set([
  "QA A79 generated missing recovery",
  "QA A79 generated corrupt recovery",
]);

type Action = "INSPECT" | "DELETE_EXACT_GENERATED_OBJECT" | "CORRUPT_EXACT_GENERATED_OBJECT";

function safeRef(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export async function POST(request: Request) {
  await assertLocalOnlyRouteHost();
  let externalQa;
  try {
    externalQa = readExternalQaServerConfig(process.env);
  } catch {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  if (!externalQa.enabled || externalQa.production
    || !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.DOCUMENT_R0)) {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  const body = await request.json().catch(() => null) as { readonly action?: unknown; readonly documentId?: unknown } | null;
  const action = body?.action;
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";
  if (!(["INSPECT", "DELETE_EXACT_GENERATED_OBJECT", "CORRUPT_EXACT_GENERATED_OBJECT"] as const).includes(action as Action)
    || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/iu.test(documentId)) {
    return NextResponse.json({ error: "A79_STAGE2B_REQUEST_INVALID" }, { status: 400 });
  }

  const correlationId = randomUUID();
  const fixture = await loadCurrentGeneratedDocumentArtifactFixture({
    scope: guard.scope,
    companyMemberId: guard.session.companyMemberId,
    correlationId,
    documentId,
  });
  if (!fixture || !FIXTURE_NAMES.has(fixture.productName)) {
    return NextResponse.json({ error: "A79_STAGE2B_EXACT_FIXTURE_OWNERSHIP_REQUIRED" }, { status: 409 });
  }
  const metadata = fixture.metadata;
  if (!metadata.objectKey) return NextResponse.json({ error: "A79_STAGE2B_OBJECT_KEY_MISSING" }, { status: 409 });
  const store = new R2WorkerGeneratedDocumentObjectStore(new R2WorkerGeneratedDocumentTransport());
  const before = await inspectGeneratedDocumentArtifact(metadata, store);
  if (action === "DELETE_EXACT_GENERATED_OBJECT") {
    await store.deletePdf(metadata.objectKey);
  } else if (action === "CORRUPT_EXACT_GENERATED_OBJECT") {
    const corrupt = Buffer.from("A79_STAGE2B_DETERMINISTIC_CORRUPT_ARTIFACT", "ascii");
    await store.putPdf({
      key: metadata.objectKey,
      contentType: "application/pdf",
      fileSizeBytes: corrupt.byteLength,
      contentSha256: createHash("sha256").update(corrupt).digest("hex"),
      body: corrupt,
    });
  }
  const after = await inspectGeneratedDocumentArtifact(metadata, store);
  const expected = action === "DELETE_EXACT_GENERATED_OBJECT" ? "missing"
    : action === "CORRUPT_EXACT_GENERATED_OBJECT" ? "corrupt" : before;
  if (after !== expected) return NextResponse.json({ error: "A79_STAGE2B_EXACT_ARTIFACT_STATE_MISMATCH", before, after }, { status: 500 });
  return NextResponse.json({
    ok: true,
    data: { action, before, after, documentRef: safeRef(documentId), objectKeyRef: safeRef(metadata.objectKey), unrelatedMutation: 0 },
  }, { headers: { "Cache-Control": "no-store" } });
}
