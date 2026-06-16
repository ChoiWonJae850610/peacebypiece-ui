# 작업지시서 ViewModel 및 첨부 조회 정리 0.23.08

## 목적

작업지시서 상세와 우측 패널에 반복 전달되던 사용자 권한 선택 작업지시서 비용 첨부 액션 정보를 공통 context로 묶고 목록 조회 시 작업지시서별로 반복되던 첨부 조회를 일괄 조회로 전환한다.

## ViewModel

- `buildBaseWorkspaceContext`가 상세와 우측 패널의 공통 입력을 한 번 구성한다.
- 상세 전용 열림 상태와 우측 패널 전용 PDF 액션만 각 builder에 추가한다.
- 공통 필드 추가 시 두 builder 호출부를 각각 수정하는 누락 위험을 줄인다.

## 첨부 조회

- repository 계약에 `listSnapshotsByWorkOrderIds`를 추가한다.
- DB repository는 `order_id = ANY($1::uuid[])`로 한 번 조회한다.
- service는 작업지시서 수만큼 query를 병렬 호출하지 않고 결과를 ID별로 조합한다.
- 단건 PDF와 HTML 생성 경로는 기존 단건 API를 그대로 사용한다.

## 감사

- service에서 `Promise.all`과 `listSnapshotByWorkOrderId`를 결합한 N+1 형태를 금지한다.
- workspace view model이 공통 base context를 우회하면 감사에서 실패한다.
