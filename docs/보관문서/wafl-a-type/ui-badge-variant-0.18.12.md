# UI Badge Variant 정리 — 0.18.12

## 목적

AppBadge를 상태/카운트/정보/경고/위험성 표시의 공통 기준으로 사용하기 위한 1차 정리입니다.

## 적용 내용

- `AppBadgeVariant` 추가
  - `status`
  - `count`
  - `info`
  - `success`
  - `warning`
  - `danger`
  - `brand`
  - `neutral`
- `AppBadgeTone` export 추가
- `AppBadgeSize`에 `xs` 추가
- 기존 `tone` prop은 유지해 기존 사용처 호환을 유지했습니다.
- `variant`는 의미 기반 기본값이며, `tone`이 전달되면 `tone`이 우선합니다.
- `AdminStatusBadge`는 자체 class 조합을 줄이고 `AppBadge`로 위임합니다.
- `SectionCountBadge`는 `AppBadge variant="count"`를 사용하도록 연결했습니다.

## 후속 기준

- 작업지시서 상태, 발주 상태, 자재 상태, 멤버 상태 badge는 즉시 대량 전환하지 않습니다.
- 다음 단계에서 상태 매핑 함수 또는 상태별 label/tone 유틸을 분리해 문자열 literal 기반 비교를 줄입니다.
- 화면별 직접 badge class 반복은 AppBadge 또는 AdminStatusBadge로 점진 전환합니다.

## 변경하지 않은 범위

- DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았습니다.
- 상태값 자체와 저장 로직은 변경하지 않았습니다.
