# 0.9.149 작업지시서 Detail 구조 리팩토링 2차

## 목적

0.9.148에서 분리한 `WorkOrderDetailContainer` 모델 조립부에 이어, `buildWorkOrderDetailViewModel` 내부의 section props 조립 책임을 하위 builder로 나눈다.

## 적용 내용

- `lib/workorder/presentation/workOrderDetailSectionProps.ts`를 추가했다.
- header, action, order info, production composition, cost summary section props 조립을 각각의 builder 함수로 분리했다.
- `workOrderDetailPresentation.ts`는 order info hub policy를 계산하고 section props builder를 조합하는 역할만 담당하도록 축소했다.
- 작업지시서 화면 배치, 상태 변경, 첨부, 메모, R2 purge, DB schema는 변경하지 않았다.

## 유지한 경계

- `components/workorder/detail/WorkOrderDetailContainer.tsx`
  - editor hook 연결, container model 연결, presentation view model 호출, device view 선택
- `lib/workorder/presentation/workOrderDetailPresentation.ts`
  - detail view model 조합의 진입점
- `lib/workorder/presentation/workOrderDetailSectionProps.ts`
  - section별 props 조립
- `components/workorder/detail/views/*`
  - 디바이스별 배치
- `components/workorder/detail/sections/*`
  - 실제 UI 렌더링

## 다음 리팩토링 후보

- `useWorkOrderDetailEditor` 내부의 order/material/outsourcing 편집 mutation을 section 단위 helper로 분리할지 검토한다.
- `editingCell`, `editingValue`, `onStartEdit`, `onCommitEdit`, `onCancelEdit` 전달 범위를 줄일 수 있는지 확인한다.
- detail section별 props 타입이 너무 넓어지는 경우 section model 타입을 별도 정의한다.

## 금지 기준

- 작업지시서 상태 변경 flow 변경 금지
- 첨부/메모 저장 흐름 변경 금지
- R2 Worker 업로드/삭제 흐름 변경 금지
- DB schema 변경 금지
- 화면 배치 변경 금지
- 대규모 파일 이동 금지

## 테스트 기준

1. 작업지시서 상세 화면 진입
2. PC/태블릿/모바일 폭에서 화면 표시 확인
3. 기본정보 모달 열기/저장
4. 발주정보 셀 수정/저장
5. 생산구성 토글 열기/닫기
6. 검토요청/검토완료 등 상태 버튼 표시 확인
7. 메모 작성 후 상태 변경/새로고침 유지
8. 첨부 업로드/썸네일/삭제 정상
