# 0.11.69 작업지시서 업무화면 client navigation 로딩 고착 수정

## 목적

`/admin`에서 문서 아이콘 버튼으로 `/worker`에 client-side navigation 진입했을 때 작업지시서 목록은 표시되지만 가운데 상세 패널과 우측 첨부·메모 패널이 계속 loading 상태로 남는 문제를 보정한다.

## 원인

작업지시서 상세 hydrate는 `useWorkOrderCoreState` 내부의 mounted ref를 확인한 뒤 상태를 갱신한다. 개발 환경의 React Strict Mode 또는 client-side navigation 흐름에서는 effect cleanup/setup이 반복될 수 있는데, 기존 mounted ref는 cleanup에서 `false`로 바뀐 뒤 다음 setup에서 다시 `true`로 복구되지 않았다.

그 결과 목록 summary 로드는 완료되어 왼쪽 목록은 보이지만, 상세 hydrate 결과가 도착해도 mounted guard에서 차단되어 상세 상태가 갱신되지 않을 수 있었다.

## 수정 내용

- `useWorkOrderCoreState` mount effect setup 시 `isMountedRef.current = true`를 명시한다.
- unmount cleanup 시에는 기존처럼 mounted ref를 `false`로 바꾸고 in-flight 상세 id set을 비운다.
- `/worker` page도 `workOrderId` query를 읽어 `WorkOrderWorkspace`의 `initialWorkOrderId`로 전달하도록 보강한다.
- 고객관리자 검토·발주 대기 개별 작업지시서 열기 링크를 `/worker?workOrderId=...`로 정리한다.

## 유지한 정책

- `/admin` 문서 아이콘 버튼은 `/worker` 전체 업무화면 진입 용도로 유지한다.
- 검토·발주 대기 목록의 개별 작업지시서 열기는 특정 작업지시서 직접 진입 용도로 유지한다.
- DB/API/schema는 변경하지 않는다.
- 작업지시서 상세 API 구조는 변경하지 않는다.

## 확인 항목

1. `/admin`에서 검토·발주 대기 옆 문서 아이콘 버튼 클릭
2. `/worker` 진입 후 가운데 상세 패널과 우측 첨부·메모 패널이 정상 표시되는지 확인
3. F5 없이 왼쪽 작업지시서 목록을 여러 개 클릭해도 상세/메모가 갱신되는지 확인
4. `/admin`의 검토·발주 대기 개별 `작업지시서 열기` 클릭 시 `/worker?workOrderId=...`로 이동하고 해당 작업지시서가 열리는지 확인
