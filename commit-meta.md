Version :
0.9.22419

Summary :
admin/worker i18n 잔여 문구와 저장소 placeholder 정리

Description :
저장소 snapshot placeholder의 한국어 데이터 문자열 의존을 줄이고, 휴지통 상세와 작업지시서 저장소 목록의 단계명과 문서·디자인/메모 count 표시를 locale formatter 기준으로 정리했다. 영어 locale 새로고침 초기 한국어 flash는 SSR initialLocale 구조 이슈로 문서화하고 이번 버전에서는 보류했다.

수정 파일 목록 :
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/files/fileTrashSectionModals.tsx
- components/admin/files/fileTrashSectionPresentation.tsx
- components/admin/files/fileTrashSectionRows.ts
- lib/admin/adminFiles.adapter.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-worker-i18n-residual-cleanup-0.9.22419.md
- commit-meta.md

삭제 파일 목록 :
없음
