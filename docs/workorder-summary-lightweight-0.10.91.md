# 작업지시서 목록 요약 조회 경량화 — 0.10.91

## 목적

작업지시서 목록 초기 진입 시 `spec_sheets.payload` 전체를 내려받고 클라이언트에서 상세 배열을 파싱하던 흐름을 줄인다.

0.10.88에서 목록 요약 API와 상세 API를 분리했으므로, 이번 버전에서는 `/api/workorders/summary`가 상세 payload 전체가 아니라 목록 표시와 카운트 계산에 필요한 최소 필드만 조회하도록 조정했다.

## 변경 내용

- `findDbWorkOrderSummaries` 전용 summary SQL 추가
- summary 조회 시 `payload` 전체 대신 summary key만 `jsonb_build_object`로 구성
- `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`, `attachments`, `memos`의 활성 row 수를 SQL에서 count
- 상세 화면용 `findDbWorkOrderById`와 전체 상세 조회용 `findAllDbWorkOrders`는 기존 상세 payload 조회 유지

## 기대 효과

- 작업지시서 목록 초기 payload 크기 감소
- 목록에서 상세 배열을 모두 파싱하는 비용 감소
- 첨부/메모/생산구성 개수는 실제 DB row 기준으로 표시
- 상세 데이터는 작업지시서 선택 후 기존 상세 API에서 별도로 hydrate

## 확인 방법

브라우저 개발자도구 Network에서 아래 API를 비교한다.

```text
/api/workorders/summary
/api/workorders/{workOrderId}
```

확인 기준:

- summary 응답의 `meta.durationMs`
- detail 응답의 `meta.durationMs`
- summary 응답 크기
- 작업지시서 목록 표시 속도
- 선택한 작업지시서 상세 표시 유지 여부

## 다음 후보

summary 응답이 여전히 느리면 다음 단계에서 아래를 검토한다.

1. 목록 페이지네이션 또는 limit 도입
2. count 집계용 pre-aggregation 또는 materialized summary 검토
3. 클라이언트 derived 계산 반복 지점 계측
4. 목록 row 렌더링 memoization 검토
