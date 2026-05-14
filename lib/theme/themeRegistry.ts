import type { PbpThemeDefinition, PbpThemeId, PbpThemeRegistry } from "./themeTypes";
import { BEIGE_ATELIER_THEME, BEIGE_ATELIER_THEME_ID } from "./themes/beigeAtelier";
import { COLD_WINTER_THEME, COLD_WINTER_THEME_ID } from "./themes/coldWinter";
import { DEFAULT_LIGHT_THEME, DEFAULT_LIGHT_THEME_ID } from "./themes/defaultLight";

export const DEFAULT_PBP_THEME_ID: PbpThemeId = DEFAULT_LIGHT_THEME_ID;

export const PBP_THEME_REGISTRY: PbpThemeRegistry = {
  [DEFAULT_LIGHT_THEME_ID]: DEFAULT_LIGHT_THEME,
  [BEIGE_ATELIER_THEME_ID]: BEIGE_ATELIER_THEME,
  [COLD_WINTER_THEME_ID]: COLD_WINTER_THEME,
};

export const PBP_THEME_OPTIONS = [
  { id: DEFAULT_LIGHT_THEME_ID, theme: DEFAULT_LIGHT_THEME },
  { id: BEIGE_ATELIER_THEME_ID, theme: BEIGE_ATELIER_THEME },
  { id: COLD_WINTER_THEME_ID, theme: COLD_WINTER_THEME },
] as const;

export function getPbpThemeDefinition(themeId: PbpThemeId | undefined): PbpThemeDefinition {
  if (!themeId) {
    return PBP_THEME_REGISTRY[DEFAULT_PBP_THEME_ID];
  }

  return PBP_THEME_REGISTRY[themeId] ?? PBP_THEME_REGISTRY[DEFAULT_PBP_THEME_ID];
}

export function getPbpThemeCssVariables(themeId: PbpThemeId | undefined) {
  return getPbpThemeDefinition(themeId).cssVariables;
}
