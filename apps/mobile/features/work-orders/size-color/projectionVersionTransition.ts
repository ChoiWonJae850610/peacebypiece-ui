import { measurementProjectionImpact, type MeasurementProjectionCommandKind } from "./measurementProjectionImpactPolicy.ts";

export async function commitMeasurementProjectionTransition(input: {
  readonly command: MeasurementProjectionCommandKind;
  readonly nextVersion: number;
  readonly promoteProjection: (nextVersion: number) => void;
  readonly reconcileEntityVersion: (nextVersion: number) => void;
  readonly refreshSizeSpec: (nextVersion: number) => Promise<void>;
}) {
  const impact = measurementProjectionImpact(input.command);
  // The next-version bundle must exist before entityVersion can wake the read effect.
  input.promoteProjection(input.nextVersion);
  if (impact.specifications === "targeted-refresh") await input.refreshSizeSpec(input.nextVersion);
  input.reconcileEntityVersion(input.nextVersion);
  return impact;
}
