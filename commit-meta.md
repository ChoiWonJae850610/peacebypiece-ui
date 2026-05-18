Version :
0.13.76

Summary :
고객사 승인 실패 원인 보정과 재입력 상태 접근 제어 수정

Description :
시스템관리자 개발 세션 ID가 system_users 외래키와 충돌하지 않도록 고객사 승인/거절 처리 시 실제 존재하는 시스템 사용자 ID만 리뷰어 FK에 저장하도록 보정했다. 고객사 관리자 권한 부여 전 permission_catalog 항목을 보강해 누적 DB에서 권한 FK 누락으로 승인이 실패하지 않게 했다. 승인 후 기준정보 초기화는 승인 트랜잭션과 분리해 기준정보 초기화 오류가 고객사 승인 자체를 막지 않도록 했다. 재입력 요청 상태의 고객사는 회사 정보가 이미 채워져 있어도 profile_required 상태이면 온보딩 모달을 다시 표시하도록 수정했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
