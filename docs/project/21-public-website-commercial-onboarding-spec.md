# Public Website and Commercial Onboarding Specification


> Canonical update (0.24.21.15): synchronized with `docs/project/26-final-policy-decisions-and-master-todo.md`.
Version: 0.24.21.15  
Status: Codex implementation input  
Scope: public marketing website, domain boundary, pricing/Trial presentation, signup CTA, commercial onboarding information architecture

## 1. 목적

WAFL을 실제 고객에게 공개할 때 필요한 홍보 홈페이지, 기능·요금제·보안 설명, 가입 요청 CTA, 로그인 진입, 제품 화면 캡처, 도메인·배포·인증 경계를 하나의 canonical 계약으로 확정한다.

이번 버전은 문서와 roadmap만 변경한다. 공개 홈페이지 UI, 결제, 도메인 구매, DNS, production 배포, 가입 API, 분석 SDK는 구현하지 않는다.

## 2. 제품 공개 원칙

- 공개 홈페이지는 제품을 설명하고 가입 요청으로 연결하는 marketing surface다.
- 실제 업무 데이터와 고객사 workspace는 별도 authenticated app surface에 둔다.
- 시스템 관리자 화면은 공개 navigation이나 sitemap에 노출하지 않는다.
- 공개 페이지는 고객사 데이터, 내부 tenant id, 내부 route, secret, automation command, 테스트 계정 정보를 포함하지 않는다.
- 제품 화면 캡처는 실제 고객 데이터 대신 전용 demo fixture를 사용한다.
- 가격, Trial, 저장공간, 보존, 결제 문구는 canonical 정책과 일치해야 하며 임의 숫자를 넣지 않는다.

## 3. 권장 도메인 구조

| Surface | 권장 도메인 | 역할 |
| --- | --- | --- |
| Public website | `wafl.co.kr` | 제품 소개, 기능, 가격, 보안, 가이드, 가입 요청 |
| Customer app | `app.wafl.co.kr` | 로그인 후 고객사 workspace |
| System admin | 별도 비공개 internal/admin host | 시스템 관리자 전용 운영 화면 |
| Docs/help | 초기에는 public website 하위 경로 | 사용방법, FAQ, 정책 문서 |

원칙:

- system-admin host를 public footer, robots sitemap, marketing analytics에 노출하지 않는다.
- cookie와 session scope는 필요한 host로 최소화한다.
- public website와 app은 서로 다른 deployment여도 동일한 정책 문서 version과 signup contract를 참조한다.
- 최종 도메인과 registrar는 구매 가능성 확인 후 결정한다.

## 4. 사이트맵

### 4.1 `/` Home

목적:

- WAFL이 해결하는 생산·발주·입고·검수·원가 관리 문제를 짧게 설명한다.
- 핵심 기능과 대표 화면을 보여준다.
- `가입 요청`, `기능 보기`, `요금제 보기`, `로그인` CTA를 제공한다.

권장 섹션:

1. Hero: 제품 한 줄 설명과 대표 CTA
2. 문제: 메신저·수기·엑셀 분산 관리의 불편
3. 핵심 흐름: 작업지시서 → 발주 → 입고·검수 → 재고·원가
4. 대표 화면 캡처
5. 역할별 협업
6. 요금제 요약
7. 보안·권한·파일 관리 신뢰 요소
8. Trial/가입 요청 CTA
9. FAQ와 footer 정책 링크

### 4.2 `/features`

- 작업지시서 작성·검토·발주 요청
- 원단·부자재·외주 관리
- 입고·검수·재고 반영
- 거래처·멤버·권한 관리
- 비용·원가·통계
- 첨부파일·PDF·히스토리
- 시스템 관리자와 고객사 관리자 기능은 구분해서 설명한다.

아직 구현되지 않은 기능은 현재 제공 기능처럼 표현하지 않는다. `예정`, `베타`, `준비 중` 상태를 명시한다.

### 4.3 `/pricing`

기존 canonical 요금제 표시 기준:

| Plan | Storage | Members | Export |
| --- | ---: | ---: | --- |
| Trial | 100MB | 3명 | 제한 |
| Lite | 500MB | 3명 | 월 1회 |
| Flow | 1.5GB | 10명 | 월 3회 |
| Studio | 5GB | 30명 | 월 10회 |
| Custom | 별도 협의 | 별도 협의 | 별도 협의 |

추가 저장공간은 기존 정책상 1GB 단위 월 7,000원 기준이 있으나, 실제 공개 전 판매·세금·결제 정책 검토 후 표시한다.

필수 표시:

- Trial 기간 7일
- 저장공간 80% 경고, 100%에서 신규 작업지시서·리오더·업로드·파일교체·그림편집·PDF재생성·단계변경 차단; 조회·기존 텍스트 수정·삭제·휴지통 비우기 허용
- 초과 상태에서도 조회·삭제·휴지통 비우기·업그레이드 가능
- 가격에 부가세 포함 여부
- 결제 주기와 해지 시점
- 기능 제한과 지원 범위

미확정 값은 공개 페이지에 placeholder 가격으로 노출하지 않는다.

### 4.4 `/guide`

간단한 제품 사용 흐름:

1. 회사와 멤버 준비
2. 거래처와 기본 분류 설정
3. 작업지시서 작성
4. 검토와 발주
5. 입고·검수·재고 반영
6. 히스토리와 통계 확인

긴 매뉴얼보다 첫 사용자가 전체 흐름을 이해할 수 있는 5~7단계 소개를 우선한다.

### 4.5 `/security`

- tenant 분리
- 역할·권한
- 감사 로그
- private file access
- 저장공간 quota
- 휴지통·보존·삭제 원칙
- 시스템 관리자 고객 콘텐츠 접근 제한
- 장애·백업·복구 정책은 검증된 범위만 공개

보안 페이지는 내부 구현 세부, bucket path, DB schema, command, secret 이름을 공개하지 않는다.

### 4.6 `/terms`, `/privacy`, `/policies/*`

- 이용약관
- 개인정보처리방침
- 요금제·결제·환불 정책
- 저장소·파일 보관 정책
- 서비스 운영정책
- 정책 문서 version과 시행일

가입 화면에서 동의한 immutable revision과 동일한 공개 문서를 제공한다.

### 4.7 `/signup` 또는 `/request-access`

`docs/project/20-customer-signup-consent-approval-trial-spec.md`의 입력, 동의, 제출, 승인 계약을 사용한다.

- 공개 페이지는 요청 시작과 진행 상태 확인 진입점만 제공한다.
- 실제 submission은 anti-abuse, validation, duplicate detection, consent evidence를 거친다.
- 가입 승인 전 고객사 업무 화면 접근을 허용하지 않는다.

### 4.8 `/login`

- 기존 고객의 app 로그인 진입
- 가입 요청 중인 사용자의 상태 확인 진입
- 일반 고객 로그인과 system-admin 로그인 진입을 섞지 않는다.

## 5. Navigation과 CTA

공개 상단 navigation 권장:

- 기능
- 요금제
- 사용방법
- 보안
- 로그인
- 가입 요청

CTA 원칙:

- Primary: `가입 요청`
- Secondary: `기능 보기` 또는 `요금제 보기`
- Existing customer: `로그인`
- `무료 시작`은 승인 없이 즉시 Trial이 시작되는 구조가 확정되기 전 사용하지 않는다.
- `영구 무료`, `무제한`, `완전 자동`처럼 실제 계약보다 강한 표현을 금지한다.

## 6. 공개용 제품 화면 캡처 목록

필수 후보:

1. 작업지시서 workspace 전체 흐름
2. 원단·부자재·외주 입력
3. 입고·검수·재고 반영
4. 최근 히스토리와 단계 진행
5. 고객사 관리자 dashboard
6. 멤버·권한 관리
7. 거래처 관리
8. 저장공간 사용량
9. 비용·원가·통계
10. PDF 미리보기 또는 출력 결과

캡처 기준:

- 전용 demo 회사와 가상 데이터만 사용한다.
- 실제 이름, 전화번호, 사업자번호, 파일, 이메일, 주문 정보는 포함하지 않는다.
- PC뿐 아니라 mobile/tablet 화면도 필요한 기능에 한해 제공한다.
- 아직 정책·UI가 확정되지 않은 화면은 공개 캡처 대상에서 제외한다.
- 저장공간 화면은 후속 원통형 디자인 수정 완료 후 캡처한다.
- 대표 이미지·사업자등록증 중복 문구가 정리된 후 설정 화면을 캡처한다.

## 7. Public Website와 App 경계

Public website:

- anonymous access
- static 또는 cache 가능한 제품 콘텐츠
- 정책 문서 조회
- 가입 요청 시작
- 문의

Customer app:

- authenticated access
- 회사별 tenant context
- 작업지시서·발주·입고·파일·통계
- 가입 승인 후 접근

System admin:

- 별도 guard
- 가입 요청 검토
- 회사·요금제·용량·감사 운영
- public website에서 직접 link 금지

경계 원칙:

- public route는 고객사 API를 직접 호출하지 않는다.
- app route의 권한 guard를 marketing route 편의 때문에 약화하지 않는다.
- external analytics는 현재 도입하지 않으며 Codex Sprint 이후 TODO로 유지한다.
- 향후 도입 시 authenticated app의 고객 업무 이벤트, 개인정보, 파일명, 작업지시서 내용을 기본 수집하지 않는다.
- public contact/signup 데이터와 app tenant 데이터의 retention과 접근권한을 구분한다.

## 8. SEO와 공개 메타데이터

필수:

- page별 title과 description
- canonical URL
- Open Graph image
- sitemap과 robots
- structured data는 실제 서비스 정보만 사용
- 정책 문서 version과 시행일
- 고객지원 연락 경로

금지:

- system-admin route 색인
- preview/staging 색인
- 내부 roadmap/functions/id-control route 색인
- 실제 고객 데이터가 포함된 OG image
- 구현되지 않은 기능 키워드 남용

## 9. 문의와 전환 측정

초기 측정 대상:

- 기능 페이지 조회
- 요금제 페이지 조회
- 가입 요청 시작
- 가입 요청 제출
- 로그인 이동
- 문의 제출

원칙:

- 개인정보·사업자번호·파일명·작업지시서 데이터는 analytics payload에 넣지 않는다.
- 정책 동의는 marketing analytics가 아니라 consent evidence store가 기준이다.
- third-party analytics 도입 전 개인정보처리방침과 cookie 정책을 검토한다.
- 전환 측정 실패가 가입 submission을 막아서는 안 된다.

## 10. 배포와 환경

권장 분리:

- production public website
- production customer app
- internal/system admin
- preview QA deployments

필수 환경 규칙:

- preview에는 `noindex`
- production hostname allowlist
- public/app callback URL 분리
- 공개 사이트가 production app secret을 공유하지 않도록 최소 환경변수만 제공
- Vercel preview는 1.0 전 QA 용도이며 실제 고객 가입을 받지 않는다.

## 11. Codex Public Website Sprint 범위

구현 전 조사:

- 현재 Next.js route와 auth middleware
- 공개 legal route 존재 여부
- signup request 관련 기존 route/API/schema
- brand asset과 screenshot fixture 위치
- deployment와 hostname guard

권장 구현 순서:

1. public layout와 navigation
2. Home/Features/Pricing/Guide/Security 정적 페이지
3. legal document route 연결
4. Login/Signup CTA 연결
5. responsive/accessibility/SEO
6. demo screenshot asset pipeline
7. analytics는 별도 승인 후
8. 가입 요청 API/UI는 20번 문서 Sprint에서 구현

완료 조건:

- public route가 인증 없이 정상 조회된다.
- app/system-admin route guard는 약화되지 않는다.
- 가격·Trial·용량 값이 canonical 정책과 일치한다.
- 구현되지 않은 기능은 명확히 구분된다.
- mobile/tablet/desktop에서 navigation과 CTA가 정상이다.
- preview noindex와 public sitemap exclusion이 검증된다.
- 고객 데이터나 내부 route가 공개 asset과 metadata에 포함되지 않는다.

## 12. 이번 버전 범위 밖

- 실제 도메인 구매와 DNS
- public UI 코드
- 가입 API/UI
- DB schema/migration
- PG·자동결제·세금계산서
- analytics SDK 설치
- production 배포
- 실제 고객 데이터 캡처
- system-admin route 공개

## 13. 확정/보류 경계

확정:

- 브랜드 `WAFL`, `www.wafl.co.kr`, VAT 포함 가격, `7일 무료로 시작하기` CTA.
- 공개 사이트 안에 가입과 로그인 진입점을 둔다.
- 고객 문의는 이메일과 앱 내 문의를 사용한다.
- 한 repository를 유지하고 production Vercel/DB/R2/env만 분리한다.
- 추가 저장공간은 1GB당 월 7,000원의 정식 장기 애드온이다.

보류:

- 외부 analytics와 cookie banner/동의.
- 최종 공개 캡처와 Instagram 콘텐츠 전략.

보류 항목은 SDK나 placeholder로 임의 구현하지 않는다.
