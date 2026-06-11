# WAFL settings/billing/company direct style cleanup 0.21.34

## 목적

0.21.34는 설정/결제/회사 영역의 Direct Style 제거 2차 작업이다. 0.21.32에서 1차 정리한 회사 설정, 조직 설정, 구독 콘솔, 권한 preview 기준을 이어서 settings hub, 정책 overview, 회사 파일 패널, feedback form까지 WAFL Foundation 기준으로 맞춘다.

## 정리 범위

- `AdminSettingsHub`
  - 구독 summary card와 회사 정보 metrics table을 `WaflSurface` 계열로 연결
  - billing action row를 `WaflSurfaceButton`으로 전환
  - feedback form의 select/input/textarea를 `AppSelect`, `WaflInput`, `WaflTextarea`로 전환
  - policy document list, agreement, feedback history의 직접 radius 조합을 WAFL shape class로 낮춤
- `AdminPolicyOverview`
  - 정책 카드/운영 정책/서비스 운영 항목을 `WaflSurface` 기준으로 전환
  - 상태 pill을 `AppBadge`로 전환
- `AdminCompanyFilesPanel`
  - 파일 preview modal wrapper, image/pdf preview, empty preview를 `WaflSurface`/`WaflInfoBox` 기준으로 정리
  - 회사 파일 slot card, preview frame, dense meta badge를 Foundation 기준으로 연결
- `AdminCompanySettingsForm`
  - theme swatch의 직접 radius를 WAFL shape class로 보정

## 예외 후보

- storage usage progress bar의 `rounded-full`은 진행률 bar 의미가 있어 예외 후보로 유지한다.
- color swatch는 실제 색상 견본 표시 목적이므로 완전한 control box와 다르게 유지할 수 있다.

## 금지 범위

- 저장/조회/API 호출/상태 변경 로직 변경 없음
- DB schema 변경 없음
- 기능 동작 변경 없음
