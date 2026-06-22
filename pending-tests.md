# Pending Tests — 0.24.21.1

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서·화면 확인

- [ ] `/roadmap`에서 현재 `0.24.21.1`, 다음 `0.24.21.2`가 표시된다.
- [ ] `docs/README.md`에서 19번 canonical 문서 링크가 정상이다.
- [ ] 현재 system seed의 제품 유형 3개 경로 gap이 정확히 기록되어 있다.
- [ ] 기본 분류, 사이즈 스펙, 신규 회사 provisioning, 기존 회사 backfill 계약이 서로 충돌하지 않는다.
- [ ] 이번 패치에 SQL, schema, migration, seed 실행 또는 제품 코드 변경이 없다.

## 사용자 결정이 필요한 항목 — 이번 문서

- [ ] 속옷·액세서리 분류를 신규 고객사에 기본 활성화할지 여부.
- [ ] 가슴·허리·엉덩이를 단면 기준으로 기본 제공하고 둘레는 선택 항목으로 둘지 여부.
- [ ] 고객사에 시스템 기본 분류의 직접 이름 변경을 허용할지, 별칭만 허용할지 여부.
- [ ] 기존 고객사에 새 시스템 기본 항목을 자동 enable할지, 고객사 관리자 확인 후 enable할지 여부.

## 기존 사용자 결정 대기 항목

- [ ] 계정 종료 후 고객 export 가능 기간과 실제 데이터 purge 전 grace 기간.
- [ ] Final PDF와 superseded PDF의 보존 기간.
- [ ] Mandatory four-eyes 승인이 필요한 production 명령의 확정 목록.
- [ ] Final workorder PDF 생성 가능 상태.
- [ ] Final supplier/material-order PDF 생성 가능 상태.
- [ ] 고객에게 공개할 audit log 범위.
- [ ] production incident communication/escalation 최종 책임자.

## 다음 버전 실제 작업 — 0.24.21.2

- [ ] 공개 홈페이지에서 고객사 가입 요청으로 진입하는 흐름.
- [ ] 회사/최초 관리자 입력 필드와 중복 검증 기준.
- [ ] 이용약관·개인정보·저장소/운영정책 필수/선택 동의.
- [ ] 동의 문서 version, timestamp, evidence와 재동의 계약.
- [ ] 가입 요청 draft/submitted/reviewing/changes_requested/approved/rejected/canceled 상태.
- [ ] 시스템 관리자 승인 후 Trial, quota, 회사, 관리자, 기본 기준정보 provisioning 순서.
- [ ] 결제 연결 시점과 미구현 경계.

## 이번 버전에서 실행하지 않는 항목

- SQL 작성 또는 실행 없음.
- DB schema/migration/seed/reset/backfill 실행 없음.
- 시스템 관리자 UI 구현 없음.
- 가입/약관/결제 페이지 구현 없음.
- PDF/R2 renderer 또는 production mutation 없음.
- permission/runtime/API/dependency/lockfile 변경 없음.
