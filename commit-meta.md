Version :
0.9.22396

Summary :
휴지통 actionFlow 책임 분리 2차

Description :
저장소 휴지통의 복원, 선택 삭제, 비우기 흐름이 공통 actionFlow를 사용하도록 정리했다. page.tsx는 선택 ID와 클릭 처리 중심으로 축소하고, 실제 대상 해석과 summary/message formatter 연결은 adminFiles.actionFlow.ts로 이동했다. 고객관리자 저장소 화면에 남아 있던 연결 첨부 표현도 문서·디자인·메모 기준 문구로 보정했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- lib/admin/adminFiles.actionFlow.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-action-flow-responsibility-0.9.22396.md
- commit-meta.md

삭제 파일 목록 :
없음
