Version :
0.9.22420

Summary :
i18n 도메인 용어 glossary 구조 도입

Description :
문장별 i18n key에 반복되던 작업지시서, 문서, 디자인, 메모, 저장소, 휴지통, 삭제 요청 같은 도메인 용어를 공통 terms namespace로 분리했다. useAdminTranslation에서 terms.* 경로를 읽을 수 있도록 보정하고, 저장소관리 일부 반복 용어를 glossary 기준으로 표시하도록 정리했다.

수정 파일 목록 :
- components/admin/files/FileListSection.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- components/admin/files/fileTrashSectionPresentation.tsx
- components/admin/files/fileTrashSectionRows.ts
- lib/i18n/index.ts
- lib/i18n/useAdminTranslation.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/i18n/ko/terms.ts
- lib/i18n/en/terms.ts
- docs/i18n-domain-terms-glossary-0.9.22420.md

삭제 파일 목록 :
없음
