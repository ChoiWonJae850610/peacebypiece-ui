# Simulator DB Seed Adapter 0.23.76

## 목적

실제 dev/test PostgreSQL에 `wafl-fn-company-a`부터 `wafl-fn-company-j`까지 테스트 회사를 반복 가능하게 구성한다.

## 생성 범위

- companies / company_subscriptions
- users / company_users
- partners
- spec_sheets
- material_orders / material_order_lines / material_order_allocations
- storage_usage_snapshots (`manual` simulator snapshot)

실제 R2 객체와 attachments는 이 버전에서 생성하지 않는다.

## 안전 조건

- production runtime 차단
- DB host/database 이름이 local/dev/test/demo/staging/sandbox 또는 wafl-fn으로 식별될 때만 허용
- `WAFL_SIMULATOR_ENABLE_DB_MUTATION=1` 필요
- seed: `WAFL_SIMULATOR_CONFIRM=SEED WAF-FN`
- cleanup: `WAFL_SIMULATOR_CONFIRM=CLEANUP WAF-FN`
- 전체 transaction 및 advisory lock
- deterministic ID와 upsert로 재실행 중복 방지
- cleanup은 fixture에 등록된 `wafl-fn` 회사 ID만 삭제

## PowerShell

- 14: seed dry-run
- 15: cleanup dry-run
- 21: seed execute (이중 확인)
- 22: cleanup execute (파괴적, 이중 확인)
- 29: DB adapter contract

실제 seed/cleanup은 전체 검사에 포함하지 않는다.
