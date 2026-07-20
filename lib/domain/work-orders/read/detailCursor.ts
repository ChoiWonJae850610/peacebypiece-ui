import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getWaflSessionSigningSecret } from "@/lib/auth/session";
import type { OpaqueCursor, WorkOrderId } from "@/lib/domain/work-orders/contracts";

const CURSOR_VERSION = 1;
const CURSOR_TTL_MS = 60 * 60 * 1000;

export type WorkOrderTabCursorKind =
  | "materials:fabric"
  | "materials:accessory"
  | "materials:fabric:archived"
  | "materials:accessory:archived"
  | "assets"
  | "documents"
  | "history";

type WorkOrderTabCursorPayload = {
  readonly v: number;
  readonly exp: number;
  readonly k: WorkOrderTabCursorKind;
  readonly w: string;
  readonly p: readonly string[];
  readonly s: string;
};

export class WorkOrderTabCursorError extends Error {
  constructor() {
    super("CURSOR_INVALID");
    this.name = "WorkOrderTabCursorError";
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function sign(value: string): string {
  return createHmac("sha256", getWaflSessionSigningSecret()).update(`work-order-tab:${value}`).digest("base64url");
}

function scopeHash(input: { readonly companyId: string; readonly visibilityKey: string; readonly workOrderId: string; readonly kind: WorkOrderTabCursorKind }): string {
  return createHmac("sha256", getWaflSessionSigningSecret())
    .update(`work-order-tab-scope:${input.companyId}:${input.visibilityKey}:${input.workOrderId}:${input.kind}`)
    .digest("base64url")
    .slice(0, 24);
}

export function encodeWorkOrderTabCursor(input: {
  readonly companyId: string;
  readonly visibilityKey: string;
  readonly workOrderId: WorkOrderId;
  readonly kind: WorkOrderTabCursorKind;
  readonly position: readonly string[];
  readonly now?: number;
}): OpaqueCursor {
  const payload: WorkOrderTabCursorPayload = {
    v: CURSOR_VERSION,
    exp: (input.now ?? Date.now()) + CURSOR_TTL_MS,
    k: input.kind,
    w: input.workOrderId,
    p: input.position,
    s: scopeHash(input),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}` as OpaqueCursor;
}

export function decodeWorkOrderTabCursor(input: {
  readonly cursor: string;
  readonly companyId: string;
  readonly visibilityKey: string;
  readonly workOrderId: WorkOrderId;
  readonly kind: WorkOrderTabCursorKind;
  readonly positionLength: number;
  readonly now?: number;
}): readonly string[] {
  const [encoded, receivedSignature, extra] = input.cursor.split(".");
  if (!encoded || !receivedSignature || extra) throw new WorkOrderTabCursorError();
  const expectedSignature = sign(encoded);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new WorkOrderTabCursorError();

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<WorkOrderTabCursorPayload>;
    if (
      payload.v !== CURSOR_VERSION ||
      typeof payload.exp !== "number" ||
      payload.exp <= (input.now ?? Date.now()) ||
      payload.k !== input.kind ||
      payload.w !== input.workOrderId ||
      !isUuid(payload.w) ||
      payload.s !== scopeHash(input) ||
      !Array.isArray(payload.p) ||
      payload.p.length !== input.positionLength ||
      payload.p.some((value) => typeof value !== "string" || value.length === 0 || value.length > 128)
    ) {
      throw new WorkOrderTabCursorError();
    }
    return payload.p;
  } catch (error) {
    if (error instanceof WorkOrderTabCursorError) throw error;
    throw new WorkOrderTabCursorError();
  }
}
