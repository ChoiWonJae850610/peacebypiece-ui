# DB/API smoke test fixture 보정 — 0.19.88.1

## 목적

0.19.88에서 확장한 DB/API smoke test 중 멤버 생명주기 fixture가 현재 `users_role_check` 제약과 맞지 않는 `member` 값을 `users.role`에 삽입해 실패하던 문제를 보정한다.

## 원인

현재 `users.role` 허용값은 다음과 같다.

```text
admin
designer
inspector
inventory_manager
viewer
system
```

0.19.88 smoke test fixture는 일반 멤버를 표현하기 위해 `member` 값을 사용했다. 이 값은 실제 DB schema의 허용 role 값이 아니므로 `users_role_check` 제약에 의해 insert 단계에서 실패한다.

## 변경

- 멤버 생명주기 smoke fixture의 일반 사용자 `users.role` 값을 `member`에서 `designer`로 변경한다.
- `company_members.role_template_code`는 기존처럼 `designer`를 유지한다.
- 테스트가 검증하려는 대상은 `users.role` 자체가 아니라 `company_members.status` 변경 흐름이므로 기능 검증 의미는 유지된다.

## 영향 범위

- 앱 기능 로직 변경 없음
- API route 변경 없음
- DB schema 변경 없음
- full_reset.sql 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음

## 재실행 명령

```bash
npm run test:smoke:db-api
```

## 기대 결과

- member lifecycle contract가 `users_role_check`에서 실패하지 않아야 한다.
- 실패가 계속된다면 다음 단계의 실제 상태값/컬럼 제약 실패 여부를 확인한다.
