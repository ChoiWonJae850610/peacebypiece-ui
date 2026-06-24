# Pending Tests — 0.24.21.9

## 자동 검증

- [ ] `node tests/document-structure-contract.mjs`
- [ ] `node tests/roadmap-development-contract.mjs`
- [ ] `node tests/unicode-encoding-contract.mjs`
- [ ] `npx tsc --noEmit`

## 문서 검토

- [ ] `docs/project/26-final-policy-decisions-and-master-todo.md`가 최신 사용자 결정과 일치한다.
- [ ] 기존 project spec 19~23의 충돌 정책은 26번 문서 우선으로 연결된다.
- [ ] 완료·미개발·보류 TODO가 섞이지 않고 구분된다.
- [ ] 0.24.22 Sprint A 범위가 기존 master pack과 일치한다.
- [ ] 법률·세무 보존기간은 출시 전 재검토 대상으로 남아 있다.

## 회귀 방지

- [ ] 앱 UI/API/DB/R2 동작을 변경하지 않았다.
- [ ] package와 lockfile을 변경하지 않았다.
- [ ] DB Migration이 없다.
- [ ] secret, production URL, token, 실제 계정정보를 포함하지 않았다.

## 이번 패치 생성 환경 실행 결과

- PASS: `node tests/unicode-encoding-contract.mjs`
- 기존 contract blocker: `document-structure-contract`가 현재 버전과 무관한 `APP_VERSION = "0.24.13"` 고정 기대값으로 실패
- 기존 contract blocker: `roadmap-development-contract`가 기존 0.24.18 title mismatch로 실패
- 환경 blocker: 전달 ZIP에 `node_modules`가 없어 `npx tsc --noEmit`이 React/Next/Node type module을 찾지 못해 실패
- 위 실패는 0.24.21.9 문서 변경에서 새로 발생한 앱 동작 오류로 확인되지 않았으며, 사용자 로컬 canonical pipeline에서 재검증 필요
