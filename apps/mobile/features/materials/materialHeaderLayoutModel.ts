export const MATERIAL_HEADER_NAME_MAX_LINES = 2;

export type MaterialHeaderPresentation = {
  readonly name: string;
  readonly maxNameLines: number;
  readonly badgeCluster: readonly [
    { readonly kind: "unit"; readonly text: string },
    { readonly kind: "status"; readonly text: string },
  ];
};

export function createMaterialHeaderPresentation(input: {
  readonly name: string;
  readonly unitCode: string;
  readonly statusLabel: string;
}): MaterialHeaderPresentation {
  return {
    name: input.name,
    maxNameLines: MATERIAL_HEADER_NAME_MAX_LINES,
    badgeCluster: [
      { kind: "unit", text: input.unitCode },
      { kind: "status", text: input.statusLabel },
    ],
  };
}
