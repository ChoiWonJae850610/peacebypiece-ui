# 고객사 회사 파일 DB/API 1차 — 0.19.95

## 목적

고객사 회사 정보에서 사용하는 대표 이미지와 사업자등록증 파일을 별도 업무 테이블로 관리하기 위한 DB/API 1차 기준을 추가한다.

이번 버전은 실제 R2 업로드 연결 전 단계다. API는 파일 바이너리를 받지 않고, 업로드 완료 후 저장될 메타데이터 구조를 먼저 고정한다.

## DB 기준

신규 테이블: `company_files`

주요 컬럼:

- `company_id`: 고객사 범위
- `file_type`: 파일 용도
- `original_name`: 원본 파일명
- `storage_key`: R2 저장 키 또는 이후 업로드 완료 시 기록될 저장 키
- `mime_type`: MIME 타입
- `size_bytes`: 파일 크기
- `review_status`: 시스템관리자 검토 상태
- `uploaded_by_user_id`: 업로드 사용자
- `reviewed_by_system_user_id`: 검토 시스템관리자
- `reviewed_at`: 검토 시각
- `rejection_reason`: 반려 사유
- `replaced_by_file_id`: 교체된 경우 새 파일 ID
- `deleted_at`: 현재 활성 파일 제외 기준

## file_type 기준

| file_type | 의미 | 기본 review_status |
| --- | --- | --- |
| `representative_image` | 회사 대표 이미지 | `not_required` |
| `business_registration` | 사업자등록증 | `pending_review` |

## review_status 기준

| review_status | 의미 |
| --- | --- |
| `not_required` | 검토 불필요 |
| `pending_review` | 검토 대기 |
| `approved` | 승인 |
| `rejected` | 반려 |

## API skeleton

경로: `app/api/admin/company-files/route.ts`

### GET

현재 로그인 세션의 `companyId` 기준 활성 회사 파일 목록을 반환한다.

응답 예:

```json
{
  "ok": true,
  "files": []
}
```

### POST

현재 로그인 세션의 `companyId` 기준으로 파일 메타데이터를 등록한다. 같은 `file_type`의 기존 활성 파일은 `deleted_at`과 `replaced_by_file_id`로 교체 처리한다.

요청 예:

```json
{
  "fileType": "business_registration",
  "originalName": "business-registration.pdf",
  "storageKey": "companies/{companyId}/company-files/business_registration/business-registration.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 12345
}
```

## 자동테스트 기준

`scripts/smoke-db-api.mjs`에 `company_files contract`를 추가했다.

검증 항목:

- `company_files` 필수 테이블/컬럼 존재
- 대표 이미지 교체 시 활성 파일이 1개만 남는지
- 기존 대표 이미지에 `replaced_by_file_id`가 기록되는지
- 사업자등록증 기본 상태가 `pending_review`인지
- smoke 테스트 데이터가 트랜잭션 rollback 안에서만 생성되는지

## full_reset.sql 영향

`db/schema/full_reset.sql`에 `company_files` 테이블과 인덱스를 추가했다.

`db/schema/full_reset_smoke_test.sql`에 다음 검증을 추가했다.

- `company_files` 테이블 존재
- 필수 컬럼 존재
- 필수 인덱스 존재
- `file_type` check constraint
- `review_status` check constraint

## 다음 단계

0.19.96에서 환경설정 > 회사 정보 UI에 대표 이미지/사업자등록증 상태 표시와 등록/변경 버튼을 연결한다. 실제 R2 업로드는 0.19.97에서 별도 진행한다.
