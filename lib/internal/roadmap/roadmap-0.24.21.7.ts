import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_7: RoadmapVersionDetail = {
  version: "0.24.21.7",
  title: "PowerShell Pipeline Encoding and Parser Recovery",
  status: "verification_pending",
  userSummary: [
    "Windows PowerShell에서 canonical pipeline이 한글 깨짐과 정규식 parser 오류 없이 실행되도록 복구한다.",
  ],
  visibleChanges: ["앱 UI 변화 없음"],
  expectedUi: ["사용자 화면 변화 없음"],
  developmentPurpose: [
    "0.24.21.6 pipeline 변경 후 Windows PowerShell 5.1에서 발생한 script parse failure를 안전하게 복구한다.",
  ],
  developmentUiStructure: ["UI 구조 변경 없음"],
  scope: [
    "canonical pipeline UTF-8 BOM 저장",
    "secret 검사 정규식 quote 안전화",
    "verification result parser 안전화",
    "pipeline encoding contract test",
  ],
  outOfScope: [
    "앱 UI/API 변경",
    "DB/R2/Seed/Migration",
    "대형 repository cleanup",
    "package/lockfile 변경",
  ],
  implementationPrinciples: [
    "Windows PowerShell 5.1 호환을 위해 canonical ps1을 UTF-8 BOM으로 저장한다.",
    "중첩 quote가 필요한 정규식은 \x22와 \x27을 사용해 parser ambiguity를 제거한다.",
    "기존 pipeline 동작과 generated-output exclude 계약은 유지한다.",
  ],
  successConditions: [
    "PowerShell parser 오류 없이 menu가 열린다.",
    "한글 메뉴와 메시지가 정상 표시된다.",
    "pipeline encoding contract test가 PASS한다.",
    "0.24.21.6 generated-output 제외 계약이 유지된다.",
  ],
  failureConditions: [
    "PowerShell parser 오류 재발",
    "한글 mojibake 지속",
    "secret 검사 또는 verification parser 약화",
    "runtime/package/DB 변경",
  ],
  cautions: [
    "최종 확인은 사용자의 Windows PowerShell 5.1 환경에서 수행한다.",
  ],
  stopConditions: [
    "canonical script 외 복사본이 실행됨",
    "로컬 편집기가 저장 시 BOM을 제거함",
    "추가 parser 오류가 다른 helper ps1에서 발견됨",
  ],
  permissionImpact: "none",
  permissionNotes: ["권한 코드 변경 없음"],
  dbImpact: "none",
  dbImpactNotes: ["DB 접근·변경 없음"],
  r2Impact: "none",
  r2ImpactNotes: ["R2 접근·변경 없음"],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음",
  automaticTests: [
    "pipeline-powershell-encoding-contract",
    "pipeline-repo-state-publication-contract",
  ],
  manualTests: [
    "Windows PowerShell에서 peacebypiece-auto-pipeline.ps1 실행",
    "한글 메뉴 정상 표시",
    "menu 7 handoff ZIP 생성",
  ],
  expectedChangeAreas: [
    "tools/pipeline/peacebypiece-auto-pipeline.ps1",
    "tests/pipeline-powershell-encoding-contract.mjs",
    "lib/internal/roadmap/*",
  ],
  recommendedCommitMessage: "fix: recover PowerShell pipeline encoding and parser compatibility",
  nextVersionBoundary: [
    "0.24.22에서 Codex Productization Sprint A를 진행한다.",
  ],
  completionConditions: [
    "Windows PowerShell 실행 PASS",
    "pipeline contract PASS",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "canonical pipeline을 UTF-8 BOM으로 저장하고 parser-sensitive 정규식과 result parser를 안전화했다.",
    ],
    commitHash: "",
    verificationResult: "수동 패치 생성 완료; Windows PowerShell 실환경 확인 필요",
    remainingIssues: [],
    userConfirmationRequired: true,
    userConfirmationResult: "사용자 Windows PowerShell 실행 결과 확인 필요",
  },
};
