# 시스템관리자 회사 파일 검토 설계 1차 (0.19.98)

## 목적

0.19.95~0.19.97에서 추가한 고객사 회사 파일 DB/API/UI/R2 업로드 흐름 이후, 시스템관리자가 사업자등록증을 검토하는 기준과 화면/API 연결 범위를 먼저 확정한다.

이 버전은 설계 문서 단계이며, DB schema, API route, R2 업로드 흐름, 고객사 환경설정 UI는 변경하지 않는다.

## 검토 대상

| file_type | 검토 필요 여부 | 기본 review_status | 설명 |
| --- | --- | --- | --- |
| representative_image | 불필요 | not_required | 고객사 대표 이미지. 서비스 운영상 수동 승인 대상이 아니다. |
| business_registration | 필요 | pending_review | 사업자등록증 또는 사업자 확인 문서. 시스템관리자 승인/반려 대상이다. |

대표 이미지는 부적절한 이미지 신고/운영 차단 정책이 필요해질 수 있으나, 0.19.98 범위에서는 사업자등록증 검토와 분리한다.

## 검토 상태 기준

`company_files.review_status`는 다음 기준으로 사용한다.

| 상태 | 의미 | 고객사 표시 | 시스템관리자 표시 |
| --- | --- | --- | --- |
| not_required | 검토 대상 아님 | 등록 완료 | 검토 목록 제외 |
| pending_review | 검토 대기 | 검토 대기 | 검토 필요 목록 표시 |
| approved | 승인 완료 | 승인 완료 | 승인 이력 표시 |
| rejected | 반려 | 반려됨 + 재업로드 안내 | 반려 이력 표시 |

사업자등록증 파일을 새로 업로드하면 기본값은 `pending_review`다. 같은 `file_type` 재등록 시 기존 활성 파일은 교체 처리되고 새 파일만 활성 검토 대상이 된다.

## 시스템관리자 화면 연결 위치

1차 구현 위치는 시스템관리자 고객사 상세 화면이 적합하다.

- 고객사 승인 요청 검토 화면과 회사 파일 검토를 완전히 합치지 않는다.
- 회사 승인 요청은 회사 계정 생성/승인 흐름이고, 사업자등록증 검토는 회사 운영 중에도 파일이 교체될 수 있는 별도 반복 업무다.
- 시스템관리자 홈 또는 고객사 목록에서는 `사업자등록증 검토 대기` 개수만 요약 표시할 수 있다.

권장 IA:

```txt
/system
  └─ 고객사 관리
      └─ 고객사 상세
          ├─ 기본 정보
          ├─ 승인/상태 정보
          ├─ 회사 파일
          │   ├─ 대표 이미지
          │   └─ 사업자등록증 검토
          └─ 운영 이력
```

## 승인/반려 동작

### 승인

승인 시 다음 값을 저장한다.

- `review_status = 'approved'`
- `reviewed_at = now()`
- `reviewed_by_system_user_id = current system user id`
- `review_note`는 선택 입력

### 반려

반려 시 다음 값을 저장한다.

- `review_status = 'rejected'`
- `reviewed_at = now()`
- `reviewed_by_system_user_id = current system user id`
- `review_note` 또는 구조화된 반려 사유 저장

반려 사유는 1차에서는 자유 텍스트로 시작하되, UI에는 아래 사유 후보를 제공한다.

```txt
- 파일이 열리지 않음
- 사업자 정보 식별 불가
- 회사명 또는 사업자등록번호 불일치
- 유효하지 않은 문서
- 기타
```

향후 통계/자동 안내가 필요해지면 `review_reason_code` 컬럼을 추가해 구조화한다. 지금은 schema 확장을 최소화하기 위해 기존 `review_note` 중심으로 설계한다.

## 파일 열람 기준

시스템관리자는 검토 대상 파일을 열람할 수 있어야 한다. 다만 회사 파일에는 사업자등록증 같은 민감 운영 문서가 포함되므로 다음 기준이 필요하다.

- 파일 URL은 영구 공개 URL로 노출하지 않는다.
- 열람 시 단기 signed URL 또는 R2 Worker download proxy를 사용한다.
- 시스템관리자 파일 열람은 감사 로그 대상으로 분리한다.
- 0.19.99에서는 열람 URL API를 최소 skeleton으로 두고, 감사 로그는 별도 버전으로 분리할 수 있다.

## 감사 로그 분리 기준

0.19.98에서는 감사 로그 DB/API를 추가하지 않는다.

다만 0.19.99 이후 구현 시 다음 이벤트는 시스템관리자 감사 로그 후보로 본다.

| 이벤트 | 기록 필요 정보 |
| --- | --- |
| business_registration_viewed | system_user_id, company_id, company_file_id, viewed_at |
| business_registration_approved | system_user_id, company_id, company_file_id, review_note, reviewed_at |
| business_registration_rejected | system_user_id, company_id, company_file_id, review_note, reviewed_at |

고객사 관리자에게는 세부 열람자 로그를 그대로 노출하지 않고, 파일 상태와 승인/반려 결과만 표시한다.

## API 구현 방향

0.19.99 구현 후보 API:

```txt
GET  /api/system/company-files?reviewStatus=pending_review
GET  /api/system/companies/[companyId]/company-files
POST /api/system/company-files/[fileId]/review
POST /api/system/company-files/[fileId]/view-url
```

API route는 thin하게 유지하고, 실제 조회/검토 로직은 `lib/system/company-files/` 하위 repository/service로 분리한다.

## 고객사 환경설정 표시 기준

고객사 환경설정의 회사 파일 섹션은 다음 상태 문구를 표시한다.

| 상태 | 고객사 안내 |
| --- | --- |
| pending_review | 사업자등록증 검토 대기 중입니다. |
| approved | 사업자등록증 검토가 완료되었습니다. |
| rejected | 사업자등록증이 반려되었습니다. 새 파일을 다시 등록해 주세요. |

반려 사유는 고객사 관리자에게 보여도 되는 문장으로 정제해 표시한다. 시스템 내부 메모와 고객 공개 반려 사유를 분리할 필요가 생기면 `review_note_public` 같은 별도 컬럼을 검토한다.

## 자동테스트 기준

0.19.98은 설계 문서 단계이므로 기존 자동테스트 범위를 변경하지 않는다.

0.19.99 구현 시 추가할 테스트:

- DB/API smoke: pending_review 사업자등록증 목록 조회
- DB/API smoke: 승인 처리 후 review_status/reviewed_at/reviewer 저장
- DB/API smoke: 반려 처리 후 review_note 저장
- E2E: 시스템관리자 회사 상세에서 사업자등록증 검토 카드 표시
- E2E: 승인/반려 mock 동작 후 상태 문구 변경

## 제외 범위

- 실제 시스템관리자 UI/API 구현
- 파일 다운로드/미리보기 API 구현
- 감사 로그 DB/API 구현
- 고객사 환경설정 반려 사유 상세 표시 구현
- R2 오브젝트 삭제/정리

위 항목은 0.19.99 이후 구현 대상으로 분리한다.
