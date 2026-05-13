# 시스템 홈 Card/Section 공통화 1차 (0.11.34)

## 목적

시스템관리자 홈(`/system`)의 최상단 헤더와 navigation section wrapper를 관리자 공통 Card/Section 패턴으로 맞춘다.

## 변경 범위

- `components/admin/common/AdminSection.tsx`
  - `AdminCard`의 semantic wrapper에 `header`를 허용했다.
  - `AdminSection`에 `headerClassName`을 추가해 section header의 구분선/간격을 화면별로 조정할 수 있게 했다.
- `components/system/SystemConsoleShell.tsx`
  - 시스템 홈 상단 header wrapper를 `AdminCard`로 교체했다.
  - navigation section wrapper를 `AdminSection`으로 교체했다.

## 유지한 것

- 시스템 홈 navigation card의 tone별 색상 정책은 유지했다.
- `/system` 카드 링크, status badge, description, href 표시는 유지했다.
- 좌측 패널 없는 카드형 IA는 유지했다.
- 작업지시서 바로가기 버튼은 추가하지 않았다.

## 제외한 것

- 시스템관리자 하위 화면 전체 일괄 치환은 제외했다.
- storage purge, billing, audit log, standards 기능 로직은 변경하지 않았다.
- i18n key 구조는 변경하지 않았다.

## 후속 작업 후보

0.11.35에서는 AdminModal을 쓰지 않는 직접 modal/overlay/drawer 패턴을 조사하는 것이 적절하다.
