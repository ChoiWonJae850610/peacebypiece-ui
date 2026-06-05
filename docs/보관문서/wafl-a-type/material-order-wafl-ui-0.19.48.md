# 0.19.48 원단·부자재 발주 UI 공통화 1차

## 작업 범위

0.19.47 점검 문서에서 허용한 안전 범위만 적용했다. 원단·부자재 발주 화면의 3패널 구조, 발주 생성/상태 변경 로직, PDF 흐름, 작업지시서 자재 할당 계산식, DB/API/schema는 변경하지 않았다.

## 반영 내용

- `MaterialOrderActionButton` adapter 추가
- `MaterialOrderPanelMessage`를 WAFL 상태 컴포넌트 기반 compact state로 전환
- 발주서 목록과 작업지시서 패널의 loading/error/search 상태에 kind를 명시
- 중앙 상세 패널의 미선택 상태를 `WaflEmptyState`로 전환
- 공급처 조회 실패 후 다시 조회 버튼을 `AppButton` 기반 danger 버튼으로 전환
- 발주 품목 empty row를 `WaflEmptyState` 기반으로 정리
- 발주 품목 row 삭제 버튼을 원단·부자재 전용 mini action button으로 전환

## 변경하지 않은 범위

- `/api/material-orders` 계열 API
- `useMaterialOrderDraftEditor`의 상태/저장/라인 수정 로직
- `materialOrderDraftCalculator` 계산식
- 발주 PDF 생성 흐름
- 작업지시서 자재 할당 계산식
- 3패널 grid column 기준
- 모바일/태블릿 sheet 구조
- DB schema / migration / full_reset.sql

## 다음 후보

- 원단·부자재 발주 목록 카드 action 영역 세부 정리
- 발주 품목 테이블 header/cell class를 WAFL editable table 상수로 별도 분리
- 우측 작업지시서 자재 선택 row의 선택 버튼 밀도 확인
- 발주 상태 flow의 WAFL semantic token 점검
