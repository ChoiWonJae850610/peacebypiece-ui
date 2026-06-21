# Simulator onboarding scenario fix — 0.23.95

## 문제
Simulator DB Seed는 회사명과 상태만 만들고 사업자명, 사업자등록번호, 주소, 관리자 연락처를 채우지 않았다.
따라서 `active` 회사 A/B/G/H/I/J도 고객사 관리자 전환 시 회사정보 입력 게이트가 표시됐다.

## 정책
- 업무 테스트 회사: 회사 프로필 필수값 완성 + `onboarding_status=active`
- C: 프로필 완성 + 승인 대기
- D: 프로필 완성 + 보완 필요
- E: 이용 중지
- 나머지 업무 시나리오: 각 상태 목적은 유지하되 회사 프로필은 완성
- 온보딩 입력 화면 자체는 제품에서 제거하지 않는다.

## 적용
Simulator Seed가 다음 값을 idempotent upsert한다.
- 영문명
- 사업자명
- 테스트 사업자등록번호
- 우편번호, 도로명·지번·상세주소
- 관리자 전화번호
- 활성 회사의 onboarding 완료 시각

`/dev/test-console`에는 회사 상태를 함께 표시한다.
- 업무 테스트 가능
- 회사정보 미완료
- 승인 대기
- 보완 필요

## 재실행
0.23.95 적용 후 개발·테스트 도구 21번 `Simulator DB Seed Execute`를 다시 실행한다.
Full Reset은 필요 없다.
