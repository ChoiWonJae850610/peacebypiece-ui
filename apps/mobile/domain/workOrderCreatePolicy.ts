import type { WorkOrderListItem } from "@/domain/mobileContract";

export type WorkOrderCreateAttemptIdentity = {
  readonly productName: string;
  readonly isSample: boolean;
  readonly clientRequestId: string;
  readonly idempotencyKey: string;
};

export function resolveWorkOrderCreateAttempt(
  existing: WorkOrderCreateAttemptIdentity | null,
  productName: string,
  isSample: boolean,
  suffix: string,
): WorkOrderCreateAttemptIdentity {
  if (existing?.productName === productName && existing.isSample === isSample) return existing;
  const identity = `alpha61-mobile-create-${suffix}`;
  return { productName, isSample, clientRequestId: identity, idempotencyKey: identity };
}

export function reconcileCreatedWorkOrderListItem(
  current: readonly WorkOrderListItem[],
  created: WorkOrderListItem,
): readonly WorkOrderListItem[] {
  return [created, ...current.filter((item) => item.workOrderId !== created.workOrderId)];
}
