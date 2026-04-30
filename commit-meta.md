Version: 0.9.16

Summary: 관리자 대시보드 i18n 누락으로 인한 빌드 오류 수정

Description:
- 0.9.15 빌드 로그 텍스트에서 확인된 TypeScript 오류를 기준으로 수정했다.
- `adminOperations.repository.ts`에서 참조하는 `operationsDashboard.statusDistribution` 및 `operationsDashboard.insights`가 영문 i18n 리소스에 누락되어 발생한 타입 오류를 수정했다.
- `lib/constants/app.ts`는 `APP_VERSION`만 0.9.16으로 변경하고, 나머지 export는 유지했다.
- 압축파일에는 node_modules가 포함되어 있지 않아 현재 작업 환경에서는 `next` 명령을 실행할 수 없었다. 텍스트파일에 기록된 빌드 오류 기준으로 수정했다.

수정 파일 목록:
1. lib/i18n/en/admin.ts
   - 운영 대시보드 영문 i18n에 상태 분포 및 인사이트 문구를 추가했다.

2. lib/constants/app.ts
   - APP_VERSION만 0.9.16으로 변경했다.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 빌드 로그 오류 위치: lib/admin/adminOperations.repository.ts:87
- 오류 원인: ko 리소스에는 존재하는 `operationsDashboard.statusDistribution` 객체가 en 리소스에는 없어 `getI18n()` 반환 타입에서 안전하게 접근할 수 없었다.
- 수정 방향: repository 로직은 유지하고 i18n 리소스 구조를 ko/en 동일하게 맞췄다.
- app.ts 보존 기준: STORAGE_KEY, LEGACY_STORAGE_KEYS, SECTION_PREFERENCES_STORAGE_KEY, WORKORDER_REPOSITORY_MODE, PARTNER_REPOSITORY_MODE, ATTACHMENT_MEMO_REPOSITORY_MODE 유지.
