Version :
0.9.224381

Summary :
휴지통 단계 표시와 리오더 생성 pending 보정

Description :
작업지시서 휴지통 상세에서 검토완료 단계가 작성중 위치로 표시되던 문제를 보정했다. 리오더 생성 시 전체 작업지시서 목록을 저장하지 않고 새 리오더 작업지시서 1건만 생성 저장하도록 바꿔 리오더 생성중 상태가 오래 유지되는 문제를 줄였다.

수정 파일 목록 :
- components/admin/files/fileTrashSectionRows.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-trash-stage-and-reorder-pending-0.9.224381.md

삭제 파일 목록 :
없음
