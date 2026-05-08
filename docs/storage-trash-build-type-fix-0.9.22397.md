# 0.9.22397 저장소 휴지통 build 타입 오류 보정

## 목적

0.9.22396 적용 후 `next build` TypeScript 단계에서 `/app/api/admin/files/snapshot/route.ts`가 `rows.attachments`를 `AdminManagedFileItem[]`로 추론하지 못해 발생한 타입 오류를 보정한다.

## 원인

`listAdminFileManagementRows()`의 반환값이 명시적으로 타입 지정되지 않아, `attachments` 배열 내부의 `fileKind` 값이 `"document" | "design"` 리터럴 유니언이 아니라 `string`으로 넓게 추론되었다.

그 결과 `buildFileTypeDistribution(rows.attachments, trendPeriod)` 호출에서 `rows.attachments`가 `AdminManagedFileItem[]`에 할당되지 못했다.

## 수정 내용

- `AdminFileManagementRows` 반환 타입을 추가했다.
- `attachments`, `trashItems`, `workOrders` 배열에 각각 명시 타입을 부여했다.
- `fileKind`가 `AdminStorageFileKind` 유니언으로 유지되도록 했다.
- `APP_VERSION`을 `0.9.22397`로 갱신했다.

## DB 변경

없음.

## build 확인

ChatGPT/container 환경에서는 `npm run build`를 실행하지 않았다. 사용자가 로컬에서 확인한다.
