# 61. Workorder action/result/history reason constants 1차

## 기준

- 기준 버전: 0.15.37
- 결과 버전: 0.15.38
- 목표: 작업지시서 action/result/history reason 계열 값의 문자열 직접 사용을 줄이고, 후속 DB reason/code 정리 전 기준 상수를 분리한다.

## 이번 버전에서 반영한 범위

### 1. History category / filter / tone 상수화

추가 파일:

```txt
lib/constants/workorderHistory.ts
```

추가 기준:

```txt
HISTORY_CATEGORY
HISTORY_FILTER
HISTORY_TONE
```

적용 대상:

```txt
types/workflow.ts
lib/workorder/history/builders/workHistoryBuilders.ts
lib/workorder/history/builders/inventoryHistoryBuilders.ts
lib/workorder/history/builders/attachmentHistoryBuilders.ts
lib/workorder/history/filters.ts
lib/workorder/history/inventory.ts
```

정리 내용:

- `"work"`, `"inventory"`, `"attachment"` 직접 사용을 history constants로 치환했다.
- `"all"` history filter 직접 비교를 `HISTORY_FILTER.all`로 치환했다.
- `"blue"`, `"violet"`, `"emerald"`, `"rose"`, `"amber"`, `"stone"` tone 직접 사용을 `HISTORY_TONE`으로 치환했다.

### 2. Memo history action 상수화

추가 기준:

```txt
MEMO_HISTORY_ACTION.thread
MEMO_HISTORY_ACTION.reply
```

적용 대상:

```txt
lib/workorder/actionFlow/memoResults.ts
lib/workorder/history/builders/workHistoryBuilders.ts
```

정리 내용:

- memo history builder의 `"thread" | "reply"` payload type을 `MemoHistoryActionValue`로 변경했다.
- memo action 분기를 `MEMO_HISTORY_ACTION.thread` 기준으로 정리했다.
- memo actionFlow에서 history payload를 생성할 때 직접 문자열 대신 constants를 사용하도록 변경했다.

## 이번 버전에서 일부러 변경하지 않은 범위

### 1. DB 저장값

이번 버전은 DB 저장값을 바꾸지 않는다.

변경하지 않은 항목:

```txt
- workorders.workflow_state
- spec_sheets.status 계열
- attachments lifecycle/status
- system_audit_logs.metadata
- company_account_requests.request_payload
```

이유:

- DB check constraint, full_reset.sql, seed/smoke test에 영향을 줄 수 있다.
- 현재 목적은 먼저 TypeScript domain constants와 presentation/history layer를 정리하는 것이다.

### 2. WorkOrder kind 문자열

아래 값은 history tone/category가 아니라 workorder domain value이므로 이번 상수화 범위에서 제외했다.

```txt
sample
main
rework
```

후속 작업에서 별도 `workOrderKind` domain constants로 분리하는 것이 적합하다.

### 3. Attachment scope 문자열

아래 값은 history category가 아니라 attachment domain value이므로 이번 상수화 범위에서 제외했다.

```txt
design
attachment
memo
```

후속 작업에서 `AttachmentScope` / upload target / save target 기준으로 분리한다.

## 후속 정리 후보

### 0.15.39 후보 — workorder kind / attachment scope constants

대상:

```txt
sample/main/rework
design/attachment/memo
```

정리 목표:

- 작업지시서 유형과 첨부 scope를 history/category와 분리된 도메인 상수로 관리한다.
- `workOrderKind`, attachment upload/save target, presentation key를 분리한다.

### 0.15.40 후보 — workorder result/reason code 감사

대상:

```txt
reason
message
error
result
metadata
```

정리 목표:

- UI 표시용 문장과 DB/API 저장용 code를 분리한다.
- 긴 한글 문장을 reason/status로 저장하는 후보를 줄인다.
- system audit metadata는 허용하되 raw request body/secret/token 저장 금지 기준을 더 명확히 한다.

## 검증 기준

확인 화면:

```txt
/workspace
작업지시서 상세 화면
작업지시서 히스토리 패널
작업지시서 재고/검수 히스토리
첨부 업로드/삭제 히스토리
메모 작성/답글 히스토리
```

확인 포인트:

```txt
- 히스토리 카테고리 필터가 기존처럼 동작하는지
- 디자이너/검수담당 역할별 히스토리 표시 범위가 기존과 같은지
- 메모 작성/답글 히스토리가 기존 문구로 표시되는지
- 첨부/재고/검수 히스토리 tone이 기존과 같은지
```
