Version : 0.9.58
Base Version : 0.9.57
Target Version : 0.9.58
Summary : 고객사 repository와 API skeleton 추가
Description : 시스템관리자 고객사 관리 기반을 위해 고객사 타입, repository skeleton, 얇은 system companies API route와 handler를 추가하고 앱 버전을 0.9.58로 갱신했습니다. 실제 DB 연결과 인증 연결은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- app/api/system/companies/route.ts
- lib/company/companyTypes.ts
- lib/company/companyRepository.ts
- lib/company/api/companyRouteHandlers.ts
- lib/company/index.ts
삭제 파일 목록 :
- 없음
