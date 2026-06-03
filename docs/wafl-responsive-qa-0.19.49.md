# WAFL Responsive QA 1차 — 0.19.49

## 목적

고객사 관리자 주요 화면이 WAFL 공통 UI 규격을 기준으로 PC, 태블릿, 모바일에서 같은 제품처럼 보이는지 확인한다. 이번 버전은 QA 기준 정리와 회귀 테스트 범위 확정이 목적이며, 화면 구조나 기능 로직은 변경하지 않는다.

## 기준 화면

- `/workspace/stats` 통계정보
- `/workspace/members` 멤버관리
- `/workspace/partners` 협력업체관리
- `/workspace/storage` 저장소관리
- `/workspace/settings` 환경설정

## 디바이스 기준

| 구분 | 확인 기준 |
| --- | --- |
| PC Chrome | 넓은 화면에서 hero, summary, section, table 정렬 확인 |
| iPhone 세로 | 카드 stack, 버튼 full width, 모달 닫기 버튼 확인 |
| iPhone 가로 | 과도한 세로 압축, 버튼/토스트 겹침 확인 |
| iPad mini 세로 | compact card 전환 기준 확인 |
| iPad mini 가로 | table/card 전환 기준 확인 |
| iPad Pro 세로 | section max width와 table overflow 확인 |
| iPad Pro 가로 | PC형 레이아웃 전환 기준 확인 |
| Galaxy Tab 세로 | stale width 발생 여부 확인 |
| Galaxy Tab 가로 | 세로↔가로 반복 회전 후 stale width 발생 여부 확인 |

## 공통 QA 체크리스트

### PageHero

- hero 폭이 다른 section 폭과 어긋나지 않는다.
- title, description, action 영역이 모바일에서 겹치지 않는다.
- Galaxy Tab 회전 후 hero 폭이 이전 방향 기준으로 남지 않는다.

### SummaryCard

- 카드 우측 border가 중간에서 끊겨 보이지 않는다.
- 카드 내부 숫자, badge, 설명 문구가 줄바꿈되어도 카드 높이가 자연스럽다.
- 카드 grid가 모바일에서 1열, 태블릿에서 2열 또는 적절한 compact 형태로 보인다.

### SectionPanel / SectionHeader

- panel radius, border, shadow, background tone이 화면별로 일관된다.
- section header의 title, description, action button이 모바일에서 수직 정렬된다.
- section 간 간격이 과하게 좁거나 넓지 않다.

### FilterBar

- 검색 input과 filter button이 좁은 화면에서 넘치지 않는다.
- filter가 wrap될 때 상하 간격이 유지된다.
- 검색 결과 없음 상태가 table 영역과 같은 폭으로 표시된다.

### DataTable / CompactCard

- PC wide table의 header 높이, row 높이, cell padding이 일관된다.
- 태블릿에서 table이 유지되어야 할 화면과 card로 전환되어야 할 화면이 의도대로 동작한다.
- 모바일 compact card에서 row action button이 텍스트와 겹치지 않는다.
- Galaxy Tab 회전 후 table/card 전환이 즉시 재계산된다.

### Button / ActionButton

- 큰 버튼의 높이, padding, icon gap이 화면별로 일관된다.
- icon-only action button이 row 높이를 과하게 늘리지 않는다.
- danger/disabled/loading 상태가 의미에 맞게 표시된다.

### Toast

- toast가 모바일 하단에서 bottom navigation 또는 sheet와 겹치지 않는다.
- success/loading/warning/danger tone이 theme token 기준으로 보인다.
- Galaxy Tab 회전 후 toast width가 stale 되지 않는다.

### Modal

- 배경 스크롤 차단이 유지된다.
- focus trap과 Escape 닫기가 유지된다.
- 모바일 상단 fixed 닫기 버튼이 safe area를 침범하지 않는다.
- footer action button이 모바일에서 자연스럽게 stack된다.

### Empty / Loading / Error

- empty/loading/error state가 section 폭을 벗어나지 않는다.
- skeleton이나 loading state가 과하게 높거나 낮지 않다.
- error state의 재시도 버튼 위치가 일관된다.

## 화면별 QA 포인트

### 통계정보

- summary card grid와 chart/section 폭이 맞는지 확인한다.
- 기간 선택 버튼이 모바일에서 넘치지 않는지 확인한다.
- 통계 데이터 없음 상태가 WAFL state 기준으로 보이는지 확인한다.

### 멤버관리

- 상단 카드와 하단 카드의 우측 border 길이가 동일하게 보이는지 확인한다.
- 멤버 목록 table/card 전환이 Galaxy Tab 회전 후 즉시 갱신되는지 확인한다.
- 초대 목록 action button의 크기와 row height가 일관되는지 확인한다.
- 권한 모달 footer 버튼이 모바일에서 깨지지 않는지 확인한다.

### 협력업체관리

- 업체 추가 버튼 위치가 PC/모바일에서 자연스럽게 전환되는지 확인한다.
- 업체 table header와 row 높이가 멤버관리/저장소관리와 유사한지 확인한다.
- 등록/수정 모달의 body scroll과 footer 고정이 자연스러운지 확인한다.

### 저장소관리

- 저장공간 summary card와 문서/디자인/휴지통 section 폭이 어긋나지 않는지 확인한다.
- 휴지통 wide table과 compact card 전환을 확인한다.
- 삭제/복원/비우기 확인 모달의 danger tone과 button width를 확인한다.

### 환경설정

- 설정 카드 grid가 모바일에서 1열로 자연스럽게 전환되는지 확인한다.
- 계정 정보, 요금제·저장공간, 약관·정책, 개발 건의 섹션 간격을 확인한다.
- 회사 정보 변경 요청 textarea와 action button이 좁은 화면에서 넘치지 않는지 확인한다.

## 0.19.49 결과 기준

이번 버전에서 실제 UI 코드는 변경하지 않는다. 다음 버전부터 발견된 항목을 아래 기준으로 나눈다.

- 즉시 보정: 폭 넘침, 회전 stale, 버튼 겹침, 모달 닫기 불가
- 다음 공통화 대상: 반복되는 screen-specific class, 중복 layout wrapper, 중복 empty/loading/error state
- 기능 개발 이후 처리: 정책/결제/시스템관리자 운영 화면처럼 아직 기능 구조가 확정되지 않은 영역

## 다음 버전 연결

0.19.50에서는 WAFL UI 시스템 문서를 정리한다. 0.19.49 QA 결과에서 확정된 공통 기준은 `docs/wafl-ui-system.md` 계열 문서에 반영한다.
