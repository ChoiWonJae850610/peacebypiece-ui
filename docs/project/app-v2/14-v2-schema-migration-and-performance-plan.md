# WAFL v2 Schema Migration and Performance Plan

Version: `2.0.0-alpha.19`
Status: planning only; no migration file, DB connection, seed, or benchmark execution
Target model: `13-core-domain-schema-v2.md`

## 1. 목적과 비목표

이 문서는 v1 데이터를 보존하면서 v2 schema/API로 전환하는 순서와 성능 gate를 정의한다.

이번 버전에서 하지 않은 것:

- migration SQL 작성/적용
- dev/test/production DB mutation
- seed/fixture 생성
- API dual write 구현
- R2/PDF Worker 변경
- production benchmark

## 2. Additive migration 원칙

1. 기존 table/column을 먼저 rename/drop하지 않는다.
2. v2 table, constraint, nullable reference를 additive로 추가한다.
3. deployed schema fingerprint와 read-only reconciliation이 PASS한 뒤 backfill한다.
4. dual-read 비교 기간을 두고 v1/v2 결과를 같은 DTO로 비교한다.
5. write cutover는 command 단위로 진행하며 한 번에 전체 workorder를 전환하지 않는다.
6. old writer는 v2 writer 안정화 전 제거하지 않는다.
7. rollback은 data delete가 아니라 read/write feature flag 복귀를 우선한다.
8. destructive cleanup은 production 안정화와 별도 승인 후 마지막 phase에서만 한다.

## 3. v1/v2 병행 전략

권장 전략은 `shadow schema + bounded dual read + command별 cutover`다.

```text
v1 tables remain authoritative
  -> additive v2 tables
  -> read-only backfill
  -> shadow read comparison
  -> selected command dual write
  -> v2 read cutover
  -> v2 write authority
  -> v1 compatibility freeze
  -> later deprecation
```

장기간 무제한 dual write는 금지한다. 두 모델의 의미가 달라 drift를 키우므로 command별 기간과 종료 조건을 둔다.

## 4. Phase plan

### Phase 0 - read-only preflight

필수:

- deployed schema fingerprint와 repository schema 비교.
- migration ledger/적용 순서 확인.
- production RLS/policy 확인.
- table별 row count, orphan, duplicate, invalid date, tenant mismatch 집계.
- `spec_sheets`, child tables, attachment, material order, size spec의 company consistency 확인.
- 외부 job/writer inventory.

Stop:

- schema drift가 설명되지 않음.
- company mismatch/orphan이 존재하고 remediation이 없음.
- text due date를 `date`로 해석할 수 없는 값이 있음.
- 기존 ID를 UUID로 변환할 수 있다고 근거 없이 가정해야 함.

### Phase 1 - v2 additive foundation

별도 승인 migration에서만 수행:

- `work_orders`, `work_order_revisions`, document number sequence.
- revision-scoped material/size/color/process tables.
- image/attachment revision link.
- generated document/token/event tables.
- nullable mapping columns 또는 mapping table.

초기 FK는 필요 시 `NOT VALID`로 만들고 reconciliation 후 validate한다. 무조건적인 cascade는 document/audit retention과 충돌하지 않는지 확인한다.

### Phase 2 - deterministic backfill

Mapping 원칙:

| v1 | v2 | 규칙 |
| --- | --- | --- |
| `spec_sheets` | `work_orders` + R0 revision | 기존 ID는 `legacy_source_id`로 unique 보존; 새 internal UUID 생성 |
| `spec_sheet_materials` | revision material lines | type normalization table로 fabric/accessory 분류; 불명확 값은 review queue |
| `orders` | process/order candidate | 공장발주와 실제 공정을 자동 혼합하지 않음; rule 밖 row는 review queue |
| `spec_sheet_outsourcing_lines` | revision processes | process/vendor/date/cost mapping |
| attachments user rows | images/attachments | MIME/type/primary로 분리; object 이동 없음 |
| attachments generated rows | generated documents legacy link | snapshot/hash 없는 row는 `legacy_import`로 표시 |
| size spec 4 tables | revision size spec | R0 revision에 연결 |
| material orders/lines/allocations | v2 order model | workorder allocation을 v2 material line과 reconcile |

Backfill 특성:

- idempotent batch.
- company별, PK cursor batch.
- row count/checksum/error manifest 기록.
- 업무 데이터를 자동 보정하지 않고 rejected row를 별도 report에 기록.
- R2 object key를 바꾸거나 object를 복사하지 않음.

### Phase 3 - shadow read

- 같은 company/page/filter에 v1 summary와 v2 summary를 실행.
- user response는 아직 v1.
- server-side comparison은 ID/status/due/quantity/count/amount/representative asset을 비교.
- customer name, filename, email 같은 민감한 payload를 log하지 않음.
- mismatch는 count와 opaque ID/correlation만 기록.

Gate:

- tenant leak 0.
- deterministic field mismatch 0.
- 허용된 legacy normalization mismatch는 문서화.
- 500/5,000 성능 gate PASS.

### Phase 4 - command별 dual write

권장 순서:

1. work order scalar draft create/update.
2. material line command.
3. size/color matrix and size spec.
4. process command.
5. asset metadata linkage.
6. material order/allocation.
7. revision finalize/document generation metadata.

각 command는 transaction 또는 outbox/retry 중 하나의 일관성 전략을 가져야 한다. 일부 성공을 사용자에게 성공으로 반환하지 않는다.

### Phase 5 - v2 read cutover

- internal/test company부터 feature flag 적용.
- list -> detail core -> tab collection 순서로 전환.
- v1 fallback은 read-only로 제한.
- payload/query metrics와 error rate를 관찰.

### Phase 6 - v2 write authority

- v2 command API가 source of truth.
- v1 compatibility projection이 필요한 화면만 derived write/read를 사용.
- old full aggregate PATCH와 delete/reinsert writer를 차단.
- revision finalize와 document generation transaction boundary를 검증.

### Phase 7 - v1 freeze/deprecation

- runtime, script, test, job reference가 0인지 확인.
- v1 tables는 read-only compatibility 기간을 거친다.
- rename/drop/data purge는 별도 destructive work order와 backup/restore evidence 후 진행한다.

## 5. 문서번호 backfill

- 기존 workorder에 표시번호가 없다면 company business date와 stable existing creation order로 번호를 배정한다.
- 기존 `created_at`이 timezone 없는 값이므로 company timezone 해석 규칙을 먼저 고정한다.
- 동일 timestamp는 legacy ID를 tie-breaker로 사용한다.
- 한번 배정한 번호는 rerun에서 바뀌지 않도록 mapping table/unique legacy source를 사용한다.
- collision은 번호를 재사용하지 않고 report 후 batch를 중단한다.

## 6. Revision와 PDF backfill

- 기존 workorder current row는 R0 imported revision으로 시작한다.
- 기존 generated attachment는 immutable PDF bytes는 유지하되 완전한 source snapshot이 없음을 `legacy_import`로 표시한다.
- 생성 당시 source revision을 증명할 수 없으면 추정 연결하지 않는다.
- 기존 final replacement 기록이 soft-delete된 attachment에만 남아 있다면 trash metadata를 보존한다.
- 기존 object hash는 read-only object access가 승인된 dev/test phase에서 계산한다. alpha.19에서는 하지 않는다.

## 7. Rollback

### schema rollback

Additive table은 즉시 drop하지 않는다. migration rollback의 기본은:

- v2 feature flag off.
- v1 read/write authority 복귀.
- v2 write 중단.
- failed batch marker와 mismatch report 보존.

### data rollback

- backfill은 v1 원본을 수정하지 않는다.
- v2 generated rows는 batch/correlation ID로 구분한다.
- cleanup은 production 안정화 전 실행하지 않는다.
- dual-write mismatch는 자동 overwrite하지 않고 reconciliation queue로 보낸다.

### stop conditions

- tenant mismatch 1건 이상.
- document number collision.
- revision/child count mismatch.
- generated document가 잘못된 revision/company를 참조.
- query plan이 sequential scan으로 5,000건 budget을 반복 초과.
- API payload 또는 query count가 bounded contract를 위반.

## 8. Dev/test seed plan

실제 seed 구현은 alpha.21 별도 승인 대상이다.

### dataset

| profile | 규모 |
| --- | --- |
| A | 회사 1개, 작업지시서 500건 |
| B | 회사 1개, 작업지시서 5,000건 |
| C | 여러 회사 합계 5,000건 이상, 회사별 분포 차등 |

작업지시서당 분포:

- 이미지 5~10, 첨부 0~10.
- 원단 5~20, 부자재 10~50.
- 색상 4~12, 사이즈 5~12, matrix 20~144 cells.
- 공정 3~15.
- PDF revision 1~5.
- status/due date/deleted row 분포 포함.

Seed 원칙:

- `wafl-fn` dev/test prefix와 canonical test company ID를 유지.
- deterministic seed.
- production guard와 explicit execute confirmation.
- performance seed와 normal QA seed를 분리.
- cleanup manifest와 row counts 제공.

## 9. Benchmark matrix

### DB query

- recent list page 1/10/last cursor.
- status filter, due date sort.
- product/document exact search.
- product/material/partner contains search.
- detail core.
- each tab: material, size/color, size spec, process, asset, document, history.
- trash/purge candidate query.

각 query는 다음을 기록한다.

- p50/p95/max wall time.
- planning/execution time.
- rows scanned/returned.
- buffers hit/read.
- index/seq scan.
- query text hash와 schema fingerprint.

`EXPLAIN (ANALYZE, BUFFERS)`는 dev/test dataset에서만 실행한다.

### API

- status and headers.
- server timing p50/p95.
- query count.
- uncompressed/gzip payload bytes.
- serialization time.
- cursor correctness, duplicate/missing ID.
- tenant boundary and assigned visibility.

### client/runtime

- initial list render row count.
- time to interactive.
- search input latency.
- list scroll frame drops.
- detail tab switch latency.
- memory before/after 10 page navigation.

## 10. Performance budget

초기 gate는 current stack의 network variance를 고려해 DB와 API를 분리한다.

| 대상 | 500건 | 5,000건 |
| --- | --- | --- |
| list DB p95 | <= 100ms | <= 200ms |
| detail core+one tab DB p95 | <= 200ms | <= 250ms |
| indexed search DB p95 | <= 150ms | <= 250ms |
| list API server p95 | <= 400ms | <= 500ms |
| list page payload | <= 150KB uncompressed | 동일 |
| initial list query count | <= 3 | 동일 |
| detail initial query count | <= 4 | 동일 |
| cursor page size | 30 default, 50 max | 동일 |

실기기 end-to-end budget은 network/device QA에서 별도 측정한다. 이 수치는 production SLA가 아니라 schema/API cutover gate 초안이다.

## 11. 인덱스 검증 순서

1. 실제 query predicate/order와 existing index 대조.
2. no-index baseline plan 저장.
3. candidate index를 dev/test에만 적용.
4. read 개선과 write/storage 비용 함께 측정.
5. 중복 index 제거 후보 식별.
6. production migration proposal에 하나씩 포함.

`pg_trgm`/FTS는 simple btree/normalized search가 5,000건 gate를 통과하지 못할 때만 검토한다.

## 12. Production 적용 전 gate

- owner가 `13-core-domain-schema-v2.md` OPEN DECISION을 검토.
- deployed schema/RLS fingerprint 확인.
- read-only reconciliation zero critical mismatch.
- migration compatibility and rollback rehearsal PASS.
- 500/5,000 benchmark PASS.
- API tenant/permission tests PASS.
- document number concurrency test PASS.
- revision immutability test PASS.
- PDF snapshot hash/schema/renderer contract PASS.
- 30일 trash/restore/purge and R2 cleanup dry-run PASS.
- backup/restore rehearsal evidence.
- production migration exact command와 approval 별도 확보.

## 13. 예상 migration 단위

실제 파일명은 future version에서 확정한다.

1. tenant/document-number foundation.
2. work order/revision identity.
3. revision material/size/color/process.
4. asset revision linkage.
5. generated document/share token/event.
6. indexes and validated constraints.
7. backfill scripts and read-only audits.

한 파일에 전체 v2 schema를 몰아넣지 않는다. 각 migration은 preflight, post-apply read-only audit, compatibility test, rollback stance를 가진다.

## 14. PowerShell / pipeline 후보

향후 기존 pipeline menu에 통합할 때:

| 기능 | 분류 | 환경/확인 |
| --- | --- | --- |
| V2 Schema Preflight | read-only | dev/test/prod read-only 가능, production explicit access 필요 |
| V2 Migration Plan Validate | dry-run | no DB mutation |
| V2 Additive Migration Apply | mutation | dev/test only, explicit confirmation |
| V2 Backfill Plan | read-only | no mutation |
| V2 Backfill Apply | mutation | dev/test only, batch confirmation |
| V2 Performance Seed | destructive-capable | dev/test only, exact dataset confirmation |
| V2 Performance Benchmark | read-only after seed | dev/test only |

alpha.19에서는 위 command를 추가하지 않았다.

## 15. OPEN DECISION

- company/season/item code ownership과 변경 승인.
- final/superseded document retention.
- inventory source-of-truth consolidation.
- RLS 도입 phase와 system-admin bypass policy.
- completion 후 correction state 명칭.

## 16. 다음 action

다음 버전은 migration 구현이 아니라 API DTO/command와 read model 계약을 더 좁게 설계한 뒤, 사용자 승인된 별도 버전에서 dev/test additive migration을 시작하는 것이 안전하다. alpha.19의 문서는 production SQL 실행 승인이 아니다.
