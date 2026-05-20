Version : 0.15.81
Summary : 시스템관리자 고객사 관리 화면 JSX 닫힘 오류 수정
Description : 0.15.8에서 SystemShell 적용 중 남아 있던 불필요한 wrapper 종료 태그를 제거해 /system/companies 화면의 JSX 파싱 오류를 수정했다. 이후 정규 버전 흐름은 0.15.9로 이어갈 수 있도록 APP_VERSION을 임시 핫픽스 버전 0.15.81로 반영했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/constants/app.ts

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음
