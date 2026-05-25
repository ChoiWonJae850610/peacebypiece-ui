# 83. 작업지시서 검토요청/반려/재검토요청 회귀 테스트 기준

## Version

0.15.60

## 목적

0.15.40~0.15.59 구간에서 생산구성 저장, 조회, 반려 보존 흐름을 안정화하면서 확인한 정상 기준을 고정한다.
이 문서는 이후 serviceCode 연결 확대, `orders` replace 저장 전환, 생산구성 테이블 schema 정리 중 회귀를 막기 위한 기준 문서다.

## 적용 범위

대상 화면:

- 작업지시서 상세 화면
- 디자이너 작업지시서 화면
- 고객사 관리자 검토 화면

대상 테이블:

- `spec_sheets`
- `orders`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`
- `workorder_history`

비대상:

- 첨부파일/R2 purge 정책
- 메모 저장 정책
- 저장소 휴지통 정책
- 시스템 관리자 감사로그 schema

## 서비스 코드 기준

### 검토요청

서비스 코드:

```txt
WO-F001
```

허용 side effect:

```txt
spec_sheets.workflow_state update
workorder_history insert
orders replace 저장
spec_sheet_materials replace 저장
spec_sheet_outsourcing_lines replace 저장
```

금지 side effect:

```txt
attachments delete
memos delete
r2_objects delete/purge
```

정상 기준:

- 공장 발주 row가 `orders`에 저장된다.
- 원단/부자재 row가 `spec_sheet_materials`에 저장된다.
- 외주공정 row가 `spec_sheet_outsourcing_lines`에 저장된다.
- 수량, 단가, 금액은 DB 저장 후 조회 화면에서 0으로 떨어지지 않는다.
- PostgreSQL numeric 문자열 값도 화면 숫자로 복원된다.

### 반려

서비스 코드:

```txt
WO-B001
```

허용 side effect:

```txt
spec_sheets.workflow_state update
spec_sheets rejection reason 계열 update
workorder_history insert
```

금지 side effect:

```txt
orders replace/delete/is_active=false/deleted_at update
spec_sheet_materials replace/delete/is_active=false/deleted_at update
spec_sheet_outsourcing_lines replace/delete/is_active=false/deleted_at update
attachments delete
memos delete
r2_objects delete/purge
```

정상 기준:

- 반려 직후 `orders.is_active`가 false로 바뀌면 안 된다.
- 반려 직후 `orders.deleted_at`이 새로 입력되면 안 된다.
- 반려 직후 `spec_sheet_materials` row가 삭제되면 안 된다.
- 반려 직후 `spec_sheet_outsourcing_lines` row가 삭제되면 안 된다.
- 반려 후 디자이너 화면을 새로고침해도 공장, 원단, 부자재, 외주공정이 유지되어야 한다.

### 재검토요청

현재 구현상 별도 serviceCode가 없으면 검토요청과 같은 forward workflow로 취급한다.

서비스 코드 후보:

```txt
WO-F001
```

또는 향후 분리 후보:

```txt
WO-F006
```

정상 기준:

- 반려 후 디자이너가 값을 수정하고 다시 검토요청하면 현재 생산구성이 replace 저장된다.
- 이전 반려 시점의 row 삭제/비활성화가 발생하면 안 된다.
- 재검토요청 후 관리자 화면에서 공장, 원단, 부자재, 외주공정이 모두 표시되어야 한다.

### 검토완료

서비스 코드:

```txt
WO-F002
```

정상 기준:

- forward workflow이므로 생산구성 replace 저장을 허용한다.
- 검토완료 시 현재 생산구성이 DB 현재값 테이블에 확정 반영된다.
- 첨부/R2/메모는 검토완료 action으로 삭제되면 안 된다.

## 회귀 테스트 시나리오

### 시나리오 A — 최초 검토요청

1. 디자이너로 작업지시서를 생성한다.
2. 공장 row 2개를 입력한다.
3. 원단 row 1개를 입력한다.
4. 부자재 row 1개를 입력한다.
5. 외주공정 row 1개를 입력한다.
6. 각 row에 수량, 단가, 단위, 금액이 계산될 값을 입력한다.
7. 검토요청을 실행한다.
8. 관리자 화면에서 같은 작업지시서를 연다.

확인:

- `orders`에 현재 공장 row가 존재한다.
- `spec_sheet_materials`에 원단/부자재 row가 존재한다.
- `spec_sheet_outsourcing_lines`에 외주공정 row가 존재한다.
- 화면에서 수량/단가/금액이 0으로 표시되지 않는다.

### 시나리오 B — 반려

1. 관리자 화면에서 시나리오 A의 작업지시서를 반려한다.
2. DB를 확인한다.
3. 디자이너 화면에서 작업지시서를 새로고침한다.

확인:

- `orders.is_active`가 false로 바뀌지 않는다.
- `orders.deleted_at`이 새로 찍히지 않는다.
- `spec_sheet_materials` row가 삭제되지 않는다.
- `spec_sheet_outsourcing_lines` row가 삭제되지 않는다.
- 디자이너 화면에서 기존 생산구성이 유지된다.

### 시나리오 C — 반려 후 재검토요청

1. 디자이너 화면에서 반려된 작업지시서의 원단/부자재/외주공정 값을 수정한다.
2. 다시 검토요청을 실행한다.
3. 관리자 화면에서 작업지시서를 다시 조회한다.

확인:

- 수정된 현재값이 DB에 반영된다.
- 기존 row가 불필요하게 누적되지 않는다.
- 이전 반려 동작으로 인한 row 삭제나 비활성화가 없다.

### 시나리오 D — 검토완료

1. 관리자 화면에서 재검토요청된 작업지시서를 검토완료 처리한다.
2. DB와 화면을 확인한다.

확인:

- 현재 생산구성 row가 유지된다.
- workflow state만 정상 진행된다.
- 첨부, 메모, R2 객체는 영향을 받지 않는다.

## 테이블별 변경 허용 기준

| Action | spec_sheets | orders | spec_sheet_materials | spec_sheet_outsourcing_lines | workorder_history | R2 |
| --- | --- | --- | --- | --- | --- | --- |
| 검토요청 | update | replace | replace | replace | insert | no-op |
| 반려 | update | no-op | no-op | no-op | insert | no-op |
| 재검토요청 | update | replace | replace | replace | insert | no-op |
| 검토완료 | update | replace | replace | replace | insert | no-op |

## 후속 작업 기준

0.15.61 이후 작업은 이 문서의 회귀 기준을 깨지 않아야 한다.

후속 우선순위:

```txt
0.15.61 작업지시서 화면 액션별 serviceCode 연결 상태 점검
0.15.62 serviceCode 누락 액션 1차 연결
0.15.63 orders replace 저장 방식 전환
0.15.64 생산구성 3개 테이블 컬럼 정리 SQL 설계
0.15.65 full_reset.sql + repository mapping 동시 정리
0.15.66 production snapshot/history 테이블 설계
```
