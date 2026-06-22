# Customer Signup, Consent, Approval, and Trial Provisioning Specification

Version: 0.24.21.2  
Status: Codex implementation input  
Scope: public customer signup request, policy consent evidence, system-admin approval, Trial provisioning

## 1. 목적

WAFL 공개 홈페이지에서 고객사 관리자가 가입을 요청하고, 필수 정책에 동의한 뒤 시스템 관리자가 검토·승인하면 회사 workspace, 최초 관리자, Trial, 저장공간 quota, 기본 분류와 사이즈 스펙이 안전하게 생성되는 전체 계약을 확정한다.

이번 버전은 문서와 roadmap만 변경한다. 공개 홈페이지, 가입 폼, 결제, DB schema, API, 시스템 관리자 Queue, provisioning 코드는 구현하지 않는다.

## 2. 기존 기준 조사 결과

프로젝트에는 이미 다음 기준이 존재한다.

- Trial/Lite/Flow/Studio/Custom 요금제 체계
- Trial 7일, 100MB, 멤버 3명, 데이터 내보내기 제한 정책
- 고객사 승인 요청 시 이용약관과 개인정보처리방침 동의 필요
- 정책 문서 버전과 사용자별 동의 이력 보관
- 승인 대기, 승인, 거절, 재입력 필요 상태
- `trial_started_at`, `trial_ends_at` 기반 Trial 상태
- 시스템 기본 분류·사이즈 스펙 provisioning 계약

따라서 새 구현은 기존 회사 승인·정책 동의·billing 구조를 대체하지 않고 공개 가입 요청 흐름과 연결해야 한다.

## 3. 공개 진입 구조

권장 라우팅은 다음과 같다.

- `wafl.co.kr`: 공개 홈페이지
- `app.wafl.co.kr`: 로그인 후 서비스
- 공개 홈페이지 CTA: `가입 요청`, `기능 보기`, `요금제 보기`, `로그인`
- 가입 요청 경로 예시: `/signup` 또는 `/request-access`

도메인과 배포 구조는 구매 및 운영 결정 전까지 구성 가능 계약으로만 유지한다.

## 4. 전체 가입 흐름

1. 공개 홈페이지에서 가입 요청을 시작한다.
2. 최초 고객사 관리자 본인 인증 또는 로그인 수단을 확인한다.
3. 회사 정보와 담당자 정보를 입력한다.
4. 필수 정책 문서를 각각 열람하고 동의한다.
5. 선택 동의는 필수 동의와 분리한다.
6. 가입 요청을 제출한다.
7. 요청은 시스템 관리자 검토 Queue에 들어간다.
8. 시스템 관리자는 승인, 보완 요청, 거절 중 하나를 선택한다.
9. 승인 시 하나의 idempotent provisioning transaction/job을 실행한다.
10. 회사, 최초 관리자, Trial, quota, 기본 기준정보가 모두 생성된 뒤에만 활성화한다.
11. 가입 요청자에게 결과와 첫 로그인 안내를 보낸다.

결제는 초기 공개 오픈 단계에서 승인과 분리할 수 있다. 기본 계약은 Trial 승인 후 시작이며 유료 결제는 Trial 중 또는 종료 전에 연결한다.

## 5. 가입 요청 입력 항목

### 5.1 회사 정보

- 회사명 또는 상호
- 대표자명
- 사업자등록번호
- 업종/업태
- 사업장 주소
- 대표 전화번호
- 사업자등록증 파일
- 대표 이미지 또는 로고(선택)
- 예상 사용자 수
- 문의 또는 도입 목적(선택)

### 5.2 최초 고객사 관리자

- 이름
- 이메일
- 휴대전화번호
- 로그인 제공자/계정 식별자
- 직책(선택)
- 회사와의 관계 확인 항목

### 5.3 중복 검증

- 사업자등록번호는 normalized value로 중복 검사한다.
- 관리자 이메일은 normalized lowercase로 검사한다.
- 같은 사용자가 여러 회사를 관리할 수 있는 구조와 중복 가입 요청을 구분한다.
- 동일 회사의 `draft`, `submitted`, `reviewing`, `changes_requested` 요청이 있으면 새 요청보다 기존 요청 재개를 우선한다.
- 거절 또는 취소 요청의 재신청 정책은 기존 audit history를 보존한다.

## 6. 정책 동의 계약

### 6.1 필수 동의

- 서비스 이용약관
- 개인정보처리방침 확인 및 개인정보 수집·이용
- 요금제·결제·환불 정책
- 파일·저장소 보관 및 삭제 정책
- 서비스 운영 정책
- 정책 변경 고지 및 재동의 정책

실제 법적 필수성은 공개 전 법률 검토를 거친다. 제품 DB는 필수/선택을 문서별로 관리할 수 있어야 한다.

### 6.2 선택 동의

- 마케팅 정보 수신
- 제품 업데이트·교육 콘텐츠 수신
- 선택적 제3자 제공 또는 별도 기능 동의가 생기는 경우 개별 항목

선택 동의 거부로 가입 요청을 차단하지 않는다.

### 6.3 동의 증적

각 동의는 다음 정보를 저장한다.

- policy/document code
- 문서 version
- 공개된 content hash 또는 immutable revision
- 필수/선택 구분
- 동의/거부 값
- 동의 일시
- 사용자/가입 요청 식별자
- 채널과 화면
- locale
- IP와 user agent는 개인정보처리방침 및 최소수집 원칙에 맞는 범위에서만 저장
- 철회 또는 재동의 이력

체크박스 하나로 모든 문서에 포괄 동의시키지 않고 문서별 동의 기록을 유지한다. 전체 동의 UI를 제공하더라도 개별 기록으로 분해한다.

## 7. 가입 요청 상태

| 상태 | 의미 | 허용 동작 |
| --- | --- | --- |
| `draft` | 작성 중 | 수정, 삭제, 제출 |
| `submitted` | 제출 완료 | 요청자 조회, 시스템 검토 시작 |
| `reviewing` | 시스템 관리자 검토 중 | 내부 메모, 승인/보완/거절 |
| `changes_requested` | 보완 요청 | 요청자 수정 및 재제출 |
| `approved` | 승인 및 provisioning 완료 | 로그인·Trial 시작 |
| `rejected` | 거절 | 사유 조회, 정책에 따른 재신청 |
| `canceled` | 요청자 취소 | 읽기 전용 이력 보존 |
| `provisioning_failed` | 승인 후 생성 실패 | 시스템 관리자 복구·재시도 |

승인 상태는 회사 생성만 성공하고 subscription 또는 기본 기준정보 생성이 실패한 부분 성공 상태를 허용하지 않는다.

## 8. 시스템 관리자 가입 요청 Queue

필수 표시 항목:

- 요청 일시와 경과 시간
- 회사명, 사업자번호, 요청자
- 중복·위험·누락 상태
- 약관 동의 완전성
- 사업자등록증 상태
- 검토 상태와 담당자
- Trial 및 선택 요금제
- 최근 보완/거절 사유
- provisioning 상태

허용 작업:

- 검토 시작
- 보완 요청
- 승인
- 거절
- 내부 메모
- 중복 후보 비교
- 감사 로그 조회
- 실패한 provisioning 안전 재시도

사업자등록증과 개인정보 접근에는 목적·사유·접근자·시각 로그를 남긴다.

## 9. 승인 및 provisioning 순서

승인 명령은 idempotency key를 가진 단일 orchestration으로 처리한다.

1. 요청 상태와 필수 동의 version을 재검증한다.
2. 사업자번호와 관리자 계정 중복을 다시 확인한다.
3. 회사 record를 생성한다.
4. 최초 고객사 관리자 membership을 생성한다.
5. Trial subscription을 생성한다.
6. Trial 시작일과 종료일을 확정한다.
7. Trial storage quota 100MB와 멤버 3명 제한을 적용한다.
8. 시스템 기본 단위·공정·제품 분류·사이즈 스펙을 provisioning한다.
9. 회사 설정과 onboarding 상태를 생성한다.
10. 감사 로그와 provisioning result를 기록한다.
11. 모든 단계 성공 후 요청을 `approved`로 전환한다.
12. 첫 로그인 안내를 발송한다.

재시도 시 이미 생성된 동일 회사, membership, subscription, catalog를 중복 생성하지 않는다.

## 10. Trial과 결제 경계

현재 canonical 기준:

- Trial 기간: 7일
- 저장공간: 100MB
- 멤버: 3명
- 데이터 내보내기: 제한

기본 흐름:

- 시스템 관리자 승인 완료 시 Trial이 시작된다.
- 카드 등록은 Trial 시작의 필수 조건으로 두지 않는 것을 기본안으로 한다.
- Trial 중 요금제 선택과 결제수단 등록을 유도한다.
- Trial 종료 전 안내와 종료 후 제한 UX는 별도 구현 PB로 분리한다.
- 실제 PG, 자동결제, 세금계산서, 환불은 이번 Sprint 범위 밖이다.

결제 선행 여부는 상업 정책 확정 전 Codex가 임의 구현하지 않는다.

## 11. 실패와 복구

- 승인 전 validation 실패는 상태를 바꾸지 않는다.
- provisioning 중 실패하면 `provisioning_failed`와 단계별 evidence를 남긴다.
- 재시도는 동일 idempotency key 또는 request id 기준으로 수행한다.
- 부분 생성 데이터를 수동 삭제하지 않고 repair/retry 절차를 사용한다.
- production DB/R2 수정, purge, reset은 별도 승인 없이는 금지한다.
- 사용자에게는 내부 오류 상세 대신 처리 지연과 문의 경로를 보여준다.

## 12. 권한과 감사

- 가입 요청자는 자기 요청만 조회·수정한다.
- 시스템 관리자만 전체 Queue를 본다.
- 검토 담당자와 승인자를 분리할 수 있도록 actor 필드를 남긴다.
- 승인, 거절, 보완 요청, 민감 파일 접근, provisioning 재시도는 감사 로그 대상이다.
- 향후 mandatory four-eyes 목록이 확정되기 전에는 운영 승인 명령을 확장하지 않는다.

## 13. Codex 구현 분리안

### Sprint A: Public request UI
- 공개 가입 요청 폼
- 정책 문서 modal/link
- draft 저장과 제출
- 중복·validation UX

### Sprint B: Consent evidence
- policy revision 조회
- 문서별 동의 저장
- 재동의와 철회 이력
- contract tests

### Sprint C: System-admin Queue
- 필터·상세·보완·승인·거절
- 민감 파일 접근 로그
- permission tests

### Sprint D: Provisioning orchestration
- idempotent 회사/관리자/Trial/quota/catalog 생성
- 실패 복구와 evidence
- dev/test simulator

### Sprint E: Trial/Payment follow-up
- 종료 안내
- 요금제 선택
- PG 및 결제는 별도 승인 후

DB migration이 필요하면 UI Sprint와 분리해 계획·dry-run·rollback을 먼저 제시한다.

## 14. 완료 조건

- 공개 가입 요청에서 승인까지 상태 전이가 명확하다.
- 필수 정책 동의가 문서 version별 증적으로 저장된다.
- 승인 후 회사와 Trial, quota, 기본 데이터가 중복 없이 생성된다.
- 실패 시 부분 성공을 활성 회사로 노출하지 않는다.
- 시스템 관리자 Queue와 민감 정보 접근이 감사 가능하다.
- 미확정 결제·법무 정책을 코드가 임의 결정하지 않는다.

## 15. 사용자 결정 대기

다음은 구현 전 또는 상업 오픈 전에 확정해야 한다.

- 사업자등록증을 가입 요청 필수로 할지
- 관리자 승인 전에 이메일/휴대전화 인증을 어디까지 요구할지
- 카드 등록 없이 Trial을 시작할지
- Trial 종료 후 읽기 전용 유예기간
- 거절·취소된 가입 요청과 첨부파일 보존기간
- 동일 사용자의 복수 회사 관리자 허용 정책
- 가입 승인 명령을 mandatory four-eyes 대상으로 둘지
- 마케팅 동의 채널과 철회 방식
