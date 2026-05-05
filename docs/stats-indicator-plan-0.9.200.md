# PeaceByPiece 통계 지표 / 요금제 / 구현 로드맵

- 기준 버전: 0.9.1993
- 문서 버전: 0.9.200
- 목적: 고객관리자/시스템관리자 통계 기능을 요금제별 노출, 데이터 구조, 라이브러리 도입, 성능/DB 설계까지 한 번에 검토할 수 있도록 정리한다.

---

## 1. 기본 방향

통계 기능은 처음부터 요금제별 노출 구조를 염두에 두고 설계한다.

개발은 단계별로 진행하되, DB와 API는 나중에 고급 통계/요금제 잠금/대용량 집계까지 확장할 수 있게 만든다.

핵심 원칙:

1. 통계 화면은 raw data 전체를 클라이언트로 내려받아 계산하지 않는다.
2. 통계 API는 집계된 결과만 반환한다.
3. R2 object list를 통계 화면에서 직접 조회하지 않는다.
4. 저장소 통계는 attachments DB metadata 기준으로 계산한다.
5. 작업지시서 통계는 spec_sheets, orders, attachments, memos, category id, partner id 등 DB 컬럼 기준으로 계산한다.
6. 고급 통계는 요금제 feature flag로 잠금 처리할 수 있게 설계한다.
7. 초기에는 SQL aggregate API + Recharts로 시작하고, 사용량 증가 시 summary table/materialized view/read replica/TanStack Query를 적용한다.

---

## 2. 요금제별 통계 노출 구상

### 2.1 Basic 플랜

목표: 고객이 현재 작업 흐름과 기본 사용량을 확인할 수 있는 수준.

노출 통계:

| 영역 | 지표 | 설명 |
|---|---|---|
| 작업 현황 | 상태별 작업지시서 수 | 작성중/검토요청/검토완료/발주요청/검수/완료 등 |
| 작업 추이 | 월별 작업지시서 생성 수 | 월별 생성량 |
| 작업 추이 | 월별 완료 수 | 월별 완료량 |
| 저장소 | 전체 저장 용량 | 현재 회사의 전체 사용량 |
| 저장소 | active/trash 용량 | 사용 중 파일/휴지통 파일 용량 |
| 최근 현황 | 최근 생성 작업지시서 | 최근 작업 흐름 확인 |

잠금 처리:

- 공장별 비용/납기/불량 등 의사결정형 통계는 preview card로 보여주고 상위 플랜 안내.

---

### 2.2 Standard / Growth 플랜

목표: 생산량, 공장별 비용, 품목별 반복 생산을 분석할 수 있는 수준.

노출 통계:

| 영역 | 지표 | 설명 |
|---|---|---|
| 분류 | 1차 분류별 작업지시서 수 | 상의/하의/아우터 등 |
| 분류 | 2차 분류별 작업지시서 수 | 티셔츠/셔츠/팬츠 등 |
| 분류 | 3차 분류별 작업지시서 수 | 반팔 티셔츠/후드 등 |
| 분류 | 3차 분류별 총 발주 수량 | 실제 생산 비중 |
| 리오더 | 리오더 많은 3차 분류 TOP | 반복 생산 품목 확인 |
| 리오더 | 리오더율 | 리오더 작업 / 전체 작업 |
| 공장 | 공장별 발주 건수 | 공장별 업무량 |
| 공장 | 공장별 총 발주 수량 | 공장별 생산량 |
| 공장 | 공장별 총 비용 | 수량 × 장당 공임비 + 로스비 합산 |
| 비용 | 월별 총 생산비 | 공임/자재/외주/로스 합산 기준 |
| 비용 | 분류별 장당 평균 생산비 | 견적 기준 참고 |

잠금 처리:

- 납기 지연율, 불량률, 기간 비교, export는 Premium으로 잠금.

---

### 2.3 Premium 플랜

목표: 공장 평가, 납기/품질 리스크, 비용 분석, 리포트 출력까지 제공.

노출 통계:

| 영역 | 지표 | 설명 |
|---|---|---|
| 공장 | 공장별 납기 지연 건수 | 납기 초과 건수 |
| 공장 | 공장별 납기 지연율 | 지연 건수 / 전체 발주 건수 |
| 공장 | 공장별 평균 지연일 | 평균 며칠 지연되는지 |
| 품질 | 공장별 불량/에러 수량 | 검수 결과 기반 |
| 품질 | 공장별 불량률 | 에러 수량 / 발주 수량 |
| 품질 | 분류별 불량률 | 품목별 난이도 파악 |
| 외주 | 외주공정별 사용 건수 | 나염/자수/재단 등 |
| 외주 | 외주공정별 총 비용 | 공정별 비용 규모 |
| 자재 | 원단처/부자재처별 사용 건수 | 주요 거래처 확인 |
| 자재 | 자재명별 사용 빈도 | 재고/구매 전략 |
| 자재 | 자재 단가 변화 | 가격 변동 확인 |
| 기간 비교 | 전월 대비 증감 | 작업량/비용/리오더 비교 |
| Export | CSV/Excel 다운로드 | 내부 보고/정산용 |
| 리포트 | 월간 리포트 | 자동 요약 또는 다운로드 |

전제 조건:

- 검수 결과, 에러 수량, 실제 완료일/납기일 기준이 DB에 안정적으로 저장되어야 한다.
- 품질/납기 통계는 데이터 필드 정리 후 활성화한다.

---

### 2.4 Enterprise / 시스템관리자 통계

시스템관리자는 고객사 전체 사용량, 저장소, 요금제, purge, 장애/성능을 본다.

노출 통계:

| 영역 | 지표 | 설명 |
|---|---|---|
| 고객사 | 전체 고객사 수 | 등록 회사 수 |
| 고객사 | 활성 고객사 수 | 최근 사용 고객사 |
| 고객사 | 고객사별 작업지시서 수 | 사용량 기준 |
| 고객사 | 고객사별 월간 생성 수 | 활동량 |
| 고객사 | 고객사별 최근 활동일 | 이탈 가능성 |
| 요금제 | 요금제별 고객사 수 | 플랜 분포 |
| 요금제 | 고객사별 저장 용량 사용률 | quota 대비 사용량 |
| 요금제 | 용량 초과 위험 고객 | 80% 이상 등 |
| 저장소 | 전체 R2 용량 | 전체 파일 비용 관리 |
| 저장소 | purge 후보 수 | 삭제 가능 파일 |
| 저장소 | purge 성공/실패 수 | Worker 삭제 안정성 |
| 저장소 | purge 실패 사유 | 운영 점검 |
| 기능 사용 | PDF 출력 횟수 | 핵심 기능 사용량 |
| 기능 사용 | 리오더 생성 횟수 | 반복 사용성 |
| 기능 사용 | 첨부 업로드 횟수 | 저장소 사용 패턴 |
| 성능 | 작업지시서 목록 로딩 시간 | 캐싱 필요 판단 |
| 성능 | 상세 hydrate 시간 | payload/쿼리 병목 판단 |
| 성능 | API 에러율 | 장애 판단 |
| 성능 | R2 upload/purge 실패율 | 파일 처리 안정성 |

전제 조건:

- event_logs 또는 operation_logs 성격의 로그 테이블이 필요할 수 있다.
- API 응답 시간/에러율은 애플리케이션 로그 또는 별도 계측 구조가 필요하다.

---

## 3. 고객관리자 통계 지표 전체 목록

### 3.1 작업지시서 운영 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 전체 작업지시서 수 | 높음 | spec_sheets |
| 진행 중 작업지시서 수 | 높음 | status/is_active/delete_status |
| 완료 작업지시서 수 | 높음 | status/completed_at |
| 상태별 작업지시서 수 | 높음 | status |
| 월별 생성 수 | 높음 | created_at |
| 월별 완료 수 | 높음 | completed_at/status |
| 평균 완료 소요일 | 중간 | created_at/completed_at |
| 상태별 평균 체류 시간 | 중간~높음 | status history 필요 |

### 3.2 품목/카테고리 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 1차 분류별 작업지시서 수 | 높음 | category1_id |
| 2차 분류별 작업지시서 수 | 높음 | category2_id |
| 3차 분류별 작업지시서 수 | 높음 | category3_id |
| 3차 분류별 총 발주 수량 | 높음 | category3_id + order quantity |
| 리오더 많은 3차 분류 | 높음 | category3_id + reorder_group_id/reorder_round |
| 분류별 평균 제작비 | 중간 | cost summary |
| 분류별 평균 로스비 | 중간 | loss cost |
| 분류별 완료율 | 중간 | status/category id |

### 3.3 공장별 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 공장별 발주 건수 | 높음 | factory order rows |
| 공장별 총 발주 수량 | 높음 | quantity |
| 공장별 평균 공임 단가 | 높음 | labor_cost |
| 공장별 총 공임비 | 높음 | quantity × labor_cost |
| 공장별 총 로스비 | 높음 | loss_cost |
| 공장별 총 비용 | 높음 | quantity × labor_cost + loss_cost |
| 공장별 납기 지연 건수 | 중간~높음 | due_date/completed_at |
| 공장별 납기 지연율 | 중간~높음 | due_date/completed_at |
| 공장별 평균 지연일 | 중간 | due_date/completed_at |
| 공장별 불량률 | 중간~높음 | inspection result 필요 |

### 3.4 원단/부자재 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 원단처별 사용 건수 | 중간 | material rows |
| 원단처별 총 사용 수량 | 중간 | material quantity |
| 원단처별 총 비용 | 중간 | material cost |
| 원단명별 사용 빈도 | 중간 | material name |
| 부자재처별 사용 건수 | 중간 | accessory rows |
| 부자재명별 사용 빈도 | 중간 | accessory name |
| 자재 단가 변화 | 낮음~중간 | date + unit cost |

### 3.5 외주공정 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 외주공정별 사용 건수 | 중간 | outsourcing process |
| 외주처별 발주 건수 | 중간 | vendor id |
| 외주공정별 총 비용 | 중간 | outsourcing cost |
| 외주처별 평균 단가 | 중간 | cost/quantity |
| 외주공정별 지연 건수 | 낮음~중간 | due/completed 필요 |
| 외주공정별 불량률 | 낮음~중간 | inspection result 필요 |

### 3.6 비용 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 월별 총 생산비 | 높음 | cost summary |
| 작업지시서별 총 비용 | 높음 | cost summary |
| 분류별 평균 생산비 | 중간~높음 | category + cost |
| 장당 평균 생산비 | 높음 | total cost / quantity |
| 공장별 비용 비중 | 높음 | factory cost |
| 로스비 총액 | 중간 | loss cost |
| 로스비 비율 | 중간 | loss / total |

### 3.7 저장소/파일 통계

| 지표 | 우선순위 | 필요 데이터 |
|---|---:|---|
| 전체 저장 용량 | 높음 | attachments size metadata |
| active 파일 용량 | 높음 | is_active/deleted_at |
| 휴지통 파일 용량 | 높음 | deleted_at/purge_status |
| purge 예정 파일 수 | 중간 | purge_after_at/purge_status |
| 디자인 파일 용량 | 중간 | attachment type |
| 첨부파일 용량 | 중간 | attachment type |
| 메모 첨부 용량 | 낮음~중간 | attachment type |
| 작업지시서별 용량 TOP | 중간 | work_order_id + size |
| 파일 유형별 용량 | 중간 | mime/type |

---

## 4. 라이브러리 후보와 도입 시기

### 4.1 1차 추천: Recharts

용도:

- 고객관리자 기본 통계
- 상태별 수, 월별 추이, 공장별 비용, 분류별 TOP, 저장소 용량

장점:

- React 컴포넌트 방식이라 현재 구조와 잘 맞음.
- 카드형 UI 안에 넣기 쉬움.
- Tailwind/theme token과 조합하기 쉬움.
- 업무용 SaaS 대시보드 톤에 적합.

단점:

- 대용량 raw point 렌더링에는 적합하지 않음.
- 복잡한 BI 기능은 ECharts보다 약함.

도입 시기:

- 0.9.202 또는 0.9.203에서 도입 권장.

수정 파일:

- package.json
- package-lock.json

비고:

- 통계 라이브러리 도입 버전에서는 package 파일 수정 금지 규칙을 예외로 둔다.

---

### 4.2 2차 후보: TanStack Query

용도:

- 통계 API 캐싱
- 중복 요청 방지
- staleTime 설정
- background refetch

장점:

- 통계 화면 이동 시 반복 조회 감소.
- API 상태 관리가 명확해짐.
- 캐시 무효화 기준을 체계화할 수 있음.

단점:

- 기존 fetch/hook 구조와 병행 기간이 필요함.
- 전면 도입하면 구조 변경 범위가 커짐.

도입 시기:

- Recharts 이후 또는 동시에 가능.
- 처음에는 통계 API에만 제한 적용 권장.

---

### 4.3 고급 후보: Apache ECharts

용도:

- 시스템관리자 고급 통계
- 대량 고객사 데이터
- 복합 차트
- zoom/drill-down/장기 추이

장점:

- 대량 데이터/복합 차트에 강함.
- 시스템 운영 대시보드에 적합.

단점:

- option 객체 기반이라 React 컴포넌트 톤과 다름.
- 제품 UI와 맞추려면 adapter 필요.

도입 시기:

- 고객사 수와 통계 복잡도가 늘어난 후 검토.
- 처음부터 도입하지 않음.

---

### 4.4 기타 후보

| 라이브러리 | 판단 |
|---|---|
| Nivo | 예쁜 시각화에는 좋지만 초기 업무형 통계에는 과함 |
| Visx | 완전 맞춤형 차트에 좋지만 개발 공수가 큼 |
| Chart.js | 무난하지만 Recharts가 현재 React/Tailwind 구조에 더 적합 |

---

## 5. 성능/DB 설계 원칙

### 5.1 통계 API 원칙

금지:

```text
통계 화면에서 spec_sheets/attachments/memos 전체 raw data를 내려받아 프론트에서 groupBy 계산
```

권장:

```text
API route에서 SQL aggregate로 집계한 결과만 반환
```

예시:

```sql
SELECT category3_id, COUNT(*) AS work_order_count
FROM spec_sheets
WHERE company_id = $1
  AND delete_status <> 'purged'
GROUP BY category3_id;
```

응답 예시:

```json
[
  { "label": "반팔 티셔츠", "count": 12 },
  { "label": "후드", "count": 8 }
]
```

---

### 5.2 R2 통계 원칙

금지:

```text
통계 화면에서 R2 listObjects로 용량 계산
```

권장:

```text
attachments 테이블의 size_bytes, type, storage_key, thumbnail_key, is_active, deleted_at, purge_status 기준으로 계산
```

필요 점검:

- 원본 size_bytes 저장 여부
- thumbnail size 저장 여부
- 원본 + 썸네일 합산 기준
- active/trash/purged 구분 기준

---

### 5.3 인덱스 후보

통계 기능 전에 검토할 인덱스:

```sql
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_id ON spec_sheets(company_id);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_status ON spec_sheets(company_id, status);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_created_at ON spec_sheets(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_category1 ON spec_sheets(company_id, category1_id);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_category2 ON spec_sheets(company_id, category2_id);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_category3 ON spec_sheets(company_id, category3_id);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_delete_status ON spec_sheets(company_id, delete_status);
CREATE INDEX IF NOT EXISTS idx_attachments_company_status ON attachments(company_id, is_active, deleted_at, purge_status);
CREATE INDEX IF NOT EXISTS idx_attachments_work_order_id ON attachments(work_order_id);
```

주의:

- 실제 컬럼명은 현재 schema 확인 후 반영한다.
- 인덱스는 무조건 많이 만드는 것이 아니라, 실제 통계 쿼리 기준으로 추가한다.

---

### 5.4 summary table / materialized view 후보

초기에는 실시간 aggregate SQL로 충분할 수 있다.

사용량이 늘면 아래 구조를 검토한다.

```text
company_monthly_stats
company_category_stats
company_factory_stats
company_storage_stats
system_company_usage_stats
```

갱신 방식 후보:

1. C/U/D 발생 시 해당 summary row만 갱신.
2. 5분~1시간 주기로 background 재계산.
3. materialized view를 수동 refresh.

권장 순서:

```text
1차: SQL aggregate API
2차: index 보강
3차: summary table
4차: read replica / 캐싱
```

---

### 5.5 1000명 동시 사용 대비

위험한 구조:

```text
- 통계 카드마다 API 개별 호출
- API마다 raw data 전체 조회
- company_id 인덱스 없음
- R2 listObjects로 용량 계산
- primary DB에서 무거운 통계 쿼리 반복
```

안전한 구조:

```text
- 통계 API는 집계 결과만 반환
- company_id + status/category/date 인덱스 사용
- R2는 metadata 기반 계산
- 통계 응답 캐싱
- 필요 시 Neon read replica 분리
- summary table로 무거운 집계 사전 계산
```

추가 검토:

- TanStack Query staleTime
- 서버 route cache 정책
- 고객사별 통계 API 응답 크기 제한
- 기간 필터 기본값 30일/90일/12개월 제한
- export는 비동기 작업으로 분리 가능

---

## 6. 작업 버전 로드맵

### 0.9.200 — 통계 지표/요금제별 노출 설계 문서화

목표:

- 본 문서 추가
- 고객관리자/시스템관리자 통계 지표 목록 정리
- Basic/Standard/Premium/Enterprise 노출 기준 정리
- 라이브러리 도입 시기 정리
- 성능/DB 설계 원칙 정리

수정 예상:

- docs/stats-indicator-plan-0.9.200.md
- lib/constants/app.ts

---

### 0.9.201 — 통계 API 설계 문서화

목표:

- 고객관리자 통계 API endpoint 설계
- 시스템관리자 통계 API endpoint 설계
- raw data 금지 원칙 정리
- 응답 DTO 설계
- 기간 필터, company_id 필터, plan feature flag 기준 정리

예상 API:

```text
GET /api/admin/stats/overview
GET /api/admin/stats/workorders
GET /api/admin/stats/categories
GET /api/admin/stats/factories
GET /api/admin/stats/storage
GET /api/system/stats/companies
GET /api/system/stats/storage
GET /api/system/stats/purge
```

---

### 0.9.202 — 통계용 schema/index 1차

목표:

- 통계 쿼리에 필요한 인덱스 추가
- full_reset.sql 반영
- smoke test 반영
- 실제 쿼리 기준으로 최소 인덱스만 추가

주의:

- 기존 data model을 크게 바꾸지 않음.
- payload 제거/대규모 정규화는 하지 않음.

---

### 0.9.203 — Recharts 도입

목표:

- recharts 설치
- package.json/package-lock.json 수정 허용
- 공통 ChartCard 컴포넌트 추가
- theme token과 chart color token 연결 준비

설치 후보:

```bash
npm install recharts
```

---

### 0.9.204 — 고객관리자 기본 통계 카드 1차

목표:

- 상태별 작업지시서 수
- 월별 생성/완료 추이
- 저장소 active/trash 용량
- Basic 플랜 기준 통계 화면 구성

---

### 0.9.205 — 고객관리자 고급 통계 preview/잠금

목표:

- 공장별 비용/수량 preview card
- 분류별 생산량 preview card
- 리오더 TOP preview card
- 플랜 권한 없으면 잠금 처리
- 실제 요금제 feature flag 구조 준비

---

### 0.9.206 — Standard/Growth 통계 1차

목표:

- category1/2/3별 작업지시서 수
- 3차 분류별 발주 수량 TOP
- 공장별 발주 건수/수량
- 공장별 총 비용
- 리오더 많은 3차 분류 TOP

---

### 0.9.207 — Premium 통계 준비

목표:

- 납기 지연율/불량률에 필요한 DB 필드 확인
- 검수 결과/에러 수량/완료일 기준 정리
- 부족한 schema 문서화
- 아직 차트 노출은 preview 가능

---

### 0.9.208 — 시스템관리자 통계 1차

목표:

- 고객사별 작업지시서 수
- 고객사별 저장 용량 사용률
- 요금제별 고객사 수
- purge 후보/성공/실패 수
- 용량 초과 위험 고객

---

### 0.9.209 — TanStack Query 도입 검토/적용

목표:

- 통계 API에 한정해 TanStack Query 적용
- staleTime/cacheTime 기준 정리
- 중복 요청 방지
- 탭 전환 시 재요청 최소화

설치 후보:

```bash
npm install @tanstack/react-query
```

---

### 0.9.210 — 성능 측정 기준 문서화

목표:

- 작업지시서 목록 로딩 시간
- 작업지시서 상세 hydrate 시간
- 통계 API 응답 시간
- 통계 차트 렌더링 시간
- API 에러율
- R2 upload/purge 실패율
- 측정 방식과 기준값 정리

---

### 0.9.211 — summary table/materialized view 검토

목표:

- 실시간 aggregate 쿼리 성능 확인 후 결정
- summary table 후보 설계
- materialized view 후보 설계
- read replica 필요성 판단

---

## 7. 보류/후속 결정 항목

아래는 지금 당장 결정하지 않고, 실제 사용/속도/DB 구조를 본 뒤 결정한다.

1. payload 컬럼 제거 여부
2. spec_sheets와 payload 중복 구조 정리
3. event_logs 도입 여부
4. inspection_results 별도 테이블 설계 여부
5. materialized view 사용 여부
6. Neon read replica 도입 시점
7. ECharts 추가 도입 여부
8. CSV/Excel export 유료 플랜 범위
9. 월간 리포트 자동 생성 방식
10. 모바일/태블릿 통계 화면 노출 범위

---

## 8. 현재 제품 톤과 차트 디자인 방향

PeaceByPiece 통계 화면은 다음 톤을 기준으로 한다.

```text
- 업무용 SaaS
- 차분한 카드형 dashboard
- 과하게 화려하지 않음
- 테이블/차트가 같이 읽히는 구조
- theme token 기반 색상
- PC 우선
```

추천 UI 구성:

```text
상단: 핵심 숫자 카드 4개
중단: 월별 추이 line chart + 상태별 bar/donut
하단: 공장별 비용 TOP + 3차 분류별 수량 TOP + 리오더 TOP
```

차트는 Recharts 기반으로 시작하고, 색상은 직접 hex를 박지 않고 theme token을 거쳐 관리한다.

---

## 9. 최종 판단

통계 기능은 추가 요금제로 나누기에 적합하다.

단, 차트만 많이 만드는 것보다 먼저 아래 기반이 중요하다.

1. DB 컬럼/인덱스
2. 통계 API aggregate 설계
3. feature flag / plan gating
4. chart component 공통화
5. 캐싱/성능 기준

따라서 다음 순서는 아래가 적절하다.

```text
0.9.200 문서화
0.9.201 API 설계
0.9.202 인덱스/schema 준비
0.9.203 Recharts 도입
0.9.204 Basic 통계 1차
0.9.205 고급 통계 잠금 preview
0.9.206 Standard/Growth 통계
0.9.207 Premium 통계 준비
0.9.208 시스템관리자 통계
0.9.209 TanStack Query
0.9.210 성능 측정
```
