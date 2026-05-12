# 0.11.10 시스템 기준정보 원장 화면 공통 UI 적용

## 목적

시스템관리자 기준정보 상세 편집 화면 중 단위 표준 관리와 외주공정 유형 관리 화면의 버튼, 링크, 상태 라벨을 관리자 공통 UI 컴포넌트 기준으로 전환한다.

## 반영 범위

- `SystemUnitStandardsPage`
  - 헤더 버전 라벨 → `AdminStatusBadge`
  - 기준정보 설계 / 시스템 콘솔 링크 → `AdminLinkButton`
  - 새로고침 / 단위 추가 / 저장 / 취소 / 수정 버튼 → `AdminButton`
  - 활성/비활성/검토 상태 라벨 → `AdminStatusBadge`

- `SystemProcessStandardsPage`
  - 헤더 버전 라벨 → `AdminStatusBadge`
  - 기준정보 설계 / 시스템 콘솔 링크 → `AdminLinkButton`
  - 새로고침 / 공정 추가 / 저장 / 취소 / 수정 버튼 → `AdminButton`
  - 활성/비활성/검토 상태 라벨 → `AdminStatusBadge`

## 제외 범위

- 기준정보 API 변경 없음
- DB schema 변경 없음
- 단위/공정 CRUD 로직 변경 없음
- 제품 템플릿/카테고리 트리 편집 화면은 후속 단계로 분리

## 확인 항목

1. `/system/standards/units`
2. `/system/standards/processes`
3. 새로고침 버튼 표시와 동작
4. 추가/수정/저장/취소 버튼 표시와 동작
5. 상태 라벨 표시와 사용/미사용 토글 동작
