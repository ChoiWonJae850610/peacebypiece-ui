# 모바일/태블릿 1차 점검 계획 (0.11.38)

## 목적

0.11.x에서 관리자/시스템관리자 공통 UI 정리, Table/List 정리, Card/Section 정리, Modal 공통화가 진행되었으므로 제품화 전 모바일/태블릿에서 깨질 가능성이 높은 화면을 먼저 점검한다.

이번 버전은 점검 계획 문서화만 수행한다. 실제 UI 수정, 저장 정책 변경, DB/API 변경, R2 purge 흐름 변경은 하지 않는다.

## 공통 점검 기준

### 화면 폭 기준

- 모바일 세로: 360px ~ 430px
- 모바일 가로: 640px ~ 932px
- 태블릿 세로: 768px ~ 834px
- 태블릿 가로: 1024px ~ 1194px
- PC 기본: 1280px 이상

### 공통 확인 항목

1. 헤더와 주요 액션 버튼이 화면 밖으로 밀리지 않는지 확인한다.
2. 카드 grid가 1열 또는 2열로 자연스럽게 접히는지 확인한다.
3. table은 overflow-x 또는 card 전환 기준이 명확한지 확인한다.
4. modal은 모바일에서 닫기 버튼, footer action, 본문 스크롤이 정상인지 확인한다.
5. drawer/overlay는 background scroll 차단, Escape 닫기, 포커스 이동 기준이 깨지지 않는지 확인한다.
6. 날짜 선택, 필터, 검색 입력은 손가락 터치 기준으로 눌리기 쉬운지 확인한다.
7. i18n 문구가 줄바꿈되더라도 버튼 의미가 깨지지 않는지 확인한다.

## 1차 점검 대상

### 고객관리자 홈 `/admin`

- 운영 관리 카드 grid
- 카드 제목/설명 줄바꿈
- 홈 카드 간격
- 카드 클릭 영역
- 권한/상태 badge 위치

위험도: 낮음

### 고객관리자 통계 `/admin/dashboard`

- 기간 선택 달력 영역
- summary card 4개 배치
- 차트 높이와 overflow
- Top list 영역 줄바꿈
- 업체 성과 table 가로 스크롤

위험도: 중간

우선순위가 높은 이유: chart, date picker, table, summary card가 한 화면에 함께 있어 모바일 깨짐 가능성이 크다.

### 고객관리자 저장소 `/admin/files`

- 저장소 summary card
- 파일 목록 table overflow
- 휴지통 목록 table overflow
- 복원/선택 삭제/비우기 버튼 줄바꿈
- 휴지통 상세 modal
- 비우기 confirm modal

위험도: 높음

주의: R2 삭제/복원 로직은 건드리지 않고 wrapper, spacing, overflow만 점검한다.

### 고객관리자 멤버관리 `/admin/members`

- 초대 링크 생성 영역
- 초대 대기 목록 table
- 가입 신청 목록
- 권한 checkbox grid
- 저장 버튼 위치

위험도: 중간

주의: join_requests 승인/거절 API와 권한 저장 로직은 변경하지 않는다.

### 고객관리자 협력업체 `/admin/partners`

- 협력업체 목록
- 추가/수정 modal
- 연락처/메모 줄바꿈
- 버튼 row 줄바꿈

위험도: 중간

### 고객관리자 환경설정 `/admin/settings`

- 설정 카드 grid
- 회사 설정 form
- 기준정보 진입 카드
- 안내 modal

위험도: 낮음

## 시스템관리자 점검 대상

### 시스템 홈 `/system`

- 시스템 콘솔 header card
- navigation card grid
- system badge 위치
- 모바일에서 카드 설명 줄바꿈

위험도: 낮음

### 시스템 저장소 `/system/storage-usage`

- storage summary
- 실제 삭제 후보 table overflow
- 선택 삭제/전체삭제 버튼 row
- purge 결과 메시지

위험도: 높음

주의: 시스템관리자 purge 흐름은 절대 변경하지 않는다.

### 시스템 고객사 `/system/companies`

- 고객사 목록
- 가입 요청 목록
- 승인/거절 버튼 배치
- 회사 정보 card/list 표시

위험도: 중간

### 시스템 기준정보 `/system/standards/*`

- 기준정보 table/list
- category values modal
- category rule test modal
- 저장/초기화 footer button

위험도: 중간

### 시스템 감사 로그 `/system/audit-logs`

- 날짜/검색 필터
- 로그 table overflow
- target/action badge
- detail text 줄바꿈

위험도: 중간

## 작업지시서 주요 화면 점검 대상

### 작업지시서 목록 `/workspace`

- 목록/상세 분할 구조
- 모바일에서 목록과 상세 전환 기준
- workflow action button 접근성
- 상태/담당자/납기 정보 표시

위험도: 높음

### 작업지시서 상세

- 제목/담당자 즉시 저장 영역
- 발주정보 저장 버튼
- 생산구성 저장 버튼
- 디자인 첨부 영역
- 메모 영역
- 납기일 입력
- 모바일에서 footer/action button 접근성

위험도: 높음

주의: 제목/담당자 즉시 저장 정책, 발주정보/생산구성 버튼 저장 정책, 디자인/R2 첨부 흐름은 변경하지 않는다.

## 우선순위 제안

### 0.11.39

관리자 홈/설정 화면 모바일 보정

- 위험도가 낮고 공통 Card/Section 패턴 검증에 적합하다.
- PC 레이아웃을 거의 유지하면서 spacing, grid, button wrapping만 보정한다.

### 0.11.40

관리자 저장소 화면 모바일 보정

- table, modal, action button이 함께 있어 회귀 위험이 높다.
- R2/삭제/복원 로직은 변경하지 않고 overflow, footer button, modal spacing만 다룬다.

### 0.11.41

관리자 통계 화면 모바일 보정

- chart, date picker, Top list, table을 분리해서 확인한다.
- Recharts 구조 변경은 피하고 wrapper와 height 중심으로 정리한다.

### 0.11.42

시스템관리자 화면 모바일 보정

- `/system`, `/system/storage-usage`, `/system/companies`, `/system/standards/*`, `/system/audit-logs`를 순차 점검한다.

### 0.11.43 이후

작업지시서 화면 모바일 점검과 보정

- 가장 중요한 업무 화면이므로 기능 변경 없이 별도 라인으로 다룬다.
- 저장/상태변경/첨부/R2 흐름 회귀 확인을 필수로 둔다.

## 이번 버전에서 변경하지 않은 것

- UI 컴포넌트 실제 치환 없음
- CSS class 수정 없음
- DB schema 변경 없음
- API 변경 없음
- R2 upload/delete/purge 변경 없음
- 작업지시서 저장 정책 변경 없음
- package.json / package-lock.json 변경 없음
