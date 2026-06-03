# 0.19.54 저위험 UI/export 정리 1차

## 목적

0.19.53 소스 전체 리팩토링 분석 이후 기능 로직을 변경하지 않는 범위에서 공통 UI export/import 기준을 정리한다.

이번 버전은 화면 동작 변경이 아니라 `components/common/ui` barrel export 기준을 강화하고, 기존 deep import를 공통 진입점으로 모으는 작업이다.

## 정리 기준

- `@/components/common/ui/*` 직접 경로 import를 줄이고 `@/components/common/ui` 진입점을 우선 사용한다.
- 공통 UI로 승격된 다음 컴포넌트를 barrel export에 추가한다.
  - `InlineInfoItem`
  - `SectionCountBadge`
  - `SummaryCard`
  - `WorkOrderPanelCard`
  - `WORKORDER_PANEL_CARD_CLASS`
- 기존 props, className, 동작 로직은 변경하지 않는다.
- modal, toast, workorder, material order의 기능 흐름은 변경하지 않는다.
- DB/API/R2/PDF/schema/full_reset.sql은 변경하지 않는다.

## 적용 범위

### 공통 UI export

- `components/common/ui/index.ts`

### common modal

- `BaseModal`
- `ModalBody`
- `ModalFooter`
- `ModalHeader`
- `ModalShell`
- `modalActions`
- `CreateWorkOrderCategoryFields`

### 작업지시서

- `WorkOrderOverlay`
- `PartnerFactoryRegistryModal`
- `WorkOrderCostSummarySection`
- `WorkOrderHeaderSection`
- `WorkOrderAttachmentPanel`
- `WorkOrderMemoPanel`
- 모바일/태블릿 비용 요약 섹션
- 상세 편집 shared helper

### 원단·부자재 / 자재

- `MaterialOrderAllocationPanel`
- `MaterialOrderDraftEditor`
- `MaterialOrderListPanel`
- `MaterialsWorkspacePage`

### 시스템/관리 화면

- `SystemCompanyApprovalConsole`
- `AdminModal`

## 제외 범위

- 화면 구조 변경
- 스타일 토큰 추가/삭제
- 신규 기능
- 작업지시서 workflow
- 원단·부자재 발주 상태 변경
- 첨부/디자인/메모/R2 흐름
- PDF 생성 흐름
- DB schema / API route / repository 로직
- package.json / package-lock.json

## 다음 단계

0.19.55에서는 작업지시서/원단·부자재의 복잡도 분석을 별도 문서로 분리하는 것이 적절하다. 기능 추가는 그 이후 저위험 정리와 위험 영역 분류가 끝난 뒤 진행한다.
