# System Default Catalog and Seed Specification


> Canonical update (0.24.21.9): conflicting provisional policy in this document is superseded by `docs/project/26-final-policy-decisions-and-master-todo.md`.
Version: 0.24.21.1  
Status: Codex implementation input  
Scope: system product taxonomy, garment measurement catalog, seed/backfill contract, system-admin operations

## 1. 목적

신규 고객사가 가입 승인될 때 작업지시서 작성에 필요한 기본 생산품 분류와 사이즈 스펙 항목을 바로 사용할 수 있게 한다. 시스템 기본값과 고객사 사용자 정의값을 분리하고, 기존 고객사 설정을 덮어쓰지 않는 idempotent seed/backfill 계약을 Codex 구현 입력으로 제공한다.

이번 버전은 문서와 roadmap만 변경한다. SQL 실행, DB schema 변경, seed 실행, production mutation은 포함하지 않는다.

## 2. 현재 구현 조사 결과

현재 canonical seed는 `db/seed/system_standards_seed.sql`이다.

현재 포함된 생산품 유형 경로는 다음 3개뿐이다.

- 상의 → 티셔츠 → 반팔
- 하의 → 팬츠 → 슬랙스
- 아우터 → 자켓 → 테일러드

따라서 시스템 관리자 화면의 상위/하위 기준정보가 비어 보이거나 기본 제공 범위가 지나치게 좁을 수 있다. 단위와 외주공정 baseline은 존재하지만 제품 분류와 제품별 사이즈 스펙 baseline은 제품 운영용으로 부족하다.

## 3. 데이터 소유권과 계층

### 3.1 시스템 기본값

- 시스템 관리자가 관리한다.
- 안정적인 `code`를 사용한다.
- 이름 변경과 표시 순서 변경은 허용하되 참조 중인 code를 재사용하거나 의미를 바꾸지 않는다.
- 물리 삭제보다 `is_active=false`를 우선한다.
- 신규 고객사 생성 시 활성 기본값을 복제하거나 enable 관계를 만든다.

### 3.2 고객사 설정

- 고객사 관리자가 활성/비활성, 정렬, 별칭, 사용자 정의 항목을 관리한다.
- 시스템 기본값 업데이트가 고객사의 명시적 비활성화 또는 사용자 정의 순서를 덮어쓰지 않는다.
- 시스템 기본값과 사용자 정의 항목은 source/type 필드 또는 별도 관계로 구분한다.

### 3.3 기존 문서 참조

- 기존 작업지시서가 참조하는 분류와 스펙 항목은 비활성화 후에도 조회 가능해야 한다.
- code 변경 또는 삭제로 과거 문서가 깨지면 안 된다.
- 표시 이름 snapshot이 필요한 경우 문서 생성 시 함께 저장한다.

## 4. 권장 기본 생산품 분류

아래 목록은 Codex seed 구현용 권장 baseline이다. 실제 SQL 작성 전에 현재 schema의 level/parent/code 제약과 중복을 확인한다.

| 1차 | 2차 | 3차 기본값 |
| --- | --- | --- |
| 상의 | 티셔츠 | 반팔, 긴팔, 민소매 |
| 상의 | 셔츠/블라우스 | 셔츠, 블라우스, 오버셔츠 |
| 상의 | 니트 | 니트탑, 카디건, 베스트 |
| 상의 | 스웨트 | 맨투맨, 후드티 |
| 하의 | 팬츠 | 슬랙스, 데님, 쇼츠, 조거, 와이드팬츠 |
| 하의 | 스커트 | 미니, 미디, 롱, 플리츠 |
| 아우터 | 자켓 | 테일러드, 블루종, 데님자켓, 트위드자켓 |
| 아우터 | 코트 | 트렌치, 싱글코트, 더블코트, 패딩코트 |
| 아우터 | 점퍼 | 바람막이, 패딩, 야상 |
| 원피스/세트 | 원피스 | 미니, 미디, 롱, 셔츠원피스 |
| 원피스/세트 | 점프수트 | 점프수트, 오버롤 |
| 원피스/세트 | 세트 | 상하세트, 트레이닝세트 |
| 이너웨어 | 언더웨어 | 브라탑, 팬티, 이너탑 |
| 액세서리 | 패션잡화 | 모자, 머플러, 벨트, 가방 |
| 기타 | 사용자 분류 | 기타 의류, 샘플/테스트 |

### 4.1 코드 규칙

- 1차: `apparel.top`, `apparel.bottom`, `apparel.outer`, `apparel.onepiece_set`, `apparel.inner`, `apparel.accessory`, `apparel.other`
- 2차: `apparel.top.tshirt`처럼 부모 code를 prefix로 사용한다.
- 3차: `apparel.top.tshirt.short_sleeve`처럼 안정적인 영문 snake_case suffix를 사용한다.
- 화면 표시 이름은 한국어이며 향후 i18n label mapping을 추가할 수 있다.
- 이름을 바꿔도 code는 바꾸지 않는다.

## 5. 기본 사이즈 스펙 카탈로그

### 5.1 공통 항목

| code | 표시명 | 기본 단위 | 비고 |
| --- | --- | --- | --- |
| `body_length` | 총장 | cm | 상의/아우터/원피스 |
| `shoulder_width` | 어깨너비 | cm | 상의/아우터 |
| `chest_width` | 가슴단면 | cm | 기본은 단면 표기 |
| `waist_width` | 허리단면 | cm | 하의/원피스 |
| `hip_width` | 엉덩이단면 | cm | 하의/원피스 |
| `sleeve_length` | 소매길이 | cm | 상의/아우터 |
| `armhole` | 암홀 | cm | 상의/아우터 |
| `hem_width` | 밑단단면 | cm | 공통 |
| `neck_width` | 목너비 | cm | 상의/원피스 |
| `neck_depth` | 목깊이 | cm | 앞/뒤 구분 확장 가능 |

### 5.2 하의 추가 항목

- `outseam_length` 총기장
- `rise_front` 앞밑위
- `rise_back` 뒤밑위
- `thigh_width` 허벅지단면
- `knee_width` 무릎단면
- `leg_opening_width` 밑단단면
- `inseam_length` 인심

### 5.3 스커트·원피스 추가 항목

- `skirt_length` 스커트길이
- `waist_to_hip` 허리-힙 길이
- `bust_point` BP 위치
- `back_length` 등길이

### 5.4 액세서리 예시

- 모자: 머리둘레, 챙길이, 높이
- 가방: 가로, 세로, 폭, 스트랩길이
- 벨트: 전체길이, 폭, 홀 간격

### 5.5 측정 규칙

- 저장 단위의 기본값은 `cm`다.
- 화면에서는 cm/inch 전환을 지원할 수 있으나 canonical 저장 단위는 하나로 통일한다.
- 둘레와 단면을 혼용하지 않는다. 기본 의류 스펙은 `가슴단면`, `허리단면`, `엉덩이단면`으로 명시한다.
- 항목마다 measurement guide, sort order, applicable product code 목록을 둘 수 있다.
- 고객사 사용자 정의 항목을 허용하되 system code와 충돌하지 않게 한다.

## 6. 제품군별 기본 스펙 매핑

| 제품군 | 기본 표시 항목 |
| --- | --- |
| 티셔츠/스웨트 | 총장, 어깨너비, 가슴단면, 소매길이, 암홀, 밑단단면 |
| 셔츠/블라우스 | 총장, 어깨너비, 가슴단면, 소매길이, 암홀, 목너비, 밑단단면 |
| 니트/카디건 | 총장, 어깨너비, 가슴단면, 소매길이, 밑단단면 |
| 자켓/코트/점퍼 | 총장, 어깨너비, 가슴단면, 소매길이, 암홀, 밑단단면 |
| 팬츠 | 허리단면, 엉덩이단면, 총기장, 앞밑위, 뒤밑위, 허벅지단면, 밑단단면, 인심 |
| 스커트 | 허리단면, 엉덩이단면, 스커트길이, 밑단단면 |
| 원피스/점프수트 | 총장, 어깨너비, 가슴단면, 허리단면, 엉덩이단면, 소매길이, 암홀, 밑단단면 |
| 액세서리 | 해당 하위 유형의 전용 항목만 기본 표시 |

사용자는 작업지시서별로 항목을 추가·숨김·정렬할 수 있어야 한다. 기본 매핑은 시작값이지 강제 스키마가 아니다.

## 7. 신규 고객사 provisioning 계약

가입 승인 후 회사 workspace를 만들 때 다음 순서를 권장한다.

1. 회사와 최초 고객사 관리자 계정을 생성한다.
2. 활성 요금제와 저장공간 quota를 연결한다.
3. 활성 시스템 단위·공정 기준정보를 enable 관계로 생성한다.
4. 기본 생산품 분류 template을 회사 범위로 복제하거나 enable한다.
5. 제품군별 기본 스펙 항목과 정렬을 회사 범위로 생성한다.
6. 처리 결과와 template version을 provisioning audit에 기록한다.
7. 일부 단계 실패 시 회사가 반쯤 생성된 상태로 노출되지 않게 transaction 또는 resumable provisioning 상태를 사용한다.

## 8. Seed와 Backfill 계약

### 8.1 Seed

- canonical 파일은 `db/seed/system_standards_seed.sql`을 유지한다.
- stable id/code와 `ON CONFLICT`를 사용한다.
- seed 재실행은 중복 행을 만들지 않는다.
- 고객사 설정을 덮어쓰지 않는다.
- production 실행은 별도 승인과 dry-run evidence가 필요하다.

### 8.2 기존 고객사 Backfill

- 신규 누락 관계만 추가한다.
- 고객사가 비활성화한 기존 항목은 다시 활성화하지 않는다.
- 사용자 정의 분류와 이름이 같아도 code/source가 다르면 자동 병합하지 않는다.
- 적용 전 회사별 추가 예정 건수, 충돌 건수, skip 건수를 report한다.
- 실패 시 회사 단위 재시도가 가능해야 한다.

### 8.3 Schema/Migration 판단

Codex는 구현 전에 다음을 조사한다.

- 현재 product template/category table이 고객사 enable 또는 복제를 충분히 지원하는가.
- spec item catalog와 product-category mapping table이 이미 존재하는가.
- 없다면 additive migration이 필요한가.
- migration 없이 기존 JSON/row 구조로 안전하게 표현 가능한가.

Schema 변경이 필요하면 0.24.22 UI Sprint에 섞지 말고 별도 DB Sprint와 사용자 승인 대상으로 분리한다.

## 9. 시스템 관리자 화면 요구사항

시스템 관리자는 다음을 조회·관리할 수 있어야 한다.

- 1차/2차/3차 분류 tree와 활성 상태
- stable code, 표시명, 정렬 순서, 사용 중인 고객사 수
- 사이즈 스펙 항목과 적용 제품군
- 현재 seed/template version
- 신규/기존 고객사 적용 상태
- dry-run 결과와 마지막 적용 이력

운영 화면에서 raw SQL, DB URL, secret, 내부 token을 노출하지 않는다. 위험 작업은 preview → 확인 → 실행 → 결과 증적 순서로 분리한다.

## 10. Simulator와 테스트 fixture

최소 시나리오:

- 기본 분류와 스펙이 모두 적용된 신규 Trial 회사
- 일부 분류를 비활성화한 기존 회사
- 사용자 정의 분류·스펙이 있는 회사
- 구버전 template을 사용하는 회사
- backfill 충돌과 skip이 있는 회사

검증 항목:

- 분류 tree 순서와 parent 관계
- 신규 회사 기본값 생성
- 재실행 idempotency
- 고객사 비활성화 보존
- 기존 작업지시서 참조 보존
- PDF document model에서 스펙 label/order 유지

## 11. Codex 구현 분리 권장

### Sprint DB-A — 조사와 계약

- 현재 schema/repository/API 조사
- seed gap report
- additive migration 필요 여부 결정
- dry-run report 형식 확정

### Sprint DB-B — 시스템 baseline

- 분류 및 스펙 catalog seed
- idempotency와 duplicate contract
- full reset와 canonical seed 동기화

### Sprint DB-C — 회사 provisioning/backfill

- 신규 고객사 기본값 생성
- 기존 고객사 dry-run/backfill
- audit/evidence

### Sprint UI-D — 시스템 관리자 관리 화면

- tree/catalog/status UI
- WAFL component 적용
- preview와 destructive guard

## 12. 완료 조건

- 기본 분류와 스펙 항목이 stable code로 정의된다.
- seed와 full reset baseline이 동일하다.
- 신규 회사 provisioning이 자동 검증된다.
- 기존 고객사 설정을 덮어쓰지 않는 backfill contract가 통과한다.
- seed 재실행 시 중복 0건이다.
- production 실행 없이 dev/test evidence가 확보된다.

## 13. 사용자 결정이 필요한 항목

이번 문서에서 즉시 구현을 막지 않는 선택 항목:

- 기본 분류 목록에 속옷·액세서리를 기본 활성화할지 여부
- 가슴/허리/엉덩이를 단면 기본으로 고정할지, 둘레 옵션을 동시에 제공할지
- 고객사에 시스템 기본 분류 이름 변경을 허용할지, 별칭만 허용할지
- 기존 고객사에 신규 기본 항목을 자동 enable할지, 관리자 승인 후 enable할지

Codex는 위 항목을 임의 확정하지 않고 기본값 제안과 영향 보고 후 진행한다.
