import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getWaflSessionSigningSecret } from "@/lib/auth/session";
import type { OpaqueCursor, WorkOrderId } from "@/lib/domain/work-orders/contracts";

const CURSOR_VERSION = 1;
const CURSOR_TTL_MS = 60 * 60 * 1000;

type WorkOrderListCursorPayload = {
  readonly v: number;
  readonly exp: number;
  readonly u: string;
  readonly i: string;
  readonly s: string;
};

export type WorkOrderListCursorPosition = {
  readonly updatedAt: string;
  readonly workOrderId: WorkOrderId;
};

export class WorkOrderListCursorError extends Error {
  constructor() {
    super("CURSOR_INVALID");
    this.name = "WorkOrderListCursorError";
  }
}

function sign(value: string): string {
  return createHmac("sha256", getWaflSessionSigningSecret()).update(`work-order-list:${value}`).digest("base64url");
}

function scopeHash(companyId: string, visibilityKey: string): string {
  return createHmac("sha256", getWaflSessionSigningSecret())
    .update(`work-order-list-scope:${companyId}:${visibilityKey}`)
    .digest("base64url")
    .slice(0, 24);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function encodeWorkOrderListCursor(input: {
  readonly companyId: string;
  readonly visibilityKey: string;
  readonly position: WorkOrderListCursorPosition;
  readonly now?: number;
}): OpaqueCursor {
  const payload: WorkOrderListCursorPayload = {
    v: CURSOR_VERSION,
    exp: (input.now ?? Date.now()) + CURSOR_TTL_MS,
    u: input.position.updatedAt,
    i: input.position.workOrderId,
    s: scopeHash(input.companyId, input.visibilityKey),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}` as OpaqueCursor;
}

export function decodeWorkOrderListCursor(input: {
  readonly cursor: string;
  readonly companyId: string;
  readonly visibilityKey: string;
  readonly now?: number;
}): WorkOrderListCursorPosition {
  const [encoded, receivedSignature, extra] = input.cursor.split(".");
  if (!encoded || !receivedSignature || extra) throw new WorkOrderListCursorError();

  const expectedSignature = sign(encoded);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new WorkOrderListCursorError();
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<WorkOrderListCursorPayload>;
    const updatedAt = typeof payload.u === "string" ? payload.u : "";
    const updatedAtMs = Date.parse(updatedAt);
    if (
      payload.v !== CURSOR_VERSION ||
      typeof payload.exp !== "number" ||
      payload.exp <= (input.now ?? Date.now()) ||
      payload.s !== scopeHash(input.companyId, input.visibilityKey) ||
      !Number.isFinite(updatedAtMs) ||
      typeof payload.i !== "string" ||
      !isUuid(payload.i)
    ) {
      throw new WorkOrderListCursorError();
    }

    return {
      updatedAt: new Date(updatedAtMs).toISOString(),
      workOrderId: payload.i as WorkOrderId,
    };
  } catch (error) {
    if (error instanceof WorkOrderListCursorError) throw error;
    throw new WorkOrderListCursorError();
  }
}
