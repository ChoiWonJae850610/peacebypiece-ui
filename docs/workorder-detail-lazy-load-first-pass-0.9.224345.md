# 0.9.224345 작업지시서 상세 lazy load 1차 구현

## 목표

작업지시서 화면 첫 진입 시 전체 작업지시서의 첨부/메모 snapshot을 한 번에 hydrate하지 않고, 목록 전용 summary API를 먼저 사용한 뒤 선택된 작업지시서의 상세 데이터만 별도로 불러오도록 전환한다.

## 변경 요약

- `/api/workorders/summary`를 작업지시서 첫 로딩에 사용한다.
- `/api/workorders/[workOrderId]` 상세 API를 추가한다.
- DB repository에 `findDbWorkOrderById(workOrderId)`를 추가한다.
- repository adapter에 `loadWorkOrderDetail` 메서드를 추가한다.
- workspace state 초기화 시 summary 목록을 먼저 받은 뒤 초기 선택 작업지시서만 detail API로 hydrate한다.
- 작업지시서 선택 변경 시 `hasDetailSnapshot === false`인 항목만 상세 API로 lazy load한다.
- 목록 카드의 파일 수는 summary 단계에서는 `summaryAttachmentCount`를 사용한다.

## 현재 의도한 로딩 순서

```text
작업지시서 화면 진입
→ GET /api/workorders/summary
→ 가벼운 목록 120개 수신
→ selectedId 결정
→ GET /api/workorders/{selectedId}
→ 선택된 작업지시서 1건만 첨부/메모 snapshot hydrate
```

선택 변경 시:

```text
다른 작업지시서 선택
→ 해당 row의 hasDetailSnapshot 확인
→ false이면 GET /api/workorders/{id}
→ 현재 선택 항목만 상세 데이터로 교체
```

## 아직 남은 보정 지점

- 상세 로딩 중 UI 표시를 더 명확히 분리할 필요가 있다.
- 상세 load 실패 시 화면에 표시할 문구는 다음 안정화 버전에서 정리한다.
- `findDbWorkOrderById`는 현재 기존 active row 조회 구조를 재사용한다. 이후 필요하면 id 단건 SQL로 더 최적화한다.
- 저장/첨부/메모/상태 변경 이후 목록 summary count 갱신은 다음 회귀 테스트에서 확인한다.

## 확인 방법

PowerShell 예시:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/workorders/summary" -Method GET |
ConvertTo-Json -Depth 10 |
Out-File -Encoding utf8 .tmp\workorders-summary-response.json

Invoke-RestMethod -Uri "http://localhost:3000/api/workorders/realistic-spec-906" -Method GET |
ConvertTo-Json -Depth 10 |
Out-File -Encoding utf8 .tmp\workorders-detail-response.json
```

확인값:

```json
{
  "meta": {
    "mode": "detail",
    "hydrated": true
  }
}
```
