# 0.9.148 작업지시서 Detail 구조 리팩토링 1차

## 목적

0.9.77 복구 라인의 작업지시서 UI와 동작을 유지한 상태에서 `WorkOrderDetail` 계층의 책임을 점검하고, 안전하게 분리 가능한 컨테이너 모델 조립부를 우선 분리한다.

## 적용 내용

- `WorkOrderDetailContainer` 내부에서 직접 만들던 persistence, identity, permission, cost, disclosure, workflow, action 모델 조립을 `buildWorkOrderDetailContainerModels`로 분리했다.
- 생산구성 통합 토글 inline handler를 `toggleProductionSection` 이름의 지역 함수로 분리했다.
- device view switch, detail editor, presentation view model, 상태 변경 action, 첨부, 메모, R2 purge 흐름은 변경하지 않았다.

## 현재 구조 판단

### 유지해야 할 경계

- `components/workorder/detail/WorkOrderDetailContainer.tsx`
  - hook 연결, editor 연결, view model 조립, device view 선택만 담당한다.
- `lib/hooks/workorder/useWorkOrderDetailEditor.ts`
  - 화면 편집 상태와 편집 action을 담당한다.
- `lib/workorder/presentation/workOrderDetailPresentation.ts`
  - section props로 전달할 표시용 view model을 만든다.
- `components/workorder/detail/views/*`
  - PC/태블릿/모바일 배치만 담당한다.
- `components/workorder/detail/sections/*`
  - 각 영역의 실제 UI를 담당한다.

### 다음 리팩토링 후보

- `useWorkOrderDetailEditor` 내부의 order/material/outsourcing 편집 흐름을 section별 hook 또는 mutation helper로 더 분리한다.
- `buildWorkOrderDetailViewModel`의 orderInfo, productionComposition, costSummary prop 조립을 하위 builder로 분리한다.
- detail view props 타입을 `viewModelTypes`와 중복되지 않도록 점검한다.

## 금지 기준

- 작업지시서 상태 변경 flow 변경 금지
- 첨부/메모 저장 흐름 변경 금지
- R2 Worker 업로드/삭제 흐름 변경 금지
- DB schema 변경 금지
- 화면 배치 변경 금지
- 대규모 파일 이동 금지

## 테스트 기준

1. 작업지시서 상세 화면 진입
2. PC/태블릿/모바일 폭에서 화면이 기존처럼 표시되는지 확인
3. 기본정보 모달 열기/저장
4. 발주정보 셀 수정/저장
5. 생산구성 토글 열기/닫기
6. 메모 작성 후 상태 변경/새로고침 유지
7. 첨부 업로드/썸네일/삭제 정상
