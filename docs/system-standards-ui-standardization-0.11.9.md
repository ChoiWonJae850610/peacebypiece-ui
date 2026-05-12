# 0.11.9 시스템 기준정보 화면 공통 UI 적용

## 목적

시스템관리자 기준정보 관련 화면에서 개별 className으로 구현하던 헤더 링크, 버전 라벨, 상태 라벨을 관리자 공통 UI 컴포넌트 기준으로 정리한다.

## 적용 범위

- `components/system/standards/SystemStandardsDesignPage.tsx`
- `components/system/standards/SystemStandardsSeedStatusPage.tsx`
- `components/system/standards/SystemStandardsRegressionPage.tsx`

## 변경 내용

- 헤더 버전 라벨을 `AdminStatusBadge`로 전환
- 헤더 이동 링크를 `AdminLinkButton`으로 전환
- 기준정보 설계 카드의 상태 라벨을 `AdminStatusBadge`로 전환
- seed 상태와 회귀 점검 결과 라벨을 `AdminStatusBadge`로 전환
- 기준정보 설계 화면의 주요 이동 링크를 `AdminLinkButton`으로 전환

## 제외 범위

- 기준정보 CRUD 로직 변경 없음
- DB schema 변경 없음
- seed/regression API 변경 없음
- product template 상세 편집 화면 표준화는 다음 작업으로 분리
