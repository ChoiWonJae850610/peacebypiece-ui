# UI Admin Shim 0.18.01

## 목적

0.18.01은 관리자 전용 UI 컴포넌트가 각 화면에서 별도 스타일 체계를 계속 확장하지 않도록, 기존 AdminButton/AdminCard API를 WAFL 공통 App UI 래퍼 위에 얹는 1차 정리 버전이다.

## 반영 범위

- `components/admin/common/AdminButton.tsx`
  - 기존 `AdminButton`, `AdminLinkButton`, `getAdminButtonClassName` API 유지
  - 내부 구현은 `AppButton`, `AppLinkButton`, `getAppButtonClassName`으로 위임
  - 기존 관리자 화면 import를 대량 수정하지 않고도 공통 버튼 톤을 공유하도록 변경

- `components/admin/layout/AdminCard.tsx`
  - 기존 `AdminCard` API 유지
  - 내부 surface는 `AppCard`를 사용하도록 변경
  - 기존 `variant`와 추가 className 조합은 유지

- `components/admin/common/AdminSection.tsx`
  - 기존 `AdminCard`, `AdminSection` API 유지
  - 내부 surface는 `AppCard`를 사용하도록 변경

- `components/common/ui/AppButton.tsx`
  - 링크형 버튼을 위한 `AppLinkButton` 추가
  - `getAppButtonClassName` export 추가

- `components/common/ui/AppCard.tsx`
  - `as` prop 추가
  - section/article/header/div surface를 공통 AppCard로 표현 가능하게 변경

## 제외 범위

- 관리자 화면별 레이아웃 재배치 없음
- 통계/저장소/멤버/환경설정 기능 수정 없음
- DB/API/R2/첨부/메모/휴지통 흐름 수정 없음
- tablet/mobile 구조 변경 없음

## 후속 작업

0.18.02에서는 build 결과를 먼저 확인한다. 실패 로그가 있으면 해당 에러를 다음 작업과 함께 수정한다. 성공하면 관리자/시스템 화면에서 AppSelect 적용 후보를 좁히고, 상태/정렬/역할/권한 선택 UI부터 순차 전환한다.
