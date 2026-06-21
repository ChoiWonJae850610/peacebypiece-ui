export type WaflUiCatalogPageProps = {
  appVersion: string;
  runtimeMode: string;
  isRuntimeAllowed: boolean;
  allowedRuntimeModes: string[];
};

export type CatalogSection = {
  id: string;
  title: string;
  plainTitle: string;
  description: string;
  status: "guide" | "sampled" | "skeleton";
};

export type QuickDecision = {
  label: string;
  component: string;
  rule: string;
  example: string;
};

export type ComponentSpec = {
  name: string;
  path: string;
  plainRule: string;
  purpose: string;
  props: string;
  avoid: string;
  screens: string;
};

export type ScreenChecklist = {
  screen: string;
  routeHint: string;
  purpose: string;
  requiredComponents: string[];
  checkItems: string[];
  missingRisk: string;
};

export type ComponentInventoryItem = {
  name: string;
  group: "Primitive" | "Pattern" | "Domain" | "Legacy";
  role: string;
  keepDecision: "유지" | "통합 후보" | "폐기 후보" | "전환 대상";
  target: string;
  priority: "높음" | "중간" | "낮음";
  note: string;
};

export type ComponentGroupGuide = {
  group: ComponentInventoryItem["group"];
  meaning: string;
  rule: string;
  examples: string;
};
