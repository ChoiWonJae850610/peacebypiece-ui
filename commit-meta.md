Version :
0.13.56

Summary :
고객사 온보딩 입력 예시와 가입 신청 표시 보정

Description :
고객사 관리자 첫 로그인 회사정보 입력 모달의 placeholder를 전체 입력 필드에 적용하고 입력 수정 시 이전 필수값 오류가 남아 보이지 않도록 정리했다. 회사 영문명, 로고, 주소, 신청 요금제 정보를 가입 신청 검토 목록에서 표시할 수 있도록 join_requests 메모에 온보딩 보조 정보를 함께 저장하도록 보강했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/admin/settings/companyOnboardingRepository.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
