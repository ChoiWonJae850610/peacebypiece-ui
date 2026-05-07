Version : 0.9.2234
Summary : 저장소 휴지통 R2 preview 썸네일 1차 연결
Description : 저장소 관리 휴지통 목록과 상세 모달에서 이미지 파일을 실제 R2 preview route 기반 썸네일로 표시하도록 보정했다. attachment_trash_items의 storage_key와 thumbnail_key를 조회해 /api/workorders/attachments/file route URL로 변환하고, 이미지 파일은 썸네일/preview를 우선 표시한다. PDF/기타 파일과 작업지시서 항목은 기존 배지 표시를 유지한다.
수정 파일 목록 :
components/admin/files/FileTrashSection.tsx
lib/admin/adminFiles.serverActions.ts
lib/admin/adminFiles.types.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-r2-preview-0.9.2234.md
삭제 파일 목록 :
없음
