---
title: Workorder Action Type Constants 정리 1차
version: 0.15.37
baseline_source: peacebypiece-ui-0.15.36
status: applied
updated: 2026-05-21
---

# 60. Workorder Action Type Constants 정리 1차

## 1. 목적

작업지시서 workflow action type을 화면과 policy 파일에서 문자열 literal로 직접 비교하지 않도록 1차 상수화한다.

## 2. 적용 범위

```txt
추가:
- lib/constants/workflowActions.ts

수정:
- types/workflow.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/actions.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- components/workorder/detail/WorkOrderActionSection.tsx
```

## 3. 정리 내용

```txt
WORKFLOW_ACTION_TYPE:
- requestReview
- cancelReviewRequest
- rejectReview
- cancelReviewApproval
- approveReview
- requestOrder
- completeInspection
- requestReinspection
```

`WorkflowAction.actionType`은 문자열 union을 직접 들고 있지 않고 `WorkflowActionTypeValue`를 참조한다.

## 4. 유지한 것

```txt
- DB 저장값 변경 없음
- API 응답 포맷 변경 없음
- 작업지시서 workflow 상태값 변경 없음
- 버튼 label/i18n 문구 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음
```

## 5. 후속 후보

```txt
0.15.38:
- workorder action/result/history reason 상수화 후보 조사
- actionFlow 안의 patch result type 문자열 정리 후보 확인

0.15.39:
- workorder 상태/액션 관련 UI presentation map 추가 정리
```
