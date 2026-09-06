import type { WaflPickerRenderPath } from "./waflPickerRenderPolicy.ts";
import { WAFL_THEME } from "../../../constants/theme.ts";

export const WAFL_REEL_ROW_HEIGHT = 44;
export const WAFL_REEL_VISIBLE_ROWS = 5;
export const WAFL_REEL_VIEWPORT_HEIGHT = WAFL_REEL_ROW_HEIGHT * WAFL_REEL_VISIBLE_ROWS;

const BODY_TOP_GAP = 14;
const REEL_LABEL_HEIGHT = 18;
const MODE_SWITCH_HEIGHT = 50;
const DIRECT_INPUT_BLOCK_HEIGHT = 84;
const SUPPLEMENTARY_CONTROL_HEIGHT = 50;
export const WAFL_REEL_AUXILIARY_STATUS_HEIGHT = 40;

export function formatWaflNumericOpeningValueForDisplay(value: string) {
  const decimal = /^([+-]?\d+)\.(\d+)$/u.exec(value);
  if (decimal === null) return value;
  const fraction = decimal[2]!.replace(/0+$/u, "");
  return fraction.length > 0 ? `${decimal[1]}.${fraction}` : decimal[1]!;
}

export function resolveWaflNumericAuxiliaryStatus(input: {
  readonly legacyValue: string | null;
  readonly validationMessage: string | null;
}) {
  const legacyText = input.legacyValue
    ? `기존값 ${formatWaflNumericOpeningValueForDisplay(input.legacyValue)}`
    : null;
  const validationText = input.validationMessage;
  return {
    kind: validationText ? "validation" : legacyText ? "legacy" : "empty",
    legacyText,
    text: validationText ?? legacyText,
    validationText,
  } as const;
}

export function resolveWaflReelAdaptiveBodyHeight(input: {
  readonly renderPath: WaflPickerRenderPath;
  readonly hasModeSwitch: boolean;
  readonly hasSupplementaryControl: boolean;
  readonly hasValidationMessage: boolean;
  readonly reserveAuxiliaryStatus?: boolean;
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
    + (input.hasValidationMessage || input.reserveAuxiliaryStatus ? WAFL_REEL_AUXILIARY_STATUS_HEIGHT : 0)
    + WAFL_THEME.sheet.bodyEndGap;
}
