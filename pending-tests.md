# Pending Tests — 0.24.21.16

## 문서·계획 정합성
- `docs/project/31-pre-codex-integrated-master-plan.md`에 정책·DB 감사·소스 감사·미구현 기능·운영·보안·QA가 모두 포함됐는지 확인
- 0.24.22가 DB Foundation, 0.24.23이 Source Architecture Cleanup, 0.24.24가 UI Foundation으로 표시되는지 확인
- `docs/project/23`, `26`, `30`이 31번 문서를 active execution authority로 가리키는지 확인
- deferred 항목(PG, analytics/cookie, Instagram, 법률/수탁자)이 구현 확정값과 섞이지 않았는지 확인

## 사용자 로컬 확인
1. `npm run build`
2. TypeScript/roadmap/document contract
3. Unicode encoding contract
4. `/roadmap` 현재 `0.24.21.16`, 다음 `0.24.22`
5. 제품화 준비도 약 80%, 기능 진척도 약 93% 표시 확인
6. 메뉴 30~32가 그대로 유지되는지 확인
7. 정상 시 commit/push 후 Vercel QA 확인

## DB/R2
- DB Migration 없음
- DB/R2/PG 실행 없음
- 0.24.22 실제 DB 작업 전 read-only reconciliation, deployed schema/RLS drift, dry-run, rollback 계획 확인 필요

## 후속
- 0.24.22 DB Foundation and Authority Alignment
- 0.24.23 Source Architecture Cleanup
- 0.24.24 WAFL UI Foundation
