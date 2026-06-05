# 0.18.98 공통 UI 규칙 기준

## 목적

전체 화면 리팩토링과 신규 기능 개발 전에 WAFL UI의 공통 규칙을 먼저 고정한다. 이번 버전은 규칙 문서화가 목표이며, 화면 동작·DB·API·R2·권한·상태 흐름은 변경하지 않는다.

0.18.97의 전체 소스 리팩토링 감사에서 확인된 후보를 기준으로, 이후 패치에서 어떤 컴포넌트를 우선 사용하고 어떤 리팩토링을 보류할지 판단할 수 있도록 한다.

## 기본 원칙

1. 화면별 임의 class 조합보다 공통 component와 variant를 우선 사용한다.
2. 내부 table/card/list 전환은 viewport breakpoint보다 실제 container width 기준을 우선한다.
3. 앱 shell, safe area, orientation, modal height, keyboard 대응은 viewport/device 조건을 병행한다.
4. 기능 흐름이 안정된 작업지시서·첨부·메모·R2·휴지통·purg​​e 영역은 직접 목표가 아니면 동작 리팩토링을 하지 않는다.
5. 공통화는 한 번에 전체 교체하지 않고 화면군별로 좁게 적용한다.

## 1. Page Header / Action Bar

### 기준

- 페이지 최상단은 title, description, primary action, secondary action, status summary를 일관된 순서로 배치한다.
- 이동 버튼과 주요 action 버튼은 같은 위치에서 반복되도록 한다.
- action이 3개 이상이면 우선순위를 정해 primary / secondary / overflow 후보로 나눈다.
- 모바일에서는 action bar가 과도하게 줄바꿈되지 않도록 full width 또는 stacked 배치를 허용한다.

### 우선 사용 후보

- `components/admin/common/AdminActionBar.tsx`
- `components/admin/common/AdminSection.tsx`
- `components/admin/common/AdminPanelSection.tsx`
- `components/common/ui/AppSection.tsx`

### 보류

- 작업지시서 상세의 업무 action은 상태·권한과 강하게 연결되어 있으므로 실제 기능 테스트 전까지 공통 action bar로 강제 이전하지 않는다.

## 2. Table / List / Card

### 기준

- PC wide container: table 우선
- medium container: compressed row 또는 주요 컬럼 중심 table
- narrow container/mobile: card/list 전환
- horizontal scroll은 임시 회피책으로 남발하지 않고, 데이터 성격상 table 유지가 필요한 경우에만 허용한다.
- print/PDF 문서용 table은 AdminTable과 분리한다.

### 우선 사용 후보

- `components/admin/common/AdminTable.tsx`
- `components/admin/partnerMaster/*ResponsiveRows.tsx`
- `components/admin/files/FileTrashResponsiveRows.tsx`
- `components/admin/members/AdminMemberDirectoryResponsiveRows.tsx`

### 적용 순서

1. 저장소관리
2. 협력업체관리
3. 통계정보
4. 멤버관리
5. 시스템 관리자 목록 화면
6. 작업지시서/원단부자재 발주 화면

작업지시서와 원단부자재 발주는 입력·상태·PDF 흐름과 연결되므로 마지막에 좁게 적용한다.

## 3. Modal

### 기준

- 관리자/시스템/설정 계열은 `AdminModal`을 우선 사용한다.
- 작업지시서 업무 모달은 기존 `components/common/modal/*` 안정 흐름을 유지한다.
- 공통 필수 UX는 배경 스크롤 차단, focus trap, Escape close, 모바일 상단 고정 닫기 버튼, footer action 정렬이다.
- modal body는 독립 스크롤을 허용하되 footer 버튼이 화면 밖으로 밀리지 않도록 한다.

### 우선 사용 후보

- `components/admin/layout/AdminModal.tsx`
- `components/common/modal/ModalShell.tsx`
- `components/common/modal/ModalHeader.tsx`
- `components/common/modal/ModalBody.tsx`
- `components/common/modal/ModalFooter.tsx`

### 보류

`BaseModal`과 업무 모달 전체를 한 번에 `AdminModal`로 통합하지 않는다. 모달은 회귀 위험이 크므로 화면별로 UX 체크가 가능할 때만 이동한다.

## 4. Button / Action / Pending Feedback

### 기준

- 일반 버튼은 `AppButton` 또는 이를 감싼 `AdminButton`을 우선 사용한다.
- 관리자 영역에서는 직접 className으로 버튼을 새로 만들지 않는다.
- destructive action은 danger variant와 confirm modal 또는 명확한 확인 문구를 사용한다.
- 이동형 카드/홈 버튼/메뉴 버튼은 pending feedback 공통 기준이 필요하다.
- disabled/WIP 상태는 화면별 임의 문구보다 공통 presentation 기준을 둔다.

### 우선 사용 후보

- `components/common/ui/AppButton.tsx`
- `components/admin/common/AdminButton.tsx`
- `components/admin/common/AdminIconActionButton.tsx`

### 후속 후보

- `PendingNavigationButton`
- `PendingNavigationCard`
- `NavigationActionLink`

이동 pending feedback은 라우팅 체감과 직접 연결되므로 실제 화면 테스트가 가능한 시점에 우선 적용한다.

## 5. Badge / Status / Role / Permission

### 기준

- 상태 표시 badge는 label, tone, description을 mapper로 분리한다.
- 색상은 semantic status color를 사용하고, 단순 theme token 제거 대상으로 보지 않는다.
- role/status/permission 문자열 직접 비교는 표시용 mapper부터 줄인다.
- 권한 판단과 상태 전환 로직은 테스트 가능 전까지 변경하지 않는다.

### 우선 사용 후보

- `components/admin/common/AdminStatusBadge.tsx`
- `components/common/ui/AppBadge.tsx`
- `components/common/ui/SectionCountBadge.tsx`

### 적용 순서

1. 표시용 badge label/tone mapper
2. 멤버 상태 표시
3. 작업지시서 상태 표시
4. 발주/검토/권한 상태 표시
5. 실제 권한 guard/helper 리팩토링

## 6. Empty / Loading / Error

### 기준

- 빈 목록, 로딩, 오류, 권한 없음, WIP 화면은 화면별로 다르게 만들지 않는다.
- empty state에는 원인과 다음 행동을 짧게 표시한다.
- loading state는 전체 overlay보다 해당 카드/목록 단위 skeleton 또는 pending label을 우선한다.
- error state는 사용자 조치 가능 여부를 분리한다.

### 우선 사용 후보

- `components/admin/common/AdminEmptyState.tsx`
- `components/workorder/WorkOrderEmptyState.tsx`
- `components/workorder/WorkOrderLoadingState.tsx`

## 7. Scroll / Container Width / Responsive

### 기준

- 전체 앱 shell, orientation, safe area, modal height는 viewport 기준을 병행한다.
- 개별 table/list/card 전환은 실제 container width 기준을 우선한다.
- 내부 패널 스크롤과 전체 페이지 스크롤을 중첩시키지 않는다.
- modal, table, side panel은 body scroll lock과 내부 scroll 위치를 분리한다.
- `overflow-hidden`, `overflow-auto`, `touch-pan-y`, `overscroll-contain`은 화면별로 임의 적용하지 않고 용도를 명확히 한다.

### 테스트 기준

가상 테스트와 실기기 테스트는 분리한다.

- 가상 폭: 360, 390, 430, 600, 744, 820, 1024, 1180, 1280, 1440
- 실기기: 아이폰, 아이패드 미니, 아이패드 프로, 갤럭시탭
- 확인 항목: 모달, table/list 전환, 카드 간격, action bar 줄바꿈, 달력/드롭다운, 파일 업로드, PDF preview, 회전 후 상태 유지

## 8. 화면군별 적용 순서

### 1차: 이미 최근에 많이 정리한 화면

- 저장소관리
- 협력업체관리
- 통계정보

### 2차: 신규 기능 전 정리해야 하는 화면

- 개인 프로필
- 멤버관리
- 환경설정

### 3차: 시스템 관리자 화면

- 시스템 홈
- 고객사 관리
- 승인 관리
- 저장소 사용량
- 감사로그/정책/요금제 후보 화면

### 4차: 회귀 위험이 큰 업무 화면

- 작업지시서
- 원단부자재 발주
- PDF/미리보기/첨부/메모

## 후속 패치 제안

- 0.18.99: formatter/label helper 위치 점검 및 저위험 정리
- 0.19.00: AdminTable/List/Card shell 적용 후보를 실제 화면 기준으로 좁게 적용
- 0.19.01: Modal/action footer 규칙 점검
- 0.19.02: 이동 pending feedback 공통 컴포넌트 설계 또는 1차 적용
