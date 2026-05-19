Version :
0.14.0

Summary :
고객사 관리자 환경설정 계정정보 구조 정리

Description :
고객사 관리자 환경설정의 기본 진입을 계정 정보로 변경하고, 현재 고객사와 대표 관리자 계정 정보를 실제 로그인 회사 기준으로 표시하도록 정리했다. 회사 정보 변경, 계정 비활성화 요청, 개인설정 이동 범위도 후속 요청 흐름 기준으로 분리했다.

수정 파일 목록 :
- app/admin/settings/page.tsx
- app/api/admin/companies/current/route.ts
- components/admin/settings/AdminSettingsHub.tsx
- lib/admin/settings/adminSettingsHub.ts
- lib/admin/settings/companyRepository.ts
- lib/admin/settings/companyTypes.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/admin/settings/adminAccountSettingsOverview.ts

삭제 파일 목록 :
없음
