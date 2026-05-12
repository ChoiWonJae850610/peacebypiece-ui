Version :
0.10.84

Summary :
시스템관리자 고객사 가입 신청 목록 실제 조회 연결

Description :
시스템관리자 고객사 승인 화면에서 request_type이 company이고 invitation scope가 system_to_company_admin인 join_requests.pending 목록을 실제 API로 조회해 표시하도록 연결했다. 기존 샘플 신청 필드 영역은 실제 목록과 빈 상태 안내로 전환했고, 고객사 생성 및 거절 버튼은 후속 버전 연결 전까지 비활성 상태로 유지했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/system/systemCompanyApprovalConsole.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
