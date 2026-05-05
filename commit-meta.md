Version :
0.9.182

Summary :
작업지시서 공장 row 검증과 삭제 기준 보완

Description :
검토요청, 검토완료, 발주요청 전에 입력된 모든 공장 row의 공장, 납기일, 수량을 검증하도록 보완했다. 공장 row가 0개인 상태를 허용하되 상태 전환과 발주요청은 차단되도록 하고, 공장 row가 1개만 남아도 삭제할 수 있게 수정했다. 발주요청 모달에서도 같은 검증 메시지를 표시한다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/hooks/workorder/detailEditor/itemMutations.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/workorder/orderSubmission.ts
- lib/workorder/workflow.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
