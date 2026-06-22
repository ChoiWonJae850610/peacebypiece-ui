# Pending Tests — 0.24.20

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서·화면 확인

- [ ] `/roadmap`에서 현재 `0.24.20`, 다음 `0.24.21`이 표시된다.
- [ ] `docs/README.md`에서 09~15 canonical 문서 링크가 정상이다.
- [ ] Release Engineering의 gate와 기존 PowerShell Finish 흐름이 충돌하지 않는다.
- [ ] QA Matrix의 role/responsive/data 기준이 현재 제품 역할과 일치한다.
- [ ] Playwright Plan이 production 서비스나 테스트 순서에 의존하지 않는다.
- [ ] Browser/Device Matrix가 PC, iPhone, Android, iPad, Galaxy Tab을 포함한다.
- [ ] 0.24.19 정책 문서에서 기존 확정값과 미결정값이 구분되어 있다.

## 기존 정책에서 확인되어 반영된 값

- Trial 100MB / Lite 500MB / Flow 1.5GB / Studio 5GB.
- 저장공간 80% 경고, 100% 신규 파일 업로드 차단.
- 초과 상태에서도 조회, 삭제, 휴지통 비우기, 허용된 export, 업그레이드는 가능.
- 고객사 휴지통 보관 30일, 이후 purge 가능 대상.
- 장기 미납 30/60/90일 단계와 서비스 종료 30일 사전 안내.
- 시스템 관리자 고객 콘텐츠 접근은 목적·범위·기간 제한과 감사 로그가 필수.

## 사용자 결정이 실제로 필요한 항목

- [ ] 계정 종료 후 고객 export 가능 기간과 실제 데이터 purge 전 grace 기간.
- [ ] Final PDF와 superseded PDF의 보존 기간.
- [ ] Mandatory four-eyes 승인이 필요한 production 명령의 확정 목록.
- [ ] Final workorder PDF 생성 가능 상태.
- [ ] Final supplier/material-order PDF 생성 가능 상태.
- [ ] 고객에게 공개할 audit log 범위.
- [ ] production incident communication/escalation 최종 책임자.

## 이번 버전에서 실행하지 않는 항목

- 실제 Playwright 테스트 코드 추가 없음.
- PDF renderer/template 구현 없음.
- production R2 upload/delete/reconciliation 없음.
- DB schema/migration/seed/reset 변경 없음.
- permission/runtime/API/dependency/lockfile 변경 없음.
