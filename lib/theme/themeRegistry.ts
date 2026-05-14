import type { PbpThemeDefinition, PbpThemeId, PbpThemeRegistry } from "./themeTypes";
import { DEFAULT_LIGHT_THEME, DEFAULT_LIGHT_THEME_ID } from "./themes/defaultLight";

export const DEFAULT_PBP_THEME_ID: PbpThemeId = DEFAULT_LIGHT_THEME_ID;

export const PBP_THEME_REGISTRY: PbpThemeRegistry = {
  [DEFAULT_LIGHT_THEME_ID]: DEFAULT_LIGHT_THEME,
};

export function getPbpThemeDefinition(themeId: PbpThemeId | undefined): PbpThemeDefinition {
  if (!themeId) {
    return PBP_THEME_REGISTRY[DEFAULT_PBP_THEME_ID];
  }

  return PBP_THEME_REGISTRY[themeId] ?? PBP_THEME_REGISTRY[DEFAULT_PBP_THEME_ID];
}

export function getPbpThemeCssVariables(themeId: PbpThemeId | undefined) {
  return getPbpThemeDefinition(themeId).cssVariables;
}
