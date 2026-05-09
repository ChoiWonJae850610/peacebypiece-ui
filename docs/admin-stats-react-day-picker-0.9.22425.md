# 0.9.22425 — 관리자 통계 기간 선택 React DayPicker 적용

## 목표
관리자 통계 화면의 직접 기간 선택을 select 기반 임시 입력에서 달력 기반 기간 선택 UI로 전환한다.

## 적용 내용
- `react-day-picker` 9.14.0 의존성을 추가했다.
- `date-fns` locale을 사용해 한국어/영어 locale에 맞는 달력 월/요일 표시를 적용했다.
- `/admin/dashboard`의 직접 기간 선택 영역을 `DayPicker mode="range"` 기반 UI로 변경했다.
- 미래 날짜 선택은 차단한다.
- 시작일/종료일 선택 상태와 안내 문구는 `dashboardPage` i18n key를 사용한다.

## 설계 기준
- 문장 전체를 단어 조립식으로 만들지 않는다.
- 달력 UI의 locale은 현재 i18n locale을 기준으로 선택한다.
- 기존 native `input[type=date]`는 사용하지 않는다.
- `package.json` / `package-lock.json` 수정은 이번 버전에서 사용자 승인 하에 허용한다.

## 테스트 항목
1. `/admin/dashboard` 진입
2. 영어 locale에서 달력 월/요일이 영어로 표시되는지 확인
3. 한국어 locale에서 달력 월/요일이 한국어로 표시되는지 확인
4. 시작일/종료일을 range로 선택할 수 있는지 확인
5. 미래 날짜가 선택되지 않는지 확인
6. 직접 선택 적용 버튼이 유효 기간 선택 후 활성화되는지 확인
7. `npm install` 후 `npm run build` 실행
