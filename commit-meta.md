Version :
0.9.22395

Summary :
휴지통 액션 결과 메시지 중앙화 1차

Description :
저장소 휴지통의 상세 모달, 상단 복원, 상단 선택 삭제, 비우기 버튼이 같은 actionFlow와 presentation formatter를 통해 결과 메시지를 만들도록 정리했다. 작업지시서, 문서, 디자인, 메모 단위의 결과 요약을 공통 summary 타입으로 합산하고 고객관리자 문구에서 연결 첨부, 복구, 영구삭제 표현을 제거했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- app/api/admin/files/trash/restore/route.ts
- app/api/admin/files/trash/purge/route.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/files/workorders/purge/route.ts
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-action-result-refactor-0.9.22395.md
- commit-meta.md

삭제 파일 목록 :
없음
