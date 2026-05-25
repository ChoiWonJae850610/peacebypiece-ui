# 62. workorder kind / attachment scope constants 정리 1차

## 기준

- 기준 버전: 0.15.39
- 이전 기준: 0.15.38
- 작업 범위: 작업지시서 종류값과 첨부 scope 값의 직접 문자열 사용 축소
- 제외 범위: DB schema, SQL check constraint, API 응답 포맷, R2 실제 삭제/업로드 흐름 변경

## 목표

작업지시서 종류와 첨부 scope는 여러 화면과 저장 계층에서 반복 사용된다.
문자열을 화면/훅/도메인 함수에서 직접 비교하면 다음 문제가 생긴다.

- 오타가 타입으로 바로 드러나지 않음
- 동일한 의미의 값이 파일마다 다르게 쓰일 가능성 증가
- 작업지시서 리오더/재작업/첨부 업로드 로직을 수정할 때 영향 범위를 추적하기 어려움
- 향후 자재 발주, PDF, 모바일 대응에서 같은 조건이 다시 중복될 가능성 증가

0.15.39에서는 1차로 상수와 normalize helper를 추가하고, 영향 범위가 큰 UI/DB 동작 변경은 하지 않는다.

## 추가한 기준

### `lib/constants/workorderIdentity.ts`

추가 기준:

- `WORK_ORDER_KIND`
- `WORK_ORDER_KINDS`
- `WorkOrderKindValue`
- `isWorkOrderKindValue`
- `normalizeWorkOrderKindValue`
- `WORK_ORDER_KIND_RANK`
- `WORK_ORDER_ORDER_TYPE`
- `WorkOrderOrderTypeValue`
- `getWorkOrderKindFromOrderTypeValue`
- `getOrderTypeFromWorkOrderKindValue`
- `ATTACHMENT_SCOPE`
- `ATTACHMENT_SCOPES`
- `UPLOADABLE_ATTACHMENT_SCOPES`
- `AttachmentScopeValue`
- `UploadableAttachmentScopeValue`
- `isAttachmentScopeValue`
- `isUploadableAttachmentScopeValue`
- `normalizeAttachmentScopeValue`
- `normalizeUploadableAttachmentScopeValue`
- `isDesignAttachmentScope`
- `isMemoAttachmentScope`

## 정리한 주요 범위

### 작업지시서 종류

대상:

- `types/workorder.ts`
- `lib/workorder/reorder/helpers.ts`
- `lib/workorder/actions.ts`
- `lib/workorder/workOrderDataRules.ts`
- `lib/workorder/history/builders/workHistoryBuilders.ts`
- `lib/workorder/presentation/workOrderPresentation.ts`
- `lib/workorder/repository/dbWorkOrderRepository.ts`
- `lib/admin/adminFiles.serverActions.ts`

정리 내용:

- `sample/main/rework` 직접 문자열 union을 `WorkOrderKindValue` 기반으로 교체
- 리오더 정렬 rank를 `WORK_ORDER_KIND_RANK`로 분리
- order type과 workorder kind 변환을 `workorderIdentity` 기준 함수로 위임
- 새 작업지시서, 리오더, 재작업 생성 시 `WORK_ORDER_KIND` 상수 사용

### 첨부 scope

대상:

- `types/workorder.ts`
- `lib/workorder/actionFlow/attachmentResults.ts`
- `lib/workorder/attachments/attachmentBuilders.ts`
- `lib/workorder/attachments/attachmentMutations.ts`
- `lib/workorder/persistence/attachmentMemoTypes.ts`
- `lib/workorder/persistence/workOrderAttachmentPolicy.ts`
- `lib/workorder/persistence/workOrderSavePolicy.ts`
- `lib/workorder/history/builders/attachmentHistoryBuilders.ts`
- `lib/hooks/workorder/useWorkOrderAttachments.ts`
- `lib/storage/r2/r2Keys.ts`
- `lib/permissions/attachments.ts`
- `lib/workorder/presentation/orderRequestDocumentPresentation.ts`
- `lib/workorder/presentation/workOrderWorkspacePresentation.ts`
- `lib/workorder/workspace/viewModelTypes.ts`
- `components/workorder/sidepanel/*`

정리 내용:

- `design/attachment/memo` scope 기준을 `ATTACHMENT_SCOPE`로 분리
- 업로드 가능한 scope는 `UPLOADABLE_ATTACHMENT_SCOPES`로 분리
- 디자인 첨부 여부 판단은 `isDesignAttachmentScope`로 통일
- 첨부 업로드/대표 디자인/삭제 후 대표 이미지 재지정 조건에서 직접 문자열 비교 축소

## 유지한 범위

아래는 이번 패치에서 직접 변경하지 않는다.

- DB 컬럼값 자체
- SQL check constraint
- R2 storage directory 문자열
- public API payload field name
- 기존 저장된 첨부/작업지시서 데이터 migration

## 후속 작업 후보

다음 단계에서는 아래 후보를 분리할 수 있다.

- DB 저장값과 화면 label의 완전 분리
- work order order type의 한국어 값 저장 여부 감사
- attachment DB kind인 `design/file`과 UI scope인 `design/attachment/memo`의 명명 분리
- admin file kind의 `design/document` 기준 상수화
- sidepanel 첨부 section key와 upload scope의 타입 통합 확대

## 확인 항목

- 작업지시서 신규 생성 시 샘플 작업지시서로 생성되는지
- 리오더 생성 시 main kind와 reorder round가 유지되는지
- 재작업 전환 시 rework kind와 불량 상태가 유지되는지
- 디자인 첨부 업로드/대표 이미지 설정이 기존처럼 동작하는지
- 일반 첨부 업로드/PDF 업로드가 기존처럼 동작하는지
- 작업지시서 PDF/발주 문서 대표 이미지 선택이 기존과 동일한지
