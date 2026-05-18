Version :
0.13.65

Summary :
고객사 가입 신청 승인 거절 흐름과 오류 문구 보정

Description :
시스템관리자 고객사 가입 신청 승인/거절 시 system_to_company_admin 초대의 recipientEmail이 비어 있어도 초대 scope를 정상 판정하도록 수정했다. 가입 신청 검토 화면에서 INVITATION_SCOPE_MISMATCH 같은 내부 오류 코드가 그대로 노출되지 않도록 사용자 문구로 변환하고, 승인/거절 성공 후 상세 모달을 닫도록 정리했다. 거절된 승인 대기 고객사는 재입력 가능한 profile_required 상태로 되돌리도록 보정했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
