Version :
0.11.0

Summary :
관리자 공통 UI 컴포넌트 표준화 1차

Description :
관리자 화면에서 반복되던 상태 라벨과 empty/loading/error 상태 표현을 공통 컴포넌트로 분리했다. 시스템관리자 홈과 고객관리자 환경설정 화면 일부에 AdminStatusBadge와 AdminEmptyState를 적용해 라벨과 상태 표현의 기준을 통일하기 시작했다.

수정 파일 목록 :
- components/admin/settings/AdminSettingsHub.tsx
- components/system/SystemConsoleShell.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/common/AdminStatusBadge.tsx
- components/admin/common/AdminEmptyState.tsx
- docs/admin-ui-primitives-standardization-0.11.0.md

삭제 파일 목록 :
없음
