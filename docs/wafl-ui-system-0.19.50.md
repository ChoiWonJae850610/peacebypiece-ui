# WAFL UI System

## 목적

WAFL 고객사 관리자 화면과 업무 화면은 같은 제품처럼 보여야 한다. 이 문서는 반복 UI를 화면별 class 조합으로 만들지 않고, WAFL 공통 컴포넌트와 theme token을 기준으로 확장하기 위한 기준이다.

이 문서는 0.19.50 기준의 공통 UI 기준이며, 이후 신규 화면이나 기존 화면 정리 시 우선 참조한다.

## 기본 원칙

1. 반복 구조는 화면 파일에 직접 class를 쌓지 않고 공통 컴포넌트로 만든다.
2. 색상, 배경, border, shadow, 상태 tone은 theme token 또는 semantic token을 우선 사용한다.
3. 화면별 layout은 content/children/slot만 전달하고, radius·spacing·font hierarchy는 공통 컴포넌트에서 관리한다.
4. 업무 기능 로직, DB/API/R2/PDF 흐름과 UI 공통화는 분리한다.
5. 모바일·태블릿·PC 기준은 화면마다 새로 만들지 않고 WAFL responsive 기준을 재사용한다.

## 공통 컴포넌트 기준

### PageHero

대표 컴포넌트:

- `components/admin/common/WaflPageHero.tsx`

사용 기준:

- 관리자 주요 화면의 최상단 설명 영역에 사용한다.
- title, description, eyebrow, action 영역을 한 화면의 진입 기준으로 정리한다.
- hero 폭은 아래 summary/section 폭과 동일한 컨테이너 기준을 따른다.
- 모바일에서는 action이 title/description과 겹치지 않고 자연스럽게 아래로 내려가야 한다.

금지 기준:

- 화면 파일에서 hero 전용 gradient, radius, border를 반복 작성하지 않는다.
- Galaxy Tab 회전 대응을 개별 hero wrapper에서 다시 만들지 않는다.

### SummaryCard

대표 컴포넌트:

- `components/common/ui/SummaryCard.tsx`
- `components/admin/common/AdminSummaryMetricCards.tsx`

사용 기준:

- 통계 요약, 저장공간 요약, 운영 상태 요약처럼 숫자와 짧은 설명이 있는 카드에 사용한다.
- 카드의 border, radius, shadow, inner spacing은 공통 기준을 따른다.
- 모바일에서는 1열, 태블릿에서는 2열 또는 compact grid, PC에서는 화면 성격에 맞는 grid를 사용한다.

주의 기준:

- 카드 우측 border가 끊겨 보이지 않아야 한다.
- 숫자와 badge가 줄바꿈되어도 카드 높이가 어색하게 튀지 않아야 한다.

### SectionPanel / SectionHeader

대표 컴포넌트:

- `components/admin/common/WaflSectionPanel.tsx`
- `components/admin/common/AdminPanelSection.tsx`
- `components/admin/common/AdminSection.tsx`

사용 기준:

- 관리자 화면의 주요 덩어리는 section panel로 감싼다.
- header에는 title, description, action을 두되, action은 모바일에서 자연스럽게 stack된다.
- table, filter, setting card, empty state는 section 안에서 같은 폭 기준을 공유한다.

금지 기준:

- 같은 화면에서 section마다 radius, border, padding을 직접 다르게 지정하지 않는다.
- section header action 영역을 absolute position으로 밀어 고정하지 않는다.

### FeatureCard / SettingCard

대표 컴포넌트:

- `components/admin/common/WaflFeatureCard.tsx`
- `components/admin/common/WaflSettingCard.tsx`
- `components/admin/common/WaflSettingsSectionGroup.tsx`

사용 기준:

- 홈/환경설정/운영 안내처럼 카드형 내비게이션 또는 설정 항목에 사용한다.
- 카드 title, description, meta, action 영역을 일관되게 유지한다.
- 환경설정처럼 세부 섹션이 많은 화면은 `WaflSettingsSectionGroup`으로 묶는다.

### NoticeBox

대표 컴포넌트:

- `components/admin/common/WaflNoticeBox.tsx`

사용 기준:

- 정책 안내, 기능 준비중, 권한 안내, 운영 기준 설명처럼 본문보다 한 단계 강조가 필요한 정보에 사용한다.
- 단순 성공/실패 피드백은 toast 또는 feedback message를 사용하고 NoticeBox로 대체하지 않는다.

### FilterBar

대표 컴포넌트:

- `components/admin/common/WaflFilterBar.tsx`
- `components/admin/common/AdminFilterBar.tsx`

사용 기준:

- 검색어, 상태 필터, 기간 필터, 토글형 조건을 한 줄 또는 wrap 가능한 영역으로 묶는다.
- 좁은 화면에서는 input과 button이 넘치지 않고 stack 또는 wrap되어야 한다.
- 검색 결과 없음 상태는 table/section 폭과 같은 기준으로 표시한다.

### DataTable / CompactCard

대표 컴포넌트:

- `components/admin/common/WaflDataTable.tsx`
- `components/admin/common/AdminTable.tsx`
- `components/admin/common/AdminTableState.tsx`

사용 기준:

- PC에서는 wide table, 모바일/일부 태블릿에서는 compact card를 사용한다.
- table header height, row height, cell padding은 `WaflDataTable` 기준을 따른다.
- compact card의 meta box, action 영역, badge 위치도 공통 class를 우선 사용한다.

주의 기준:

- Galaxy Tab 세로↔가로 회전 후 table/card 전환 기준이 이전 방향 폭으로 남지 않아야 한다.
- row action button이 row height를 과하게 늘리지 않아야 한다.
- 멤버관리, 협력업체관리, 저장소관리, 휴지통 table은 같은 밀도 기준을 따른다.

### Button

대표 컴포넌트:

- `components/common/ui/WaflButton.tsx`
- `components/common/ui/AppButton.tsx`
- `components/admin/common/AdminButton.tsx`

variant 기준:

- `primary`: 주요 실행 버튼
- `secondary`: 일반 보조 실행 버튼
- `danger`: 삭제, 취소, 비활성화처럼 주의가 필요한 실행 버튼
- `ghost`: 배경 강조 없이 보조적 동작을 제공하는 버튼
- `subtle`: 낮은 강조도의 안내성 버튼
- `icon`: 텍스트 버튼 계열 중 아이콘 중심 버튼

size 기준:

- `sm`: table row, compact 영역
- `md`: 기본 form/action 영역
- `lg`: 주요 CTA, 큰 화면의 대표 action

사용 기준:

- 화면별로 `h-`, `px-`, `rounded-`, `font-`를 직접 반복하지 않는다.
- 기존 `AppButton`, `AdminButton`은 호환 adapter로 유지하되, 신규 구현은 WAFL 기준을 따른다.

### ActionButton

대표 컴포넌트:

- `components/common/ui/WaflActionButton.tsx`
- `components/admin/common/AdminIconActionButton.tsx`
- `components/workorder/common/WorkOrderActionButton.tsx`
- `features/material-orders/components/MaterialOrderActionButton.tsx`

사용 기준:

- icon-only 또는 row action 버튼에 사용한다.
- 복사, 공유, 취소, 삭제, 복원, 새로고침, more menu 같은 짧은 작업에 사용한다.
- `neutral`, `danger`, `success`, `ghost` 등 의미 tone을 분리한다.
- 반드시 접근성 label을 제공한다.

주의 기준:

- active card 위에 올라가는 버튼은 active background와 대비가 깨지지 않게 별도 adapter에서 조정한다.
- row action button은 table/compact card 밀도와 충돌하지 않아야 한다.

### Toast

대표 컴포넌트:

- `components/common/ui/WaflToast.tsx`
- `components/common/ToastMessage.tsx`

status 기준:

- `success`: 완료
- `loading`: 처리중
- `warning`: 주의
- `danger`: 실패 또는 위험 결과
- `info`: 일반 안내

사용 기준:

- 중복 라벨을 줄이고 icon + message 중심으로 표시한다.
- 처리중 toast와 결과 toast의 위치와 형태는 일관되게 유지한다.
- 모바일에서는 bottom 영역, sheet, navigation과 겹치지 않아야 한다.

### Modal

대표 컴포넌트:

- `components/common/ui/WaflModal.tsx`
- `components/common/modal/BaseModal.tsx`
- `components/common/modal/ModalShell.tsx`
- `components/common/modal/ModalHeader.tsx`
- `components/common/modal/ModalBody.tsx`
- `components/common/modal/ModalFooter.tsx`
- `components/admin/layout/AdminModal.tsx`

필수 동작:

- 배경 스크롤 차단
- focus trap
- Escape 닫기
- 외부 클릭 정책 유지
- 모바일 상단 fixed 닫기 버튼 유지
- `aria-labelledby`, `aria-describedby` 연결

사용 기준:

- header/body/footer class는 WAFL modal helper를 우선 사용한다.
- footer action button은 `WaflButton` 계층을 사용한다.
- 모바일에서는 footer 버튼이 자연스럽게 stack되어야 한다.

### Empty / Loading / Error / Forbidden

대표 컴포넌트:

- `components/common/ui/WaflState.tsx`
- `components/admin/common/AdminEmptyState.tsx`
- `components/admin/common/AdminTableState.tsx`
- `components/workorder/WorkOrderEmptyState.tsx`
- `components/workorder/WorkOrderLoadingState.tsx`
- `features/material-orders/components/MaterialOrderPanelMessage.tsx`

사용 기준:

- 빈 목록, 선택 없음, 로딩, 오류, 권한 없음 상태는 같은 density와 tone을 사용한다.
- table 내부 상태와 panel 내부 상태는 높이만 조정하고 시각 체계는 동일하게 유지한다.
- 재시도 버튼이 필요한 오류 상태는 `WaflButton` 또는 feature adapter를 사용한다.

## 업무 화면 적용 기준

### 작업지시서

현재 적용 범위:

- 홈 버튼
- 목록 카드 action button
- 우측 첨부/디자인 action button
- 메모 수정/삭제 mini action button
- empty/loading state
- toast/modal adapter 계층

주의 기준:

- 3패널 layout, DB/R2/PDF/workflow state 로직은 UI 공통화와 분리한다.
- 첨부/디자인/메모 저장 흐름은 UI 정리 중 함께 수정하지 않는다.

### 원단·부자재 발주

현재 적용 범위:

- panel message state
- 상세 미선택 empty state
- 공급처 다시 조회 버튼
- 발주 품목 empty row
- 발주 품목 row 삭제 mini action button

주의 기준:

- 3패널 grid, 모바일 sheet, 발주 생성/상태 변경/PDF/API/DB/schema 흐름은 UI 공통화와 분리한다.
- 자재 할당 계산식은 UI 정리 버전에서 수정하지 않는다.

## Responsive 기준

기준 문서:

- `docs/wafl-responsive-qa-0.19.49.md`

공통 확인 항목:

- PC Chrome: 넓은 화면에서 hero, summary, section, table 정렬 확인
- iPhone 세로/가로: stack, full width button, modal close, toast 위치 확인
- iPad mini 세로/가로: table/card 전환 기준 확인
- iPad Pro 세로/가로: section max width와 overflow 확인
- Galaxy Tab 세로/가로: 회전 후 stale width 재발 여부 확인

반응형 원칙:

- 화면별 breakpoint를 임의로 계속 추가하지 않는다.
- 공통 컨테이너 폭과 table/card 전환 기준을 우선 재사용한다.
- Android 태블릿 회전 문제는 개별 화면 임시 보정보다 WAFL 공통 폭 계산 계층에서 해결한다.

## 신규 화면 개발 순서

1. PageHero로 화면 목적을 정리한다.
2. SummaryCard 또는 SectionPanel로 주요 덩어리를 만든다.
3. FilterBar와 DataTable/CompactCard를 공통 기준으로 배치한다.
4. Button/ActionButton은 WAFL variant와 size만 선택한다.
5. Empty/Loading/Error 상태를 먼저 연결한다.
6. Modal/Toast는 공통 adapter 계층을 사용한다.
7. PC, iPhone, iPad, Galaxy Tab 회전 기준으로 QA한다.

## 금지/주의 사항

- 공통 컴포넌트가 있는 영역에 screen-specific gradient, border, radius, padding을 반복 작성하지 않는다.
- status color와 theme color를 혼동하지 않는다. 상태 의미가 있는 badge/status는 semantic status token을 유지한다.
- 기능 변경과 UI 공통화를 한 버전에 과도하게 섞지 않는다.
- DB schema, API, R2, PDF, workflow state 변경은 UI 시스템 문서 정리 버전에서 하지 않는다.
- 기존 정상 동작 중인 작업지시서/R2/첨부/메모/휴지통/purge 흐름은 직접 목표가 아니면 건드리지 않는다.

## 0.19.50 기준 정리 결과

0.19.50은 WAFL UI 시스템 기준을 문서화하는 버전이다. 실제 UI/기능 코드는 변경하지 않고, 이후 `0.19.51 legacy style 정리`와 `0.19.52 고객사 관리자 UI 공통화 마감 QA`의 판단 기준으로 사용한다.
