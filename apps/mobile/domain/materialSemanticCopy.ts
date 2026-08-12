export type MaterialSemanticKind = "fabric" | "accessory";

const COPY = {
  fabric: { noun: "원단", information: "원단 정보" },
  accessory: { noun: "부자재", information: "부자재 정보" },
} as const satisfies Readonly<Record<MaterialSemanticKind, {
  readonly noun: string;
  readonly information: string;
}>>;

export function materialNoun(kind: MaterialSemanticKind) {
  return COPY[kind].noun;
}

export function materialInformationSubject(kind: MaterialSemanticKind) {
  return COPY[kind].information;
}

export function materialMutationSuccessCopy(kind: MaterialSemanticKind, action: "create" | "edit" | "delete") {
  const subject = materialInformationSubject(kind);
  if (action === "create") return `${subject}를 추가했습니다.`;
  if (action === "edit") return `${subject}를 수정했습니다.`;
  return `${subject}를 삭제했습니다.`;
}

export function materialLatestCopy(kind: MaterialSemanticKind, state: "checking" | "verified" | "load-failed" | "verify-failed") {
  const subject = materialInformationSubject(kind);
  if (state === "checking") return `최신 ${subject}를 확인하고 있습니다.`;
  if (state === "verified") return `저장된 ${subject}를 확인했습니다.`;
  if (state === "verify-failed") return `저장은 반영됐지만 최신 ${subject}를 확인하지 못했습니다.`;
  return `최신 ${subject}를 불러오지 못했습니다.`;
}

export function materialMutationFailureCopy(kind: MaterialSemanticKind, action: "edit" | "state") {
  const subject = materialInformationSubject(kind);
  return action === "edit" ? `${subject}를 수정하지 못했습니다.` : `${subject} 상태를 변경하지 못했습니다.`;
}
