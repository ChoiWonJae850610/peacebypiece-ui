import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_13: RoadmapVersionDetail = {
  version: "0.24.34.13",
  title: "Codex Prompt Consistency Final Review",
  status: "completed",
  userSummary: [
    "0.24.34.12 적용 결과 build/repo-state 정상 상태를 확인한 뒤 Codex continuation prompt 일관성을 최종 점검한다.",
    "A~E/Final prompt가 서로 범위를 침범하지 않고 순차 checkpoint로 유지되는지 문서화한다.",
    "0.24.35 Export는 owner 승인 전 시작하지 않는 경계를 다시 고정한다.",
  ],
  visibleChanges: [
    "사용자 업무 화면 UI 변경 없음.",
    "시스템 관리자 화면 UI 변경 없음.",
  ],
  expectedUi: [
    "사용자 업무 화면 변경 없음.",
    "시스템 관리자 화면 변경 없음.",
  ],
  developmentPurpose: [
    "Codex가 0.24.35 또는 continuation 구현을 시작하기 전에 A~E/Final prompt 범위 충돌을 방지한다.",
    "Final prompt가 새 기능 구현으로 확장되지 않도록 경계를 문서화한다.",
    "source ZIP/evidence ZIP/commit-meta token contract를 후속 작업에서도 유지하게 한다.",
  ],
  developmentUiStructure: [
    "UI 구조 변경 없음.",
    "문서, roadmap, version만 갱신한다.",
  ],
  scope: [
    "docs/audits/0.24.34.13-codex-prompt-consistency-final-review.md 추가",
    "docs/codex-current-state.md에 0.24.34.13 checkpoint 추가",
    "lib/constants/version.ts를 0.24.34.13으로 갱신",
    "roadmap 0.24.34.13 등록",
  ],
  outOfScope: [
    "0.24.35 Export 구현",
    "PDF 템플릿 구현",
    "DB/R2 변경",
    "PowerShell pipeline logic 변경",
    "Codex prompt 본문 대규모 재작성",
  ],
  implementationPrinciples: [
    "A~E prompt는 순차 checkpoint로만 실행한다.",
    "Final prompt는 검수/commit/push 전용이다.",
    "CONFIRMED 정책은 다시 묻지 않는다.",
    "source ZIP과 QA evidence ZIP을 분리한다.",
    "commit-meta.md는 현재 watcher token contract를 따른다.",
  ],
  successConditions: [
    "0.24.34.12 build/repo-state 정상 기준이 문서화된다.",
    "A~E/Final prompt의 범위 분리 조건이 명확해진다.",
    "0.24.35가 owner 승인 전 시작되지 않는다.",
  ],
  failureConditions: [
    "Codex가 A~E prompt를 한 번에 합쳐 구현한다.",
    "Final prompt에서 새 기능 구현을 시작한다.",
    "0.24.35 Export가 owner 승인 없이 시작된다.",
  ],
  cautions: [
    "이번 버전은 문서/roadmap checkpoint이며 실제 기능 구현이 아니다.",
    "0.24.35 Export는 아직 시작하지 않는다.",
  ],
  stopConditions: [
    "0.24.34.13 build 실패 시 0.24.35로 넘어가지 않는다.",
    "repo-state APP_VERSION이 잘못 출력되면 pipeline/repo-state 보정을 먼저 한다.",
  ],
  permissionImpact: "none",
  permissionNotes: [
    "권한 로직 변경 없음.",
  ],
  dbImpact: "none",
  dbImpactNotes: [
    "DB schema와 데이터 변경 없음.",
  ],
  r2Impact: "none",
  r2ImpactNotes: [
    "R2 저장/삭제/복구 로직 변경 없음.",
  ],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음.",
  automaticTests: [
    "npm run build",
    "repo-state APP_VERSION 확인",
    "source ZIP exclude 확인",
    "commit-meta token 검증",
  ],
  manualTests: [
    "Codex prompt A~E/Final 범위 분리 확인",
    "0.24.35 착수 전 owner 승인 여부 확인",
  ],
  expectedChangeAreas: [
    "docs/codex-current-state.md",
    "docs/audits",
    "lib/internal/roadmap",
    "lib/constants/version.ts",
  ],
  futureDependencies: [
    "0.24.34.14 Codex 0.24.35 start gate",
    "0.24.35 owner-approved implementation start",
  ],
  recommendedCommitMessage: "Codex continuation prompt 일관성 최종 점검",
  nextVersionBoundary: [
    "0.24.34.14는 0.24.35 start gate 문서화로 제한한다.",
    "0.24.35 Export 구현은 owner가 승인하기 전 시작하지 않는다.",
  ],
  completionConditions: [
    "prompt consistency audit 문서 추가 완료",
    "roadmap/version 등록 완료",
    "build/repo-state/source ZIP 검증 대기",
  ],
  result: {
    completedSummary: [
      "0.24.34.12 정상 적용 결과를 0.24.34.13 기준으로 이어받았다.",
      "Codex A~E/Final prompt 범위 분리와 순차 실행 조건을 문서화했다.",
      "0.24.35 owner 승인 전 미착수 경계를 유지했다.",
    ],
    commitHash: "pending",
    verificationResult: "GPT static packaging check only; owner build/repo-state verification required.",
    remainingIssues: [
      "0.24.34.13 owner local build/repo-state verification required.",
      "0.24.35 owner approval still required.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "0.24.34.13 적용 후 build/repo-state/source ZIP 결과 확인 필요.",
  },
};
