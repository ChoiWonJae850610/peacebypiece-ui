export type PendingCommandScope = "structure" | "quantity" | "measurement-cell" | "measurement-unit" | "template";

export function isSizeColorCommandPending(
  pendingScope: PendingCommandScope | null,
  controlScope: PendingCommandScope,
) {
  return pendingScope === controlScope;
}
