# Simulator Adapter Plan Foundation 0.23.75

## 목적

실제 dev/test DB와 R2에 연결하기 전에 현재 schema와 fixture가 안전하게 매핑 가능한지 파일만 읽어 점검한다.

## 명령

- `npm run simulator:adapter:contract`
- `npm run simulator:adapter:plan`

두 명령 모두 DB/R2에 접속하지 않으며 데이터 생성·수정·삭제를 하지 않는다.

## 확인 범위

- companies, users, company_users, partners
- spec_sheets, material_orders, material_order_lines, material_order_allocations
- attachments, storage_usage_snapshots
- 회사 ID `wafl-fn` prefix
- 회사별 R2 prefix 고유성과 허용 범위
- cleanup 실행 순서와 transaction 요구사항

## 현재 차단 상태

- DB seed adapter 미구현
- DB cleanup adapter 미구현
- R2 upload/delete adapter 미구현
- production 실행 금지
- `executionReady=false` 유지
