import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type { WorkOrderIssuedPdfSnapshot } from "./snapshot";

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

export type LocalIssuedPdfRenderInput = {
  readonly snapshot: WorkOrderIssuedPdfSnapshot;
  readonly canonicalSnapshotJson: string;
  readonly snapshotSha256: string;
  readonly objectKeyPlan: string;
  readonly representativeImageDataUrl: string | null;
};

export function getLocalIssuedPdfRenderInputPath(runToken: string): string {
  if (!TOKEN_PATTERN.test(runToken)) throw new Error("PDF_LOCAL_RENDER_TOKEN_INVALID");
  return path.join(process.cwd(), ".tmp", "wafl-v2-alpha38", "render-input", `${runToken}.json`);
}

export async function readLocalIssuedPdfRenderInput(runToken: string): Promise<LocalIssuedPdfRenderInput> {
  const parsed = JSON.parse(await fs.readFile(getLocalIssuedPdfRenderInputPath(runToken), "utf8")) as LocalIssuedPdfRenderInput;
  if (!parsed.snapshot?.workOrderId
    || !parsed.snapshot?.revisionId
    || !/^[0-9a-f]{64}$/.test(parsed.snapshotSha256)
    || !parsed.canonicalSnapshotJson
    || !parsed.objectKeyPlan) {
    throw new Error("PDF_LOCAL_RENDER_INPUT_INVALID");
  }
  return parsed;
}
