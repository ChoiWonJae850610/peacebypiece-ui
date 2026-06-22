# Pending Tests — 0.24.21.3

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서 확인

- [ ] `/roadmap`에서 현재 `0.24.21.3`, 다음 `0.24.21.4`가 표시된다.
- [ ] `docs/README.md`에서 21번 canonical 문서 링크가 정상이다.
- [ ] Trial 7일, 100MB, 멤버 3명과 요금제 용량이 기존 정책과 일치한다.
- [ ] public website, customer app, system-admin 경계가 분리되어 있다.
- [ ] 실제 고객 데이터와 내부 route가 공개 캡처·SEO 대상에서 제외되어 있다.
- [ ] 이번 패치에 public UI, DNS, PG, analytics SDK, 가입 API 구현이 없다.

## 사용자 결정이 필요한 항목 — 공개 홈페이지

- [ ] 최종 브랜드명과 구매할 도메인.
- [ ] 공개 가격, 부가세 포함 여부, 결제 주기 표시.
- [ ] 추가 저장공간 판매 문구와 공개 여부.
- [ ] 문의 채널과 운영 시간.
- [ ] `가입 요청`, `무료 체험`, `도입 문의` 중 primary CTA.
- [ ] 공개용 제품 캡처 최종 목록.
- [ ] public website와 app의 repository/deployment 분리 여부.
- [ ] cookie banner와 third-party analytics 도입 여부.

## 기존 사용자 결정 대기 항목

- [ ] 사업자등록증 가입 필수 여부.
- [ ] 승인 전 이메일/휴대전화 인증 수준.
- [ ] 카드 등록 없는 Trial 시작 여부.
- [ ] Trial 종료 후 읽기 전용 유예기간.
- [ ] 거절·취소 가입 요청과 첨부파일 보존기간.
- [ ] 동일 사용자의 복수 회사 관리자 허용 여부.
- [ ] 가입 승인 mandatory four-eyes 여부.
- [ ] 마케팅 동의 채널과 철회 방식.
- [ ] 기본 분류·사이즈 사용자 결정 항목.
- [ ] 계정 종료 export/purge grace, PDF retention, four-eyes production 명령, Final PDF 상태.

## 다음 버전 실제 작업 — 0.24.21.4

- [ ] 저장소 사용량 원통형 디자인 canonical 규격.
- [ ] 80% 경고와 100% 초과 상태의 responsive/접근성 기준.
- [ ] 대표 이미지·사업자등록증 항목명과 상태 배지 중복 제거 규칙.
- [ ] 공통 파일 필드의 업로드 전/후/검토 상태.
- [ ] workorder URL에서 순차 id·page query 노출 제거 방향.
- [ ] opaque identifier, deep-link, refresh, back navigation 계약.
- [ ] 관리자·시스템 관리자 화면별 acceptance criteria.
- [ ] Codex UI·routing remediation Sprint 범위.

## 이번 버전에서 실행하지 않는 항목

- public website UI 구현 없음.
- 도메인 구매, DNS, production 배포 없음.
- 가입 API/UI, DB schema/migration 없음.
- PG·결제·세금계산서 구현 없음.
- analytics SDK와 cookie banner 구현 없음.
- 실제 고객 데이터 캡처 없음.
