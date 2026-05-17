Version :
0.13.31

Summary :
통계정보 회사 범위 기준과 세션 scope 보강

Description :
관리자 통계 화면과 통계 API가 하드코딩 회사 기준이나 요청 파라미터 companyId에 의존하지 않고 실제 로그인 세션의 companyId를 사용하도록 정리했다. 세션 companyId가 없으면 통계 API는 401로 차단하고 관리자 통계 화면은 로그인 화면으로 이동하도록 보강했다.

수정 파일 목록 :
- app/admin/stats/page.tsx
- lib/admin/adminStats.repository.ts
- lib/constants/app.ts
- lib/stats/api/statsRouteHandlers.ts

추가 파일 목록 :
- lib/admin/stats/sessionScope.ts

삭제 파일 목록 :
없음
