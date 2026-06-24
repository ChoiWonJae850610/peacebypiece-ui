# Pending Tests — 0.24.21.15

## 문서 정합성
- `docs/project/26-final-policy-decisions-and-master-todo.md`의 최종 정책 검토
- `docs/project/30-pre-codex-policy-reconciliation.md`의 충돌 정리표 검토
- 09/19/20/21/23 문서가 카드 필수, 승인 시 Trial 시작, 최신 PDF 1개, 자동삭제 ON, 속옷·액세서리 기본 비활성 정책과 일치하는지 확인

## 사용자 로컬 확인
1. `npm run build`
2. TypeScript/roadmap/document contract
3. Unicode encoding contract
4. `/roadmap` 현재 `0.24.21.15`, 다음 `0.24.22`
5. 메뉴 30~32가 기존과 동일하게 유지되는지 확인
6. 정상 시 commit/push 후 Vercel QA 확인

## DB/R2
- DB Migration 없음
- DB/R2/PG 실행 없음
- 문서와 roadmap만 변경

## 후속
- 0.24.22 Codex Sprint A
- PG, analytics/cookie, Instagram, 법률/수탁자 세부정보는 DEFERRED/LEGAL_REVIEW
