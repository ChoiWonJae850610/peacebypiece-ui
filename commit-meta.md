Version : 0.13.19
Summary : 통계 빈 데이터 표시와 로그아웃 진입 정리
Description : /admin/stats의 개발용 seed 안내와 준비 중 문구를 제거하고 빈 데이터는 0값과 일반 empty state로 표시되도록 정리했습니다. 관리자 상단바에 로그아웃 버튼을 추가하고 /api/auth/logout route에서 wafl_auth_session 쿠키를 삭제한 뒤 루트 로그인 화면으로 이동하도록 구성했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/layout/AdminTopbar.tsx
- lib/admin/stats/dashboardPresentation.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
추가 파일 목록 :
- app/api/auth/logout/route.ts
삭제 파일 목록 :
- 없음
