Version : 0.12.76
Summary : 통계정보 화면 소스 마감 정리
Description : /admin/stats 화면의 표시 문구 변환, 수치 포맷, 기간/섹션 query 정규화, redirect URL 생성 로직을 presentation 유틸로 분리했습니다. AdminStatsDashboard 내부의 중복/하드코딩성 helper를 줄이고, /admin/dashboard redirect와 /admin/stats page의 query 처리도 공통 함수로 정리했습니다. 통계 계산, DB schema, 차트 색상, 작업지시서/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/dashboard/page.tsx
- app/admin/stats/page.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
추가 파일 목록 :
- lib/admin/stats/dashboardPresentation.ts
삭제 파일 목록 :
- 없음
