# WAFL 정책 문서 인덱스

이 폴더는 WAFL 서비스의 정책/약관/고객 공개 문서 초안과 정책 기반 개발 점검 문서를 보관한다.

## 문서 세트 기준

```txt
정책 문서 묶음: P-0.91.34
앱 기준 버전: 0.16.46
적용 범위: docs/policies 문서 정리
APP_VERSION 변경: 없음
소스 코드/DB 변경: 없음
```

## 폴더 구조

```txt
docs/policies/
├─ 00_policy-ia.md
├─ 01_privacy-policy-draft.md
├─ 02_terms-of-service-draft.md
├─ 03_billing-refund-policy-draft.md
├─ 04_storage-data-retention-policy-draft.md
├─ 05_service-operation-policy-draft.md
├─ 06_policy-notice-agreement-policy-draft.md
├─ 07_data-export-policy-draft.md
├─ 08_plan-storage-policy-draft.md
├─ 09_payment-notice-retention-policy-draft.md
├─ 10_policy-public-display-policy-draft.md
├─ 11_policy-cross-reference-check.md
├─ 12_public-v1-conversion-guide.md
├─ 90_policy-feature-gap.md
├─ 91_policy-decisions.md
├─ POLICY_WORKLOG.md
├─ policy-driven-development-priority.md
├─ public-*.md
└─ public/
```

## 현재 작업 기준 문서

### 정책 설계/운영 기준

- `00_policy-ia.md` — 시스템관리자/고객사관리자 정책 IA
- `11_policy-cross-reference-check.md` — 정책 문서 간 참조/중복 점검
- `12_public-v1-conversion-guide.md` — 공개용 v1 전환 기준
- `90_policy-feature-gap.md` — 정책 문구와 미구현 기능 간 gap 목록
- `91_policy-decisions.md` — 확정/보류 정책 결정 기록
- `POLICY_WORKLOG.md` — 정책 문서 작업 이력
- `policy-driven-development-priority.md` — 정책 기반 개발 우선순위

### 내부 초안

- `01_privacy-policy-draft.md` — 개인정보처리방침 초안
- `02_terms-of-service-draft.md` — 이용약관 초안
- `03_billing-refund-policy-draft.md` — 결제 및 환불 정책 초안
- `04_storage-data-retention-policy-draft.md` — 파일/저장소 보관 정책 초안
- `05_service-operation-policy-draft.md` — 서비스 운영 정책 초안
- `06_policy-notice-agreement-policy-draft.md` — 정책 변경 고지 및 동의 정책 초안
- `07_data-export-policy-draft.md` — 데이터 내보내기 정책 초안
- `08_plan-storage-policy-draft.md` — 요금제/저장소 정책 초안
- `09_payment-notice-retention-policy-draft.md` — 결제 고지/보관 정책 초안
- `10_policy-public-display-policy-draft.md` — 고객 공개 정책 표시 기준 초안

### 고객 공개 v1 초안

`public/` 폴더는 고객 화면에 노출할 공개용 v1 초안을 보관한다.

- `public/privacy-policy-v1-draft.md`
- `public/terms-of-service-v1-draft.md`
- `public/billing-refund-policy-v1-draft.md`
- `public/storage-retention-policy-v1-draft.md`
- `public/service-operation-policy-v1-draft.md`
- `public/policy-notice-agreement-policy-v1-draft.md`
- `public/data-export-policy-v1-draft.md`
- `public/plan-storage-policy-v1-draft.md`

## 적용 원칙

1. 정책 문서는 법무 검토 전 기획/설계 문서로 취급한다.
2. 고객 공개 전에는 사업자명, 대표자명, 사업장 주소, 고객지원 이메일, 도메인, PG사, 위탁사, 보관 기간을 확정해야 한다.
3. 정책 문구가 아직 구현되지 않은 기능을 전제하면 `90_policy-feature-gap.md`에 먼저 기록한다.
4. 정책 문서 변경은 기본적으로 `docs/policies` 안에서 처리한다.
5. 정책 문서 정리만 하는 경우 앱 `APP_VERSION`, DB schema, 소스 코드는 변경하지 않는다.
