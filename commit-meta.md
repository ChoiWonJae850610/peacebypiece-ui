Version :
0.10.65

Summary :
고객사 생성 시 초기 기준정보 복사 연결

Description :
시스템관리자 고객사 생성 흐름에서 회사 생성 직후 활성 단위 표준, 외주공정 유형, 기본 생산품 유형 템플릿을 신규 고객사 기준정보로 복사하는 repository를 추가했다. DB transaction 유틸을 추가하고 시스템 고객사 승인 화면의 초기 기준정보 복사 단계도 연결 완료 상태로 보정했다.

수정 파일 목록 :
- lib/db/client.ts
- lib/company/api/companyRouteHandlers.ts
- lib/system/systemCompanyApprovalConsole.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/system/standards/index.ts
- lib/system/standards/companyStandardsInitializationRepository.ts
- docs/company-standards-initialization-0.10.65.md

삭제 파일 목록 :
없음
