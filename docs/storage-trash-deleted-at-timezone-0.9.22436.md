# 0.9.22436 저장소 삭제일시/시간대 표시 정리

## 목적

`/admin/files`와 `/system/storage-usage`에서 삭제일시가 화면마다 다르게 보이는 문제를 줄이고, 휴지통 row와 상세 모달의 날짜 표시 기준을 통일한다.

## 기준

- DB 저장 기준: UTC timestamp 유지
- 화면 표시 기준: `Asia/Seoul` 기준 KST 표시
- 삭제일시 표시 형식: `YY.MM.DD HH:mm`
- 날짜만 필요한 보관 만료/도래일 표시는 기존 `YYYY-MM-DD` 유지

## 반영 내용

1. `formatAdminStorageDateTime()`을 `Intl.DateTimeFormat.formatToParts()` 기반으로 보정했다.
2. `/admin/files` 휴지통 파일/작업지시서 삭제일시는 같은 formatter를 사용한다.
3. 작업지시서와 함께 삭제된 문서/디자인/메모는 작업지시서의 삭제일시가 있으면 그 값을 우선 표시한다.
4. `/system/storage-usage` 실제 삭제 후보의 삭제일시도 `YY.MM.DD HH:mm` 형식으로 맞췄다.
5. 보관 만료일/삭제 예정일은 날짜 단위 판단이므로 `YYYY-MM-DD` 형식을 유지한다.

## 확인 방법

1. `/admin/files` 휴지통 목록에서 작업지시서 row와 함께 삭제된 문서/디자인/메모 row의 삭제일시가 같은지 확인한다.
2. 휴지통 상세 모달의 삭제일시가 목록과 같은지 확인한다.
3. `/system/storage-usage`에서 실제 삭제 후보의 삭제일시가 `YY.MM.DD HH:mm` 형식인지 확인한다.
4. DB에는 UTC로 저장하고, 화면에는 KST로 표시되는 정책을 유지한다.

## 후속 후보

- 삭제 요청일, 실제 삭제일, 보관 만료일의 라벨을 더 명확히 분리할 수 있다.
- 시스템관리자 화면에서 삭제일시와 삭제 예정일을 별도 컬럼으로 유지하되, 툴팁에 KST 기준임을 표시할 수 있다.
