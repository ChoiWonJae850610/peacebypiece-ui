# 0.12.9 theme 직접 색상 class 잔여 후보 점검

## 목적

`default-light`, `beige-atelier`, `cold-winter` 전환이 작업지시서와 관리자 홈에서 큰 문제 없이 동작하는 상태를 기준으로, 다음 단계 전에 직접 Tailwind 색상 class 잔여 후보를 정리한다.

이번 버전은 UI를 크게 바꾸지 않고, theme token으로 바꿔야 할 영역과 상태 의미색으로 유지해야 할 영역을 분리하는 점검 버전이다.

## 점검 기준

직접 색상 class는 모두 제거 대상이 아니다.

유지 가능한 항목:

- `danger`, `success`, `warning`, `pending`처럼 의미가 명확한 상태색
- 오류, 삭제, 반려, 경고 같은 고정 의미색
- chart palette 설계 전까지 임시 유지가 필요한 차트 색상

후속 치환 대상:

- card/background/surface 역할의 `bg-stone-*`, `bg-white`, `border-stone-*`
- input/select/search 역할의 직접 배경색과 border 색상
- hover/selected/focus 상태를 직접 색상명으로 표현한 class
- modal 내부 content가 공통 modal token을 우회하는 class

## 점검 결과 요약

### 작업지시서 영역

작업지시서 본 화면은 semantic token 적용이 많이 진행되어 있다. 남은 후보는 주로 개별 모달과 loading/empty 상태다.

우선 확인 후보:

- `components/workorder/detail/modals/OrderInspectionModal.tsx`
- `components/workorder/detail/shared/detailEditorShared.tsx`
- `components/workorder/WorkOrderLoadingState.tsx`
- `components/workorder/WorkOrderEmptyState.tsx`

### 관리자 영역

관리자 화면은 직접 색상 class 잔여가 가장 많다. 이미 공통 버튼/카드 계층은 theme token을 타기 시작했지만, 개별 기능 화면은 별도 순차 정리가 필요하다.

우선 확인 후보:

- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/files/FileStorageSummary.tsx`
- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/files/fileTrashSectionPresentation.tsx`

저장소/휴지통/purge 관련 화면은 기능 회귀 위험이 있으므로 시각 token 정리는 별도 버전에서만 진행한다.

### 공통 모달 영역

공통 modal shell은 theme token을 타기 시작했지만, 개별 modal content와 preview 영역에는 직접 색상 class가 남아 있다.

우선 확인 후보:

- `components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx`
- `components/common/modal/InventoryEditor.tsx`
- `components/common/modal/AttachmentPreviewModal.tsx`
- `components/common/modal/OrderRequestConfirmModal.tsx`
- `components/common/modal/InventoryLogModal.tsx`
- `components/common/modal/PermissionModal.tsx`

### 시스템관리자 영역

system route 일부는 page 단위 직접 색상 class가 남아 있다. 시스템관리자 QA 단계에서 묶어 처리한다.

우선 확인 후보:

- `app/system/storage-usage/page.tsx`
- `app/system/category-rules/page.tsx`

## 후속 적용 규칙

- surface/card 계열 직접 색상은 `pbp-card` 또는 surface token으로 이동한다.
- input/select/search 직접 색상은 `field.editable`, `field.selectable`, `field.search`로 이동한다.
- 삭제/오류/반려는 danger 의미색으로 유지하되 실제 색상값은 theme variable을 사용한다.
- 검수완료/완료/성공은 success 의미색으로 유지하되 실제 색상값은 theme variable을 사용한다.
- warning/pending/info는 상태 의미색으로 유지하고, 브랜드 theme 색상과 섞지 않는다.
- chart 색상은 action/status/surface token과 분리한 chart palette token 설계 후 적용한다.

## 다음 권장 작업

1. 작업지시서 개별 modal content semantic token 정리
2. 관리자 멤버관리/환경설정/저장소 요약 화면 직접 색상 class 정리
3. 시스템관리자 route semantic token 적용은 system QA 단계에서 별도 진행
4. `black-and-white` theme는 잔여 직접 색상 class 정리 이후 추가
