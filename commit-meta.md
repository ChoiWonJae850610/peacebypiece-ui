Version :
0.15.41

Summary :
작업지시서 생산구성 활성 입력값 반영 보강

Description :
작업지시서 상세 화면에서 원단, 부자재, 외주공정의 수량과 단가를 입력한 직후 검토 요청 또는 임시저장을 누를 때 현재 편집 중인 값을 먼저 반영하도록 수정했다. 검토 요청 실행 전에 pending detail edit을 commit하고 다음 tick에서 workflow action을 실행해 생산구성 수량과 단가가 0으로 저장되는 위험을 줄였다.

수정 파일 목록 :
- components/workorder/detail/WorkOrderDetailContainer.tsx
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/64_wafl-a-type-workorder-pending-edit-flush.md

삭제 파일 목록 :
없음
