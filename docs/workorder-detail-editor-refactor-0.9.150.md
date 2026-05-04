# 0.9.150 작업지시서 detail editor 구조 리팩토링 3차

## 목적

0.9.148~0.9.149에서 작업지시서 상세 화면의 container model 조립부와 section props 조립부를 분리했다. 0.9.150에서는 `useWorkOrderDetailEditor` 내부에서 직접 관리하던 inline editing session 상태를 별도 hook으로 분리해 detail editor의 책임을 줄였다.

## 반영 내용

- `useWorkOrderEditingSession` 추가
  - `editingCell`
  - `editingValue`
  - `setEditingValue`
  - `startEdit`
  - `cancelEdit`
- `useWorkOrderDetailEditor`는 order/material/outsourcing 편집 mutation 흐름을 유지하되, 편집 세션 시작/취소/blur 처리는 신규 hook에 위임한다.
- 기존 `blurActiveEditableElement` 호출 위치를 편집 세션 hook 안으로 모아 중복 가능성을 줄였다.

## 변경하지 않은 것

- 작업지시서 UI 구조
- 작업지시서 상태 변경 flow
- 발주정보/생산구성 저장 방식
- 첨부 업로드/썸네일/삭제
- 메모 저장/상태전환 후 유지
- R2 purge 기능
- DB schema

## 다음 리팩토링 후보

0.9.151 이후에는 UI 수정사항 수집 단계로 전환하는 것이 적절하다. 다만 detail editor를 계속 정리한다면 아래 항목이 후보가 된다.

- `commitEdit` 내부 order/material/outsourcing 분기 분리
- basic info modal draft 관리 hook 분리
- inspection modal 상태/적용 handler 분리
- registry modal 저장 handler 분리

## 테스트 기준

- 발주정보 셀 수정/저장
- 생산구성 원단/부자재 셀 수정/저장
- 외주공정 셀 수정/저장
- 셀 편집 취소 시 focus/inline edit 상태 초기화
- 상태 변경 후 메모/첨부 유지
