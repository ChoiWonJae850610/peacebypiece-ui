import type { CSSProperties } from "react";
import type { PbpThemeCssVariableName, PbpThemeDefinition, PbpThemeId } from "./themeTypes";
import { getPbpThemeDefinition } from "./themeRegistry";

export type PbpThemeRootStyle = CSSProperties & Partial<Record<PbpThemeCssVariableName, string>>;

export type PbpThemeRootAttributes = {
  "data-pbp-theme": PbpThemeId;
  "data-pbp-theme-tone": PbpThemeDefinition["tone"];
  style: PbpThemeRootStyle;
};

export function buildPbpThemeRootStyle(theme: PbpThemeDefinition): PbpThemeRootStyle {
  return Object.fromEntries(Object.entries(theme.cssVariables)) as PbpThemeRootStyle;
}

export function buildPbpThemeRootAttributes(themeId: PbpThemeId | undefined): PbpThemeRootAttributes {
  const theme = getPbpThemeDefinition(themeId);

  return {
    "data-pbp-theme": theme.id,
    "data-pbp-theme-tone": theme.tone,
    style: buildPbpThemeRootStyle(theme),
  };
}

export function applyPbpThemeToDocumentElement(
  element: HTMLElement,
  theme: PbpThemeDefinition,
) {
  element.dataset.pbpTheme = theme.id;
  element.dataset.pbpThemeTone = theme.tone;

  Object.entries(theme.cssVariables).forEach(([name, value]) => {
    element.style.setProperty(name, value);
  });
}
