Version :
0.13.99

Summary :
고객사 관리자 초기 온보딩 모달 깜빡임 보정

Description :
고객사 관리자 화면 새로고침 시 서버에서 이미 active 상태로 확인된 고객사에 대해 온보딩 상태 조회가 끝나기 전 회사정보 등록 모달이 잠깐 표시되지 않도록 초기 접근 상태를 AdminCompanyOnboardingGate에 전달했다. profile_required, approval_pending, rejected, trial 제한 상태의 기존 차단 흐름은 유지했다.

수정 파일 목록 :
- app/admin/layout.tsx
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
