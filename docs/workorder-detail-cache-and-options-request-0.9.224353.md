# 0.9.224353 — 작업지시서 상세 cache 및 options 반복 호출 보정

## 목적

작업지시서 lazy load 전환 이후 작업지시서를 선택/해제/재선택할 때 네트워크 요청이 과도하게 쌓이는지 점검하고, 우선 `workorder-options` 반복 호출을 줄인다.

## 확인한 구조

- 작업지시서 상세 데이터는 summary 목록에 포함하지 않는다.
- 처음 선택한 작업지시서는 `/api/workorders/{id}` GET으로 상세를 불러온다.
- 같은 작업지시서를 선택 해제 후 다시 선택하는 경우, 현재 state에 `hasDetailSnapshot=true`가 유지되면 상세 GET은 생략될 수 있다.
- 첨부 미리보기는 이미지/PDF 표시 때문에 `attachments/file?key=...` 요청이 발생할 수 있다.

## 보정 내용

`usePartnerWorkOrderOptions()`는 작업지시서 상세 편집 hook이 mount될 때마다 `/api/partners/workorder-options`를 호출할 수 있었다. 이 요청은 작업지시서 개별 상세 데이터가 아니라 협력업체/공정 선택 옵션이므로 선택 작업지시서마다 매번 새로 받을 필요가 낮다.

이번 버전에서는 다음을 적용했다.

- module-level cache 추가
- 5분 TTL 적용
- 동시에 여러 컴포넌트가 mount될 때 하나의 in-flight promise 공유
- hook 반환값은 clone해서 외부 mutation 영향을 줄임
- 실패 시 기존 empty fallback 유지

## 테스트 방법

1. `/worker` 진입
2. DevTools Network 열기
3. 작업지시서를 여러 개 선택/해제/재선택
4. `/api/partners/workorder-options` 호출이 선택마다 반복되지 않는지 확인
5. `/api/workorders/{id}` GET은 처음 상세 로딩 시 발생할 수 있음
6. 이미 상세가 로딩된 작업지시서 재선택 시 GET이 과도하게 반복되는지 확인

## 남은 점검

- 동일 id 상세 GET이 계속 반복되면 `hasDetailSnapshot` 유지 경로를 추가 점검해야 한다.
- `attachments/file?key=...` 실패는 R2 더미 파일/Worker/thumbnail 존재 여부와 별도로 확인한다.
- 상태 patch 응답은 0.9.224352부터 `patch` 중심 응답으로 경량화되어 있어야 한다.
