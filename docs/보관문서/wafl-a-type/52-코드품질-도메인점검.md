---
title: WAFL 코드 품질 / 도메인 구조 전수 감사
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft-audit
updated: 2026-05-21
---

# 52. 코드 품질 / 도메인 구조 전수 감사

## 1. 목적

이 문서는 0.15.29 기준으로 제품화 전 리팩토링 위험 요소를 전수 조사하기 위한 기준 문서다.

조사 대상은 단순 UI 문구가 아니라 다음 구조 품질 문제다.

```txt
- 문자열 literal 기반 도메인 비교
- 한글 표시 문구 기반 조건 분기
- DB에 문장형 reason/status 또는 raw payload를 저장하는 후보
- companyId / role / permission / status / route / plan 등의 하드코딩 후보
- 중복 포맷터와 중복 selector 후보
- TSX 내부 도메인 로직 후보
- i18n key 불일치와 hardcoded copy 후보
- as any / any / unknown 남용 후보
```

0.15.29에서는 빌드 타입 오류를 먼저 수정하고, 구조 위험을 기능 수정 없이 감사 문서로 분리한다.

## 2. 이번 빌드 오류 판단

0.15.28 build log 기준 오류는 `components/admin/settings/AdminCompanySettingsForm.tsx`에서 `text.sampleCompanyName`을 참조했지만 영문 i18n 객체에는 해당 key가 없어 발생했다.

```txt
원인:
- ko: settingsForm.sampleCompanyName
- en: settingsForm.initialCompanyName
- component: text.sampleCompanyName

수정:
- component: text.fallbackCompanyName
- ko/en: settingsForm.fallbackCompanyName으로 통일
```

이 오류는 단순 타입 누락이 아니라 i18n key를 화면에서 직접 참조하는 구조에서 ko/en shape drift가 발생한 사례다. 이후에는 i18n 리소스에 새 key를 추가할 때 ko/en 동시 반영을 필수 점검 항목으로 둔다.

## 3. 정적 검색 기준

0.15.28 소스 기준으로 아래 패턴을 정적 검색했다. 숫자는 단순 후보 수이며, 실제 오류 확정 수가 아니다.

```txt
korean_comparison 후보: 15개 파일
includes_korean 후보: 1개 파일
raw_payload_json 후보: 242개 파일
any_cast 후보: 1개 파일
mock/fallback/sample/placeholder 후보: 127개 파일
companyId / company_id 후보: 122개 파일
dev_copy 후보: 374개 파일
```

주의:
- raw_payload_json에는 Next.js Metadata, 정상 request parsing, 정상 API payload도 포함된다.
- placeholder는 input placeholder처럼 정상 UI 속성도 포함된다.
- fallback은 정상 방어 코드와 제거 대상이 섞여 있다.
- 따라서 0.15.29는 “제거”가 아니라 “분류” 단계다.

## 4. 즉시 점검해야 하는 high-risk 후보

### 4.1 한글 표시 문구 기반 조건 비교

아래 후보는 표시 문구가 바뀌면 로직이 깨질 수 있으므로 domain code 또는 selector로 분리해야 한다.

```txt
components/system/billing/SystemCompanyPlanSkeleton.tsx
- company.storageRiskLabel === "초과"
- company.storageRiskLabel === "주의"

lib/admin/adminFiles.presentation.ts
- fileType === "디자인"

lib/admin/adminFiles.serverActions.ts
- fileType === "디자인"

lib/admin/adminStats.repository.ts
- parentLabel === "분류 미지정"
- childLabel === "분류 미지정"

lib/admin/files/trashTablePresentation.ts
- typeLabel === "디자인"

lib/constants/workorderDefaults.ts
- trimmed === "보통"

lib/constants/workorderDomain.ts
- normalized === "원단"

lib/constants/workorderOptions.ts
- option !== "샘플"

lib/system/storagePurgeCandidates.ts
- input.fileTypeLabel === "이미지"

lib/workorder/reorder/helpers.ts
- normalizedType === "샘플"
```

정리 방향:

```txt
- UI label: i18n/presentation layer
- DB/domain value: const enum 또는 as const map
- 비교: domain code로만 수행
- 한글 label 비교 금지
```

### 4.2 includes 한글 비교 후보

```txt
app/api/admin/files/snapshot/route.ts
- source.includes("디자인")
```

정리 방향:

```txt
- 파일 type은 design/document/memo 등 domain value로 유지
- 표시명은 presentation에서만 변환
```

### 4.3 raw payload / json 저장 후보

우선 검토 대상은 다음이다.

```txt
app/api/admin/companies/current/route.ts
app/api/admin/settings/company-account-requests/route.ts
app/api/admin/standards/processes/route.ts
app/api/me/profile/route.ts
app/api/workorders/attachments/delete/route.ts
app/api/workorders/attachments/upload/complete/route.ts
app/api/workorders/memos/route.ts
app/api/auth/google/callback/route.ts
```

검토 기준:

```txt
- request body를 unknown으로 받은 뒤 schema 없이 바로 DB에 넣는지
- rawToken/raw payload를 DB에 저장하는지
- metadata jsonb에 장기 보존할 필요 없는 데이터를 넣는지
- 표시용 문장 또는 에러 문장을 reason/status로 저장하는지
- DB에는 code/status/reasonCode만 저장하고 label은 presentation에서 계산하는지
```

### 4.4 중복 포맷터 후보

```txt
lib/admin/adminOperations.presentation.ts
lib/admin/files/storageSummaryPresentation.ts
lib/i18n/adminTermFormatters.ts
components/common/date/PbpSingleDatePicker.tsx
```

정리 방향:

```txt
- 날짜 포맷: 공통 date formatter
- 파일 크기 포맷: 공통 storage formatter
- 개수/단위 포맷: 공통 term formatter
- 상태 badge tone: domain별 presentation map
```

### 4.5 any 사용 후보

```txt
lib/storage/r2/r2Client.ts
- catch (error: any)
```

정리 방향:

```txt
- unknown으로 받은 뒤 normalizeErrorMessage 계열 helper 사용
```

### 4.6 개발자성 문구 잔여 후보

0.15.25~0.15.28에서 public/system/admin 화면의 개발자성 문구를 상당 부분 줄였지만 다음 계열은 잔여 후보로 남긴다.

```txt
README.md의 create-next-app 기본 문구
components/admin/dashboard/AdminDbConnectionAuditPanel.tsx의 fallback-guarded
components/admin/dashboard/AdminAuditSummarySection.tsx의 초기자료/자료 정리 표현
components/admin/dashboard/AdminCompletionAuditPanel.tsx의 초기자료/자료 정리 표현
app/(admin)/admin/settings/page.tsx의 개발 건의 표현
```

이 항목은 사용자 화면 노출 여부를 먼저 확인한 뒤 제거한다.

## 5. 분류 체계

각 후보는 아래 5개 그룹으로 나눠 처리한다.

```txt
A. 즉시 수정
- build/type error
- i18n key mismatch
- 한글 label 비교로 기능이 깨질 수 있는 코드

B. domain constant로 이동
- role/status/permission/reason/fileType/orderType

C. presentation으로 이동
- label/tone/badge/title/description

D. DB schema/refactor 필요
- 문장형 reason/status 저장
- raw payload 장기 저장
- jsonb metadata 과다 저장

E. 유지 가능
- 정상 API request parsing
- 정상 input placeholder
- 정상 fallback guard
```

## 6. 권장 후속 버전

```txt
0.15.30 — domain constants/types 1차 정리
- file type, storage risk, workorder priority/order type부터 처리
- 한글 label 비교 제거

0.15.31 — 중복 formatter/presentation 통합 1차
- date/file size/count/unit/status tone 정리

0.15.32 — TSX 도메인 로직 분리 1차
- admin/system/public 화면의 조건 판단을 selector/presentation으로 이동

0.15.33 — DB 저장값 / JSON payload 감사
- reason/status/raw metadata 저장 후보를 DB schema 관점에서 재분류
- full_reset.sql 반영 필요 여부 결정

0.16.0 — DeviceKind foundation
- 구조 품질 1차 안정화 후 device 대응으로 이동
```

## 7. 0.15.30 우선 처리 후보

다음은 기능 영향 범위가 작고 구조 개선 효과가 큰 순서다.

```txt
1. systemCompanyPlanSkeleton storageRiskLabel 비교 제거
2. adminFiles 디자인/문서 label 비교 제거
3. storagePurgeCandidates 이미지 label 비교 제거
4. workorder priority/orderType 한글 비교 제거
5. adminStats 분류 미지정 label 비교 제거
```
