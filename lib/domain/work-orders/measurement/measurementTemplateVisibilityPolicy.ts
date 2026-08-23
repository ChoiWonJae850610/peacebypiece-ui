export type MeasurementTemplateVisibilityCandidate = {
  readonly id: string;
  readonly sourceKind: "system" | "company";
};

export function filterMakerVisibleMeasurementTemplates<T extends MeasurementTemplateVisibilityCandidate>(
  templates: readonly T[],
  currentWaflBasicTemplateId: string | null,
): readonly T[] {
  return templates.filter((template) => template.sourceKind === "company"
    || (template.sourceKind === "system" && template.id === currentWaflBasicTemplateId));
}
