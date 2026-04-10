export const EDITOR_NUMERIC_FIELDS = ["quantity", "unitCost", "laborCost", "lossCost"] as const;

export function isEditorNumericField(field: string) {
  return (EDITOR_NUMERIC_FIELDS as readonly string[]).includes(field);
}
