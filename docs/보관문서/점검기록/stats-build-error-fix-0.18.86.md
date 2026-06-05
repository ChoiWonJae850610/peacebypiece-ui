# 0.18.86 통계정보 빌드 에러 수정

## 목적

0.18.85 빌드 로그에서 확인된 `AdminStatsPeriodSection`의 `locale` prop 타입 오류를 수정한다.

## 수정 내용

- `AdminStatsPeriodSectionProps.locale` 타입을 `string`에서 `Locale`로 좁혔다.
- `AdminStatsPeriodControls`가 요구하는 `"ko" | "en"` 타입과 전달 타입을 일치시켰다.
- UI 렌더링, DB/API/R2, 첨부/메모/휴지통/purge 흐름은 변경하지 않았다.

## 테스트 메모

현재 사용자가 화면 테스트를 진행할 수 없는 상태이므로 반응형 눈검수 작업은 보류한다.
이번 패치는 빌드 로그에서 확인된 타입 오류 수정에 범위를 제한한다.

## 로컬 확인 필요

- `npm run build`
- 통계정보 화면 진입
- 기간 분석 탭에서 날짜 선택/7일/30일 프리셋/적용 버튼 동작 확인
