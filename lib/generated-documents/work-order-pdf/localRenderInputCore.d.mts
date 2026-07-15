import type { WorkOrderIssuedPdfSnapshot } from "./snapshot";

export type LocalIssuedPdfRenderInput = {
  readonly snapshot: WorkOrderIssuedPdfSnapshot;
  readonly canonicalSnapshotJson: string;
  readonly snapshotSha256: string;
  readonly objectKeyPlan: string;
  readonly representativeImageDataUrl: string | null;
};

export function getLocalIssuedPdfRenderInputPath(runToken: string): string;
export function writeLocalIssuedPdfRenderInput(
  runToken: string,
  input: LocalIssuedPdfRenderInput,
): Promise<string>;
export function readLocalIssuedPdfRenderInput(runToken: string): Promise<LocalIssuedPdfRenderInput>;
