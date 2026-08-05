import type { MaterialDraftFields } from "@/domain/mobileContract";

export type MaterialInlineEditSession = {
  readonly workOrderId: string;
  readonly itemId: string;
  readonly field: keyof MaterialDraftFields;
  readonly token: number;
  readonly workOrderGeneration: number;
};

export function createMaterialInlineEditSession(input: MaterialInlineEditSession): MaterialInlineEditSession {
  return Object.freeze({ ...input });
}

export function ownsMaterialInlineEditSession(
  current: MaterialInlineEditSession | null,
  candidate: MaterialInlineEditSession | null,
) {
  return current !== null
    && candidate !== null
    && current.workOrderId === candidate.workOrderId
    && current.itemId === candidate.itemId
    && current.field === candidate.field
    && current.token === candidate.token
    && current.workOrderGeneration === candidate.workOrderGeneration;
}

export function clearOwnedMaterialInlineEditSession(
  current: MaterialInlineEditSession | null,
  candidate: MaterialInlineEditSession,
) {
  return ownsMaterialInlineEditSession(current, candidate) ? null : current;
}
