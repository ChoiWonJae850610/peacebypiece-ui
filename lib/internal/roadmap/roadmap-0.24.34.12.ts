import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_12: RoadmapVersionDetail = {
  version: "0.24.34.12",
  title: "Codex Prompt Synchronization",
  status: "completed",
  userSummary: [
    "0.24.34.11 적용 결과 build/repo-state 정상 상태를 확인한 뒤 Codex continuation prompt guard를 동기화한다.",
    "0.24.35 착수 전 canonical read order, commit-meta token, source/evidence ZIP 분리 규칙을 다시 고정한다.",
    "A~E 및 Final Codex prompt가 같은 순차 실행 규칙을 따르도록 정리한다.",
  ],
  visibleChanges: [
    "사용자 업무 화면 UI 변경 없음.",
    "Codex prompt와 문서 guardrail만 갱신된다.",
  ],
  expectedUi: [
    "사용자 업무 화면 변경 없음.",
    "시스템 관리자 화면 변경 없음.",
  ],
  developmentPurpose: [
    "Codex가 0.24.35 또는 continuation 구현을 시작하기 전에 읽어야 할 canonical 문서 순서를 명확히 한다.",
    "패치 packaging과 commit-meta token contract가 실제 watcher 검증 규칙과 일치하도록 문서화한다.",
    "source ZIP과 QA evidence ZIP 분리 원칙을 Codex 지시문에 다시 고정한다.",
  ],
  developmentUiStructure: [
    "UI 구조 변경 없음.",
    "문서, prompt, roadmap, version만 갱신한다.",
  ],
  scope: [
    "docs/codex-current-state.md 갱신",
    "docs/audits/0.24.34.12-codex-prompt-synchronization.md 추가",
    "docs/codex-prompts/0.24.34.5-continuation-*.md guardrail 동기화",
    "docs/codex-prompts/0.24.34.5-final-review-and-commit.md guardrail 동기화",
    "lib/constants/version.ts를 0.24.34.12로 갱신",
    "roadmap 0.24.34.12 등록",
  ],
  outOfScope: [
    "0.24.35 Export 구현",
    "PDF 템플릿 구현",
    "DB/R2 변경",
    "PowerShell pipeline logic 변경",
    "브라우저 QA evidence 생성",
  ],
  implementationPrinciples: [
    "이미 CONFIRMED 된 정책은 Codex가 다시 묻지 않는다.",
    "Codex prompt는 A → B → C → D → E → Final 순서로만 실행한다.",
    "Final prompt는 기능 구현이 아니라 검수/commit/push 전용이다.",
    "source ZIP과 QA evidence ZIP을 분리한다.",
    "commit-meta.md는 실제 watcher token contract를 따른다.",
  ],
  successConditions: [
    "모든 continuation prompt에 0.24.34.12 synchronization guard가 포함된다.",
    "commit-meta token contract가 Version/Summary/Description/수정/추가/삭제 파일 목록으로 문서화된다.",
    "docs/codex-current-state.md가 0.24.34.12 상태와 0.24.35 미착수 상태를 명시한다.",
    "0.24.35가 owner 승인 전 시작되지 않는다.",
  ],
  failureConditions: [
    "Codex가 A~E prompt를 한 번에 합쳐 구현한다.",
    "Final prompt에서 새 기능 구현을 시작한다.",
    "QA evidence가 source ZIP 또는 Git에 섞인다.",
    "commit-meta.md에 old token 변경 파일 목록 : 이 다시 사용된다.",
  ],
  cautions: [
    "이번 버전은 문서/지시문 동기화이며 실제 기능 구현이 아니다.",
    "0.24.35 Export는 아직 시작하지 않는다.",
    "Windows에서만 확인 가능한 PowerShell runtime 동작은 owner 로컬 검증에 맡긴다.",
  ],
  stopConditions: [
    "0.24.34.12 build 실패 시 0.24.35로 넘어가지 않는다.",
    "repo-state APP_VERSION이 잘못 출력되면 pipeline/repo-state 보정을 먼저 한다.",
    "source ZIP exclude가 깨지면 packaging 보정을 먼저 한다.",
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
    "Codex prompt A~E/Final의 read order와 synchronization guard 확인",
    "0.24.35 착수 전 owner 승인 여부 확인",
  ],
  expectedChangeAreas: [
    "docs/codex-current-state.md",
    "docs/audits",
    "docs/codex-prompts",
    "lib/internal/roadmap",
    "lib/constants/version.ts",
  ],
  futureDependencies: [
    "0.24.34.13 Codex prompt consistency final review",
    "0.24.35 owner-approved implementation start gate",
  ],
  recommendedCommitMessage: "Codex continuation 지시문과 패키징 계약 최종 동기화",
  nextVersionBoundary: [
    "0.24.34.13은 Codex A~E/Final prompt 최종 점검 또는 0.24.35 start gate 문서화로 제한한다.",
    "0.24.35 Export 구현은 owner가 승인하기 전 시작하지 않는다.",
  ],
  completionConditions: [
    "문서와 prompt guardrail 갱신 완료",
    "roadmap/version 등록 완료",
    "build/repo-state/source ZIP 검증 대기",
  ],
  result: {
    completedSummary: [
      "0.24.34.12 canonical/Codex prompt synchronization 문서를 추가했다.",
      "Codex continuation prompt 6개에 0.24.34.12 guard를 반영했다.",
      "commit-meta token contract와 source/evidence ZIP 분리 규칙을 current state에 고정했다.",
    ],
    commitHash: "pending",
    verificationResult: "GPT static packaging check only; owner build/repo-state verification required.",
    remainingIssues: [
      "0.24.34.12 owner local build/repo-state verification required.",
      "0.24.35 owner approval still required.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "0.24.34.12 적용 후 build/repo-state/source ZIP 결과 확인 필요.",
  },
};
