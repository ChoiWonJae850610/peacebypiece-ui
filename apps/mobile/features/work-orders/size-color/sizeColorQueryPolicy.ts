export type SizeColorRequestAction = "initial" | "retry";
export type SizeColorRequestStatus = "not-loaded" | "loading" | "retrying" | "empty" | "loaded" | "error";

export type SizeColorRequestIdentity = {
  readonly workOrderId: string;
  readonly entityVersion: number;
  readonly cacheKey: string;
  readonly requestToken: number;
  readonly sessionGeneration: number;
};

export type SizeColorRuntimeIdentity = {
  readonly selectedWorkOrderId: string | null;
  readonly selectedEntityVersion: number | null;
  readonly activeRequestToken: number | undefined;
  readonly sessionGeneration: number;
};

type VersionedSizeColorRead = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly entityVersion: number;
};

export class SizeColorReadConflictError extends Error {
  readonly code = "SIZE_COLOR_VERSION_CONFLICT";

  constructor() {
    super("SIZE_COLOR_VERSION_CONFLICT");
    this.name = "SizeColorReadConflictError";
  }
}

export function sizeColorRequestKey(workOrderId: string, entityVersion: number) {
  return `${workOrderId}:${entityVersion}`;
}

export function shouldStartSizeColorRequest(
  action: SizeColorRequestAction,
  status: SizeColorRequestStatus,
  inFlight: boolean,
) {
  if (inFlight) return false;
  if (action === "retry") return status === "error";
  return status === "not-loaded";
}

export function nextSizeColorSessionGeneration(current: number) {
  return current + 1;
}

export function isSizeColorResponseCommitAllowed(
  request: SizeColorRequestIdentity,
  runtime: SizeColorRuntimeIdentity,
) {
  return runtime.sessionGeneration === request.sessionGeneration
    && runtime.activeRequestToken === request.requestToken
    && runtime.selectedWorkOrderId === request.workOrderId
    && runtime.selectedEntityVersion === request.entityVersion;
}

export async function readConsistentSizeColorBundle<
  Matrix extends VersionedSizeColorRead,
  Specifications extends VersionedSizeColorRead,
>(input: {
  readonly workOrderId: string;
  readonly expectedEntityVersion: number;
  readonly readMatrix: () => Promise<Matrix>;
  readonly readSpecifications: () => Promise<Specifications>;
}) {
  const [matrix, specifications] = await Promise.all([
    input.readMatrix(),
    input.readSpecifications(),
  ]);
  if (
    matrix.workOrderId !== input.workOrderId
    || specifications.workOrderId !== input.workOrderId
    || matrix.revisionId !== specifications.revisionId
    || matrix.entityVersion !== specifications.entityVersion
    || matrix.entityVersion !== input.expectedEntityVersion
  ) {
    throw new SizeColorReadConflictError();
  }
  return { matrix, specifications };
}
