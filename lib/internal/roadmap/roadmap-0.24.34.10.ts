import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_10: RoadmapVersionDetail = {
  version: "0.24.34.10",
  title: "Pipeline Contract Final Check",
  status: "completed",
  userSummary: [
    "0.24.34.9 watcher 정리 적용 결과를 기준으로 pipeline 계약을 다시 고정한다.",
    "commit-meta.md 필수 토큰을 현재 watcher 검증 규칙에 맞게 문서화한다.",
    "source ZIP과 repo-state APP_VERSION 보정 기준을 0.24.35 Export 착수 전 체크포인트로 남긴다.",
  ],
  visibleChanges: [
    "사용자 업무 화면 UI 변경 없음.",
    "PowerShell 패치 처리 규칙과 문서 기준만 정리된다.",
  ],
  expectedUi: [
    "사용자 업무 화면 변경 없음.",
    "시스템 관리자 화면 변경 없음.",
  ],
  developmentPurpose: [
    "GPT가 만드는 다음 패치 ZIP의 commit-meta.md 토큰을 실제 watcher 검증 규칙과 일치시킨다.",
    "source ZIP과 QA evidence ZIP 분리 원칙을 다시 고정한다.",
    "repo-state APP_VERSION 출력이 실제 버전 숫자로 유지되어야 함을 명확히 한다.",
  ],
  developmentUiStructure: [
    "UI 구조 변경 없음.",
    "pipeline contract 문서와 roadmap 기록만 보강한다.",
  ],
  scope: [
    "docs/audits/0.24.34.10-pipeline-contract-final-check.md 추가",
    "docs/codex-current-state.md를 0.24.34.10 기준으로 갱신",
    "lib/constants/version.ts를 0.24.34.10으로 갱신",
    "roadmap 0.24.34.10 등록",
  ],
  outOfScope: [
    "0.24.35 Export 구현",
    "PDF 템플릿 구현",
    "DB/R2 변경",
    "PowerShell watcher 동작 로직 변경",
    "대규모 cleanup/refactor",
  ],
  implementationPrinciples: [
    "새 GPT 패치의 commit-meta.md는 Version/Summary/Description/수정 파일 목록/추가 파일 목록/삭제 파일 목록 라벨을 모두 포함한다.",
    "신규 파일과 수정 파일을 commit-meta.md에서 분리한다.",
    "삭제 파일 목록 아래에는 테스트 항목이나 일반 bullet을 넣지 않는다.",
    "source ZIP에는 QA evidence와 runtime artifact를 넣지 않는다.",
  ],
  successConditions: [
    "0.24.34.10 패치의 commit-meta.md가 watcher 필수 토큰 검증을 통과한다.",
    "repo-state가 APP_VERSION을 0.24.34.10으로 출력한다.",
    "build가 통과한다.",
    "source ZIP에 evidence/runtime/build artifact가 포함되지 않는다.",
  ],
  failureConditions: [
    "commit-meta.md에서 추가 파일 목록 라벨이 누락된다.",
    "변경 파일 목록 라벨을 다시 사용한다.",
    "repo-state APP_VERSION이 export statement로 출력된다.",
    "0.24.35 Export 구현이 owner 승인 전에 시작된다.",
  ],
  cautions: [
    "이번 버전은 pipeline 계약 문서화와 버전 기록 보강이며 기능 구현이 아니다.",
    "PowerShell watcher 실제 동작은 사용자의 Windows 환경에서 확인해야 한다.",
  ],
  stopConditions: [
    "0.24.34.10 build 실패 시 0.24.35로 넘어가지 않는다.",
    "source ZIP에 QA evidence가 섞이면 packaging 보정을 먼저 한다.",
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
    "R2 object 변경 없음.",
  ],
  migrationRequired: false,
  migrationNotes: "문서/roadmap/version 보강이므로 migration 없음.",
  automaticTests: [
    "STATIC_REVIEW - commit-meta 필수 토큰 문서화 확인",
    "STATIC_REVIEW - roadmap 0.24.34.10 타입 구조 확인",
    "STATIC_REVIEW - source ZIP exclude contract 문서 확인",
  ],
  manualTests: [
    "패치 적용 후 npm run build 실행",
    "repo-state APP_VERSION이 0.24.34.10으로 출력되는지 확인",
    "source ZIP에서 evidence/runtime/build artifact 제외 여부 확인",
  ],
  expectedChangeAreas: [
    "docs/audits/0.24.34.10-pipeline-contract-final-check.md",
    "docs/codex-current-state.md",
    "lib/internal/roadmap/roadmap-0.24.34.10.ts",
    "lib/internal/roadmap/index.ts",
    "lib/constants/version.ts",
  ],
  recommendedCommitMessage: "pipeline contract final check 문서화",
  nextVersionBoundary: [
    "0.24.34.10 적용 결과를 확인한 뒤 0.24.35 Export 착수 여부를 owner가 결정한다.",
    "0.24.35는 owner 승인 전 시작하지 않는다.",
  ],
  completionConditions: [
    "0.24.34.10 패치 적용",
    "build 성공",
    "repo-state APP_VERSION 정상 출력",
    "source ZIP exclude 정상 확인",
  ],
  result: {
    completedSummary: [
      "commit-meta.md 필수 토큰 규칙을 현재 watcher 검증 기준으로 문서화했다.",
      "source ZIP/repo-state 계약을 0.24.35 전 체크포인트로 정리했다.",
      "0.24.35 Export를 시작하지 않는 경계를 유지했다.",
    ],
    commitHash: "PENDING_USER_APPLY",
    verificationResult: "STATIC_REVIEW_ONLY - user Windows build/repo-state verification required",
    remainingIssues: [
      "0.24.34.10 적용 후 build와 repo-state 확인이 필요하다.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "PENDING",
  },
};
