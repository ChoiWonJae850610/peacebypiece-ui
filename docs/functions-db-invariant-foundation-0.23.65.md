# 0.23.65 Functions DB invariant foundation

## 목적

`/functions` 시나리오 계약을 실제 자동 테스트 코드와 연결하기 위한 공통 DB 불변조건 기반을 추가한다.

## 추가된 검증

- before/after row snapshot
- 허용된 필드만 변경됐는지 확인
- 명시된 불변 필드 유지 확인
- `undefined` PATCH 필드 보존
- `null` PATCH 필드 명시 초기화
- 실패 후 rollback 복원
- 서로 다른 회사 데이터 불변 확인

## 실행 명령

```bash
npm run test:functions:db-contract
```

현재 테스트는 고정 fixture와 메모리 snapshot으로 실행되며 실제 DB를 변경하지 않는다. 실제 test DB adapter 연결은 사용자 테스트 가능 시점 이후 별도 단계에서 진행한다.

## PowerShell 자동화 메뉴 추가 필요

- 권장 이름: `Functions DB Contract Test`
- 권장 위치: 기존 테스트 메뉴 하위 또는 전체 검사 전 단계
- 명령: `npm run test:functions:db-contract`
- 구분: 안전 / 비파괴 / DB 미접속
- runtime 제한: 없음
- 파괴적 작업: 없음

추후 실제 DB 연결형 테스트가 추가되면 별도 메뉴로 분리하고 dev/test runtime 제한과 명시적 확인 절차를 적용한다.
