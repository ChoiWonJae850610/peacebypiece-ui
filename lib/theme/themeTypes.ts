export type PbpThemeTone = "light" | "dark";

export type PbpThemeId = "default-light";

export type PbpThemeCssVariableName = `--${string}`;

export type PbpThemeTokenValue = string;

export type PbpThemeTokenMap = Record<PbpThemeCssVariableName, PbpThemeTokenValue>;

export type PbpThemeStatusTokenSet = {
  bg: PbpThemeTokenValue;
  text: PbpThemeTokenValue;
  dot: PbpThemeTokenValue;
};

export type PbpThemeFieldTokenSet = {
  surface: PbpThemeTokenValue;
  border: PbpThemeTokenValue;
  text?: PbpThemeTokenValue;
};

export type PbpThemeDefinition = {
  id: PbpThemeId;
  name: string;
  description: string;
  tone: PbpThemeTone;
  cssVariables: PbpThemeTokenMap;
};

export type PbpThemeRegistry = Record<PbpThemeId, PbpThemeDefinition>;
