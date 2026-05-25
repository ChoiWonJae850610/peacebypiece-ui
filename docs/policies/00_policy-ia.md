# Policy IA

## 문서 목적
WAFL에서 시스템관리자가 관리하고 고객사 관리자가 열람해야 할 정책 문서의 구조를 정의한다.

이 문서는 법무 검토 전 기획/설계 문서이며, 실제 서비스 적용 전 사업자 정보, 결제대행사, 환불 기준, 보관 기간, 개인정보 처리 위탁사를 확정해야 한다.

## 정책 문서 버전
- Current Policy Version: P-0.91.1
- Based App Version: 0.15.73
- App Version 변경 없음

## 시스템관리자 IA

```text
시스템관리자
└─ 정책/약관 관리
   ├─ 정책 문서 목록
   ├─ 이용약관
   ├─ 개인정보처리방침
   ├─ 결제 및 환불 정책
   ├─ 파일/저장소 보관 정책
   ├─ 서비스 운영 정책
   ├─ 정책 변경 고지
   └─ 정책 변경 이력
```

## 고객사 관리자 IA

```text
고객사 관리자
├─ 회사/계정 설정
│  └─ 약관 및 정책
│     ├─ 이용약관
│     ├─ 개인정보처리방침
│     ├─ 결제 및 환불 정책
│     ├─ 파일/저장소 보관 정책
│     └─ 서비스 운영 정책
└─ 화면 하단 링크
   ├─ 이용약관
   └─ 개인정보처리방침
```

## 필수 문서

### 1. 개인정보처리방침
고객사 관리자, 멤버, 담당자, 회사 정보, 결제 기록, 첨부파일 메타데이터 등 개인정보 또는 개인정보와 연결될 수 있는 정보를 어떻게 처리하는지 설명한다.

예정 파일:
- docs/policies/01_privacy-policy-draft.md

### 2. 이용약관
서비스 이용계약, 계정, 권한, 고객사의 의무, 회사의 의무, 서비스 제한, 해지, 책임 제한을 설명한다.

예정 파일:
- docs/policies/02_terms-of-service-draft.md

### 3. 결제 및 환불 정책
요금제, 정기결제, 카드결제, 결제 실패, 환불, 해지, 영수증, 세금계산서 요청 기준을 설명한다.

예정 파일:
- docs/policies/03_billing-refund-policy-draft.md

### 4. 파일/저장소 보관 정책
작업지시서 첨부파일, 디자인 이미지, 문서 파일, 메모 첨부, 회사 정보 파일의 저장, 접근, 삭제, 복원, 영구 삭제 기준을 설명한다.

예정 파일:
- docs/policies/04_storage-data-retention-policy-draft.md

### 5. 서비스 운영 정책
점검, 장애, 고객지원, 데이터 복구, 기능 변경, 부정 이용 대응 기준을 설명한다.

예정 파일:
- docs/policies/05_service-operation-policy-draft.md

### 6. 정책 변경 고지 및 동의 정책
정책 변경 시 고지, 시행일, 재동의 필요 여부, 이전 버전 보관 기준을 설명한다.

예정 파일:
- docs/policies/06_policy-consent-change-notice-draft.md

## 고객사에게 상시 노출할 문서
- 이용약관
- 개인정보처리방침
- 결제 및 환불 정책
- 파일/저장소 보관 정책

## 가입/승인 요청 시 동의 받을 문서
- 이용약관
- 개인정보처리방침

## 유료 결제 전 확인시킬 문서
- 결제 및 환불 정책
- 파일/저장소 보관 정책

## 정책 문서와 기능 gap 관리
정책 문구에 다음과 같은 기능이 필요한 경우 `90_policy-feature-gap.md`에 기록한다.

- 아직 화면이 없는 경우
- 아직 DB 컬럼 또는 상태값이 없는 경우
- 아직 관리자 처리 기능이 없는 경우
- 아직 고객사 다운로드/export 기능이 없는 경우
- 실제 삭제/복원/purge 흐름과 정책 문구가 맞지 않는 경우

## 적용 원칙
1. 정책 문서는 먼저 초안으로 작성한다.
2. 초안 작성 중 발견되는 미구현 기능은 feature gap으로 분리한다.
3. feature gap은 앱 개발 버전 로드맵으로 넘긴다.
4. 정책 문서 대화창에서는 docs 폴더만 수정한다.
5. 소스 코드, DB, APP_VERSION은 변경하지 않는다.


## 추가 정책 문서

### 7. 데이터 내보내기 정책
고객사 관리자가 서비스 이용기간 중 업무자료를 내려받을 수 있는 데이터 내보내기 기능의 범위, 방식, 다운로드 가능 기간, 제외 대상을 설명한다.

작성 파일:
- docs/policies/07_data-export-policy-draft.md

## 요금제 및 저장소 정책 문서
무료 체험, 유료 요금제, 저장소, 멤버 수, 데이터 내보내기 횟수, 추가 저장소, 저장소 초과 기준을 설명한다.

작성 파일:
- docs/policies/08_plan-storage-policy-draft.md

## 결제 실패·장기 미납 안내 및 정책 변경 고지 기준 문서
결제 실패 안내, 장기 미납 안내, 데이터 삭제 로그 UI, 약관 변경 재동의 기준을 설명한다.

작성 파일:
- docs/policies/09_payment-notice-retention-policy-draft.md

## 정책 변경 고지 및 동의 정책 문서
정책 변경 고지 방식, 재동의 필요 기준, 재동의하지 않은 경우, 동의 이력 관리, 정책 변경 이력 공개 기준을 설명한다.

작성 파일:
- docs/policies/06_policy-notice-agreement-policy-draft.md

## 정책 문서 공개 화면 기준 문서
고객사 관리자 정책 및 약관 메뉴, 일반 멤버 열람 범위, 정책 변경 이력 표시, 내부/고객 공개 문서 분리 기준을 설명한다.

작성 파일:
- docs/policies/10_policy-public-display-policy-draft.md

## 정책 문서 전체 목차 및 상호참조 문서
정책 문서별 역할, 내부/고객 공개 문서 구분, 고객 공개 v1.0 전환 전 제거 항목과 확정 필요사항, 개발 연결 우선순위를 설명한다.

작성 파일:
- docs/policies/11_policy-cross-reference-check.md

## P-0.91.18 WAFL 명칭 및 이메일 기준
고객 공개 서비스명은 WAFL로 한다.

고객 공개 문서에서는 PeaceByPiece 명칭을 제거하고 WAFL만 사용한다.

이메일 역할:
- 대표/일반 문의: hello@wafl.co.kr
- 고객지원: support@wafl.co.kr
- 자동 발신/알림: no-reply@wafl.co.kr
- 개인정보/정책 문의: privacy@wafl.co.kr
- 결제 문의: billing@wafl.co.kr

## 고객 공개 v1.0 문서 변환 기준
내부 정책 문서 P-0.91.x를 고객 공개 v1.0 문서로 전환할 때 제거할 항목, 확정값 치환 기준, 문서 작성 순서, 공개 전 체크리스트를 설명한다.

작성 파일:
- docs/policies/12_public-v1-conversion-guide.md

## 고객 공개 이용약관 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 이용약관 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 시행일, PG사, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/terms-of-service-v1-draft.md

## 고객 공개 개인정보처리방침 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 개인정보처리방침 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 처리위탁사, 개인정보 보호책임자 또는 담당자, 시행일, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/privacy-policy-v1-draft.md

## 고객 공개 결제 및 환불 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 결제 및 환불 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 PG사, 결제 연동 방식, 시행일, 법무/세무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/billing-refund-policy-v1-draft.md

## 고객 공개 파일 및 저장소 보관 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 파일 및 저장소 보관 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 시행일, 도메인/이메일 계정, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/storage-retention-policy-v1-draft.md

## 고객 공개 데이터 내보내기 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 데이터 내보내기 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 시행일, 도메인/이메일 계정, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/data-export-policy-v1-draft.md

## 고객 공개 서비스 운영 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 서비스 운영 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 시행일, 도메인/이메일 계정, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/service-operation-policy-v1-draft.md

## 고객 공개 정책 변경 고지 및 동의 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 정책 변경 고지 및 동의 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, 시행일, 도메인/이메일 계정, 법무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/policy-notice-agreement-policy-v1-draft.md

## 고객 공개 요금제 및 저장소 정책 v1.0 초안
내부 정책 문서를 고객 공개용 WAFL 요금제 및 저장소 정책 v1.0 초안으로 변환한 문서다. 실제 공개 전 사업자 정보, PG사, 결제 연동 방식, 시행일, 법무/세무 검토 여부를 확정해야 한다.

작성 파일:
- docs/policies/public/plan-storage-policy-v1-draft.md

## 고객 공개 정책 문서 전체 목록 및 공개 전 체크리스트
고객 공개 v1.0 정책 문서 전체 목록, 공개 전 치환값, 문서별 확인사항, 정책 화면 기준, 핵심 수치 정합성 기준을 설명한다.

작성 파일:
- docs/policies/public-policy-release-checklist.md

## 고객 공개 v1.0 정책 문서 정합성 점검
docs/policies/public 하위 고객 공개 초안 문서들의 서비스명, 이메일, 핵심 수치, 공개 전 제거 표현, 문서별 다음 조치를 점검한다.

작성 파일:
- docs/policies/public-v1-consistency-check.md

## 고객 공개 v1.0 치환값 관리표
고객 공개 v1.0 문서에서 실제값으로 치환해야 할 사업자 정보, 이메일, PG사, 개인정보 보호책임자, 처리위탁사, 시행일, 법무/세무 검토 여부를 추적한다.

작성 파일:
- docs/policies/public-v1-replacement-values.md

## 고객 공개 v1.0 공개 전 제거 표현 위치 추적
docs/policies/public 하위 고객 공개 초안 문서에서 “초안”, “확정 필요”, “내부 기준 버전” 등 공개 전 제거/치환해야 할 표현 위치를 추적한다.

작성 파일:
- docs/policies/public-v1-removal-tracking.md

## 고객 공개 v1.0 문서 헤더 및 파일명 기준
고객 공개 최종본의 헤더 형식, 초안 헤더 제거 기준, `-draft` 파일명과 최종 공개 파일명 기준, 화면 표시명과 노출 순서를 설명한다.

작성 파일:
- docs/policies/public-v1-header-filename-rules.md

## 고객 공개 v1.0 최종본 차단 조건 점검
docs/policies/public 하위 고객 공개 초안 문서에 남아 있으면 안 되는 차단 표현을 검사하고, 최종 공개본 전환 가능 여부를 판단한다.

작성 파일:
- docs/policies/public-v1-final-blocker-check.md

## 정책 기반 개발 우선순위
정책 문서에서 도출된 개발 필요사항을 실제 코드 작업 순서로 정리한다. 정책 및 약관 화면, 동의 이력, 고객사 승인 요청 약관 동의, 요금제/무료체험/결제 실패, 데이터 내보내기, 저장소/휴지통, 장기 미납, 재동의, 시스템관리자 접근 로그, PG 연동 순서로 개발 우선순위를 제시한다.

작성 파일:
- docs/policies/policy-driven-development-priority.md
