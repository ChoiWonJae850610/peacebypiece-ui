export const USAGE_RISK = {
  normal: "normal",
  warning: "warning",
  exceeded: "exceeded",
} as const;

export type UsageRiskCode = (typeof USAGE_RISK)[keyof typeof USAGE_RISK];

export type UsageRiskTone = "success" | "warning" | "danger";

export const USAGE_RISK_LABELS_KO: Record<UsageRiskCode, string> = {
  [USAGE_RISK.normal]: "정상",
  [USAGE_RISK.warning]: "주의",
  [USAGE_RISK.exceeded]: "초과",
};

export const USAGE_RISK_TONES: Record<UsageRiskCode, UsageRiskTone> = {
  [USAGE_RISK.normal]: "success",
  [USAGE_RISK.warning]: "warning",
  [USAGE_RISK.exceeded]: "danger",
};

export function resolveUsageRiskCode(input: {
  ratio?: number | null | undefined;
  exceeded?: boolean | null | undefined;
  warningThreshold?: number | null | undefined;
}): UsageRiskCode {
  if (input.exceeded) return USAGE_RISK.exceeded;

  const ratio = Number(input.ratio ?? 0);
  const warningThreshold = Number(input.warningThreshold ?? 0.85);

  if (Number.isFinite(ratio) && ratio >= warningThreshold) {
    return USAGE_RISK.warning;
  }

  return USAGE_RISK.normal;
}

export function getUsageRiskLabelKo(code: UsageRiskCode): string {
  return USAGE_RISK_LABELS_KO[code];
}

export function getUsageRiskTone(code: UsageRiskCode): UsageRiskTone {
  return USAGE_RISK_TONES[code];
}
