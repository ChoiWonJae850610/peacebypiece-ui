export type GeneratedDocumentPurgeStoragePlan =
  | "already_deleted"
  | "delete_then_finalize"
  | "finalize_confirmed_absent";

export function resolveGeneratedDocumentPurgeStoragePlan(input: {
  readonly lifecycle: "revoked" | "deleted";
  readonly objectPresent: boolean;
}): GeneratedDocumentPurgeStoragePlan {
  if (input.lifecycle === "deleted") return "already_deleted";
  return input.objectPresent ? "delete_then_finalize" : "finalize_confirmed_absent";
}

export function resolveAmbiguousGeneratedDocumentDelete(input: {
  readonly verification: "absent" | "present" | "unknown";
}) {
  return {
    mayFinalizeDeleted: input.verification === "absent",
    mustRemainRevoked: input.verification !== "absent",
  } as const;
}
