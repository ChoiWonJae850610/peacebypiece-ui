import { DEFAULT_LIGHT_THEME } from "./themes/defaultLight";
import type { PbpThemeCssVariableName, PbpThemeTokenMap } from "./themeTypes";

export const DEFAULT_THEME_RUNTIME_MIRROR_SOURCE = "lib/theme/themes/defaultLight.ts" as const;
export const DEFAULT_THEME_RUNTIME_MIRROR_TARGET = "app/globals.css :root" as const;

export const DEFAULT_LIGHT_THEME_VARIABLE_NAMES = Object.keys(
  DEFAULT_LIGHT_THEME.cssVariables,
) as PbpThemeCssVariableName[];

export const DEFAULT_LIGHT_THEME_VARIABLE_COUNT = DEFAULT_LIGHT_THEME_VARIABLE_NAMES.length;

export type PbpThemeVariableSyncReport = {
  source: typeof DEFAULT_THEME_RUNTIME_MIRROR_SOURCE;
  target: typeof DEFAULT_THEME_RUNTIME_MIRROR_TARGET;
  sourceCount: number;
  targetCount: number;
  missingFromTarget: PbpThemeCssVariableName[];
  extraInTarget: PbpThemeCssVariableName[];
};

function toThemeVariableNameSet(variableNames: Iterable<string>) {
  return new Set(Array.from(variableNames).filter((name): name is PbpThemeCssVariableName => name.startsWith("--")));
}

export function getThemeVariableNames(themeVariables: PbpThemeTokenMap): PbpThemeCssVariableName[] {
  return Object.keys(themeVariables) as PbpThemeCssVariableName[];
}

export function buildDefaultThemeVariableSyncReport(
  targetVariableNames: Iterable<string>,
): PbpThemeVariableSyncReport {
  const sourceNames = toThemeVariableNameSet(DEFAULT_LIGHT_THEME_VARIABLE_NAMES);
  const targetNames = toThemeVariableNameSet(targetVariableNames);

  return {
    source: DEFAULT_THEME_RUNTIME_MIRROR_SOURCE,
    target: DEFAULT_THEME_RUNTIME_MIRROR_TARGET,
    sourceCount: sourceNames.size,
    targetCount: targetNames.size,
    missingFromTarget: Array.from(sourceNames).filter((name) => !targetNames.has(name)),
    extraInTarget: Array.from(targetNames).filter((name) => !sourceNames.has(name)),
  };
}

export const DEFAULT_THEME_SYNC_RULES = [
  "defaultLight.ts의 cssVariables와 app/globals.css :root 변수명은 일치해야 한다.",
  "동적 테마 적용 전까지 app/globals.css :root는 default-light의 런타임 mirror 역할만 한다.",
  "컴포넌트는 색상값이나 테마 이름이 아니라 pbp-* semantic class를 참조한다.",
  "새 semantic class가 CSS 변수를 추가하면 defaultLight.ts와 globals.css에 동시에 반영한다.",
  "테마 파일 분리 후에도 상태 의미색과 브랜드/분위기색은 분리해서 유지한다.",
] as const;
