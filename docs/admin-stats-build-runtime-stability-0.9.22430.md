# 관리자 통계 화면 build/런타임 안정화 0.9.22430

## 목적

0.9.22429에서 통계 화면 정보 구조를 재배치한 뒤 발생할 수 있는 타입, 날짜 범위, SQL 런타임 위험을 먼저 보정한다.

## 반영 내용

- DayPicker range selected 값에 `undefined` 시작일이 들어가지 않도록 선택 날짜를 명시적으로 정규화했다.
- 통계 기간의 오늘 날짜 계산을 UTC 기반 `toISOString()`이 아니라 로컬 날짜 기준으로 통일했다.
- 종료일만 먼저 선택한 상태가 불필요하게 invalid 처리되지 않도록 직접 기간 검증 조건을 보정했다.
- 납기 지연 통계 SQL에서 `due_date::date` 직접 캐스팅 전에 날짜 문자열 형식을 확인하는 안전 캐스팅 표현식을 사용했다.
- `package-lock.json`의 resolved URL은 npm registry 기준을 유지한다.

## 확인 필요

- `npm run build`는 ChatGPT 환경에서 실행하지 않았다. 사용자가 로컬에서 확인한다.
- `/admin/dashboard` 첫 진입, 7일/30일/직접 기간, 기간 요약 클릭에 따른 TOP5 전환을 확인한다.

## DB 변경

없음.
