Version :
0.13.82

Summary :
고객사 온보딩 승인요청 전 검증 순서 보정

Description :
고객사 초대 링크로 진입한 관리자가 승인 요청을 제출할 때 회사 계정 생성보다 payload와 온보딩 파일 검증을 먼저 수행하도록 수정했다. 필수 회사 정보와 관리자 연락처 검증 로직을 저장소 계층에 공통 함수로 분리해 API route와 실제 저장 로직이 같은 기준을 사용하도록 정리했다.

수정 파일 목록 :
- app/api/admin/companies/onboarding/route.ts
- lib/admin/settings/companyOnboardingRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
