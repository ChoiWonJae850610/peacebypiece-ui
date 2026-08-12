export type WaflPickerKind = "quantity" | "unit" | "integer" | "option" | "eighth-inch";

export type WaflPickerRenderPath =
  | "single-choice-reel"
  | "numeric-reel"
  | "numeric-keypad";

export function resolveWaflPickerRenderPath(
  kind: WaflPickerKind,
  mode: "reel" | "keypad",
): WaflPickerRenderPath {
  if (kind === "option") return "single-choice-reel";
  return mode === "reel" ? "numeric-reel" : "numeric-keypad";
}
