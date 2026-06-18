# Simulator Seed suspension consistency fix — 0.23.83

## 원인

`company_members`에는 `status = 'suspended'`이면 `suspended_at`이 반드시 있어야 하는 체크 제약조건이 있다. 0.23.82 Seed는 suspended 회사의 멤버 status만 suspended로 저장하고 정지 시각을 저장하지 않아 실행이 차단됐다.

## 수정

- suspended 멤버: `suspended_by = ownerId`, `suspended_at = now()`
- 그 외 멤버: `suspended_by = NULL`, `suspended_at = NULL`
- upsert 시에도 두 컬럼을 함께 갱신하여 재실행 후 상태가 일관되게 복구된다.

## 재검증

PowerShell 개발·테스트 메뉴 21을 승인된 dev/test DB에서 다시 실행하고 ExitCode 0 및 `companyMembers: 193`을 확인한다.
