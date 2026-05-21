Version :
0.15.34

Summary :
DB domain status constants 1차 정리

Description :
회사 온보딩, 고객사 구독, 가입 신청, 초대 상태의 기준값과 normalize helper를 lib/domain/companyStatus.ts로 분리했다. 시스템 고객사 승인 presentation, 고객사 온보딩 repository, 고객사 관리자 계정 정보 presentation의 일부 직접 문자열 비교를 domain constants 기반으로 정리했다. DB schema, API 응답, R2, 권한, 세션 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/admin/settings/companyOnboardingRepository.ts
- lib/admin/settings/adminAccountSettingsOverview.ts
- lib/system/systemCompanyApprovalPresentation.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/domain/companyStatus.ts
- docs/wafl-a-type/57_wafl-a-type-db-domain-status-constants.md

삭제 파일 목록 :
없음
