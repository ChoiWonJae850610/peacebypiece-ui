Version :
0.13.64

Summary :
고객사 온보딩 첨부 preview와 R2 Worker 회사 파일 정책 보강

Description :
시스템관리자 가입 신청 검토 화면에서 고객사 로고와 사업자등록증 제출 상태를 확인하고 상세 모달에서 preview 또는 열기 처리를 할 수 있도록 보강했다. 고객사 온보딩 파일을 R2 Worker에서 허용하도록 회사 온보딩 storage key와 파일 정책을 추가해 업로드 실패 원인을 보완했다.

수정 파일 목록 :
- cloudflare/r2-upload-worker.js
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/admin/settings/companyOnboardingFileRepository.ts
- lib/admin/settings/companyOnboardingRepository.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestTypes.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/system/companies/onboarding/files/[fileId]/view/route.ts

삭제 파일 목록 :
없음
