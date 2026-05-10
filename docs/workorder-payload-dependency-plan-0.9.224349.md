# spec_sheets.payload 정리 설계 및 상세 hydrate 의존성 점검 — 0.9.224349

## 목적

`spec_sheets.payload`는 과거 mock/localStorage 기반 작업지시서 객체를 DB로 옮기면서 남은 legacy snapshot 성격의 컬럼이다. 현재 구조에서는 일부 상세 필드와 fallback 표시값이 payload에 남아 있기 때문에 즉시 삭제하면 작업지시서 상세, 목록, 통계 일부가 깨질 수 있다.

이번 버전의 목표는 payload를 바로 제거하는 것이 아니라 다음 두 가지를 먼저 정리하는 것이다.

1. payload가 없어도 DB 상태 점검이 실패하지 않도록 한다.
2. 상세 1건 조회가 전체 작업지시서 목록을 다시 읽지 않도록 한다.

## 이번 버전 반영 내용

### 1. 상세 1건 조회 범위 축소

기존 `findDbWorkOrderById()`는 내부에서 active 작업지시서 전체를 조회한 뒤 메모리에서 id를 찾는 구조였다.

```text
findDbWorkOrderById(id)
→ loadActiveSpecSheetRows()
→ 전체 작업지시서 조회
→ rows.find(id)
```

0.9.224349에서는 `WHERE id = $1` 조건으로 해당 작업지시서 1건만 조회하도록 변경했다.

```text
findDbWorkOrderById(id)
→ SELECT ... FROM spec_sheets WHERE id = $1 LIMIT 1
```

이 변경은 작업지시서 상세 lazy load, 상태 변경 전 이전 상태 조회, 상세 API 응답 속도에 직접 영향을 준다.

### 2. payload 컬럼 상태 점검 완화

`/api/workorders/status`는 기존에 payload 컬럼을 필수로 요구했다. 이 기준은 payload 제거 또는 payload 의존 축소와 충돌한다.

0.9.224349에서는 다음처럼 변경했다.

```text
id, title: 필수
payload: 선택
payload가 있으면 json/jsonb/text 계열만 허용
payload가 없어도 DB 상태 점검은 READY 가능
```

응답에는 payload 상태를 확인할 수 있도록 schema 정보를 포함한다.

```json
{
  "schema": {
    "payloadColumn": "payload",
    "payloadColumnKind": "jsonb",
    "payloadOptional": true
  }
}
```

payload 컬럼이 없는 구조로 전환한 뒤에는 다음처럼 나오는 것이 정상이다.

```json
{
  "schema": {
    "payloadColumn": null,
    "payloadColumnKind": null,
    "payloadOptional": true
  }
}
```

## 아직 남은 payload 의존성

payload는 아직 완전히 제거할 수 없다. 현재 남은 대표 의존성은 다음과 같다.

- 작업지시서 상세의 일부 표시 필드
- summary 목록의 `category`, `season`, `priority`, `vendor`, `manager`, `quantity`, `inventoryStatus` fallback
- 통계 repository의 category/product label fallback
- seed SQL의 category label 보강
- legacy workOrder 객체 복원

## 정리 원칙

향후 정리 방향은 다음과 같다.

```text
핵심 업무 기준값:
- spec_sheets 개별 컬럼 또는 정규화 테이블 기준
- 상태, 제목, 리오더, 불량 여부, 카테고리 id, 업체, 수량, 날짜 등

payload 허용 범위:
- legacy fallback
- 임시 draft snapshot
- 아직 정규화되지 않은 화면 보조값

payload 금지 범위:
- 상태 전환 기준
- 통계 기준
- 검색/정렬 기준
- 목록 로딩 필수 기준
- 첨부/메모 기준
```

## 다음 단계

권장 다음 작업은 다음과 같다.

```text
0.9.224350 — 작업지시서 상태 변경 최소 patch API 설계
0.9.224351 — summary 목록 payload fallback 축소
0.9.224352 — spec_sheets payload 제거 가능 필드 목록화
```

payload 컬럼 삭제는 마지막 단계에서 진행한다. 지금은 개발 중이라 DB reset이 가능하지만, 삭제 전에 화면 의존성과 seed 의존성을 먼저 걷어내는 것이 안전하다.
