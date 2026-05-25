# 고객 공개 정책 문서 전체 목록 및 공개 전 체크리스트

## 문서 상태
- Policy Version: P-0.91.28
- Based App Version: 0.15.73
- 문서 성격: 고객 공개 v1.0 전환 전 최종 점검용
- 적용 대상: WAFL 고객 공개 정책 문서 전체

## 1. 목적
이 문서는 WAFL 고객 공개 정책 문서 v1.0 세트의 전체 목록, 공개 전 치환값, 검토 순서, 서비스 화면 연결 기준, 법무/운영 검토 체크리스트를 정리한다.

## 2. 현재 고객 공개 초안 목록
현재 생성된 고객 공개 초안 문서는 다음과 같다.

- docs/policies/public/billing-refund-policy-v1-draft.md
- docs/policies/public/data-export-policy-v1-draft.md
- docs/policies/public/plan-storage-policy-v1-draft.md
- docs/policies/public/policy-notice-agreement-policy-v1-draft.md
- docs/policies/public/privacy-policy-v1-draft.md
- docs/policies/public/service-operation-policy-v1-draft.md
- docs/policies/public/storage-retention-policy-v1-draft.md
- docs/policies/public/terms-of-service-v1-draft.md

## 3. 고객 공개 v1.0 필수 문서 세트
고객 공개 v1.0에서 우선 공개할 문서는 다음과 같다.

### 3.1 필수 공개 문서
- 이용약관
- 개인정보처리방침

### 3.2 운영상 공개 권장 문서
- 결제 및 환불 정책
- 요금제 및 저장소 정책
- 파일 및 저장소 보관 정책
- 데이터 내보내기 정책
- 서비스 운영 정책
- 정책 변경 고지 및 동의 정책

## 4. 공개 전 공통 치환값
다음 값은 모든 고객 공개 문서에서 실제 값으로 치환해야 한다.

| 항목 | 현재 상태 | 공개 전 처리 |
| --- | --- | --- |
| 서비스명 | WAFL | 확정 |
| 회사명/사업자명 | 미정 | 사업자등록 후 확정 |
| 대표자명 | 미정 | 사업자등록 후 확정 |
| 사업장 주소 | 미정 | 사업자등록 후 확정 |
| 사업자등록번호 | 미정 | 사업자등록 후 확정 |
| 시행일 | 미정 | 공개일 또는 적용일로 확정 |
| 도메인 | wafl.co.kr 예정 | 도메인 소유권 확보 후 확정 |
| 고객지원 이메일 | support@wafl.co.kr | Google Workspace 설정 후 확정 |
| 개인정보/정책 문의 | privacy@wafl.co.kr | Google Workspace 설정 후 확정 |
| 결제 문의 | billing@wafl.co.kr | Google Workspace 설정 후 확정 |
| 자동 발신 | no-reply@wafl.co.kr | 발송 설정 후 확정 |
| 대표/일반 문의 | hello@wafl.co.kr | Google Workspace 설정 후 확정 |
| PG사 | 미정 | 결제 연동 전 확정 |
| 법무 검토 여부 | 미검토 | 공개 전 검토 여부 기록 |
| 개인정보 보호책임자/담당자 | 미정 | 사업자등록 후 지정 |
| 처리위탁사 목록 | 후보 | 실제 사용하는 수탁사만 기재 |

## 5. 이메일 역할 최종 기준
고객 공개 문서의 이메일 역할은 다음 기준을 사용한다.

- 대표/일반 문의: hello@wafl.co.kr
- 고객지원: support@wafl.co.kr
- 자동 발신/알림: no-reply@wafl.co.kr
- 개인정보/정책 문의: privacy@wafl.co.kr
- 결제 문의: billing@wafl.co.kr

고객 공개 전 확인:
- wafl.co.kr 도메인 소유권 확보
- Google Workspace 또는 동일 목적의 이메일 계정 설정
- support@wafl.co.kr 수신 테스트
- privacy@wafl.co.kr 수신 테스트
- billing@wafl.co.kr 수신 테스트
- no-reply@wafl.co.kr 발송 테스트

## 6. 문서별 공개 전 확인사항

### 6.1 이용약관
확인 문서:
- docs/policies/public/terms-of-service-v1-draft.md

공개 전 확인:
- 사업자 정보 치환
- 시행일 치환
- 고객지원 이메일 확인
- 결제/해지/장기 미납/데이터 삭제 문구 최종 검토
- 책임 제한 문구 법무 검토

### 6.2 개인정보처리방침
확인 문서:
- docs/policies/public/privacy-policy-v1-draft.md

공개 전 확인:
- 개인정보 보호책임자 또는 담당자 확정
- 처리위탁사 목록 확정
- 실제 수집 항목 확인
- 보유기간 확인
- 파기 방식 확인
- 개인정보/정책 문의 이메일 확인

### 6.3 결제 및 환불 정책
확인 문서:
- docs/policies/public/billing-refund-policy-v1-draft.md

공개 전 확인:
- PG사 확정
- 결제 연동 방식 확정
- 영수증/카드매출전표 제공 경로 확정
- 세금계산서 원칙적 미발행 문구 세무 검토
- 환불 예외 수동 처리 문구 검토

### 6.4 요금제 및 저장소 정책
확인 문서:
- docs/policies/public/plan-storage-policy-v1-draft.md

공개 전 확인:
- Trial/Lite/Flow/Studio 가격 최종 확정
- VAT 포함 표시 확인
- 추가 저장소 1GB당 월 7,000원 확정 여부 확인
- 저장소 80%/100% 기준 확인
- 데이터 내보내기 횟수 제한 확인

### 6.5 파일 및 저장소 보관 정책
확인 문서:
- docs/policies/public/storage-retention-policy-v1-draft.md

공개 전 확인:
- 고객사 휴지통 30일 확정
- 초기 자동 영구 삭제 없음 확정
- 시스템관리자 최종 확인 삭제 문구 확인
- export zip 7일 보관 문구와 데이터 내보내기 정책 일치 여부 확인
- 백업/복구 제한 문구 검토

### 6.6 데이터 내보내기 정책
확인 문서:
- docs/policies/public/data-export-policy-v1-draft.md

공개 전 확인:
- 내보내기 포함/제외 대상 확정
- 멤버정보 범위 이름/전화번호/역할 확인
- 이메일 다운로드 링크 방식 확인
- 로그인 필요 링크 방식 확인
- 다운로드 7일 만료 확인

### 6.7 서비스 운영 정책
확인 문서:
- docs/policies/public/service-operation-policy-v1-draft.md

공개 전 확인:
- 정기점검 특정 시간 미고정 문구 확인
- 고객지원 응답 시간 미보장 문구 확인
- 부정 이용 즉시 제한 대상 확인
- 서비스 전체 종료 30일 전 고지 문구 확인
- 장애 보상 원칙적 미제공 문구 법무 검토

### 6.8 정책 변경 고지 및 동의 정책
확인 문서:
- docs/policies/public/policy-notice-agreement-policy-v1-draft.md

공개 전 확인:
- 재동의 필요 변경 항목 확인
- 재동의 불필요 변경 항목 확인
- 재동의하지 않은 경우 기능 제한 문구 확인
- 정책 변경 이력 요약 표시 방식 확인
- 동의 이력 저장 항목 확인

## 7. 고객 공개 문서 화면 기준
서비스 화면에서는 다음 구조를 권장한다.

```text
고객사 관리자
└─ 환경설정
   └─ 정책 및 약관
      ├─ 이용약관
      ├─ 개인정보처리방침
      ├─ 결제 및 환불 정책
      ├─ 요금제 및 저장소 정책
      ├─ 파일 및 저장소 보관 정책
      ├─ 데이터 내보내기 정책
      ├─ 서비스 운영 정책
      └─ 정책 변경 고지 및 동의 정책
```

일반 멤버에게 기본 공개:
- 이용약관
- 개인정보처리방침

고객사 관리자 중심 공개:
- 결제 및 환불 정책
- 요금제 및 저장소 정책
- 파일 및 저장소 보관 정책
- 데이터 내보내기 정책
- 서비스 운영 정책
- 정책 변경 이력

## 8. 공개 전 제거해야 할 내부 표현
고객 공개 문서에서 다음 표현은 제거하거나 확정값으로 대체한다.

- 초안
- 변환 연습용
- 확정 필요
- 미정
- 후보
- 예정
- 검토
- 내부 기준 버전
- Policy Version
- Based App Version
- 법무 검토 전
- 개발 필요사항
- feature gap
- 내부 메모
- 파일 경로
- ChatGPT 작업 이력
- 사용자 결정 과정

## 9. 공개 전 검토 순서
고객 공개 v1.0 전환 전 검토 순서는 다음을 권장한다.

1. 사업자 정보 확정
2. 도메인 및 이메일 계정 확정
3. PG사 확정
4. 개인정보 보호책임자/담당자 확정
5. 처리위탁사 확정
6. 정책 시행일 확정
7. 내부 초안에서 공개 문서로 문구 치환
8. 문서 간 용어/수치 일치 확인
9. 법무/세무 검토
10. 서비스 화면 연결
11. 동의 이력 저장 테스트
12. 고객 공개

## 10. 문서 간 일치시켜야 할 핵심 수치
다음 수치는 모든 정책 문서에서 동일해야 한다.

- Trial: 7일, 100MB, 멤버 3명, 데이터 내보내기 제한
- Lite: 9,900원, 500MB, 멤버 3명, 데이터 내보내기 월 1회
- Flow: 19,900원, 1.5GB, 멤버 10명, 데이터 내보내기 월 3회
- Studio: 39,900원, 5GB, 멤버 30명, 데이터 내보내기 월 10회
- 추가 저장소: 1GB당 월 7,000원
- 저장소 80% 도달: 안내
- 저장소 100% 초과: 새 파일 업로드 제한
- 고객사 휴지통: 30일
- export zip 다운로드 가능 기간: 7일
- 장기 미납: 30일 안내, 60일 삭제 예정 안내, 90일 삭제 가능
- 서비스 전체 종료: 원칙적으로 30일 전 사전 고지
- 해지 취소: 다음 결제일 전날 23:59까지

## 11. 다음 작업
다음 작업은 고객 공개 문서 전체의 용어, 수치, 이메일, 공개 전 치환값을 점검하는 정합성 점검으로 진행한다.

추천:
- P-0.91.29 — 고객 공개 v1.0 정책 문서 정합성 점검
