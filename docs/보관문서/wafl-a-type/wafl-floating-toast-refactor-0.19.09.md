# 0.19.09 WAFL floating toast 공통화 1차

## 목적

0.19.08 감사 결과를 기준으로 저장소관리, 작업지시서, 원단·부자재 발주 화면의 action 결과 메시지를 WAFL floating toast 기준으로 좁게 맞춘다. 화면 내부에 남아 있어야 하는 로드 실패, 빈 상태, 검증 안내는 inline feedback으로 유지한다.

## 변경 범위

- `components/common/AppToaster.tsx`
  - Sonner toast shell class를 기존 token 조합에서 `pbp-toast` 기반 WAFL toast class로 맞췄다.
- `components/admin/files/AdminFilesWorkspaceClient.tsx`
  - 삭제/복원/비우기/조회 실패 toast에 tone과 eventKey를 부여했다.
  - 성공 결과는 success, 조회/처리 실패는 danger, 새로고침 진행은 info로 분리했다.
- `components/workorder/WorkOrderOverlay.tsx`
  - 처리중 floating status의 radius와 shadow를 AppToaster 쪽 WAFL toast 기준에 맞췄다.
  - 기존 작업지시서 완료/실패 toast 호출 구조는 유지했다.
- `features/material-orders/hooks/useMaterialOrderDraftEditor.ts`
  - 발주서 상태 변경 성공/실패 결과를 floating toast용 상태로 분리했다.
- `features/material-orders/MaterialOrderDraftEditor.tsx`
  - 원단·부자재 발주 화면에 `ToastMessage`를 연결했다.
- `features/material-orders/MaterialOrderDetailPanel.tsx`, `features/material-orders/components/MaterialOrderStatusFlow.tsx`
  - 상태 변경 결과 메시지를 footer inline 문구로 끼워 넣지 않고, footer는 현재 상태 label만 표시하도록 유지했다.

## 유지한 것

- 저장소관리 휴지통 데이터, 선택, 삭제, 복원, 비우기 흐름
- 작업지시서 상태 머신, 검토요청, 발주요청, 첨부/메모/R2 흐름
- 원단·부자재 발주 계산식, 발주서 저장, 상태 변경 API 흐름
- DB schema, API route, R2 Worker, 권한 기준

## 테스트 위치

- `/workspace/storage`
- `/workspace/workorders`
- `/workspace/material-orders`

## 확인할 것

### 저장소관리

- 휴지통 단일 복원/선택 복원 결과가 둥근 WAFL toast로 표시되는지 확인한다.
- 휴지통 단일 삭제/선택 삭제/비우기 결과가 둥근 WAFL toast로 표시되는지 확인한다.
- 실패 상황에서는 danger tone toast가 뜨는지 확인한다.
- 새로고침 버튼을 눌렀을 때 info tone toast가 뜨는지 확인한다.

### 작업지시서

- 저장, 검토요청, 발주요청, 첨부/메모 action 결과 toast가 기존처럼 표시되는지 확인한다.
- 처리중 상태가 화면 하단 floating status로 보이고, radius/shadow가 다른 WAFL toast와 어긋나지 않는지 확인한다.
- workflow 검증 모달, 거절 사유 안내, 권한 모달은 toast로 바뀌지 않아야 한다.

### 원단·부자재 발주

- 발주서 상태 변경 성공 시 둥근 WAFL toast가 표시되는지 확인한다.
- 발주서 상태 변경 실패 시 danger tone toast가 표시되는지 확인한다.
- 진행 단계 footer는 현재 상태 label만 표시해야 한다.

## 바뀌면 안 되는 것

- 저장소관리 파일 개수, 용량 계산, 휴지통 row, 선택 체크박스
- 저장소관리 삭제/복원/비우기 confirm 모달과 처리 결과
- 작업지시서 검토요청/발주요청/상태 변경/담당자 변경
- 작업지시서 첨부/메모/디자인/R2 흐름
- 원단·부자재 발주 계산식, 발주 품목, 공급처 선택, 상태 변경 API
- DB/API/R2/권한/상태 흐름

## 다음 작업

- 0.19.10: 멤버관리, 환경설정, 협력업체관리, 시스템 저장소 사용량 쪽 WAFL floating toast 공통화 2차
