# Pending Tests — 0.24.21.2

## 패치 적용 후 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `roadmap-development-contract`
- [ ] 문서 경로/version 계약
- [ ] Mutation Audit high-risk 0
- [ ] package.json / package-lock.json 무변경
- [ ] DB/R2/Seed/Reset/Cleanup/Migration 미실행

## 수동 문서·화면 확인

- [ ] `/roadmap`에서 현재 `0.24.21.2`, 다음 `0.24.21.3`이 표시된다.
- [ ] `docs/README.md`에서 20번 canonical 문서 링크가 정상이다.
- [ ] Trial 7일, 100MB, 멤버 3명 기준이 기존 정책과 일치한다.
- [ ] 가입 요청 상태와 승인 provisioning 순서가 서로 충돌하지 않는다.
- [ ] 정책 동의가 문서별 version/evidence로 분리되어 있다.
- [ ] 이번 패치에 공개 홈페이지, DB/API/UI, PG/결제 구현이 없다.

## 사용자 결정이 필요한 항목 — 가입/승인

- [ ] 사업자등록증을 가입 요청 필수로 할지 여부.
- [ ] 시스템 관리자 승인 전 이메일/휴대전화 인증 수준.
- [ ] 카드 등록 없이 Trial을 시작할지 여부.
- [ ] Trial 종료 후 읽기 전용 유예기간.
- [ ] 거절·취소 가입 요청과 첨부파일 보존기간.
- [ ] 동일 사용자의 복수 회사 관리자 허용 여부.
- [ ] 가입 승인 명령을 mandatory four-eyes 대상으로 할지 여부.
- [ ] 마케팅 동의 채널과 철회 방식.

## 기존 사용자 결정 대기 항목

- [ ] 속옷·액세서리 기본 활성화 여부.
- [ ] 가슴·허리·엉덩이 기본 단면/둘레 정책.
- [ ] 시스템 기본 분류 이름 변경 또는 별칭 범위.
- [ ] 기존 고객사 새 기본 항목 자동 enable 여부.
- [ ] 계정 종료 후 export 가능 기간과 purge grace.
- [ ] Final PDF와 superseded PDF 보존기간.
- [ ] Mandatory four-eyes production 명령 목록.
- [ ] Final workorder/supplier PDF 생성 가능 상태.
- [ ] 고객 공개 audit log 범위.
- [ ] production incident escalation 책임자.

## 다음 버전 실제 작업 — 0.24.21.3

- [ ] 공개 홈페이지 사이트맵과 페이지 역할.
- [ ] 홈, 기능, 요금제, 사용방법, 보안, 약관, 가입, 로그인 IA.
- [ ] `wafl.co.kr`, `app.wafl.co.kr`, 관리자 도메인 분리안.
- [ ] 홍보용 제품 화면 캡처 요구 목록.
- [ ] 기능·가격·보안·Trial CTA 콘텐츠 계약.
- [ ] 공개 사이트와 앱의 배포·인증 경계.
- [ ] SEO, 문의, 전환 추적, 공개 금지 정보 기준.
- [ ] Codex 구현용 public website Sprint 범위.

## 이번 버전에서 실행하지 않는 항목

- 공개 홈페이지·가입 폼·시스템 관리자 Queue 구현 없음.
- DB schema/migration/API/seed/provisioning 실행 없음.
- PG·결제·세금계산서 구현 없음.
- 사업자등록증 R2 업로드 변경 없음.
- permission/runtime/dependency/lockfile 변경 없음.
