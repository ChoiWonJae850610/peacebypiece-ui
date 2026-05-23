Version : 0.15.88
Summary : 작업지시서 workflow action hook 정리 마무리
Description : 재고 반영과 검수 완료 후처리의 공통 persist 경로를 분리하여 useWorkOrderWorkflowActions 내부 중복 저장 처리와 상태 반영 호출을 줄였습니다. 기능 변경 없이 작업지시서 workflow/action hook의 잔여 중복을 정리하고 APP_VERSION을 0.15.88으로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
