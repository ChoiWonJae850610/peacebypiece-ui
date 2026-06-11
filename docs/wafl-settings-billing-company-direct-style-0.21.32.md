# WAFL settings/billing/company direct style 1차 정리 · 0.21.32

## 목표

0.21.32는 설정/결제/회사 계열 화면의 직접 radius/status box 사용을 WAFL Foundation 기준으로 낮추는 1차 작업이다.

## 적용 범위

- 회사 설정 summary 카드
- 조직 설정 scope/personal settings 카드
- 권한 preview card/checklist/modal row
- 구독 콘솔 hero/metric/status/plan/notice card
- `/ui` Direct Style 잔여 점검판

## 유지 원칙

- 기능 로직 변경 없음
- 저장/조회/상태 변경 없음
- theme swatch와 color dot은 원형 의미가 있어 예외 후보로 유지
- 설정/결제/회사 화면은 아직 2차 정리가 남아 있음

## 다음 정리 후보

- `AdminSettingsHub`의 문서/피드백/정책 상세 panel
- `AdminCompanyFilesPanel`의 파일 preview/upload slot
- public/dev 화면의 낮은 우선순위 direct style
