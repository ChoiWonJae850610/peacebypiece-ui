import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_7: RoadmapVersionDetail = {
  version: "0.24.34.7",
  title: "Pipeline Packaging and Cleanup Audit Guard",
  status: "completed",
  userSummary: [
    "0.24.34.6 문서 감사 이후 source ZIP에 QA artifacts/test output이 섞이는 문제를 pipeline 단계에서 차단한다.",
    "download watcher 경로의 backup ZIP 생성 로직과 PowerShell 메뉴 7 source ZIP contract의 exclude 기준을 정렬한다.",
    "repo-state APP_VERSION이 re-export 파일이 아니라 lib/constants/version.ts의 실제 버전 문자열을 기록하도록 보정한다.",
    "한글 문서 폴더, lockfile, reports, 대형 파일, WAFL raw UI, mock/internal term은 즉시 삭제하지 않고 감사 문서로 분리한다.",
  ],
  visibleChanges: [
    "tools/pipeline/pipeline-patch-processing.ps1의 backup ZIP tar exclude가 artifacts/playwright-report/test-results/reports/coverage/blob-report/.nyc_output/tsbuildinfo/env/generated ZIP을 제외한다.",
    "tools/pipeline/pipeline-patch-processing.ps1의 repo-state APP_VERSION 파서가 lib/constants/version.ts에서 실제 문자열을 읽는다.",
    "tools/pipeline/peacebypiece-auto-pipeline.ps1의 source ZIP contract가 blob-report/coverage/.nyc_output/storageState/har/webm까지 차단한다.",
    "project cleanup/source ZIP packaging/refactor 후보 감사 문서가 추가된다.",
  ],
  expectedUi: [
    "사용자 화면 UI 변경 없음.",
    "이번 버전은 pipeline packaging guard와 문서 감사 보강 버전이다.",
  ],
  developerNotes: [
    "download-watcher.ps1은 watcher 진입점이고 실제 patch 처리 및 backup ZIP 생성은 pipeline-patch-processing.ps1의 ProcessOnePatchIfReady/BackupProjectToZip 흐름에서 수행된다.",
    "peacebypiece-auto-pipeline.ps1의 메뉴 7 source ZIP 생성 경로는 이미 별도 contract를 갖고 있으므로 이번 버전에서 exclude summary/contract를 보강한다.",
    "한글 경로는 Windows Explorer/Git에서 정상이라고 확인됐으므로 rename/delete하지 않는다. Linux extraction에서 깨져 보이는 현상은 ZIP filename encoding 감사 대상으로만 남긴다.",
    "0.24.35 Company-wide Export는 시작하지 않는다.",
  ],
  verification: [
    "GPT 정적 파일 검사 기준으로 pipeline-patch-processing.ps1의 APP_VERSION 파서와 tar exclude 보강을 확인했다.",
    "GPT 정적 파일 검사 기준으로 peacebypiece-auto-pipeline.ps1의 source ZIP excluded path/contract 보강을 확인했다.",
    "PowerShell 실행, npm run build, Playwright, 실제 ZIP 생성 검증은 미실행이다. Codex/Windows에서 재확인해야 한다.",
  ],
  expectedChangeAreas: [
    "tools/pipeline/pipeline-patch-processing.ps1",
    "tools/pipeline/peacebypiece-auto-pipeline.ps1",
    "docs/audits/*",
    "docs/codex-current-state.md",
    "docs/productization-roadmap.md",
    "docs/project/26-final-policy-decisions-and-master-todo.md",
    "lib/internal/roadmap/*",
  ],
  recommendedCommitMessage: "pipeline source ZIP 제외 규칙과 repo-state 버전 기록 보정",
  nextVersionBoundary: [
    "다음 구현 버전은 owner 승인 후 0.24.34.8 또는 Codex 실행용 continuation 버전으로 올린다.",
    "0.24.35 Export 실행은 0.24.34.x PDF/치수/가입/대시보드 continuation과 사용자 검수 이후에만 시작한다.",
  ],
  completionConditions: [
    "source ZIP 생성 경로에서 artifacts/playwright-report/test-results/reports 계열 제외가 문서화·보강된다.",
    "repo-state APP_VERSION이 lib/constants/version.ts 실제 값으로 기록되도록 보정된다.",
    "cleanup/refactor/delete 후보는 실제 삭제가 아니라 감사 문서로 분리된다.",
  ],
  result: {
    completedSummary: [
      "pipeline packaging guard와 cleanup audit 문서화가 완료됐다.",
      "브라우저/빌드/PowerShell 실행 없이 GPT 정적 패치로만 생성된 버전이다.",
    ],
    commitHash: "",
    verificationResult: "GPT_STATIC_REVIEW_ONLY - local PowerShell/ZIP contract verification required",
    remainingIssues: [
      "Windows에서 download watcher로 실제 patch 처리 후 source ZIP에 artifacts/test output이 빠지는지 확인해야 한다.",
      "repo-state APP_VERSION이 0.24.34.7처럼 실제 문자열로 찍히는지 확인해야 한다.",
      "한글 문서 폴더명은 Windows/Git 기준 정상 여부를 유지 확인하고, 정상이라면 rename하지 않는다.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "PowerShell pipeline 실행 결과 repo-state/source ZIP 확인 필요",
  },
};
