# 84. 작업지시서 화면 액션별 serviceCode 연결 상태 점검

## 1. 목적

0.15.50~0.15.60에서 작업지시서 serviceCode 체계, side effect matrix, state patch guard, route guard, 검토요청/반려 회귀 기준을 추가했다. 0.15.61의 목적은 **작업지시서 화면 안의 실제 버튼/액션이 serviceCode 체계와 어느 정도 연결되어 있는지**를 점검하고, 다음 연결 작업의 우선순위를 고정하는 것이다.

이번 단계는 코드 동작 변경이 아니라 연결 상태 감사 문서화다. DB schema, API, R2, 권한, 세션 흐름은 변경하지 않는다.

---

## 2. 현재 확인된 연결 상태 요약

| 구분 | 액션 | serviceCode 상태 | 현재 판단 |
|---|---|---:|---|
| workflow | 검토요청 | 연결됨 | `getWorkOrderWorkflowServiceCode()`를 통해 `WO-F001` 전달 |
| workflow | 반려 | 연결됨 | `getWorkOrderWorkflowServiceCode()`를 통해 `WO-B001` 전달 |
| workflow | 검토완료 | 연결됨 | `WO-F002` 후보로 연결됨 |
| workflow | 발주요청 | 연결됨 | `WO-F003` 후보로 연결됨 |
| workflow | 검수완료 | 연결됨 | `WO-F004` 사용 |
| workflow | 완료처리 | 부분 연결 | `nextState=completed` 기준 `WO-F005`로 판정 가능하지만 실제 버튼/액션별 확인 필요 |
| workflow | 발주취소/되돌리기 | 부분 연결 | 일부 action type은 `WO-B003`으로 판정. 발주취소 전용 `WO-B002` 연결은 추가 확인 필요 |
| immediate | 현재 재고 변경 | 연결됨 | `WO-I004` 사용 |
| immediate | 담당자 변경 | 미연결 | `persistWorkOrderWithHistory()` 직접 호출. `WO-I002` 연결 필요 |
| immediate | 제목 변경 | 미연결 | `repository.saveWorkOrdersAsync()` 직접 호출. `WO-I001` 연결 필요 |
| immediate | 기본정보/분류 변경 | 미연결 가능성 높음 | 즉시 저장 field는 있으나 serviceCode 없이 full save 경로 사용 가능 |
| production | 발주정보 저장 | 미확정 | `WO-P001` 상수는 있으나 실제 버튼 연결 확인 필요 |
| production | 생산구성 저장 | 미확정 | `WO-P002` 상수는 있으나 실제 버튼 연결 확인 필요 |
| memo | 메모 생성/수정/삭제 | route guard 연결 | API route guard는 있음. 클라이언트 호출부 serviceCode 명시 여부는 추가 확인 필요 |
| attachment | 업로드 준비/완료/삭제/대표 지정 | route guard 연결 | API route guard는 있음. 클라이언트 호출부 serviceCode 명시 여부는 추가 확인 필요 |
| storage | 작업지시서 삭제/복원/purge | route guard 일부 연결 | 화면 action과 serviceCode 연결은 추가 확인 필요 |
| reorder | 리오더 생성 | 미연결 | `WO-R001` 상수는 있으나 `persistCreatedWorkOrderWithHistory()`에 serviceCode 전달 없음 |
| query | 목록/상세/요약 조회 | 기준만 있음 | `WO-Q001~003`은 side effect 없음. 실제 query 로그/audit 적용은 후순위 |

---

## 3. 연결됨으로 볼 수 있는 영역

### 3.1 검토요청 / 반려 / 검토완료 / 발주요청

`useWorkOrderWorkflowActions.ts`의 workflow action 저장 흐름은 `getWorkOrderWorkflowServiceCode()`를 통해 action type과 nextState 기준 serviceCode를 만든다. 이 흐름은 0.15.59에서 서버 repository payload까지 전달되도록 보강되었다.

정상 기준:

```txt
검토요청: WO-F001
반려: WO-B001
검토완료: WO-F002
발주요청: WO-F003
검수완료: WO-F004
완료처리: WO-F005
```

주의:

```txt
발주취소 / 검토취소 / 되돌리기 계열은 WO-B002 또는 WO-B003 중 실제 버튼 의미에 맞춰 분리해야 한다.
현재는 일부 되돌림 action이 WO-B003으로 묶여 있을 수 있다.
```

### 3.2 현재 재고 변경 / 검수완료

현재 재고 변경과 검수완료는 `persistWorkOrderStatePatchesWithHistory()` 호출 시 serviceCode를 전달한다.

```txt
현재 재고 변경: WO-I004
검수완료: WO-F004
```

---

## 4. 미연결 또는 재확인 필요 영역

### 4.1 담당자 변경

현재 담당자 변경은 `persistWorkOrderWithHistory()`를 직접 호출한다. 즉시 DB 저장 정책은 맞지만, serviceCode 관점에서는 `WO-I002`가 저장 payload까지 들어가지 않을 가능성이 있다.

정리 방향:

```txt
담당자 변경 → WO-I002
허용 테이블: spec_sheets update, workorder_history insert
금지 테이블: orders, spec_sheet_materials, spec_sheet_outsourcing_lines, attachments, memos, r2_objects
```

### 4.2 제목 변경

제목 변경은 reorder group title 처리 때문에 여러 작업지시서를 함께 저장할 수 있다. 현재는 repository 직접 저장 경로가 남아 있으므로 serviceCode 명시가 필요하다.

정리 방향:

```txt
제목 변경 → WO-I001
허용 테이블: spec_sheets update, workorder_history insert
금지 테이블: production detail tables, attachments, memos, r2_objects
```

### 4.3 기본정보 / 분류 변경

`handleUpdateSelectedWorkOrder()`는 patch가 immediate DB field면 `persistWorkOrderWithHistory()`를 호출한다. 이 흐름에는 아직 patch 내용별 serviceCode 분기 기준이 명확하지 않다.

정리 방향:

```txt
분류/시즌/기본정보 변경 → WO-I003
현재 재고 변경 → WO-I004
담당자 변경 → WO-I002
제목 변경 → WO-I001
```

### 4.4 발주정보 저장 / 생산구성 저장

상수는 존재하지만 실제 화면 버튼이 `WO-P001`, `WO-P002`를 사용해 repository state patch로 저장하는지 확인이 필요하다.

정리 방향:

```txt
발주정보 저장 → WO-P001
생산구성 저장 → WO-P002
두 액션만 production replace 허용
```

### 4.5 리오더 생성

리오더 생성은 신규 작업지시서 생성 성격이 있으므로 `WO-R001`이 맞다. 현재 생성 저장 경로에 serviceCode가 명시되어 있지 않으면 후속 작업에서 연결한다.

정리 방향:

```txt
리오더 생성 → WO-R001
허용 테이블: spec_sheets insert, workorder_history insert
production detail table은 새 작업지시서 초기화 정책에 따라 별도 결정
```

### 4.6 메모/첨부/R2

API route guard는 연결되었지만, 클라이언트 호출부가 serviceCode를 명시적으로 보낼지는 추가 확인이 필요하다. route 내부 고정 serviceCode만으로 통과하는 구조라면 현재는 1차 안전장치로 충분하지만, audit metadata까지 serviceCode를 남기려면 클라이언트/route 입력 기준도 정리해야 한다.

---

## 5. 다음 작업 우선순위

### 0.15.62 — serviceCode 누락 액션 1차 연결

우선순위:

```txt
1. 담당자 변경 → WO-I002
2. 제목 변경 → WO-I001
3. 기본정보/분류 즉시 저장 → WO-I003
4. 발주정보 저장 → WO-P001
5. 생산구성 저장 → WO-P002
6. 검토완료/발주요청/발주취소/완료처리 실제 버튼별 serviceCode 확인
```

### 0.15.63 — orders replace 저장 방식 전환

serviceCode 연결이 더 안정화된 뒤, `orders` 저장 방식을 `spec_sheet_id` 기준 replace 방식으로 전환한다. 이때 반려/취소/되돌리기 계열은 `orders`를 절대 건드리지 않는 0.15.60 회귀 기준을 유지한다.

### 0.15.64 이후 — 생산구성 3개 테이블 schema 정리

`orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`의 불필요 컬럼 제거는 serviceCode 연결과 저장 정책이 안정화된 다음 진행한다.

---

## 6. 고정 기준

```txt
1. serviceCode 없는 DB/R2 side effect를 줄인다.
2. 즉시 저장, 명시 저장, forward workflow, backward workflow를 섞지 않는다.
3. 생산구성 replace는 WO-Pxxx 또는 WO-Fxxx 중 허용된 코드에서만 실행한다.
4. WO-Bxxx는 workflow/history/reason만 변경하고 생산구성 현재값 테이블은 변경하지 않는다.
5. route guard는 유지하고, 화면 action → repository/API payload까지 serviceCode 전달 범위를 단계적으로 넓힌다.
```
