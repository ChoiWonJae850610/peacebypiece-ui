# Pending Tests — 0.24.21.4

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서 확인

- [ ] `/roadmap`에서 현재 `0.24.21.4`, 다음 `0.24.21.5`가 표시된다.
- [ ] `docs/README.md`에서 22번 canonical 문서 링크가 정상이다.
- [ ] 저장공간 80% 경고와 100% 업로드 제한 기준이 기존 quota 정책과 일치한다.
- [ ] 원통형 visual이 기본이고 직사각형 progress는 좁은 fallback으로만 정의되어 있다.
- [ ] 대표 이미지·사업자등록증 항목명과 상태 badge가 중복되지 않는다.
- [ ] workorder opaque identifier가 authorization 대체 수단으로 설명되지 않는다.
- [ ] 이번 패치에 UI, route, DB schema, migration, backfill, R2 변경이 없다.

## Codex 구현 전 조사 항목

- [ ] system/customer storage usage 화면과 공통 component 후보.
- [ ] 기존 storage cylinder component 또는 style 존재 여부.
- [ ] 대표 이미지·사업자등록증의 canonical status enum 존재 여부.
- [ ] workorder 현재 route shape와 모든 route builder/link.
- [ ] 안정적인 기존 workorder code를 public id로 재사용할 수 있는지.
- [ ] old route redirect와 bookmark compatibility 범위.
- [ ] public id 저장을 위해 DB column/migration/backfill이 필요한지.
- [ ] `/worker`와 `/workspace/workorders`가 같은 canonical identity를 쓰는지.

## 기존 사용자 결정 대기 항목

- [ ] 최종 브랜드명과 구매할 도메인.
- [ ] 공개 가격, 부가세, 결제 주기, 추가 저장공간 판매 문구.
- [ ] 사업자등록증 가입 필수 여부.
- [ ] 승인 전 이메일/휴대전화 인증 수준.
- [ ] 카드 등록 없는 Trial 시작 여부와 종료 후 유예기간.
- [ ] 가입 요청/첨부파일 보존기간과 복수 회사 관리자 허용 여부.
- [ ] 가입 승인 mandatory four-eyes 여부와 마케팅 동의 방식.
- [ ] 기본 분류·사이즈 사용자 결정 항목.
- [ ] 계정 종료 export/purge grace, PDF retention, four-eyes production 명령, Final PDF 상태.

## 다음 버전 실제 작업 — 0.24.21.5

- [ ] 0.24.22 Codex Sprint Master Pack 통합.
- [ ] PB-005·PB-006·PB-010과 system data/signup/public website/UI routing 문서 연결.
- [ ] DB/UI/Functions/Public Website/PDF·R2 Sprint 순서.
- [ ] 각 Sprint 변경 파일 후보, 금지 범위, 완료 조건.
- [ ] 승인창 자동 승인 가능 명령과 수동 승인 필수 명령.
- [ ] Build/contract/Playwright/Vercel QA 실행 순서.
- [ ] 실패·중단·rollback·handoff 기준.
- [ ] 사용자 미결정 정책을 Blocked queue로 분리.

## 이번 버전에서 실행하지 않는 항목

- storage cylinder UI 구현 없음.
- 회사 파일 upload/review UI 변경 없음.
- workorder route/API 변경 없음.
- public-id schema/migration/backfill 없음.
- DB/R2/Seed/Reset/Cleanup/Purge 없음.
- package/lockfile 변경 없음.
