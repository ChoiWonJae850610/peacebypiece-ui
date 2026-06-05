# UI member/system select application 0.18.03

## 목표

0.18.03은 멤버관리와 시스템 감사 로그 화면에 남아 있던 일부 native `select`를 `AppSelect` 기반으로 전환하는 범위다.

## 적용 범위

- 멤버 초대 만료 선택
- 멤버 권한 상세 역할 선택
- 가입 승인 액션의 승인 역할 선택
- 시스템 감사 로그 대상 유형 선택
- 시스템 감사 로그 심각도 선택

## AppSelect 보강

시스템 감사 로그 조회 폼은 GET form submit 구조를 유지해야 하므로 `AppSelect`에 `name`과 `defaultValue`를 지원하도록 보강했다.

- controlled 사용: `value` + `onValueChange`
- uncontrolled form 사용: `name` + `defaultValue`
- 빈 문자열 옵션은 기존 sentinel 처리 유지

## 비변경 범위

- 멤버 승인/거절 로직 변경 없음
- 멤버 권한 저장 로직 변경 없음
- 초대 링크 생성 로직 변경 없음
- 시스템 감사 로그 API/쿼리 로직 변경 없음
- DB/API/R2/첨부/메모/상태 전환 흐름 변경 없음
