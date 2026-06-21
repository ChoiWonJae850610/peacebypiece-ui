import type { SystemConsoleNavigationCard } from "./systemConsoleShell";

export const SYSTEM_CONSOLE_INTERNAL_TOOLS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "id-control",
    label: "개발 제어센터",
    description:
      "현재 계정, system-admin 상태, runtime, impersonation 상태를 확인하고 내부 조회 화면으로 이동합니다. 실제 계정 전환 실행은 환경 제한을 따릅니다.",
    href: "/id-control",
    statusLabel: "조회 가능",
    tone: "warning",
  },
  {
    id: "productization-roadmap",
    label: "제품화 로드맵",
    description:
      "버전별 사용자 요약과 Codex/ChatGPT 개발 기준을 조회합니다. 편집, 저장, DB/R2 작업은 없습니다.",
    href: "/roadmap",
    statusLabel: "조회 전용",
    tone: "primary",
  },
  {
    id: "wafl-ui",
    label: "WAFL UI 카탈로그",
    description:
      "공통 컴포넌트와 반응형 구성을 확인합니다. 실행형 데모가 필요한 항목은 개발/테스트 환경에서만 동작합니다.",
    href: "/ui",
    statusLabel: "조회 가능",
    tone: "maintenance",
  },
  {
    id: "functions",
    label: "기능 및 자동화 현황",
    description:
      "자동화, 진단, Build/Test 결과, 명령 설명을 조회합니다. Seed, Reset, Cleanup, DB/R2 변경 실행은 환경 제한을 유지합니다.",
    href: "/functions",
    statusLabel: "조회 가능",
    tone: "neutral",
  },
];
