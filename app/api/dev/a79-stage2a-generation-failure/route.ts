import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { readExternalQaServerConfig } from "@/lib/external-qa/configCore.mjs";
import { isMakerQaCapabilityEnabled, MAKER_QA_CAPABILITY } from "@/lib/external-qa/makerQaCapabilities.mjs";
import {
  GeneratedDocumentGenerationError,
  generateIssuedWorkOrderDocument,
  type GenerationExecutionHooks,
} from "@/lib/generated-documents/work-order-pdf/generationService";
import {
  R2WorkerGeneratedDocumentObjectStore,
  type GeneratedDocumentObjectMetadata,
  type GeneratedDocumentObjectStore,
} from "@/lib/generated-documents/work-order-pdf/objectStore";
import { R2WorkerGeneratedDocumentTransport } from "@/lib/generated-documents/work-order-pdf/r2WorkerTransport";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Scenario = "FAIL_BEFORE_OBJECT_PUT" | "FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE";

function safeRef(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

class ExactAttemptTrackingObjectStore implements GeneratedDocumentObjectStore {
  readonly counts = { put: 0, head: 0, get: 0, delete: 0 };
  private exactCreatedKey: string | null = null;

  constructor(private readonly delegate: GeneratedDocumentObjectStore) {}

  async putPdf(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }) {
    if (this.exactCreatedKey !== null) throw new Error("A79_STAGE2A_MULTIPLE_OBJECT_PUT_FORBIDDEN");
    const result = await this.delegate.putPdf(input);
    this.exactCreatedKey = input.key;
    this.counts.put += 1;
    return result;
  }

  async headPdf(key: string) {
    this.counts.head += 1;
    return this.delegate.headPdf(key);
  }

  async getPdf(key: string) {
    this.counts.get += 1;
    return this.delegate.getPdf(key);
  }

  async deletePdf(key: string) {
    if (this.exactCreatedKey === null || key !== this.exactCreatedKey) {
      throw new Error("A79_STAGE2A_NON_OWNED_DELETE_FORBIDDEN");
    }
    await this.delegate.deletePdf(key);
    this.counts.delete += 1;
  }

  objectKeyRef(): string | null {
    return this.exactCreatedKey ? safeRef(this.exactCreatedKey) : null;
  }

  async exactObjectAbsent(): Promise<boolean> {
    return this.exactCreatedKey === null || (await this.delegate.headPdf(this.exactCreatedKey)) === null;
  }
}

export async function POST(request: Request) {
  await assertLocalOnlyRouteHost();
  let externalQa;
  try {
    externalQa = readExternalQaServerConfig(process.env);
  } catch {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  if (
    !externalQa.enabled
    || externalQa.production
    || !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.DOCUMENT_R0)
  ) {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  const body = await request.json().catch(() => null) as {
    readonly scenario?: unknown;
    readonly workOrderId?: unknown;
    readonly revisionId?: unknown;
  } | null;
  const scenario = body?.scenario;
  const workOrderId = typeof body?.workOrderId === "string" ? body.workOrderId : "";
  const revisionId = typeof body?.revisionId === "string" ? body.revisionId : "";
  if (scenario !== "FAIL_BEFORE_OBJECT_PUT" && scenario !== "FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE") {
    return NextResponse.json({ error: "A79_STAGE2A_SCENARIO_INVALID" }, { status: 400 });
  }

  const trackingStore = new ExactAttemptTrackingObjectStore(
    new R2WorkerGeneratedDocumentObjectStore(new R2WorkerGeneratedDocumentTransport()),
  );
  const hooks: GenerationExecutionHooks = scenario === "FAIL_BEFORE_OBJECT_PUT"
    ? { beforeObjectPut: () => { throw new Error("A79_STAGE2A_FAIL_BEFORE_OBJECT_PUT"); } }
    : { afterObjectPutBeforeFinalize: () => { throw new Error("A79_STAGE2A_FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE"); } };

  try {
    await generateIssuedWorkOrderDocument({
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId: randomUUID(),
      workOrderId,
      revisionId,
      idempotencyKey: `a79-stage2a-${scenario.toLowerCase()}-${randomUUID()}`,
    }, { hooks, objectStore: trackingStore });
    return NextResponse.json({ error: "A79_STAGE2A_EXPECTED_FAILURE_MISSING" }, { status: 409 });
  } catch (error) {
    if (!(error instanceof GeneratedDocumentGenerationError) || error.code !== "GENERATION_FAILED") {
      throw error;
    }
    const exactObjectAbsent = await trackingStore.exactObjectAbsent();
    const expectedCounts = scenario === "FAIL_BEFORE_OBJECT_PUT"
      ? trackingStore.counts.put === 0 && trackingStore.counts.delete === 0
      : trackingStore.counts.put === 1 && trackingStore.counts.delete === 1 && exactObjectAbsent;
    if (!expectedCounts) {
      return NextResponse.json({
        error: "A79_STAGE2A_EXACT_CLEANUP_INCOMPLETE",
        counts: trackingStore.counts,
        exactObjectAbsent,
      }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({
      ok: true,
      data: {
        scenario,
        status: "failed",
        counts: trackingStore.counts,
        objectKeyRef: trackingStore.objectKeyRef(),
        exactObjectAbsent,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  }
}
