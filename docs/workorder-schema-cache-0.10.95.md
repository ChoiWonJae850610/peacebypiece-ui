# 작업지시서 schema 조회 캐시 보정 — 0.10.95

## 목적

0.10.93~0.10.94에서 `spec_sheets.payload` 기반 호환 코드를 제거하고 정규 컬럼 중심으로 전환했다.
이번 버전은 repository 호출마다 `information_schema.columns`를 반복 조회하던 비용을 줄이기 위해 `spec_sheets` schema 확인 결과를 서버 모듈 단위로 캐시한다.

## 변경 내용

- `loadSpecSheetSchema()`가 매번 `information_schema.columns`를 조회하지 않도록 module-level Promise cache를 추가했다.
- 최초 schema 조회가 실패하면 cache를 비워 다음 호출에서 다시 시도할 수 있게 했다.
- 실제 DB schema, 저장/조회 쿼리, 작업지시서 도메인 데이터 구조는 변경하지 않았다.

## 기대 효과

- 작업지시서 목록/상세/상태 변경 API에서 반복되는 schema introspection 비용 감소
- 정규화 이후 repository 경로의 불필요한 DB 왕복 일부 제거
- full reset 이후 고정 schema 기준 운영에 더 적합한 구조로 전환

## 확인 방법

```powershell
npm run build
```

화면 확인:

```text
작업지시서 목록 진입
작업지시서 상세 진입
상태 변경
발주요청
재고/검수 상태 변경
```

성능 확인:

```text
/api/workorders/summary meta.durationMs
/api/workorders/{id} meta.durationMs
```

## 주의

- 이번 패치는 `spec_sheets` schema가 앱 실행 중 바뀌지 않는다는 전제에 맞춘다.
- 개발 중 schema를 바꾼 뒤에는 Next dev server를 재시작하는 것이 안전하다.
- DB DDL 변경은 없다.
