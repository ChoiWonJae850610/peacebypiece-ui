Version : 0.9.68
Base Version : 0.9.67
Target Version : 0.9.68
Summary : 스토리지 사용량 집계 API skeleton 추가
Description : 시스템관리자 고객별 저장공간 사용량 조회와 snapshot 생성을 위한 얇은 API route, route handler, repository skeleton, 설계 문서를 추가하고 앱 버전을 0.9.68로 갱신했습니다. R2 실시간 집계, 업로드 차단, 결제 자동화는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/billing/index.ts
추가 파일 목록 :
- app/api/system/storage-usage/route.ts
- lib/billing/storageUsageRepository.ts
- lib/billing/api/storageUsageRouteHandlers.ts
- docs/billing/storage_usage_api_skeleton.md
삭제 파일 목록 :
- 없음
