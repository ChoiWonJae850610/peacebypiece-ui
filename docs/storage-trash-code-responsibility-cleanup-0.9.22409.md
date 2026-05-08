# 저장소관리 코드 책임 최종 정리 1차 (0.9.22409)

## 목적

저장소/휴지통 화면의 작업지시서 묶음 항목 판정, 복원 정책 판정, 선택 항목 계산이 UI 컴포넌트와 server action에 흩어지지 않도록 공통 정책 함수로 정리했다.

## 변경 요약

- `trashPolicy.ts`에 휴지통 복원 정책 상수와 공통 helper를 추가했다.
- 작업지시서 묶음 첨부 조회를 `selectAdminWorkOrderBundleTrashItems()`로 통일했다.
- 묶음 복원/차단 count 계산을 `countAdminWorkOrderBundleRestorePolicy()`로 통일했다.
- 휴지통 항목 용량 합산을 `sumAdminTrashItemSizeBytes()`로 통일했다.
- `fileTrashSectionActions.ts`와 `fileTrashSectionRows.ts`의 inline filter/reduce 도메인 판단을 공통 함수 호출로 줄였다.
- `adminFiles.serverActions.ts`의 복원 정책 판정과 표시 라벨 조립을 `trashPolicy.ts`로 이동했다.
- `bundle_required`, `parent_deleted_restore_blocked` 직접 비교는 active UI/server 코드에서 정책 상수 기준으로 정리했다.

## 책임 기준

### `components/admin/files/*`

- UI 표시와 사용자 액션 연결만 담당한다.
- 작업지시서 묶음 여부, 복원 정책 count, 용량 합산 같은 도메인 판단은 직접 구현하지 않는다.

### `lib/admin/files/trashPolicy.ts`

- 삭제 상태, 복원 정책, 작업지시서 묶음 항목 판정의 기준 소스다.
- UI와 actionFlow가 같은 정책 함수를 사용한다.

### `lib/admin/adminFiles.serverActions.ts`

- DB row 조회/변환은 유지하되, 복원 정책 판정 자체는 `trashPolicy.ts`의 helper를 사용한다.

## DB 변경

없음.

## 다음 단계

0.9.22410에서는 남은 저장소/휴지통 문구, i18n key, 하드코딩 문장과 API route 메시지를 추가 점검한다.
