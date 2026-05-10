Version :
0.9.224392

Summary :
고객관리자 카드형 홈 1차 구현

Description :
고객관리자 AdminShell에서 좌측 패널 렌더링을 제거하고 상단 홈/작업지시서 이동 버튼을 추가했다. /admin 카드형 홈은 작업지시서 업무 진입과 협력업체관리, 저장소관리, 통계정보, 환경설정, 멤버관리 후보 카드로 재구성했다. 권한 기반 확장을 위해 카드 registry와 permission code를 추가하고 단위표준, 외주공정, 생산품유형은 후속 권한 후보 카드로 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/layout/AdminShell.tsx
- components/admin/layout/AdminTopbar.tsx
- components/admin/dashboard/AdminConsoleSections.tsx
- lib/admin/adminConsoleLinks.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
- lib/admin/adminWorkspaceCards.ts
- docs/admin-card-home-implementation-0.9.224392.md

삭제 파일 목록 :
없음
