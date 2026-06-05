# 시스템관리자 회사 파일 검토 UI/API 1차 — 0.19.99

## 목적

0.19.98에서 확정한 회사 파일 검토 설계를 시스템관리자 고객사 관리 화면과 API에 1차 연결한다.

## 적용 범위

- 대상 파일: `company_files.file_type = 'business_registration'`
- 제외 파일: `representative_image`
- 조회 범위: 삭제되지 않은 활성 사업자등록증 파일
- 처리 상태: `pending_review`, `approved`, `rejected`

## API

신규 API: `/api/system/company-files`

### GET

시스템관리자 세션만 접근 가능하다.

반환값:

- 고객사명
- 사업자명
- 파일명
- storage key
- MIME type
- 크기
- 검토 상태
- 업로더
- 검토자
- 검토일
- 반려 사유

### PATCH

요청값:

```json
{
  "fileId": "company-file-id",
  "action": "approved | rejected",
  "reviewReason": "반려 시 필수"
}
```

처리 기준:

- `approved`: `review_status = 'approved'`, `reviewed_by_system_user_id`, `reviewed_at` 저장, `rejection_reason` 제거
- `rejected`: `review_status = 'rejected'`, `reviewed_by_system_user_id`, `reviewed_at`, `rejection_reason` 저장
- 반려 사유는 1자 이상, 1200자 이하

## UI

시스템관리자 `/system/companies` 화면에 `회사 파일 검토` 패널을 추가했다.

표시 내용:

- 검토 대기/승인/반려 카운트
- 고객사명과 사업자명
- 파일명, 크기, MIME type, 등록일
- storage key
- 검토자와 검토일
- 반려 사유
- 승인/반려 버튼

## 자동테스트 기준

`npm run test:smoke:db-api`의 `company files contract`에 시스템관리자 검토 업데이트 계약을 추가했다.

검증 항목:

- 사업자등록증 기본 상태가 `pending_review`인지 확인
- 승인 처리 시 `review_status`, `reviewed_by_system_user_id`, `reviewed_at`, `rejection_reason` 정합성 확인
- 반려 처리 시 `review_status`, `reviewed_by_system_user_id`, `reviewed_at`, `rejection_reason` 정합성 확인

## 후속 분리 대상

- 파일 원본 열람 signed URL 또는 R2 Worker download proxy
- 시스템관리자 파일 열람 감사 로그
- 승인/반려 감사 로그
- 고객사 환경설정 화면의 검토 결과 상세 안내 강화
