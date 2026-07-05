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
  developmentPurpose: [
    "0.24.35 Export 착수 전에 source ZIP과 QA evidence ZIP이 섞이지 않도록 pipeline packaging 기준을 보정한다.",
    "repo-state APP_VERSION이 re-export 파일 내용이 아니라 실제 버전 문자열을 기록하도록 한다.",
  ],
  developmentUiStructure: [
    "사용자 화면 구조 변경 없음.",
    "PowerShell pipeline과 roadmap 감사 문서만 변경한다.",
  ],
  scope: [
    "pipeline-patch-processing.ps1 backup ZIP exclude 보강",
    "pipeline-patch-processing.ps1 repo-state APP_VERSION 파서 보강",
    "peacebypiece-auto-pipeline.ps1 source ZIP contract 보강",
    "cleanup/refactor 후보 감사 문서 추가",
  ],
  outOfScope: [
    "0.24.35 Export 구현",
    "PDF 템플릿 구현",
    "DB/R2 변경",
    "한글 폴더 rename/delete",
    "대형 파일 실제 refactor",
  ],
  implementationPrinciples: [
    "download-watcher.ps1은 watcher 진입점이고 실제 patch 처리 및 backup ZIP 생성은 pipeline-patch-processing.ps1의 ProcessOnePatchIfReady/BackupProjectToZip 흐름에서 수행된다.",
    "peacebypiece-auto-pipeline.ps1의 메뉴 7 source ZIP 생성 경로는 별도 contract를 갖고 있으므로 watcher 경로와 exclude 기준을 맞춘다.",
    "한글 경로는 Windows Explorer/Git 기준 정상으로 취급하고 ZIP filename encoding 감사 대상으로만 남긴다.",
  ],
  successConditions: [
    "source ZIP 생성 경로에서 artifacts/playwright-report/test-results/reports 계열이 제외된다.",
    "repo-state APP_VERSION이 실제 문자열로 기록된다.",
    "cleanup/refactor/delete 후보가 실제 삭제가 아니라 감사 문서로만 분리된다.",
  ],
  failureConditions: [
    "source ZIP에 QA evidence 또는 test output이 포함된다.",
    "repo-state APP_VERSION이 re-export 문장으로 출력된다.",
    "0.24.35 Export 구현을 시작한다.",
  ],
  cautions: [
    "한글 폴더명은 Linux unzip 표시만 보고 rename/delete하지 않는다.",
    "reports, old audit docs, lockfile, dev/test console 파일은 삭제하지 않는다.",
    "실제 PowerShell 실행 검증은 Windows 환경에서 확인한다.",
  ],
  stopConditions: [
    "download watcher 또는 build fail이 발생하면 다음 기능 작업보다 실패 보정을 우선한다.",
    "source ZIP과 QA evidence ZIP이 섞인 경우 Export 구현으로 넘어가지 않는다.",
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
  migrationNotes: "PowerShell packaging/document audit 보정이므로 migration 없음.",
  automaticTests: [
    "GPT_STATIC_REVIEW_ONLY - Windows PowerShell 실행 미확인",
    "npm run build는 0.24.34.7 적용 후 RoadmapVersionDetail excess property 오류로 실패함",
  ],
  manualTests: [
    "Windows에서 download watcher로 patch ZIP 1개 처리",
    "build log가 OK로 생성되는지 확인",
    "repo-state APP_VERSION이 실제 버전 문자열로 출력되는지 확인",
    "source ZIP에 artifacts/playwright-report/test-results/reports/coverage/blob-report가 제외되는지 확인",
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
