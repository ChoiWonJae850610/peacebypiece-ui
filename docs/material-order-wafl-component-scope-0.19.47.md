# 0.19.47 원단·부자재 발주 화면 WAFL 공통화 점검

## 작업 성격

이번 버전은 실제 원단·부자재 발주 화면의 3패널 UI를 바로 수정하지 않고, 다음 0.19.48에서 안전하게 적용할 수 있는 WAFL 공통 컴포넌트 범위를 분리한 점검/문서화 패치다.

## 현재 화면 구조

- 진입 화면: `/workspace/material-orders`
- 루트: `features/material-orders/MaterialOrderWorkspacePage.tsx`
- 실제 작업 화면: `features/material-orders/MaterialOrderDraftEditor.tsx`
- 좌측 패널: `MaterialOrderListPanel`
- 중앙 패널: `MaterialOrderDetailPanel`
- 우측 패널: `MaterialOrderAllocationPanel`
- 발주 품목 테이블: `components/MaterialOrderLineTable`
- 진행 단계: `components/MaterialOrderStatusFlow`
- 상태 메시지: `components/MaterialOrderPanelMessage`

## 이미 WAFL 공통 기반에 연결된 범위

- `AppButton`은 0.19.38 이후 `WaflButton` compatibility adapter 기준을 탄다.
- `ToastMessage`는 0.19.39 이후 `WaflToast` 기준을 탄다.
- `AppSheet`, `AppResponsiveWorkspace`, `AppCard`, `AppSection`, `AppListRow`, `AppSelect` 등 기존 common ui 계층을 사용한다.
- `WorkflowProgressPanel`을 통해 진행 단계 UI가 작업지시서와 유사한 공통 진행 패널 계층을 사용한다.

## 0.19.48에서 직접 적용 가능한 후보

### 1. 원단·부자재 전용 ActionButton adapter

추가 후보:

- `features/material-orders/components/MaterialOrderActionButton.tsx`

목표:

- 자재 선택 열기 버튼 주변 보조 액션
- 공급처 다시 조회 버튼
- 발주 품목 row 삭제 버튼
- 향후 발주 PDF/공유/복사/취소 같은 icon-only 액션

주의:

- `DeleteButton`은 현재 작업지시서 상세 테이블 공통 helper에서 온다. 바로 교체하면 작업지시서 테이블과 다른 밀도가 생길 수 있으므로, 0.19.48에서는 자재 발주 쪽 adapter만 만들고 실제 삭제 버튼 교체는 화면 확인 가능 시점에 제한 적용한다.

### 2. 상태 메시지 공통화

대상:

- `MaterialOrderPanelMessage`
- `MaterialOrderDetailPanel`의 “선택된 발주서가 없습니다.” 영역
- `MaterialOrderLineTable`의 “주문할 자재를 선택하세요.” row

적용 후보:

- `WaflEmptyState`
- `WaflLoadingState`
- `WaflErrorState`

주의:

- 좌측/우측 패널의 message box는 작고 좁은 패널 안에 들어간다. `WaflStateBlock`의 기본 padding/높이가 과하면 패널 내부 밀도가 무너질 수 있으므로 `compact` 성격의 adapter를 두는 편이 안전하다.

### 3. 발주 품목 테이블 밀도 정리

대상:

- `MaterialOrderLineTable`

현재:

- 작업지시서 상세 테이블의 `TABLE_HEADER_CELL_CLASS`, `EDITABLE_TABLE_CELL_CLASS`, `SELECTABLE_TABLE_CELL_CLASS`, `CALCULATED_TABLE_CELL_CLASS`, `DeleteButton`을 재사용한다.

판단:

- 이 재사용은 나쁘지 않다. 다만 WAFL DataTable과 작업지시서 편집 테이블은 성격이 다르므로, 0.19.48에서는 대규모 테이블 교체를 하지 않는다.
- header 높이, cell padding, row hover 정도만 원단·부자재 화면 전용 constant로 감싸는 정도가 안전하다.

### 4. 패널 카드 클래스 정리

대상:

- `materialOrderWorkspaceStyles.ts`

적용 후보:

- `MATERIAL_ORDER_PANEL_CARD_CLASS`
- `MATERIAL_ORDER_SECTION_CARD_CLASS`
- `MATERIAL_ORDER_EMPTY_STATE_CLASS`
- `MATERIAL_ORDER_TABLE_SHELL_CLASS`

판단:

- 현재 token 기반 class를 사용하고 있어 급한 교체 대상은 아니다.
- 다만 `WaflSectionPanel`, `WaflState`, `WaflButton`에 맞춰 이름과 의도를 문서화하면 다음 기능 확장 때 화면별 class가 늘어나는 것을 줄일 수 있다.

### 5. 모바일/태블릿 sheet 버튼 정리

대상:

- `MaterialOrderDraftEditor`의 “자재 선택 열기” 버튼

판단:

- 이미 `AppButton`을 사용하므로 WAFL Button adapter 영향을 받는다.
- 0.19.48에서는 className 직접 지정이 필요한지 확인하고, 불필요한 직접 높이/폭 class만 줄이는 방향이 적절하다.

## 0.19.48에서 건드리지 말아야 할 범위

- `useMaterialOrderDraftEditor`의 발주 생성/상태 변경/라인 수정 로직
- `/api/material-orders` 계열 API
- PDF 생성 흐름
- 작업지시서 자재 할당 계산식
- `materialOrderDraftCalculator` 계산식
- 3패널 grid column 기준
- 모바일/태블릿 sheet 구조
- workflow state 전환 조건
- DB schema / migration / full_reset.sql

## 권장 작업 순서

1. `MaterialOrderPanelMessage`를 `WaflState` 기반 compact adapter로 전환
2. 상세 미선택 상태를 동일 compact state로 전환
3. 발주 품목 empty row 문구를 최소 변경으로 정리
4. 공급처 다시 조회 버튼을 `AppButton` 또는 WAFL adapter로 통일
5. 문서상 제외 범위와 실제 변경 파일을 비교해 DB/API/PDF 흐름이 포함되지 않았는지 확인

## 0.19.48 테스트 기준

- 발주서 생성
- 발주서 선택
- 구분 변경
- 공급처 선택
- 자재 선택 sheet 열기/닫기
- 우측 작업지시서 자재 추가
- 발주 품목 수량/단가 수정
- 라인 삭제
- 상태 변경
- 발주/PDF 관련 흐름 기존 유지
- PC 3패널, 태블릿 2패널+sheet, 모바일 탭+bottom sheet 구조 유지
- 갤럭시탭 세로↔가로 회전 후 패널 폭 stale 여부 확인
