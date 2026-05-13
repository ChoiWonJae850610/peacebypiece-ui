Version :
0.11.42

Summary :
모바일 시스템관리자 화면 표시 보정

Description :
시스템관리자 홈, 저장소 사용량, 고객사 승인, 시스템 통계 overview 화면의 모바일/태블릿 폭 표시를 보정했다. table row 최소 너비와 action 영역 줄바꿈을 정리했으며, storage purge와 고객사 승인/거절 로직은 변경하지 않았다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/SystemConsoleShell.tsx
- components/system/SystemStatsOverview.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/responsive-system-pages-0.11.42.md

삭제 파일 목록 :
없음
