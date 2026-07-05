import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_9: RoadmapVersionDetail = {
  version: "0.24.34.9",
  title: "Pipeline Script Cleanup and Dev Server Watcher",
  status: "completed",
  userSummary: [
    "tools/pipeline 안에 남아 있던 버전명 download-watcher 임시 파일을 정리한다.",
    "npm run dev를 main menu 2번뿐 아니라 단독 watcher 파일로도 실행할 수 있게 한다.",
    "0.24.35 Export는 아직 시작하지 않는다.",
  ],
  visibleChanges: [
    "사용자 업무 화면 UI 변경 없음.",
    "PowerShell pipeline 실행 파일 구성이 정리된다.",
    "dev-server-watcher.ps1을 직접 실행하거나 auto pipeline 2번 메뉴에서 백그라운드 실행할 수 있다.",
  ],
  expectedUi: [
    "사용자 업무 화면 변경 없음.",
    "시스템 관리자 화면 변경 없음.",
  ],
  developmentPurpose: [
    "download-watcher canonical 파일은 download-watcher.ps1 하나로 유지한다.",
    "임시 hotfix 파일이 source ZIP과 repository에 남아 다음 작업을 혼동시키지 않게 한다.",
    "개발 서버 실행을 download watcher처럼 독립 실행 가능한 파일로 분리한다.",
  ],
  developmentUiStructure: [
    "UI 구조 변경 없음.",
    "PowerShell pipeline entrypoint만 정리한다.",
  ],
  scope: [
    "tools/pipeline/download-watcher-0.24.34.8.1.ps1 삭제",
    "tools/pipeline/dev-server-watcher.ps1 추가",
    "tools/pipeline/peacebypiece-auto-pipeline.ps1 2번 메뉴를 dev-server-watcher 진입점으로 연결",
    "lib/constants/version.ts를 0.24.34.9로 갱신",
    "roadmap 0.24.34.9 등록",
  ],
  outOfScope: [
    "0.24.35 Export 구현",
    "PDF 템플릿 구현",
    "DB/R2 변경",
    "대규모 cleanup/refactor",
    "PowerShell 전체 메뉴 재설계",
  ],
  implementationPrinciples: [
    "canonical watcher는 버전 없는 파일명만 유지한다.",
    "임시 hotfix 파일은 repository/source ZIP에 남기지 않는다.",
    "dev server 실행은 기존 pipeline.config.psd1의 DevServerPidFile을 그대로 사용해 메뉴 상태와 단독 실행 상태를 맞춘다.",
  ],
  successConditions: [
    "tools/pipeline에는 download-watcher.ps1과 dev-server-watcher.ps1만 남고 버전명 download-watcher 파일은 삭제된다.",
    "auto pipeline 2번 메뉴가 dev-server-watcher.ps1을 백그라운드 프로세스로 실행한다.",
    "dev-server-watcher.ps1이 dev-server.log, dev-server-state.json, dev-server.pid를 기록한다.",
  ],
  failureConditions: [
    "버전명 download-watcher 임시 파일이 source ZIP에 계속 포함된다.",
    "2번 메뉴가 기존 cmd.exe 직접 실행 방식으로 되돌아간다.",
    "0.24.35 Export 작업이 이번 범위에 섞인다.",
  ],
  cautions: [
    "새로 다운로드한 ps1 단독 파일은 Windows 실행 정책 때문에 최초 실행 시 Unblock-File 또는 ExecutionPolicy Bypass가 필요할 수 있다.",
    "dev-server-watcher.ps1은 Windows PowerShell 환경에서 최종 실행 확인이 필요하다.",
  ],
  stopConditions: [
    "dev-server-watcher.ps1 실행 시 PowerShell parser error가 발생하면 다음 기능 작업으로 넘어가지 않는다.",
    "npm run dev가 시작 직후 종료되면 dev-server.log를 기준으로 원인을 확인한다.",
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
  migrationNotes: "PowerShell pipeline entrypoint 정리이므로 migration 없음.",
  automaticTests: [
    "STATIC_REVIEW - tools/pipeline 내 download-watcher 중복 파일 제거 확인",
    "STATIC_REVIEW - peacebypiece-auto-pipeline.ps1 2번 메뉴가 dev-server-watcher.ps1을 호출하는지 확인",
    "STATIC_REVIEW - 패치 ZIP flat 구조 확인",
  ],
  manualTests: [
    "패치 적용 후 npm run build 실행",
    "tools/pipeline/download-watcher.ps1 단독 실행 확인",
    "tools/pipeline/dev-server-watcher.ps1 단독 실행 확인",
    "peacebypiece-auto-pipeline.ps1 2번 메뉴로 npm run dev watcher 시작/종료 확인",
    "dev-server.log와 dev-server-state.json 생성 확인",
  ],
  expectedChangeAreas: [
    "tools/pipeline/dev-server-watcher.ps1",
    "tools/pipeline/peacebypiece-auto-pipeline.ps1",
    "tools/pipeline/download-watcher-0.24.34.8.1.ps1",
    "lib/internal/roadmap/roadmap-0.24.34.9.ts",
    "lib/internal/roadmap/index.ts",
    "lib/constants/version.ts",
  ],
  recommendedCommitMessage: "pipeline watcher 중복 정리와 dev server watcher 추가",
  nextVersionBoundary: [
    "0.24.34.10에서는 watcher와 dev-server watcher 실제 실행 결과를 확인한 뒤 source ZIP exclude와 repo-state APP_VERSION 보정을 재점검한다.",
    "0.24.35 Export는 owner 승인 전 시작하지 않는다.",
  ],
  completionConditions: [
    "0.24.34.9 패치 적용",
    "download-watcher 중복 파일 삭제 확인",
    "dev-server-watcher 단독 실행 또는 auto pipeline 2번 메뉴 실행 확인",
  ],
  result: {
    completedSummary: [
      "버전명 download-watcher 임시 파일을 삭제 대상으로 정리했다.",
      "npm run dev용 단독 watcher 파일을 추가하고 auto pipeline 2번 메뉴에 연결했다.",
    ],
    commitHash: "PENDING_USER_APPLY",
    verificationResult: "STATIC_REVIEW_ONLY - Windows PowerShell/build verification required",
    remainingIssues: [
      "Windows PowerShell에서 dev-server-watcher.ps1 최초 실행 검증이 필요하다.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "PENDING",
  },
};
