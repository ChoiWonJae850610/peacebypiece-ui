Version : 0.9.69
Base Version : 0.9.68
Target Version : 0.9.69
Summary : 통계 selector와 repository 구조 추가
Description : 고객관리자 통계와 시스템관리자 통계의 공통 metric 타입, selector, repository skeleton, 얇은 API route를 추가하고 앱 버전을 0.9.69로 갱신했습니다. 실제 DB 통계 쿼리, 차트 UI, AI 분류 통계는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- lib/stats/statsTypes.ts
- lib/stats/statsSelectors.ts
- lib/stats/statsRepository.ts
- lib/stats/api/statsRouteHandlers.ts
- lib/stats/index.ts
- app/api/admin/stats/route.ts
- app/api/system/stats/route.ts
- docs/stats/stats_repository_structure.md
삭제 파일 목록 :
- 없음
