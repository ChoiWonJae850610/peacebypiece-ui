# 작업지시서 WAFL 공통 컴포넌트 적용 범위 점검 — 0.19.45

## 목적

작업지시서 화면은 목록, 상세, 우측 첨부·디자인·메모 패널, 생성/수정/삭제 모달, PDF/상태 변경 흐름이 서로 연결되어 있다. 0.19.45에서는 대규모 UI 전환을 하지 않고, 이미 공통화된 WAFL 컴포넌트를 어디까지 안전하게 적용할 수 있는지 점검한다.

## 현재 유지해야 하는 구조

- PC 3패널 구조: 좌측 목록, 중앙 상세, 우측 첨부·디자인·메모 패널
- 태블릿 split 구조
- 모바일 stack/sheet 구조
- 작업지시서 DB 저장 흐름
- R2 첨부/디자인 업로드 흐름
- 메모 작성/수정/삭제 흐름
- PDF 생성 버튼 및 결과 처리 흐름
- write-lock / processing 상태 처리

## 이미 적용된 공통 컴포넌트

### Button

- `AppButton`은 0.19.38에서 `WaflButton` 기반 adapter로 전환됨.
- `components/workorder/layout/MobileSectionStack.tsx`, `components/workorder/layout/TabletSplitLayout.tsx`의 우측 패널 열기 버튼은 이미 간접적으로 WAFL Button 기준을 따른다.

### Toast

- 0.19.39에서 `ToastMessage`가 `WaflToast` 기반 adapter로 정리됨.
- 작업지시서 상태 변경, 첨부/메모/PDF 처리 결과 toast는 기존 호출부를 유지해도 공통 toast 규격을 따른다.

### Empty / Loading

- 0.19.40에서 `WorkOrderEmptyState`, `WorkOrderLoadingState`가 WAFL 상태 컴포넌트 기준으로 정리됨.
- 상세 미선택, 우측 패널 미선택, 로딩 skeleton은 이미 1차 공통화 대상에 들어갔다.

### Modal

- 0.19.41에서 공통 modal shell이 WAFL helper 기준으로 정리됨.
- 작업지시서 생성/삭제/수정 관련 모달은 공통 modal shell 변경의 영향을 이미 받는다.

## 0.19.46에서 직접 적용 가능한 후보

### 1. 작업지시서 목록 카드 action button

대상:

- `components/workorder/list/WorkOrderListCard.tsx`

후보:

- 목록 카드 우측 `…` 메뉴 버튼
- 재작업 / 삭제 dropdown row action

주의:

- 선택된 카드(active) 상태에서 어두운 배경·흰색 계열 버튼이 적용된다.
- 단순 `WaflActionButton` 치환 시 active 상태 색상 충돌 가능성이 있으므로, active tone 또는 workorder 전용 adapter를 먼저 두는 편이 안전하다.

추천:

- `WorkOrderCardActionButton` adapter를 만든 뒤 내부에서 `WaflActionButton`을 사용한다.
- active 상태의 색상만 작업지시서 semantic token으로 별도 처리한다.

### 2. 작업지시서 홈 버튼

대상:

- `components/workorder/layout/WorkOrderHomeButton.tsx`

후보:

- 원형 Home icon link

주의:

- 현재 직접 `border-stone-200 bg-white text-stone-700`를 사용한다.
- WAFL theme token 기준으로 바꿔도 기능 영향이 거의 없다.

추천:

- `WaflActionLink` 또는 `AppButton variant="icon"` 계열로 전환한다.

### 3. 우측 첨부 패널 action button

대상:

- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`

후보:

- 파일 추가/디자인 추가 메뉴 버튼
- 첨부 retry 버튼
- 항목별 편집/삭제/다운로드 계열 버튼

주의:

- R2 업로드 상태, write-lock, file input trigger가 연결되어 있다.
- 먼저 icon-only 버튼만 분리하고, 업로드/삭제 로직은 건드리지 않는다.

추천:

- `WorkOrderSidePanelActionButton` adapter를 만들고, 기존 `onClick`, `disabled`, `title`만 전달한다.

### 4. 메모 패널 action button

대상:

- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`

후보:

- 댓글/답글 작성 취소
- 수정/삭제 icon button
- 답글 열기 버튼

주의:

- memo thread 상태와 deleted state 표시가 섞여 있다.
- 삭제성 액션은 `dangerSoft` tone으로 제한 적용한다.

추천:

- 삭제/수정 icon-only부터 `WaflActionButton`으로 전환한다.
- text button은 0.19.46에서 범위를 넓히지 않고 0.19.47 이후에 진행한다.

### 5. 상세 섹션 내 추가 버튼

대상:

- `components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx`
- tablet/desktop 상세 섹션 계열 파일

후보:

- 발주정보 추가
- 외주공정 추가
- 편집 버튼

주의:

- 상세 섹션은 모바일/태블릿/PC 파일이 분리되어 있어 한 파일만 바꾸면 밀도가 달라질 수 있다.
- 제품구성/발주정보/원단/부자재/외주공정의 편집 동작과 validation이 연결되어 있다.

추천:

- 0.19.46에서는 목록/우측 패널 중심으로 먼저 적용한다.
- 상세 섹션은 0.19.47 이후 별도 버전으로 진행한다.

## 0.19.46에서 피해야 할 범위

- 작업지시서 3패널 layout 구조 변경
- 상세 섹션 컴포넌트 통합 리팩토링
- 첨부/디자인/메모 R2 키 구조 변경
- PDF 생성 흐름 변경
- workflow state 변경 로직 수정
- 제품구성/발주정보/원단/부자재/외주공정 DB 저장 로직 수정
- 모바일/태블릿 layout breakpoint 변경

## 권장 작업 순서

1. `WorkOrderHomeButton`을 WAFL action link 기준으로 전환
2. `WorkOrderListCard` 우측 메뉴 버튼 adapter 생성
3. `WorkOrderAttachmentPanel` icon-only 버튼 일부 adapter 적용
4. `WorkOrderMemoPanel` 수정/삭제 icon-only 버튼 일부 adapter 적용
5. 화면별 smoke test 후 상세 섹션 버튼은 다음 단계로 분리

## 0.19.46 테스트 기준

- 작업지시서 목록 선택/상세 진입이 기존과 동일해야 한다.
- 목록 카드 active 상태 색상이 깨지면 안 된다.
- `…` 메뉴 열기/닫기, Escape/외부 클릭 닫기가 유지되어야 한다.
- 삭제 메뉴의 권한/상태 제한이 기존과 동일해야 한다.
- 첨부/디자인/메모 업로드·삭제·수정 흐름이 기존과 동일해야 한다.
- PC 3패널, 태블릿 split, 모바일 stack/sheet 구조가 변하면 안 된다.
- 갤럭시탭 세로↔가로 회전 후 좌/중/우 패널 폭이 stale 되면 안 된다.
