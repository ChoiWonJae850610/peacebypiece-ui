# 고객사 관리자 UI 공통화 마감 QA — 0.19.52

## 목적

0.19.20대 후반부터 진행한 WAFL UI 공통화 작업이 고객사 관리자 주요 화면에서 같은 제품처럼 보이는지 최종 확인한다. 이번 문서는 마감 QA 기준을 고정하기 위한 것이며, 기능 로직과 데이터 흐름은 변경하지 않는다.

## 기준 화면

- `/workspace/stats` 통계정보
- `/workspace/members` 멤버관리
- `/workspace/partners` 협력업체관리
- `/workspace/storage` 저장소관리
- `/workspace/settings` 환경설정

## 마감 판단 기준

### 1. 화면 골격

- PageHero, SummaryCard, SectionPanel, SectionHeader가 화면별로 같은 폭 기준을 공유한다.
- 카드와 섹션의 radius, border, shadow, background tone이 화면별로 크게 튀지 않는다.
- 화면 상단 설명, 요약 카드, 본문 섹션의 세로 간격이 과도하게 좁거나 넓지 않다.
- PC에서 불필요한 좌우 흔들림이나 container 폭 불일치가 없어야 한다.

### 2. 버튼과 액션

- 큰 버튼은 `WaflButton` 또는 이를 감싼 adapter 기준을 따른다.
- icon-only 버튼은 `WaflActionButton` 또는 화면 전용 adapter 기준을 따른다.
- danger, disabled, loading 상태가 의미에 맞게 보인다.
- 모바일에서 action button이 텍스트와 겹치거나 카드 밖으로 밀리지 않는다.

### 3. 테이블과 compact card

- PC wide table의 header 높이, row 높이, cell padding이 일관된다.
- 태블릿과 모바일에서 table/card 전환 기준이 화면별로 납득 가능해야 한다.
- compact card에서 title, meta, badge, action 영역이 겹치지 않는다.
- Galaxy Tab 세로↔가로 반복 회전 후 stale width가 재발하지 않아야 한다.

### 4. 상태 화면

- 빈 목록, 로딩, 오류, 권한 없음 상태가 `WaflState` 계열 기준과 유사하게 보인다.
- empty/loading/error 상태가 table 또는 section 폭과 어긋나지 않는다.
- 오류 상태는 복구 액션이 필요한 경우 버튼 위치가 명확해야 한다.

### 5. Toast와 Modal

- toast 위치와 폭이 모바일/태블릿에서 화면 밖으로 나가지 않는다.
- modal header/body/footer, close button, action button 위치가 화면별로 일관된다.
- Escape 닫기, focus trap, 배경 스크롤 차단, 모바일 상단 닫기 버튼이 유지되어야 한다.

## 화면별 QA

### 통계정보

- Hero와 summary metric card 폭이 일치하는지 확인한다.
- 통계 데이터가 없을 때 empty state가 자연스럽게 표시되는지 확인한다.
- 기간/필터 영역이 좁은 화면에서 줄바꿈되어도 버튼이 겹치지 않는지 확인한다.
- PC와 태블릿에서 카드 간격이 과하게 벌어지지 않는지 확인한다.

### 멤버관리

- 승인/멤버/초대 목록의 table 또는 compact card 전환이 자연스러운지 확인한다.
- 초대 action button, 권한 modal button, 승인/거절 action button의 높이와 tone을 확인한다.
- 권한 modal footer button stacking이 모바일에서 정상인지 확인한다.
- Galaxy Tab 회전 후 목록 우측 선, 카드 폭, action button 정렬이 어긋나지 않아야 한다.

### 협력업체관리

- 업체 추가 버튼의 크기와 위치가 다른 관리자 화면과 유사한지 확인한다.
- 업체 table header/row 밀도가 멤버관리, 저장소관리와 크게 다르지 않아야 한다.
- 등록/수정 modal의 header/body/footer 구성이 WAFL modal 기준에 맞는지 확인한다.
- 필터/검색 영역이 모바일에서 넘치지 않는지 확인한다.

### 저장소관리

- 저장공간 summary, 문서/디자인 목록, 휴지통 section의 폭 기준이 일치하는지 확인한다.
- 휴지통 action button과 bulk action button의 크기, danger tone, disabled 상태를 확인한다.
- 삭제/복원/비우기 modal과 toast가 WAFL 기준에 맞는지 확인한다.
- 문서/디자인 empty/loading/error 상태가 section 폭과 맞는지 확인한다.

### 환경설정

- 설정 카드와 상세 섹션이 같은 spacing/radius 기준으로 보이는지 확인한다.
- 회사 정보, 기준정보, 요금제·저장공간, 약관·정책, 개발 건의 탭의 카드 높이와 문구 밀도를 확인한다.
- 요청 작성 버튼과 textarea가 모바일에서 넘치지 않아야 한다.
- 읽기 전용/준비중/운영 기준 안내가 과하게 강한 색으로 튀지 않아야 한다.

## 디바이스별 필수 확인

| 디바이스 | 필수 확인 |
| --- | --- |
| PC Chrome | hero/section/table 폭 일치, 버튼 정렬, modal 중앙 정렬 |
| iPhone 세로 | 카드 stack, 버튼 full width, modal 상단 닫기 버튼 |
| iPhone 가로 | toast/modal/버튼 겹침 여부 |
| iPad mini 세로 | compact card 전환 기준 |
| iPad mini 가로 | table 유지 또는 card 전환 기준 |
| iPad Pro 세로 | section max width와 table overflow |
| iPad Pro 가로 | PC형 layout 전환 |
| Galaxy Tab 세로 | stale width, 카드 우측 선, action button 정렬 |
| Galaxy Tab 가로 | 세로↔가로 반복 회전 후 width 재계산 |

## 마감 판정

### 통과

- 위 주요 화면이 같은 WAFL 제품군처럼 보인다.
- 버튼, table, card, modal, toast, state의 차이가 화면별 용도 차이 수준으로만 보인다.
- 기능 흐름의 회귀가 없다.

### 보정 필요

- 특정 화면만 card/table 밀도가 확연히 다르다.
- Galaxy Tab 회전 후 stale width가 재발한다.
- modal 또는 toast가 모바일에서 화면 밖으로 나간다.
- danger/disabled/loading tone이 의미와 다르게 보인다.

### 다음 단계

마감 QA를 통과하면 기능 개발 또는 운영 화면 정리로 이동한다. 미통과 항목이 있으면 0.19.53부터 화면별 QA 보정 패치로 분리한다.
