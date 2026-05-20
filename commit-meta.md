Version : 0.15.13
Summary : 시스템관리자 잔여 점검 화면 A-TYPE shell 적용
Description : 시스템관리자 잔여 화면 중 access-checkpoint, standards regression, standards seed-status에 SystemShell을 적용하고 page-level wrapper 중복을 제거했다. /system/invites는 /system/companies redirect route로 유지하는 기준을 문서화했으며, 기능/API/DB 로직은 변경하지 않았다.
수정 파일 목록 :
- components/system/access/SystemAccessStabilityCheckpoint.tsx
- components/system/standards/SystemStandardsRegressionPage.tsx
- components/system/standards/SystemStandardsSeedStatusPage.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/34_wafl-a-type-system-admin-remaining-screens.md
삭제 파일 목록 :
없음
