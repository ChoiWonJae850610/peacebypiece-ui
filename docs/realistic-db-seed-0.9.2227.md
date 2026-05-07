# PeaceByPiece 0.9.2227 — realistic DB seed SQL

## 목적

`/admin/dashboard`, `/admin/partners`, `/admin/files`, `/worker` 화면을 실제 DB 데이터 기준으로 테스트하기 위한 개발용 realistic seed를 추가한다.

이번 버전은 DB seed만 추가한다. 실제 R2 파일 업로드는 다음 버전 `0.9.2228`에서 더미 파일 생성/업로드 스크립트로 처리한다.

## 실행 전제

운영 DB에서 실행하지 않는다.

권장 실행 순서:

```sql
-- 1. 전체 초기화
db/schema/full_reset.sql

-- 2. 기본 smoke seed
db/schema/full_reset_smoke_test.sql

-- 3. realistic seed
db/schema/seed_realistic_workorders_0_9_2227.sql
```

## 생성 데이터

`company-sample-customer` 기준으로 다음 데이터를 생성한다.

- 최근 6개월 작업지시서 100개
- 협력업체 12개
  - 공장 5개
  - 원단처 3개
  - 부자재처 2개
  - 외주처 2개
- 발주 orders 100개
- 원단/부자재 material lines 200개
- 외주공정 lines 약 40~50개
- 메모 약 50~60개
- R2 업로드 예정 attachment metadata 약 180~190개
- 휴지통 attachment 후보
- 일/월 작업 통계 summary row
- 현재 저장소 summary row

## 데이터 분포

작업지시서 날짜는 최근 약 180일에 분산한다. 제품은 15개 유형으로 구성한다.

- 반팔 티셔츠
- 오버핏 셔츠
- 슬랙스
- 플리츠 스커트
- 셔츠 원피스
- 테일러드 자켓
- 트렌치 코트
- 블라우스
- 니트 조끼
- 와이드 팬츠
- 후드 집업
- 데님 스커트
- 롱 원피스
- 린넨 셔츠
- 크롭 자켓

각 제품 유형은 1차, 2차, 3차 이상 리오더가 섞이도록 `reorder_group_id`, `reorder_round`, `parent_spec_sheet_id`를 구성한다.

## 납기/검수 테스트 기준

현재 앱의 통계 계산 기준에 맞춰 다음 케이스를 포함한다.

- 납기일이 오늘보다 과거이고 완료되지 않은 발주
- 정상 완료 발주
- 검수/불량 후보로 볼 수 있는 rejected 상태
- 일부 재작업 후보 `is_rework = true`

실제 불량 수량 컬럼은 아직 없으므로, 검수/불량률은 현재 통계 화면 기준과 동일하게 `rejected` 또는 `is_rework` 후보 기준으로 확인한다.

## 첨부/R2 테스트 준비

이번 SQL은 `attachments` metadata와 `storage_key`를 먼저 생성한다.

예시 key:

```text
workorders/realistic-spec-001/design/realistic-attachment-001-1.png
workorders/realistic-spec-002/attachments/realistic-attachment-002-2.pdf
workorders/realistic-spec-003/memos/realistic-attachment-003-3.png
```

실제 R2 파일은 아직 없다. 0.9.2228에서 다음 작업을 수행한다.

1. DB의 `realistic-attachment-%` metadata 조회
2. metadata의 `size_bytes`, `mime_type`, `storage_key` 기준으로 더미 파일 생성
3. R2 Worker/API로 실제 업로드
4. 업로드 성공 여부 검증

## small preset 기준

이번 0.9.2227 seed는 small preset의 DB metadata 역할이다.

- attachment metadata 총량: 대략 수십 MB 수준
- 파일 수: 약 180~190개
- 실제 R2 업로드는 다음 버전에서 small preset부터 실행

향후 0.9.2228에서 `small`, `medium`, `large` preset을 스크립트로 분리한다.

## 테스트 체크리스트

1. SQL 실행 후 마지막 SELECT 결과 확인
   - spec_sheet_count = 100
   - order_count = 100
   - partner_count = 12
   - attachment_metadata_count가 0보다 큼
   - attachment_metadata_mb가 0보다 큼

2. `/admin/dashboard` 확인
   - 누적 생산 수가 증가
   - 리오더 TOP5 표시
   - 생산품 유형 비율 표시
   - 업체별 납기/검수 지표 표시

3. `/admin/partners` 확인
   - 협력업체 요약 카드에 공장/원단/부자재/외주 수 표시

4. `/worker` 확인
   - 작업지시서 목록에 realistic 작업지시서가 표시
   - 첨부 metadata는 보이지만 실제 R2 파일 업로드 전에는 미리보기/다운로드가 실패할 수 있음

5. `/admin/files` 확인
   - attachment metadata 기준 저장소 사용량/휴지통 후보 확인

## 주의

- 운영 DB에서 실행하지 않는다.
- R2 실제 업로드 전에는 DB metadata와 R2 파일이 아직 불일치한다.
- 첨부 미리보기/다운로드 테스트는 0.9.2228 R2 업로드 이후 진행한다.
