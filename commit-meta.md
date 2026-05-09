Version :
0.9.22422

Summary :
i18n terms count formatter 적용 범위 확대

Description :
저장소관리에서 반복되는 개수 표시와 파일 유형 표시를 terms glossary 기반 공통 formatter로 정리했다. 한국어와 영어 terms count key를 추가하고 저장소 요약, 휴지통 선택 count, 작업지시서 저장소 summary가 같은 formatter를 사용하도록 보정했다.

수정 파일 목록 :
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- components/admin/files/fileTrashSectionPresentation.tsx
- lib/i18n/ko/terms.ts
- lib/i18n/en/terms.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/i18n/adminTermFormatters.ts
- docs/i18n-terms-glossary-usage-expand-0.9.22422.md

삭제 파일 목록 :
없음
