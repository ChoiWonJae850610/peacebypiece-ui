Version : 0.15.10
Summary : 고객사 관리자 통계정보 화면 A-TYPE section 구조 정리
Description : /admin/stats 화면의 누적 운영 지표와 작업흐름분석 영역을 AdminSection 기반 A-TYPE 구조로 분리했다. 통계 계산, 기간 필터, 차트 렌더링, DB/API/R2/권한/세션 흐름은 변경하지 않고 화면 section 구조와 i18n 문구, 구현 기준 문서만 정리했다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/31_wafl-a-type-admin-stats-screen.md
삭제 파일 목록 :
