export const FACTORY_DELIVERY_MEMO_MAX_LENGTH = 500;

export function factoryDeliveryMemoLength(value: string): number {
  return value.length;
}

function present(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

/** Current authoring SOT is the Basic Process memo; the revision field is legacy read fallback only. */
export function resolveFactoryDeliveryMemo(input: {
  readonly basicProcessMemo: string | null | undefined;
  readonly legacyFactoryDeliveryMemo: string | null | undefined;
}): string | null {
  return present(input.basicProcessMemo) ?? present(input.legacyFactoryDeliveryMemo);
}
