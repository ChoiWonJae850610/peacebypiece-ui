# 0.19.94 고객사 회사 이미지/사업자등록증 업로드 설계 1차

## 목적

고객사 관리자가 회사 정보에서 회사 대표 이미지와 사업자등록증 파일을 등록·변경할 수 있도록 하기 전, DB/API/R2/시스템관리자 검토 흐름을 먼저 고정한다.

이번 버전은 설계 문서화 단계이며 실제 파일 업로드 기능, DB schema, R2 key, API route는 변경하지 않는다.

## 관리 대상 파일

### 1. 회사 대표 이미지

- 용도: 고객사 내부 화면에서 회사 식별용으로 표시한다.
- 예시: 회사 로고, 매장/작업실 대표 이미지, 브랜드 대표 이미지.
- 필수 여부: 초기에는 선택값으로 둔다.
- 변경 가능자: 고객사 관리자.
- 시스템관리자 검토: 원칙적으로 불필요하다.
- 표시 위치 후보:
  - 업무 홈 회사 요약 영역
  - 환경설정 > 회사 정보
  - 시스템관리자 고객사 상세 요약

### 2. 사업자등록증

- 용도: 고객사 승인, 운영 검토, 세금계산서/결제 준비 시 회사 증빙으로 사용한다.
- 필수 여부: 최종 온보딩에서는 필수 후보로 둔다.
- 변경 가능자: 고객사 관리자.
- 시스템관리자 검토: 필요하다.
- 변경 시 상태 후보:
  - `pending_review`: 고객사 관리자가 새 파일을 업로드했고 시스템관리자 검토 전
  - `approved`: 시스템관리자가 확인 완료
  - `rejected`: 시스템관리자가 반려
- 반려 시 고객사 관리자가 다시 업로드할 수 있어야 한다.

### 3. 추후 확장 후보

이번 단계에서는 구현하지 않지만 구조상 확장 가능해야 한다.

- 통장사본
- 사업장 사진
- 회사 소개서
- 계약 관련 증빙 문서
- 기타 시스템관리자가 요청한 증빙 파일

## 권한 기준

| 역할 | 대표 이미지 등록/변경 | 사업자등록증 등록/변경 | 검토/승인/반려 |
| --- | --- | --- | --- |
| 고객사 관리자 | 가능 | 가능 | 불가 |
| 일반 멤버 | 불가 | 불가 | 불가 |
| 시스템관리자 | 조회 가능 | 조회 가능 | 가능 |

일반 멤버는 회사 파일 관리 기능에 접근하지 않는다.

## 화면 위치

### 고객사 관리자

기준 위치는 `환경설정 > 회사 정보`가 적합하다.

구성 후보:

- 회사 기본정보 카드
- 회사 대표 이미지 카드
- 사업자등록증 카드
- 업로드 이력/최근 변경일 표시
- 사업자등록증 검토 상태 표시

### 시스템관리자

기준 위치는 향후 `시스템관리자 > 고객사 상세` 또는 `회사 계정 요청 상세`이다.

구성 후보:

- 회사 대표 이미지 미리보기
- 사업자등록증 파일명/업로드일/업로드자
- 다운로드/열람 버튼
- 검토 승인/반려 버튼
- 반려 사유 입력
- 파일 접근 로그 연결

## DB 설계 후보

기존 회사 테이블에 파일 컬럼을 직접 늘리는 방식보다 별도 테이블이 적합하다.

후보 테이블명:

```sql
company_files
```

후보 컬럼:

```sql
id uuid primary key
company_id uuid not null
file_type text not null
file_name text not null
mime_type text not null
size_bytes bigint not null
r2_key text not null
status text not null
uploaded_by_user_id uuid not null
reviewed_by_system_user_id uuid null
reviewed_at timestamptz null
rejected_reason text null
created_at timestamptz not null
updated_at timestamptz not null
```

`file_type` 후보:

```text
company_profile_image
business_registration_certificate
bankbook_copy
business_place_photo
other_company_document
```

`status` 후보:

```text
active
pending_review
approved
rejected
archived
```

대표 이미지는 `active` 중심으로 운영하고, 사업자등록증은 `pending_review / approved / rejected` 흐름을 사용한다.

## R2 key 설계 후보

기존 회사 범위 구조와 맞춰야 한다.

```text
companies/{companyId}/company-files/{fileType}/{fileId}-{safeFileName}
```

예시:

```text
companies/123/company-files/company_profile_image/abc-logo.png
companies/123/company-files/business_registration_certificate/def-business-registration.pdf
```

주의:

- 예전 legacy key 호환 코드는 추가하지 않는다.
- companyId scope를 반드시 포함한다.
- 파일명은 표시용 원본명과 저장용 safe name을 분리한다.
- 실제 R2 URL이나 secret은 DB/문서/패치에 포함하지 않는다.

## API 설계 후보

### 고객사 관리자용

```text
GET /api/admin/company-files
POST /api/admin/company-files
PATCH /api/admin/company-files/:id
DELETE /api/admin/company-files/:id
```

또는 회사 정보 API 하위로 묶을 수 있다.

```text
GET /api/admin/company/files
POST /api/admin/company/files
```

권장 방향은 `company-files` 도메인 분리이다. 파일 업로드, 검토 상태, 시스템관리자 접근 로그가 붙을 가능성이 높기 때문이다.

### 시스템관리자용

```text
GET /api/system/companies/:companyId/files
POST /api/system/company-files/:id/approve
POST /api/system/company-files/:id/reject
```

시스템관리자의 파일 열람/다운로드는 향후 감사로그 설계와 연결한다.

## 업로드 흐름

### 대표 이미지

```text
1. 고객사 관리자 환경설정 진입
2. 대표 이미지 선택
3. 파일 형식/크기 검증
4. R2 업로드
5. company_files active record 저장
6. 기존 대표 이미지는 archived 처리
7. 화면 즉시 갱신
```

### 사업자등록증

```text
1. 고객사 관리자 환경설정 진입
2. 사업자등록증 파일 선택
3. 파일 형식/크기 검증
4. R2 업로드
5. company_files pending_review record 저장
6. 고객 화면에 검토 대기 표시
7. 시스템관리자 고객사 상세 또는 요청 검토 화면에 표시
8. 시스템관리자 승인/반려
9. 승인 시 approved, 반려 시 rejected + rejected_reason 저장
```

## 파일 검증 기준 후보

### 대표 이미지

- 허용 확장자: png, jpg, jpeg, webp
- 최대 크기: 초기 5MB 후보
- 미리보기 제공

### 사업자등록증

- 허용 확장자: pdf, png, jpg, jpeg
- 최대 크기: 초기 10MB 후보
- PDF 미리보기는 추후, 1차는 다운로드/파일명 표시로 충분

## 테스트 설계

### DB/API smoke test 후보

- `company_files` 테이블/컬럼 존재 확인
- 대표 이미지 active record 저장 가능 확인
- 사업자등록증 pending_review 저장 가능 확인
- 승인/반려 상태 변경 가능 확인
- 같은 file_type의 기존 active 파일 archived 처리 계약 확인

### Playwright 후보

- 환경설정 회사 정보 화면 진입
- 대표 이미지 업로드 버튼 표시
- 사업자등록증 업로드 버튼 표시
- 업로드 후 상태 문구 표시
- 시스템관리자 화면에서 사업자등록증 검토 버튼 표시

### R2 테스트 주의

실제 R2 업로드는 비용/외부 의존성이 있으므로 처음에는 다음 순서가 안전하다.

```text
1. DB/API smoke test
2. UI route mock 기반 Playwright
3. R2 upload worker mock 또는 테스트 전용 guard
4. 실제 R2 업로드 수동 확인
```

## 구현 순서 제안

### 0.19.95

회사 파일 DB/API 1차

- `company_files` 설계 반영
- `full_reset.sql` 반영
- 고객사 관리자 조회/등록 API skeleton
- DB/API smoke test 추가
- 실제 R2 업로드는 다음 단계로 분리 가능

### 0.19.96

고객사 회사 파일 UI 1차

- 환경설정 > 회사 정보에 대표 이미지/사업자등록증 카드 추가
- 파일 선택 UI 추가
- 상태 표시 추가
- route mock 기반 Playwright 추가

### 0.19.97

R2 업로드 연결 1차

- 기존 R2 upload flow 재사용
- `companies/{companyId}/company-files/...` key 적용
- 대표 이미지 실제 업로드
- 사업자등록증 실제 업로드

### 0.19.98

시스템관리자 사업자등록증 검토 1차

- 시스템관리자 고객사 상세 또는 요청 검토 화면에 파일 표시
- 승인/반려 API
- 반려 사유 저장

## 이번 버전 제외 범위

- DB schema 변경 없음
- `full_reset.sql` 변경 없음
- R2 upload worker 변경 없음
- 실제 업로드 UI 구현 없음
- 시스템관리자 검토 UI 구현 없음
- 파일 접근 감사로그 구현 없음

## 결론

고객사 회사 파일은 회사 기본정보의 부가 컬럼으로 처리하기보다 별도 `company_files` 도메인으로 분리하는 편이 안전하다. 대표 이미지는 단순 active 파일로, 사업자등록증은 검토 상태가 있는 증빙 파일로 분리해 운영한다. 실제 구현은 DB/API → UI → R2 → 시스템관리자 검토 순서로 나누는 것이 적합하다.
