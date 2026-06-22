# Pending Tests — 0.24.21.5

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서 확인

- [ ] `/roadmap`에서 현재 `0.24.21.5`, 다음 `0.24.22`가 표시된다.
- [ ] `docs/README.md`에서 23번 Master Pack 링크가 정상이다.
- [ ] 0.24.22는 Sprint A만 구현하도록 제한되어 있다.
- [ ] Sprint A~F 각각에 범위·제외·중단 조건이 있다.
- [ ] 자동 승인 가능 명령과 수동 승인/중단 명령이 분리되어 있다.
- [ ] Build→Contract→Mutation Audit→Playwright→Vercel QA 순서가 명시되어 있다.
- [ ] 미결정 정책이 Blocked Decision Queue에 남아 있다.
- [ ] 이번 패치에 UI/API/route/DB/R2/seed/migration 구현이 없다.

## 0.24.22 Codex 시작 전 확인

- [ ] 최신 `master = origin/master`, ahead 0, behind 0, working tree clean.
- [ ] `docs/project/23-codex-productization-sprint-master-pack.md`를 읽는다.
- [ ] Sprint A의 실제 대상 파일을 search evidence로 확정한다.
- [ ] package/lockfile, schema/migration, production DB/R2 변경이 없는지 확인한다.
- [ ] 사용자 미결정 항목을 구현값으로 고정하지 않는다.
- [ ] Sprint B~F를 0.24.22 commit에 섞지 않는다.

## Blocked Decision Queue

- [ ] 시스템 기본 분류/스펙 활성화와 단면/둘레 정책
- [ ] 가입 사업자등록증·인증·Trial 결제·보존 정책
- [ ] 브랜드·도메인·가격·문의·CTA·배포 분리·analytics
- [ ] workorder public-id schema/migration 여부
- [ ] 계정 종료 export/grace/purge 기간
- [ ] Final/superseded PDF 보존기간
- [ ] mandatory four-eyes production 명령
- [ ] Final PDF 생성 가능 workflow 단계
- [ ] 고객 공개 audit log와 incident escalation owner
