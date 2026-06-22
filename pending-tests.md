# Pending Tests — 0.24.21

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서·화면 확인

- [ ] `/roadmap`에서 현재 `0.24.21`, 다음 `0.24.22`가 표시된다.
- [ ] `docs/README.md`에서 16~18 canonical 문서 링크가 정상이다.
- [ ] PB-005/006/010이 0.24.22 Ready 범위로 표시된다.
- [ ] PB-002 final PDF/retention 항목은 사용자 결정 대기로 유지된다.
- [ ] 기존 통합 QA 계획이 0.24.25 후보로 보존된다.
- [ ] 0.24.22 필수·선택·제외 범위가 서로 충돌하지 않는다.

## 사용자 결정이 실제로 필요한 항목

- [ ] 계정 종료 후 고객 export 가능 기간과 실제 데이터 purge 전 grace 기간.
- [ ] Final PDF와 superseded PDF의 보존 기간.
- [ ] Mandatory four-eyes 승인이 필요한 production 명령의 확정 목록.
- [ ] Final workorder PDF 생성 가능 상태.
- [ ] Final supplier/material-order PDF 생성 가능 상태.
- [ ] 고객에게 공개할 audit log 범위.
- [ ] production incident communication/escalation 최종 책임자.

## 다음 버전 실제 작업 — 0.24.22

- [ ] PB-005: 고객사 관리자 주요 화면 WAFL 공통화.
- [ ] PB-006: 관리자 dashboard와 `/worker` 정보 밀도 축소.
- [ ] PB-010: Functions 실행 전 environment/profile/safety/dry-run report UX.
- [ ] 관련 responsive/permission/empty/loading/error 계약 보강.
- [ ] Build/Test/Commit/Push 후 Vercel PC/mobile QA 항목 제공.

## 이번 버전에서 실행하지 않는 항목

- 실제 UI/Functions 코드 구현 없음.
- PDF renderer/template 구현 없음.
- production R2/DB mutation 없음.
- DB schema/migration/seed/reset 변경 없음.
- permission/runtime/API/dependency/lockfile 변경 없음.
