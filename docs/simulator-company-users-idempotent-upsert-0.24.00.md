# 0.24.00 Simulator company_users idempotent upsert fix

## Failure

PowerShell 개발·테스트 도구 21번 `Simulator DB Seed Execute`가 다음 오류로 중단됐다.

- constraint: `company_users_pkey`
- cause: 기존 Seed 행의 고정 membership id는 같지만 0.23.99 권한 시나리오가 역할을 변경하면서 기존 `ON CONFLICT (company_id,user_id,role)` 대상과 PK 대상이 불일치했다.

## Fix

각 Simulator 사용자별 `company_users` 저장 전에 같은 회사·사용자이면서 고정 id가 다른 오래된 membership을 제거한다. 이후 고정 membership id를 conflict target으로 사용해 role, active state, display name을 갱신한다.

이 방식은 반복 Seed와 역할 시나리오 변경을 모두 허용하며, 한 회사·사용자에 오래된 role bridge 행이 누적되는 것도 방지한다.
