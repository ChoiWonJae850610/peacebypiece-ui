Version : 0.9.22341
Summary : 저장소 휴지통 preview 빌드 및 런타임 오류 수정
Description : 저장소 휴지통 R2 preview 연결 이후 placeholder 타입 누락으로 발생한 build 오류와 createAttachmentFilePreviewUrl helper 누락으로 발생한 런타임 오류를 수정한다. 휴지통 상세 모달의 정보 카드 글씨 굵기도 낮춰 화면 압박감을 줄인다. DB schema, package 의존성, R2 Worker 정책은 변경하지 않는다.
수정 파일 목록 :
components/admin/files/FileTrashSection.tsx
lib/admin/adminFiles.serverActions.ts
lib/admin/adminFiles.presentation.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-preview-build-fix-0.9.22341.md
삭제 파일 목록 :
없음
