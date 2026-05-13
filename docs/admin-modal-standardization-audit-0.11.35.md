# 관리자/시스템 모달 패턴 잔여 조사 (0.11.35)

## 목적

`AdminModal`과 `ModalShell` 기반 모달 사용 현황을 점검하고, 다음 버전에서 안전하게 공통화할 수 있는 후보를 분리한다. 이번 버전에서는 동작 로직을 변경하지 않고 조사 결과와 후속 적용 순서만 정리한다.

## 현재 기준

- 공통 기반: `components/common/modal/ModalShell.tsx`, `components/common/modal/BaseModal.tsx`, `components/common/modal/modalUtils.ts`
- 관리자 wrapper: `components/admin/layout/AdminModal.tsx`
- `AdminModal`은 내부적으로 `ModalShell`을 사용하므로 background scroll lock, Escape 닫기, focus 이동 기준은 공통 modal 환경을 따른다.

## 이미 AdminModal 기준으로 정리된 영역

다음 영역은 이미 `AdminModal` 또는 `AdminModalSection`, `AdminModalFooterActions`를 사용한다.

- `components/admin/AdminNotificationSettingsModal.tsx`
- `components/admin/partnerMaster/PartnerMasterFormModal.tsx`
- `components/admin/partnerMaster/PartnerProcessDeleteModal.tsx`
- `components/admin/partnerMaster/PartnerProcessManagementModal.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/settings/AdminUserAccessPreview.tsx`
- `components/admin/standards/AdminFilePolicySettingsModal.tsx`
- `components/admin/standards/AdminItemCategoryManagementModal.tsx`
- `components/admin/standards/AdminNotificationPolicySettingsModal.tsx`
- `components/admin/standards/AdminUnitManagementModal.tsx`
- `components/admin/standards/StandardManagementModalFrame.tsx`

## 직접 ModalShell 사용 영역

### 1. 관리자 저장소/휴지통 모달

파일:

- `components/admin/files/fileTrashSectionModals.tsx`

현황:

- `EmptyTrashConfirmModal`
- `WorkOrderActionPreviewModal`
- `TrashDetailModal`

판단:

- 현재 `ModalShell` 기반이라 접근성/스크롤 차단/ESC 닫기 흐름은 공통 기반을 사용한다.
- 다만 관리자 화면 전용 모달이므로 장기적으로 `AdminModal` wrapper로 통일 가능하다.
- 삭제 요청, 복원, 선택 삭제, 비우기와 직접 연결되어 있어 1차 공통화 대상으로는 위험도가 높다.

후속 처리:

- 0.11.36에서는 변경하지 않는 것이 안전하다.
- 저장소 회귀 테스트 전용 버전에서 UI wrapper만 교체하는 것이 적합하다.

### 2. 시스템 category rule 테스트 모달

파일:

- `components/system/category-rules/CategoryRuleTestModal.tsx`

현황:

- 단순 입력 + 미리보기 표시
- 저장/삭제 action 없음
- `ModalShell` 직접 사용

판단:

- 가장 안전한 1차 전환 후보.
- `AdminModal`로 교체해도 데이터 저장 흐름 영향이 작다.
- footer가 없고 body 구조가 단순하다.

후속 처리:

- 0.11.36 1차 전환 후보로 적합하다.

### 3. 시스템 category values 모달

파일:

- `components/system/category-rules/CategoryValuesModal.tsx`

현황:

- 카테고리 1/2/3차 값을 편집
- 저장/초기화 footer 포함
- 내부 선택 상태와 tree 편집 로직 포함

판단:

- `AdminModal` 전환은 가능하지만 편집 로직과 footer action이 있어 1차 후보보다는 위험도가 높다.
- `AdminModalFooterActions` 적용 여부도 함께 판단해야 한다.

후속 처리:

- 0.11.37 이후 전환 후보로 분리한다.

## 직접 drawer/overlay 영역

### MobileCategoryRuleDrawer

파일:

- `components/system/category-rules/MobileCategoryRuleDrawer.tsx`

현황:

- 모바일 전용 drawer
- `useModalEnvironment` 직접 사용
- `fixed inset-0`, overlay button, side panel 구조

판단:

- 일반 modal이 아니라 모바일 drawer 패턴이다.
- `AdminModal`로 흡수하면 UX가 바뀔 수 있다.
- 별도 `AdminDrawer` 패턴을 만들기 전까지 유지하는 것이 안전하다.

후속 처리:

- 이번 modal 공통화 라인에서는 제외한다.
- responsive 정리 라인에서 drawer 전용 패턴으로 다시 점검한다.

## 0.11.36 추천 범위

작업명:

- 관리자 모달 공통화 1차

추천 수정:

- `components/system/category-rules/CategoryRuleTestModal.tsx`를 `AdminModal` 기준으로 전환

변경 금지:

- 저장소/휴지통 삭제·복원 모달 변경 금지
- category values 저장/초기화 로직 변경 금지
- mobile drawer 구조 변경 금지
- `ModalShell`, `BaseModal`, `modalUtils` 동작 변경 금지

확인 항목:

- `/system/category-rules` 진입
- 테스트 모달 열기/닫기
- Escape 닫기
- 배경 스크롤 차단
- 테스트 입력 변경
- 미리보기 결과 유지
