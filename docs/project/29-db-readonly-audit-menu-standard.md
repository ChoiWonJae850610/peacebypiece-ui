# WAFL DB Read-only Audit Menu Standard — 0.24.21.12

## 목적
Codex Sprint A 전에 개발·테스트 DB의 실제 충돌, 제약조건 준비도, 인덱스 사용 현황을 비파괴적으로 확인한다.

## 메뉴
- 30. DB Schema Reconciliation Audit
- 31. DB Constraint Readiness Check
- 32. DB Index Usage/Query Readiness Report

## 안전 계약
- 허용 runtime: development/dev/local/test/demo
- pipeline.config.psd1의 승인 DB fingerprint 일치 필수
- production 차단
- SQL은 SELECT 또는 WITH로 시작해야 함
- INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/CREATE 등 변경 구문 발견 시 차단
- DB transaction은 BEGIN READ ONLY로 실행 후 ROLLBACK
- 결과는 newest-result에 저장

## 결과 해석
- 메뉴 30과 31은 결과 행이 0이면 이상 없음
- 메뉴 32는 통계 보고서이므로 결과 행이 존재해도 실패가 아님
- 내부 식별자가 포함될 수 있으므로 결과 파일을 외부 공유하지 않는다.
