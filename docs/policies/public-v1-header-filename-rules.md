# 고객 공개 v1.0 문서 헤더 및 파일명 기준

## 문서 상태
- Policy Version: 0.16.48
- Based App Version: 0.16.48
- 문서 성격: 고객 공개 v1.0 문서 형식 기준
- 적용 대상: docs/policies/public 하위 고객 공개 문서

## 1. 목적
이 문서는 WAFL 고객 공개 정책 문서의 최종 공개본 헤더 형식, 초안 헤더 제거 기준, 파일명 기준, 화면 표시명 기준을 정리한다.

0.16.48 내부 정책 문서와 v1.0 고객 공개 문서의 형식을 분리하여, 고객에게 보이는 문서에는 내부 작업 정보가 노출되지 않도록 한다.

## 2. 내부 문서와 고객 공개 문서 구분

### 2.1 내부 문서
내부 문서는 정책 설계, 의사결정, 개발 gap, 공개 전 검토 내용을 관리한다.

내부 문서에는 다음 정보를 포함할 수 있다.

- Policy Version: 0.16.48
- Based App Version
- 문서 성격
- 개발 필요사항
- feature gap
- 내부 검토 메모
- 미정 사항
- 공개 전 치환값

### 2.2 고객 공개 문서
고객 공개 문서는 고객이 실제로 읽는 약관/정책 문서다.

고객 공개 문서에는 다음 정보를 포함하지 않는다.

- Policy Version: 0.16.48
- Based App Version
- 문서 성격
- 고객 공개 전 검토용 초안 문구
- 변환 연습용 문구
- 개발 필요사항
- feature gap
- 내부 검토 메모
- 확정 필요 문구

## 3. 고객 공개 초안 헤더 형식
현재 고객 공개 초안 문서는 다음과 같은 헤더를 사용할 수 있다.

```text
# WAFL 이용약관 v1.0 초안

## 문서 상태
- 공개 버전: v1.0 초안
- 내부 기준 버전: 0.16.48
- 시행일: [시행일 확정 필요]
- 회사명: [사업자명 확정 필요]
- 대표자: [대표자명 확정 필요]
- 사업장 주소: [사업장 주소 확정 필요]
- 사업자등록번호: [사업자등록번호 확정 필요]
- 고객지원: support@wafl.co.kr
- 문서 성격: 고객 공개 전 변환 연습용 초안

본 문서는 고객 공개 전 검토용 초안입니다.
```

이 형식은 내부 검토용으로만 사용한다.

## 4. 고객 공개 최종본 헤더 형식
실제 고객 공개 v1.0 문서는 다음 형식으로 정리한다.

```text
# WAFL 이용약관

- 버전: v1.0
- 시행일: 2026년 00월 00일
- 회사명: [실제 사업자명]
- 고객지원: support@wafl.co.kr
```

개인정보처리방침은 다음 정보를 추가할 수 있다.

```text
# WAFL 개인정보처리방침

- 버전: v1.0
- 시행일: 2026년 00월 00일
- 회사명: [실제 사업자명]
- 개인정보 보호책임자 또는 담당자: [실제 이름 또는 직책]
- 개인정보/정책 문의: privacy@wafl.co.kr
```

결제 관련 문서는 다음 정보를 추가할 수 있다.

```text
# WAFL 결제 및 환불 정책

- 버전: v1.0
- 시행일: 2026년 00월 00일
- 회사명: [실제 사업자명]
- 결제 문의: billing@wafl.co.kr
- 고객지원: support@wafl.co.kr
```

## 5. 고객 공개 최종본에서 제거할 헤더 항목
다음 항목은 고객 공개 최종본에서 제거한다.

- 공개 버전: v1.0 초안
- 내부 기준 버전
- 0.16.48
- 문서 성격
- 고객 공개 전 변환 연습용 초안
- 본 문서는 고객 공개 전 검토용 초안입니다.
- Based App Version
- Policy Version
- 시행일 확정 필요
- 사업자명 확정 필요
- 대표자명 확정 필요
- 사업장 주소 확정 필요
- 사업자등록번호 확정 필요
- PG사 확정 필요
- 법무 검토 여부

## 6. 고객 공개 파일명 기준

### 6.1 초안 파일명
고객 공개 전환 연습용 초안은 다음처럼 `-draft`를 붙인다.

```text
docs/policies/public/terms-of-service-v1-draft.md
docs/policies/public/privacy-policy-v1-draft.md
docs/policies/public/billing-refund-policy-v1-draft.md
```

### 6.2 최종 공개본 파일명
실제 고객 공개 v1.0 최종본은 `-draft`를 제거한다.

```text
docs/policies/public/terms-of-service-v1.md
docs/policies/public/privacy-policy-v1.md
docs/policies/public/billing-refund-policy-v1.md
docs/policies/public/storage-retention-policy-v1.md
docs/policies/public/data-export-policy-v1.md
docs/policies/public/service-operation-policy-v1.md
docs/policies/public/policy-notice-agreement-policy-v1.md
docs/policies/public/plan-storage-policy-v1.md
```

### 6.3 버전 증가 파일명
v1.1, v2.0 등 정책 버전이 증가하면 파일명을 분리한다.

```text
terms-of-service-v1-1.md
terms-of-service-v2.md
privacy-policy-v1-1.md
privacy-policy-v2.md
```

서비스 화면에서는 파일명보다 문서 내부 버전과 시행일을 기준으로 표시한다.

## 7. 서비스 화면 표시명 기준

| 파일 | 화면 표시명 |
| --- | --- |
| terms-of-service-v1.md | 이용약관 |
| privacy-policy-v1.md | 개인정보처리방침 |
| billing-refund-policy-v1.md | 결제 및 환불 정책 |
| plan-storage-policy-v1.md | 요금제 및 저장소 정책 |
| storage-retention-policy-v1.md | 파일 및 저장소 보관 정책 |
| data-export-policy-v1.md | 데이터 내보내기 정책 |
| service-operation-policy-v1.md | 서비스 운영 정책 |
| policy-notice-agreement-policy-v1.md | 정책 변경 고지 및 동의 정책 |

## 8. 공개 문서 화면 노출 순서
고객사 관리자 화면의 “정책 및 약관” 메뉴에서는 다음 순서를 권장한다.

1. 이용약관
2. 개인정보처리방침
3. 결제 및 환불 정책
4. 요금제 및 저장소 정책
5. 파일 및 저장소 보관 정책
6. 데이터 내보내기 정책
7. 서비스 운영 정책
8. 정책 변경 고지 및 동의 정책

일반 멤버에게는 기본적으로 다음 문서만 표시한다.

1. 이용약관
2. 개인정보처리방침

## 9. 문서 상단 안내 문구 기준
고객 공개 최종본에는 불필요한 내부 설명을 넣지 않는다.

필요한 경우 다음 정도의 안내만 허용한다.

```text
본 문서는 WAFL 서비스 이용과 관련한 기준을 설명합니다.
```

개인정보처리방침에는 다음 문구를 사용할 수 있다.

```text
회사는 WAFL 서비스를 제공함에 있어 개인정보 보호 관련 법령을 준수하고, 이용자의 개인정보를 안전하게 처리하기 위해 본 개인정보처리방침을 수립합니다.
```

## 10. 공개 전 헤더 변환 절차
고객 공개 v1.0 최종본 생성 시 다음 순서로 처리한다.

1. `-draft` 파일을 복사하여 `-draft` 없는 파일을 만든다.
2. 제목에서 “초안”을 제거한다.
3. `문서 상태` 블록을 공개용 헤더로 교체한다.
4. 내부 기준 버전 0.16.48를 제거한다.
5. 시행일을 실제 날짜로 치환한다.
6. 사업자명, 대표자명, 사업장 주소, 사업자등록번호를 실제 값으로 치환한다.
7. 고객 공개 전 검토용 문구를 삭제한다.
8. 법무/세무 검토 관련 내부 문구를 삭제한다.
9. 이메일 주소가 역할 기준과 맞는지 확인한다.
10. 파일명을 `*-v1.md` 형식으로 저장한다.

## 11. 최종 공개본 생성 전 차단 조건
다음 항목이 남아 있으면 고객 공개 최종본으로 볼 수 없다.

- 초안
- draft
- 확정 필요
- 미정
- 내부 기준 버전
- P-0.91
- 고객 공개 전
- 변환 연습용
- 법무 검토 전
- Based App Version
- Policy Version
- PeaceByPiece
- WAFLOW

## 12. 다음 작업
다음 작업은 고객 공개 v1.0 최종본 생성 전 차단 조건을 실제 public 문서에 적용해 점검하는 작업으로 진행한다.

추천:
- P-0.91.33 — 고객 공개 v1.0 최종본 차단 조건 점검
