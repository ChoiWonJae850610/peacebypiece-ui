# full_reset / seed 정리 기록 — 0.13.55

## 판단

현재 고객사 생성 기준은 샘플 seed가 아니라 다음 실제 플로우다.

1. `/system/companies`에서 고객사 관리자 초대 링크 생성
2. 고객사 관리자가 초대 링크로 Google 로그인
3. `/admin` 첫 진입 시 회사정보 온보딩 입력
4. `/system/companies`에서 가입 신청 검토 및 승인
5. 승인 후 고객사 관리자/업무자/작업지시서/협력업체 데이터를 실제 화면에서 생성

따라서 `full_reset.sql`은 실제 고객사, 고객사 관리자, 업무자, 작업지시서, 협력업체, 회사별 기준정보 enable row를 만들지 않는다.

## full_reset에 반영 확인한 patch

- `db/schema/patch_0_11_71_workorder_list_indexes.sql`
  - 작업지시서 목록 필터/정렬 인덱스가 `full_reset.sql`에 반영되어 있음.
- `db/schema/patch_0_11_77_unit_each_standard.sql`
  - `system-unit-each` 기준 단위가 `full_reset.sql`의 `system_unit_standards` baseline에 반영되어 있음.
- `db/schema/patch_0_13_16_google_oauth_member_join.sql`
  - `users.google_sub`, `users.google_picture_url`, `users.phone`, `users.birthday`, `join_requests.google_sub`, 관련 제약/인덱스가 `full_reset.sql`에 반영되어 있음.
- `db/migrations/patch_0_13_52_company_onboarding.sql`
  - 회사 온보딩/주소/로고/신청 요금제 관련 컬럼이 `full_reset.sql`에 반영되어 있음.
- `db/migrations/patch_0_13_53_system_company_invitation.sql`
  - 고객사가 생성되기 전 발급되는 시스템 초대에 맞춰 `invitations.company_id` nullable 구조가 `full_reset.sql`에 반영되어 있음.

## 제거한 seed 성격 데이터

`full_reset.sql`에서 제거한 항목:

- 샘플 고객사
- 샘플 고객사 설정
- 샘플 고객사 관리자/디자이너/검수자 사용자
- 샘플 회사 사용자 연결
- 샘플 시스템관리자
- 샘플 고객사 단위/품목 카테고리/외주공정
- 샘플 고객사 요금제 배정
- 샘플 저장소 사용량 snapshot
- legacy role/permission seed 1차 블록

## 유지한 baseline 데이터

`full_reset.sql`에 유지한 항목:

- 시스템 권한 카탈로그
- 시스템 단위 표준
- 시스템 외주공정 표준
- 시스템 생산품 유형 템플릿
- 요금제 baseline
- 최신 permission catalog
- 역할 템플릿
- 역할 템플릿별 기본 권한

## db/seed 정리

삭제:

- `db/seed/realistic_workorders_seed.sql`
- `db/seed/seolo_seoul_admin_seed.sql`

유지:

- `db/seed/system_standards_seed.sql`

유지 사유:

- full reset 직후에는 필요 없다.
- 기존 DB를 유지하면서 시스템 기준정보만 보강해야 할 때 선택 실행하는 보수용 SQL이다.
- 고객사/사용자/작업지시서/협력업체 샘플 데이터는 생성하지 않는다.
