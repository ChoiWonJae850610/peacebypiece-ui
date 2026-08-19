import type { WaflPickerRenderPath } from "./waflPickerRenderPolicy.ts";

export const WAFL_REEL_ROW_HEIGHT = 44;
export const WAFL_REEL_VISIBLE_ROWS = 5;
export const WAFL_REEL_VIEWPORT_HEIGHT = WAFL_REEL_ROW_HEIGHT * WAFL_REEL_VISIBLE_ROWS;

const BODY_TOP_GAP = 14;
const REEL_LABEL_HEIGHT = 18;
const MODE_SWITCH_HEIGHT = 50;
const DIRECT_INPUT_BLOCK_HEIGHT = 84;
const SUPPLEMENTARY_CONTROL_HEIGHT = 50;
const VALIDATION_MESSAGE_HEIGHT = 20;

export function resolveWaflReelAdaptiveBodyHeight(input: {
  readonly renderPath: WaflPickerRenderPath;
  readonly hasModeSwitch: boolean;
  readonly hasSupplementaryControl: boolean;
  readonly hasValidationMessage: boolean;
}) {
  const mainHeight = input.renderPath === "single-choice-reel"
    ? WAFL_REEL_VIEWPORT_HEIGHT + REEL_LABEL_HEIGHT
    : input.renderPath === "numeric-reel"
      ? WAFL_REEL_VIEWPORT_HEIGHT + REEL_LABEL_HEIGHT
      : DIRECT_INPUT_BLOCK_HEIGHT;
  return BODY_TOP_GAP
    + mainHeight
    + (input.hasModeSwitch ? MODE_SWITCH_HEIGHT : 0)
    + (input.hasSupplementaryControl ? SUPPLEMENTARY_CONTROL_HEIGHT : 0)
    + (input.hasValidationMessage ? VALIDATION_MESSAGE_HEIGHT : 0);
}
