---
title: WAFL workorder status usage cleanup
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft
updated: 2026-05-21
---

# 59. workorder status usage 정리 1차

## 1. 목적

작업지시서 workflow 상태값을 화면/업무 로직에서 문자열 literal로 반복 비교하는 구조를 줄이고, 후속 발주/자재 발주/모바일 대응 전에 상태 기준을 한 계층으로 모으는 것을 목적으로 한다.

## 2. 이번 버전 범위

0.15.36에서는 DB schema나 API 응답값을 바꾸지 않고, 기존 DB 저장값은 그대로 유지한다.

정리 범위:

```txt
- lib/constants/workorderStates.ts에 WORKFLOW_STATE / DISPLAY_STAGE 상수 추가
- 기존 WORKFLOW_STATES / DISPLAY_STAGES 배열은 상수 기반으로 유지
- workflow 순서 비교, lock 판단, stage 매핑, editable state set을 상수 기반으로 정리
- workflow action nextState 일부를 WORKFLOW_STATE 기반으로 정리
- 작업지시서 목록 status filter의 workflow 상태값을 상수 기반으로 정리
```

## 3. 변경하지 않은 것

```txt
- DB 저장값: draft, review_requested, review_completed, inspection, completed, rejected 유지
- SQL check constraint 변경 없음
- API 응답 포맷 변경 없음
- i18n label 변경 없음
- 작업지시서 workflow 상태 전이 정책 변경 없음
- 작업지시서/R2/첨부/메모/purge 흐름 변경 없음
```

## 4. 이번 정리 기준

상태값을 새로 만들지 않고 기존 값에 이름을 부여한다.

```txt
WORKFLOW_STATE.draft
WORKFLOW_STATE.reviewRequested
WORKFLOW_STATE.reviewCompleted
WORKFLOW_STATE.inspection
WORKFLOW_STATE.completed
WORKFLOW_STATE.rejected
```

표시 단계도 별도 상수로 둔다.

```txt
DISPLAY_STAGE.draft
DISPLAY_STAGE.reviewRequested
DISPLAY_STAGE.reviewCompleted
DISPLAY_STAGE.requestOrder
DISPLAY_STAGE.inspection
DISPLAY_STAGE.completed
```

## 5. 후속 정리 후보

0.15.37 이후에는 아래 영역을 작은 범위로 나눠 정리한다.

```txt
- workorder presentation label/tone map 정리
- workorder action type constants 정리
- order inspection status constants 사용 범위 확대
- workorder list/search/filter의 상태 label과 상태 code 분리
- DB check constraint와 domain constants 문서 동기화
- 작업지시서 발주 flow와 자재 발주 flow가 공유할 상태 경계 정의
```

## 6. QA 포인트

```txt
- 작업지시서 목록 status filter가 기존처럼 동작하는지
- 디자이너/검수담당/관리자별 목록 scope가 기존과 동일한지
- 검토요청/검토승인/발주요청/검수완료 버튼 표시 조건이 기존과 동일한지
- 리오더/검수/완료 workflow가 기존과 동일한지
```
