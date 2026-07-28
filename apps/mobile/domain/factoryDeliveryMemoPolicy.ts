export const FACTORY_DELIVERY_MEMO_MAX_LENGTH = 500;

export function factoryDeliveryMemoLength(value: string): number {
  return value.length;
}

export function clampFactoryDeliveryMemo(value: string): string {
  if (factoryDeliveryMemoLength(value) <= FACTORY_DELIVERY_MEMO_MAX_LENGTH) return value;
  let end = FACTORY_DELIVERY_MEMO_MAX_LENGTH;
  const lastIncluded = value.charCodeAt(end - 1);
  const firstExcluded = value.charCodeAt(end);
  if (
    lastIncluded >= 0xd800
    && lastIncluded <= 0xdbff
    && firstExcluded >= 0xdc00
    && firstExcluded <= 0xdfff
  ) {
    end -= 1;
  }
  return value.slice(0, end);
}
