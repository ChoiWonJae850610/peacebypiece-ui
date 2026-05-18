Version :
0.13.87

Summary :
도로명주소 검색 API 연동 1차 추가

Description :
고객사 온보딩 회사 주소 입력 영역에 도로명주소 검색 UI를 추가하고, 서버 API route에서 JUSO_API_KEY를 사용해 공식 도로명주소 검색 API를 호출하도록 구성했다. 검색 결과 선택 시 우편번호, 도로명주소, 지번주소, 참고항목을 입력값에 반영하며, 승인키 미설정 또는 검색 실패 시 수동 입력을 유지한다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/address/search/route.ts
- lib/address/jusoAddressSearch.ts

삭제 파일 목록 :
없음
