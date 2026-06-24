import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_8: RoadmapVersionDetail = {
  version: "0.24.21.8",
  title: "Korean and Unicode Encoding Standard",
  status: "verification_pending",
  userSummary: [
    "한글 파일명·폴더명·문서·소스와 PowerShell의 Unicode 인코딩 기준을 저장소 계약으로 고정한다.",
  ],
  visibleChanges: ["앱 UI 변화 없음"],
  expectedUi: ["사용자 화면 변화 없음"],
  developmentPurpose: [
    "Git, Windows PowerShell, Node.js, ZIP 전달본 사이에서 한글 경로와 본문이 손상되는 문제를 예방한다.",
  ],
  developmentUiStructure: ["UI 구조 변경 없음"],
  scope: [
    ".editorconfig UTF-8 기준",
    ".gitattributes text/binary 및 LF 기준",
    "PowerShell UTF-8 BOM 기준",
    "한글 경로 보존과 복구 절차",
    "Unicode encoding contract test",
  ],
  outOfScope: [
    "GitHub에서 정상인 한글 경로 rename",
    "추정 기반 문장 복구",
    "UI/API/DB/R2 변경",
    "package/lockfile 변경",
  ],
  implementationPrinciples: [
    "일반 소스와 문서는 UTF-8, PowerShell은 UTF-8 BOM을 사용한다.",
    "GitHub와 git ls-files가 정상인 경로는 분석 도구 mojibake만 보고 변경하지 않는다.",
    "확정 손상만 원문 근거로 최소 복구한다.",
  ],
  successConditions: [
    "UTF-8 decode failure 0",
    "U+FFFD replacement character 0",
    "canonical PowerShell UTF-8 BOM 유지",
    "한글 경로 UTF-8 round-trip PASS",
  ],
  failureConditions: [
    "정상 한글 경로 대량 rename",
    "추정 기반 복구",
    "PowerShell BOM 제거",
    "binary text 변환",
  ],
  cautions: [
    "ZIP 해제 도구의 경로 표시와 Git tracked 경로를 구분한다.",
    "mojibake 패턴은 false positive 가능성이 있어 경고만 발생시킨다.",
  ],
  stopConditions: [
    "원문을 확정할 수 없는 실제 손상 발견",
    "대량 rename 또는 문서 링크 재작성 필요",
    "외부 도구가 CP949를 강제함",
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
    "unicode-encoding-contract",
    "pipeline-powershell-encoding-contract",
  ],
  manualTests: [
    "GitHub에서 한글 경로 정상 표시",
    "Windows PowerShell 한글 메뉴 정상 표시",
    "전체 소스 ZIP과 Patch ZIP 한글 경로 확인",
  ],
  expectedChangeAreas: [
    ".editorconfig",
    ".gitattributes",
    "docs/project/25-korean-unicode-encoding-standard.md",
    "tests/unicode-encoding-contract.mjs",
    "AGENTS.md",
  ],
  recommendedCommitMessage: "chore: establish Korean Unicode encoding contract",
  nextVersionBoundary: [
    "0.24.22에서 Codex Productization Sprint A를 진행한다.",
  ],
  completionConditions: [
    "encoding contract PASS",
    "GitHub/ZIP/PowerShell 한글 확인",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "한글/Unicode 인코딩 표준과 자동 검증 계약을 추가했다.",
      "0.24.21.7 전달본에서 확정 가능한 UTF-8 decode 손상은 발견되지 않았다.",
    ],
    commitHash: "",
    verificationResult: "수동 패치 생성 완료; Windows/GitHub/ZIP 실환경 확인 필요",
    remainingIssues: [],
    userConfirmationRequired: true,
    userConfirmationResult: "적용 후 GitHub와 Windows PowerShell 확인 필요",
  },
};
