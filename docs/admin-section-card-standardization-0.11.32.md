# 0.11.32 AdminSection / AdminCard 1차 추가

## 목적

관리자/시스템관리자 화면에서 반복되는 카드, 섹션, 섹션 헤더 패턴을 점진적으로 공통화하기 위한 1차 기반을 추가했다.

## 추가 컴포넌트

`components/admin/common/AdminSection.tsx`

- `AdminCard`
  - 기본 border, radius, white background, shadow 패턴을 제공한다.
  - `as` 옵션으로 `section`, `article`, `div`를 선택할 수 있다.
- `AdminSectionHeader`
  - title, description, eyebrow, actions 영역을 공통 배치한다.
- `AdminSection`
  - `AdminCard`와 `AdminSectionHeader`를 결합한 섹션 wrapper다.
  - `density`로 기본/compact padding을 선택할 수 있다.

## 1차 적용 화면

`components/admin/dashboard/AdminConsoleSections.tsx`

- 운영 관리 섹션 wrapper를 `AdminSection`으로 전환했다.
- 개별 운영 카드 wrapper를 `AdminCard as="article"`로 전환했다.
- 카드 데이터, 링크, 권한 미리보기, 상태 badge 로직은 변경하지 않았다.

## 변경하지 않은 영역

- 관리자 홈 데이터 조회
- navigation item 구성
- 권한/워크스페이스 카드 필터링
- 시스템관리자 저장소 purge 흐름
- 작업지시서 관련 흐름
- DB/API

## 다음 작업 후보

0.11.33에서 관리자 홈/설정 화면 일부에 `AdminSection` 또는 `AdminCard`를 추가 적용한다.

우선순위는 다음과 같다.

1. `/admin/settings` 상단 설정 메뉴 섹션
2. `/admin` 운영 현황 카드 중 단순 wrapper
3. 반복 help/info card 패턴

모든 화면을 한 번에 치환하지 않고, 화면별로 작은 범위에서 적용한다.
