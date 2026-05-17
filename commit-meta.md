Version :
0.13.53

Summary :
고객사관리 화면 정리와 초대 생성 오류 수정

Description :
시스템 고객사관리 화면에서 QR, 승인 단계, 권한 설명 등 개발 점검 UI를 제거하고 고객사 관리자 초대와 가입 신청 검토 중심으로 단순화했다. 고객사 생성 전 시스템 초대를 만들 수 있도록 invitations.company_id NULL 허용 migration을 추가하고, 개발용 시스템관리자 초대 생성 시 system_users FK 오류가 나지 않도록 보강했다. 고객사 관리자 온보딩 모달 저장 버튼은 필수값 누락 안내를 보여주고 저장 시도 자체는 가능하도록 수정했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/invitationRepository.ts
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- db/schema/full_reset.sql
- lib/constants/app.ts

추가 파일 목록 :
- db/migrations/patch_0_13_53_system_company_invitation.sql

삭제 파일 목록 :
없음
