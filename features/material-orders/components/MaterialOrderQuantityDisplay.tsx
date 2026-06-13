import {
  formatMaterialQuantity,
  normalizeMaterialQuantityNumber,
  resolveMaterialQuantityNumberClassName,
} from "@/features/material-orders/materialOrderPanelUtils";

export function MaterialOrderQuantityText({
  quantity,
  unit,
}: {
  quantity: number;
  unit: string;
}) {
  const normalizedQuantity = normalizeMaterialQuantityNumber(quantity);
  const normalizedUnit = unit.trim();

  return (
    <span className="whitespace-nowrap tabular-nums">
      {normalizedQuantity}
      {normalizedUnit ? <span className="ml-1">{normalizedUnit}</span> : null}
    </span>
  );
}

export function MaterialOrderQuantityRatio({
  orderedQuantity,
  requiredQuantity,
  currentDraftQuantity,
  unit,
}: {
  orderedQuantity: number;
  requiredQuantity: number;
  currentDraftQuantity: number;
  unit: string;
}) {
  const normalizedOrderedQuantity =
    normalizeMaterialQuantityNumber(orderedQuantity);
  const normalizedRequiredQuantity =
    normalizeMaterialQuantityNumber(requiredQuantity);
  const numberClassName = resolveMaterialQuantityNumberClassName({
    orderedQuantity,
    requiredQuantity,
    currentDraftQuantity,
  });
  const normalizedUnit = unit.trim();

  return (
    <span
      className="shrink-0 whitespace-nowrap text-xs font-semibold pbp-text-muted"
      title={formatMaterialQuantity(orderedQuantity, unit)}
    >
      <span className={numberClassName}>{normalizedOrderedQuantity}</span>
      <span className="pbp-text-subtle">/{normalizedRequiredQuantity}</span>
      {normalizedUnit ? (
        <span className="ml-1 text-[10px] pbp-text-subtle">
          {normalizedUnit}
        </span>
      ) : null}
    </span>
  );
}
