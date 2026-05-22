Version : 0.15.74
Summary : 작업지시서 제목 저장 시 미저장 생산정보 draft 보존
Description : 작업지시서 제목 즉시 저장 결과를 로컬 상태에 병합할 때 발주정보, 원단/부자재, 외주, 메모/첨부 등 draft-only 필드를 보존하도록 정리했습니다. 제목 변경만으로 상세 편집 draft가 재초기화되지 않도록 상세 editor 초기화 effect를 필드 단위로 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
추가 파일 목록 :
삭제 파일 목록 :
