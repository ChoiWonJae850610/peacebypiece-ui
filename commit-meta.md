Version :
0.13.88

Summary :
고객사 온보딩 첨부 미리보기와 다운로드 안정화

Description :
시스템관리자 고객사 상세 모달에서 온보딩 로고와 사업자등록증 파일을 새 탭 열기와 다운로드로 분리했다. 온보딩 파일 view route는 companyId scope를 포함해 metadata와 R2 key를 검증하고, PDF 파일을 기본 열기와 다운로드로 구분하도록 보정했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- app/api/system/companies/onboarding/files/[fileId]/view/route.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
