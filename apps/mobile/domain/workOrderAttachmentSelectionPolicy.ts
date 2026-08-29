export type WorkOrderAttachmentOutputChange = {
  readonly attachmentId: string;
  readonly includeInDocument: boolean;
};

export async function applyVersionedAttachmentOutputSelection(input: {
  readonly initialVersion: number;
  readonly changes: readonly WorkOrderAttachmentOutputChange[];
  readonly execute: (change: WorkOrderAttachmentOutputChange, expectedVersion: number) => Promise<number>;
  readonly reconcile: (authoritativeVersion: number | null) => Promise<void>;
}) {
  let nextVersion = input.initialVersion;
  try {
    for (const change of input.changes) {
      nextVersion = await input.execute(change, nextVersion);
      if (!Number.isSafeInteger(nextVersion) || nextVersion < 1) throw new Error("ATTACHMENT_OUTPUT_VERSION_INVALID");
    }
    await input.reconcile(nextVersion);
    return { ok: true, nextVersion } as const;
  } catch (error) {
    await input.reconcile(null).catch(() => undefined);
    return { ok: false, nextVersion, error } as const;
  }
}
