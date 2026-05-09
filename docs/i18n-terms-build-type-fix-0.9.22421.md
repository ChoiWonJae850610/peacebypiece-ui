# 0.9.22421 i18n terms build 타입 오류 보정

## 목적

0.9.22420에서 i18n glossary/terms 구조를 도입한 뒤 발생한 저장소관리 build 타입 오류를 보정한다.

## 직접 원인

`components/admin/files/WorkOrderStorageSection.tsx`에서 `AdminStorageWorkOrderItem` 타입에 존재하지 않는 `restorePolicy` 속성을 참조했다.

작업지시서 저장소 목록의 정책 표시는 작업지시서 묶음 처리 고정 문구이므로, row item의 `restorePolicy` 값을 새로 요구하지 않고 기존 `restorePolicyLabel` fallback과 `filesList.restorePolicies.workorderBundle` i18n key를 사용하도록 정리했다.

## 처리 내용

- `item.restorePolicy` 참조 제거
- 작업지시서 저장소 정책 column은 `filesList.restorePolicies.workorderBundle` key를 직접 사용
- `restorePolicyLabel`은 fallback 문구로만 유지
- `APP_VERSION`을 `0.9.22421`로 변경

## DB 변경

없음.

## 확인 항목

1. `npm run build`에서 `Property 'restorePolicy' does not exist on type 'AdminStorageWorkOrderItem'` 오류가 사라지는지 확인한다.
2. `/admin/files` 작업지시서 저장소 목록의 정책 column이 한국어/영어 locale에 맞게 표시되는지 확인한다.
3. terms/glossary 관련 추가 key 오류가 있으면 다음 build 로그 기준으로 후속 보정한다.
