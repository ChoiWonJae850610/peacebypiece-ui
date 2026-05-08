Version :
0.9.22397

Summary :
저장소 snapshot build 타입 오류 보정

Description :
0.9.22396 적용 후 snapshot API에서 attachments 배열의 fileKind가 string으로 넓게 추론되어 AdminManagedFileItem[]에 할당되지 못하던 TypeScript 오류를 보정했다. listAdminFileManagementRows 반환 타입과 배열 타입을 명시하고 APP_VERSION을 0.9.22397로 갱신했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-build-type-fix-0.9.22397.md
- commit-meta.md

삭제 파일 목록 :
없음
