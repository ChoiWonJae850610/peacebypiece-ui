Version :
0.9.189

Summary :
작업지시서 생성 분류 입력과 통계용 카테고리 저장 기준 정리

Description :
작업지시서 생성 모달에서 추천분류 표시를 runtime flag로 비활성화하고 시즌/연도 입력을 제거했다. spec_sheets에 1차/2차/3차 분류 참조 컬럼을 추가하고, 작업지시서 생성/저장 시 item_categories 기준 분류 id를 함께 저장하도록 보완했다.

수정 파일 목록 :
- components/common/modal/CreateWorkOrderModal.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/spec_sheets.sql
- lib/constants/app.ts
- lib/constants/runtimeMode.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderActionTypes.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/workorder/actions.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- types/workorder.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
